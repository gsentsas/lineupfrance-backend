<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class LinerTableController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:120'],
            'ratingMin' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'ratingMax' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'page' => ['nullable', 'integer', 'min:1'],
            'perPage' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $statusFilter = $validated['status'] ?? null;
        $search = $validated['search'] ?? null;
        $ratingMin = $validated['ratingMin'] ?? null;
        $ratingMax = $validated['ratingMax'] ?? null;

        $perPage = $validated['perPage'] ?? 20;
        $page = $validated['page'] ?? 1;

        $query = User::query()
            ->select('users.*')
            ->where('role', 'liner')
            ->with(['linerProfile'])
            ->withCount([
                'linerMissions as missions_total',
                'linerMissions as missions_active' => fn ($builder) => $builder->whereIn('status', ['accepted', 'in_progress']),
            ])
            ->withSum('linerMissions as revenue_cents', 'budget_cents')
            ->when($search, function ($builder, string $term) {
                $builder->where(function ($nested) use ($term) {
                    $nested->where('users.name', 'like', "%{$term}%")
                        ->orWhere('users.email', 'like', "%{$term}%")
                        ->orWhere('users.phone', 'like', "%{$term}%");
                });
            })
            ->when($ratingMin, function ($builder, float $min) {
                $builder->whereHas('linerProfile', fn ($q) => $q->where('rating', '>=', $min));
            })
            ->when($ratingMax, function ($builder, float $max) {
                $builder->whereHas('linerProfile', fn ($q) => $q->where('rating', '<=', $max));
            });

        if ($statusFilter === 'verified') {
            $query->whereHas('linerProfile', fn ($builder) => $builder->where('kyc_status', 'approved'));
        } elseif ($statusFilter === 'pending') {
            $query->whereHas('linerProfile', fn ($builder) => $builder->whereIn('kyc_status', ['review', 'pending']));
        } elseif ($statusFilter === 'rejected') {
            $query->whereHas('linerProfile', fn ($builder) => $builder->where('kyc_status', 'rejected'));
        }

        $query->orderByDesc('users.created_at');

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $data = collect($paginator->items())->map(function (User $user) {
            $profile = $user->linerProfile;
            $rating = $profile?->rating;
            $missionsCompleted = $profile?->missions_completed ?? $user->missions_total ?? 0;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'joinedAt' => optional($user->created_at)->toISOString(),
                'rating' => $rating ? round($rating, 2) : null,
                'missionsTotal' => (int) ($user->missions_total ?? 0),
                'missionsActive' => (int) ($user->missions_active ?? 0),
                'earningsEuros' => round(((int) ($user->revenue_cents ?? 0)) / 100, 2),
                'kycStatus' => $profile?->kyc_status ?? 'not_started',
                'availability' => $profile?->availability,
                'missionsCompleted' => (int) $missionsCompleted,
                'payoutReady' => (bool) $profile?->payout_method_id,
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
                    'ratingMin' => $ratingMin,
                    'ratingMax' => $ratingMax,
                ],
            ],
        ]);
    }
}
