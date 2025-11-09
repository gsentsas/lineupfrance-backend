<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class MissionTableController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'progress' => ['nullable', 'string'],
            'paymentStatus' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:120'],
            'client' => ['nullable', 'integer'],
            'liner' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'perPage' => ['nullable', 'integer', 'min:5', 'max:100'],
            'sort' => ['nullable', 'string'],
        ]);

        $statusFilters = $this->parseList($validated['status'] ?? null);
        $progressFilters = $this->parseList($validated['progress'] ?? null);
        $paymentFilters = $this->parseList($validated['paymentStatus'] ?? null);

        [$sortField, $sortDirection] = $this->resolveSorting($validated['sort'] ?? null);

        $perPage = $validated['perPage'] ?? 20;
        $page = $validated['page'] ?? 1;

        $from = isset($validated['from']) ? Carbon::parse($validated['from']) : null;
        $to = isset($validated['to']) ? Carbon::parse($validated['to']) : null;

        $query = Mission::query()
            ->with(['client', 'liner', 'client.clientProfile', 'liner.linerProfile'])
            ->withCount('applications')
            ->when($statusFilters, fn ($builder) => $builder->whereIn('status', $statusFilters))
            ->when($progressFilters, fn ($builder) => $builder->whereIn('progress_status', $progressFilters))
            ->when($paymentFilters, fn ($builder) => $builder->whereIn('payment_status', $paymentFilters))
            ->when($validated['client'] ?? null, fn ($builder, $clientId) => $builder->where('client_id', $clientId))
            ->when($validated['liner'] ?? null, fn ($builder, $linerId) => $builder->where('liner_id', $linerId))
            ->when($from, fn ($builder) => $builder->whereDate('scheduled_at', '>=', $from))
            ->when($to, fn ($builder) => $builder->whereDate('scheduled_at', '<=', $to))
            ->when($validated['search'] ?? null, function ($builder, string $search) {
                $builder->where(function ($nested) use ($search) {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('liner', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy($sortField, $sortDirection)
            ->orderBy('created_at', 'desc');

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $data = collect($paginator->items())->map(fn (Mission $mission) => [
            'id' => $mission->id,
            'title' => $mission->title,
            'status' => $mission->status,
            'progressStatus' => $mission->progress_status,
            'paymentStatus' => $mission->payment_status,
            'budgetCents' => $mission->budget_cents,
            'currency' => $mission->currency,
            'scheduledAt' => optional($mission->scheduled_at)->toISOString(),
            'publishedAt' => optional($mission->published_at)->toISOString(),
            'applicationsCount' => $mission->applications_count,
            'client' => $mission->client ? [
                'id' => $mission->client->id,
                'name' => $mission->client->name,
                'avatarUrl' => $mission->client->avatar_url,
            ] : null,
            'liner' => $mission->liner ? [
                'id' => $mission->liner->id,
                'name' => $mission->liner->name,
                'avatarUrl' => $mission->liner->avatar_url,
                'rating' => optional($mission->liner->linerProfile)->rating,
            ] : null,
        ])->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'hasMore' => $paginator->hasMorePages(),
                'filters' => [
                    'status' => $statusFilters,
                    'progress' => $progressFilters,
                    'paymentStatus' => $paymentFilters,
                    'client' => $validated['client'] ?? null,
                    'liner' => $validated['liner'] ?? null,
                    'search' => $validated['search'] ?? null,
                    'from' => $from?->toDateString(),
                    'to' => $to?->toDateString(),
                ],
                'sort' => [
                    'field' => $sortField,
                    'direction' => $sortDirection,
                ],
            ],
        ]);
    }

    private function parseList(null|string|array $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('trim', $value)));
        }

        $chunks = array_filter(array_map('trim', explode(',', (string) $value)));

        return array_values(array_unique($chunks));
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveSorting(?string $sort): array
    {
        $default = ['published_at', 'desc'];

        if (! $sort) {
            return $default;
        }

        [$field, $direction] = array_pad(explode(':', $sort, 2), 2, 'desc');

        $field = in_array($field, ['published_at', 'scheduled_at', 'budget_cents', 'created_at'], true)
            ? $field
            : $default[0];

        $direction = in_array(strtolower($direction), ['asc', 'desc'], true)
            ? strtolower($direction)
            : $default[1];

        return [$field, $direction];
    }
}
