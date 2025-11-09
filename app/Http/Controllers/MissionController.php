<?php

namespace App\Http\Controllers;

use App\Events\MissionUpdated;
use App\Models\Mission;
use App\Models\MissionApplication;
use App\Models\User;
use App\Services\Payments\MissionPaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MissionController extends Controller
{
    public function __construct(private MissionPaymentService $paymentService)
    {
    }
    public function clientIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'progress' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:100'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $statusFilters = $this->normalizeFilters($validated['status'] ?? null);
        $progressFilters = $this->normalizeFilters($validated['progress'] ?? null);
        $limit = $validated['limit'] ?? 50;

        $missionsQuery = Mission::query()
            ->with(['liner.linerProfile'])
            ->withCount('applications')
            ->where('client_id', $user->id)
            ->when($statusFilters, fn ($query) => $query->whereIn('status', $statusFilters))
            ->when($progressFilters, fn ($query) => $query->whereIn('progress_status', $progressFilters))
            ->when(
                $validated['search'] ?? null,
                fn ($query, $search) => $query->where(fn ($searchQuery) => $searchQuery
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%"))
            )
            ->latest('published_at')
            ->latest('created_at');

        $missions = $missionsQuery->limit($limit)->get();

        return response()->json([
            'data' => $missions->map(fn (Mission $mission) => ApiResponse::mission($mission))->all(),
            'meta' => [
                'total' => $missions->count(),
                'filters' => [
                    'status' => $statusFilters,
                    'progress' => $progressFilters,
                    'search' => $validated['search'] ?? null,
                ],
            ],
        ]);
    }

    public function linerIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['nullable', 'string'],
            'progress' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:100'],
            'assigned' => ['nullable', Rule::in(['all', 'mine', 'open'])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $statusFilters = $this->normalizeFilters($validated['status'] ?? null);
        $progressFilters = $this->normalizeFilters($validated['progress'] ?? null);
        $limit = $validated['limit'] ?? 50;
        $assignmentFilter = $validated['assigned'] ?? 'all';

        $missionsQuery = Mission::query()
            ->with([
                'liner.linerProfile',
                'client.clientProfile',
                'applications' => fn ($query) => $query->where('liner_id', $user->id)->latest(),
            ])
            ->withCount('applications')
            ->when(
                $assignmentFilter === 'mine',
                fn ($query) => $query->where('liner_id', $user->id)
            )
            ->when(
                $assignmentFilter === 'open',
                fn ($query) => $query->whereNull('liner_id')
            )
            ->when(
                $assignmentFilter === 'all',
                fn ($query) => $query->where(fn ($nested) => $nested
                    ->whereNull('liner_id')
                    ->orWhere('liner_id', $user->id))
            )
            ->when($statusFilters, fn ($query) => $query->whereIn('status', $statusFilters))
            ->when($progressFilters, fn ($query) => $query->whereIn('progress_status', $progressFilters))
            ->when(
                $validated['search'] ?? null,
                fn ($query, $search) => $query->where(fn ($searchQuery) => $searchQuery
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('location_label', 'like', "%{$search}%"))
            )
            ->latest('published_at')
            ->latest('created_at');

        $missions = $missionsQuery->limit($limit)->get();

        return response()->json([
            'data' => $missions->map(fn (Mission $mission) => ApiResponse::mission($mission))->all(),
            'meta' => [
                'total' => $missions->count(),
                'filters' => [
                    'status' => $statusFilters,
                    'progress' => $progressFilters,
                    'assigned' => $assignmentFilter,
                    'search' => $validated['search'] ?? null,
                ],
            ],
        ]);
    }

    public function show(Request $request, Mission $mission): JsonResponse
    {
        $user = $request->user();
        $this->authorizeMissionView($user, $mission);

        if ($user->role === 'liner') {
            $mission->load([
                'client.clientProfile',
                'liner.linerProfile',
                'applications' => fn ($query) => $query->where('liner_id', $user->id)->latest(),
            ]);
        } else {
            $mission->load([
                'client.clientProfile',
                'liner.linerProfile',
            ]);
        }

        $mission->loadCount('applications');

        return response()->json([
            'data' => ApiResponse::mission($mission),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_if($request->user()->role !== 'client', 403, 'Vous devez vous inscrire en tant que client pour publier une mission.');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'max:100'],
            'location.label' => ['nullable', 'string', 'max:255'],
            'location.latitude' => ['nullable', 'numeric'],
            'location.longitude' => ['nullable', 'numeric'],
            'location.distanceKm' => ['nullable', 'numeric'],
            'scheduledAt' => ['nullable', 'date'],
            'durationMinutes' => ['nullable', 'integer', 'min:0'],
            'budgetCents' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
        ]);

        $mission = $request->user()->clientMissions()->create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? null,
            'location_label' => data_get($data, 'location.label'),
            'location_lat' => data_get($data, 'location.latitude'),
            'location_lng' => data_get($data, 'location.longitude'),
            'distance_km' => data_get($data, 'location.distanceKm'),
            'scheduled_at' => $data['scheduledAt'] ?? null,
            'duration_minutes' => $data['durationMinutes'] ?? null,
            'budget_cents' => $data['budgetCents'] ?? 0,
            'currency' => strtoupper($data['currency'] ?? 'EUR'),
            'status' => 'published',
            'progress_status' => 'pending',
            'booking_status' => 'open',
            'payment_status' => 'pending',
            'published_at' => now(),
        ]);

        MissionUpdated::dispatch($mission->fresh());

        return response()->json([
            'data' => ApiResponse::mission($mission),
        ], 201);
    }

    public function update(Request $request, Mission $mission): JsonResponse
    {
        abort_if($mission->client_id !== $request->user()->id, 403);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'type' => ['sometimes', 'nullable', 'string', 'max:100'],
            'location.label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location.latitude' => ['sometimes', 'nullable', 'numeric'],
            'location.longitude' => ['sometimes', 'nullable', 'numeric'],
            'location.distanceKm' => ['sometimes', 'nullable', 'numeric'],
            'scheduledAt' => ['sometimes', 'nullable', 'date'],
            'durationMinutes' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'budgetCents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'currency' => ['sometimes', 'nullable', 'string', 'size:3'],
        ]);

        foreach (['title', 'description', 'type'] as $field) {
            if (array_key_exists($field, $data)) {
                $mission->{$field} = $data[$field];
            }
        }
        if (array_key_exists('location', $data)) {
            $mission->location_label = data_get($data, 'location.label');
            $mission->location_lat = data_get($data, 'location.latitude');
            $mission->location_lng = data_get($data, 'location.longitude');
            $mission->distance_km = data_get($data, 'location.distanceKm');
        }
        if (array_key_exists('scheduledAt', $data)) {
            $mission->scheduled_at = $data['scheduledAt'];
        }
        if (array_key_exists('durationMinutes', $data)) {
            $mission->duration_minutes = $data['durationMinutes'];
        }
        if (array_key_exists('budgetCents', $data)) {
            $mission->budget_cents = $data['budgetCents'] ?? 0;
        }
        if (array_key_exists('currency', $data)) {
            $mission->currency = strtoupper($data['currency'] ?? 'EUR');
        }

        $mission->save();

        MissionUpdated::dispatch($mission->fresh());

        return response()->json([
            'data' => ApiResponse::mission($mission),
        ]);
    }

    public function favoriteClients(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $limit = $validated['limit'] ?? 5;

        $favorites = DB::table('missions')
            ->select('client_id', DB::raw('count(*) as missions_count'), DB::raw('avg(client_rating) as avg_rating'))
            ->where('liner_id', $user->id)
            ->whereNotNull('client_id')
            ->groupBy('client_id')
            ->orderByDesc('missions_count')
            ->limit($limit)
            ->get();

        $clients = User::whereIn('id', $favorites->pluck('client_id'))
            ->get()
            ->keyBy('id');

        $data = $favorites->map(function ($row) use ($clients) {
            /** @var User|null $client */
            $client = $clients->get($row->client_id);

            return [
                'clientId' => $row->client_id,
                'name' => $client?->name,
                'avatarUrl' => $client?->avatar_url,
                'missions' => (int) $row->missions_count,
                'averageRating' => $row->avg_rating ? round((float) $row->avg_rating, 2) : null,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function review(Request $request, Mission $mission): JsonResponse
    {
        abort_if($mission->client_id !== $request->user()->id, 403);

        $data = $request->validate([
            'rating' => ['required', 'numeric', 'min:1', 'max:5'],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $mission->client_rating = $data['rating'];
        $mission->client_feedback = $data['feedback'] ?? null;
        $mission->client_rated_at = now();
        $mission->save();

        MissionUpdated::dispatch($mission->fresh());

        return response()->json([
            'data' => ApiResponse::mission($mission->refresh()),
        ]);
    }

    public function cancel(Request $request, Mission $mission): JsonResponse
    {
        abort_if($mission->client_id !== $request->user()->id, 403);

        $mission->status = 'cancelled';
        $mission->progress_status = 'cancelled';
        $mission->booking_status = 'cancelled';
        $mission->payment_status = 'cancelled';
        $mission->save();

        MissionUpdated::dispatch($mission->fresh());

        return response()->json([
            'data' => ApiResponse::mission($mission),
        ]);
    }

    public function accept(Request $request, Mission $mission): JsonResponse
    {
        abort_if($mission->status === 'cancelled', 422, 'Cette mission est annulée.');
        abort_if($mission->status === 'completed', 422, 'Cette mission est déjà terminée.');

        if ($mission->liner_id && $mission->liner_id !== $request->user()->id) {
            abort(403, 'Cette mission est déjà attribuée à un autre Liner.');
        }

        if (! $mission->liner_id) {
            $mission->liner_id = $request->user()->id;
        }

        abort_if($mission->liner_id !== $request->user()->id, 403);

        $mission->status = 'accepted';
        $mission->progress_status = 'pending';
        $mission->booking_status = 'confirmed';
        $mission->published_at = $mission->published_at ?? now();
        $mission->save();

        $this->paymentService->authorize($mission);

        MissionUpdated::dispatch($mission->fresh());

        return response()->json([
            'data' => ApiResponse::mission($mission),
        ]);
    }

    public function updateStatus(Request $request, Mission $mission): JsonResponse
    {
        abort_if($mission->liner_id !== $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['nullable', Rule::in(['accepted', 'in_progress', 'completed', 'cancelled'])],
            'progressStatus' => ['nullable', Rule::in(['pending', 'en_route', 'arrived', 'queueing', 'done', 'cancelled'])],
        ]);

        if (array_key_exists('status', $data) && $data['status']) {
            $mission->status = $data['status'];
        }
        if (array_key_exists('progressStatus', $data) && $data['progressStatus']) {
            $mission->progress_status = $data['progressStatus'];
        }

        if ($mission->progress_status === 'done') {
            $mission->status = 'completed';
            $mission->booking_status = 'completed';
            $mission->completed_at = now();
            $this->paymentService->capture($mission);
        } elseif (in_array($mission->progress_status, ['en_route', 'arrived', 'queueing'], true)) {
            $mission->booking_status = 'in_progress';
        }

        $mission->save();

        MissionUpdated::dispatch($mission->fresh());

        return response()->json([
            'data' => ApiResponse::mission($mission),
        ]);
    }

    private function normalizeFilters(null|string|array $value): array
    {
        $filters = is_array($value) ? $value : explode(',', (string) $value);

        return collect($filters)
            ->filter()
            ->map(fn ($entry) => trim((string) $entry))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function authorizeMissionView(User $user, Mission $mission): void
    {
        if ($user->role === 'client') {
            abort_if($mission->client_id !== $user->id, 403);

            return;
        }

        if ($user->role === 'liner') {
            $isAssigned = $mission->liner_id === $user->id;
            $isOpen = $mission->liner_id === null;
            $hasPendingApplication = MissionApplication::query()
                ->where('mission_id', $mission->id)
                ->where('liner_id', $user->id)
                ->exists();

            abort_if(! ($isAssigned || $isOpen || $hasPendingApplication), 403, 'Mission réservée à un autre liner.');

            return;
        }

        if ($user->role === 'admin' || $user->hasTeamRole('ops', 'admin')) {
            return;
        }

        abort(403);
    }
}
