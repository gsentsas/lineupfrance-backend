<?php

namespace App\Http\Controllers;

use App\Events\MissionUpdated;
use App\Models\Mission;
use App\Models\MissionApplication;
use App\Services\Payments\MissionPaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MissionApplicationController extends Controller
{
    public function __construct(private MissionPaymentService $paymentService)
    {
    }
    public function store(Request $request, Mission $mission): JsonResponse
    {
        abort_if($mission->liner_id, 422, 'Cette mission a déjà un liner assigné.');

        $data = $request->validate([
            'message' => ['nullable', 'string', 'max:1000'],
            'proposedRateEuros' => ['nullable', 'numeric', 'min:0'],
        ]);

        $application = MissionApplication::query()->updateOrCreate(
            [
                'mission_id' => $mission->id,
                'liner_id' => $request->user()->id,
            ],
            [
                'status' => 'pending',
                'message' => $data['message'] ?? null,
                'proposed_rate_cents' => isset($data['proposedRateEuros'])
                    ? (int) round($data['proposedRateEuros'] * 100)
                    : null,
            ]
        );

        return response()->json([
            'data' => $this->transform($application),
        ], 201);
    }

    public function index(Mission $mission): JsonResponse
    {
        $this->authorizeMissionOwner($mission);

        return response()->json([
            'data' => $mission->applications()
                ->with('liner')
                ->latest()
                ->get()
                ->map(fn (MissionApplication $application) => $this->transform($application))
                ->all(),
        ]);
    }

    public function decide(Request $request, Mission $mission, MissionApplication $application): JsonResponse
    {
        $this->authorizeMissionOwner($mission);

        abort_if($application->mission_id !== $mission->id, 404);
        abort_if($mission->liner_id && $application->status !== 'accepted', 422, 'Mission déjà attribuée.');

        $data = $request->validate([
            'decision' => ['required', 'in:accept,reject'],
        ]);

        if ($data['decision'] === 'accept') {
            $application->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            $mission->update([
                'liner_id' => $application->liner_id,
                'booking_status' => 'confirmed',
                'status' => 'accepted',
                'progress_status' => 'pending',
                'payment_status' => 'pending',
            ]);

            $this->paymentService->authorize($mission->fresh());
        } else {
            $application->update([
                'status' => 'rejected',
                'rejected_at' => now(),
            ]);
        }

        $mission->refresh();
        MissionUpdated::dispatch($mission);

        return response()->json([
            'data' => $this->transform($application->fresh('liner')),
            'mission' => ApiResponse::mission($mission),
        ]);
    }

    private function authorizeMissionOwner(Mission $mission): void
    {
        abort_if(request()->user()->id !== $mission->client_id, 403, 'Action réservée au client propriétaire.');
    }

    private function transform(MissionApplication $application): array
    {
        return [
            'id' => $application->id,
            'missionId' => $application->mission_id,
            'linerId' => $application->liner_id,
            'status' => $application->status,
            'message' => $application->message,
            'proposedRateCents' => $application->proposed_rate_cents,
            'acceptedAt' => optional($application->accepted_at)->toISOString(),
            'rejectedAt' => optional($application->rejected_at)->toISOString(),
            'liner' => $application->relationLoaded('liner') ? [
                'id' => $application->liner->id,
                'name' => $application->liner->name,
                'avatarUrl' => $application->liner->avatar_url,
                'rating' => optional($application->liner->linerProfile)->rating,
                'missionsCompleted' => optional($application->liner->linerProfile)->missions_completed,
            ] : null,
        ];
    }
}
