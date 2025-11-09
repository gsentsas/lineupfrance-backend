<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class ClientTableController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'perPage' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $statusFilter = $validated['status'] ?? null;
        $search = $validated['search'] ?? null;
        $from = isset($validated['from']) ? Carbon::parse($validated['from']) : null;
        $to = isset($validated['to']) ? Carbon::parse($validated['to']) : null;

        $perPage = $validated['perPage'] ?? 20;
        $page = $validated['page'] ?? 1;

        $query = User::query()
            ->select('users.*')
            ->where('role', 'client')
            ->with(['clientProfile'])
            ->withCount([
                'clientMissions as missions_total',
                'clientMissions as missions_active' => fn ($builder) => $builder->whereIn('status', ['published', 'accepted', 'in_progress']),
            ])
            ->withSum('clientMissions as spend_cents', 'budget_cents')
            ->withMax('clientMissions as last_mission_at', 'published_at')
            ->when($search, function ($builder, string $term) {
                $builder->where(function ($nested) use ($term) {
                    $nested->where('users.name', 'like', "%{$term}%")
                        ->orWhere('users.email', 'like', "%{$term}%")
                        ->orWhere('users.phone', 'like', "%{$term}%");
                });
            })
            ->when($from, fn ($builder) => $builder->whereDate('users.created_at', '>=', $from))
            ->when($to, fn ($builder) => $builder->whereDate('users.created_at', '<=', $to));

        if ($statusFilter === 'active') {
            $query->whereExists(function ($subQuery) {
                $subQuery->selectRaw(1)
                    ->from('missions')
                    ->whereColumn('missions.client_id', 'users.id')
                    ->whereIn('status', ['published', 'accepted', 'in_progress']);
            });
        } elseif ($statusFilter === 'idle') {
            $query->whereDoesntHave('clientMissions', function ($builder) {
                $builder->whereDate('published_at', '>=', Carbon::now()->subDays(30));
            });
        } elseif ($statusFilter === 'vip') {
            $query->whereRaw(
                '(select coalesce(sum(missions.budget_cents), 0) from missions where missions.client_id = users.id) >= ?',
                [50_000]
            );
        }

        $query->orderByDesc('users.created_at');

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $data = collect($paginator->items())->map(function (User $user) {
            $lastMissionAt = $user->last_mission_at ? Carbon::parse($user->last_mission_at) : null;
            $spend = (int) ($user->spend_cents ?? 0);
            $status = ($user->missions_active ?? 0) > 0 ? 'active' : 'idle';
            if ($spend >= 50_000) {
                $status = 'vip';
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'joinedAt' => optional($user->created_at)->toISOString(),
                'missionsTotal' => (int) ($user->missions_total ?? 0),
                'missionsActive' => (int) ($user->missions_active ?? 0),
                'lifetimeValueEuros' => round($spend / 100, 2),
                'lastMissionAt' => optional($lastMissionAt)->toISOString(),
                'status' => $status,
                'preferredCommunication' => optional($user->clientProfile)->preferred_communication,
            ];
        })->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'hasMore' => $paginator->hasMorePages(),
                'filters' => [
                    'status' => $statusFilter,
                    'search' => $search,
                    'from' => $from?->toDateString(),
                    'to' => $to?->toDateString(),
                ],
            ],
        ]);
    }
}
