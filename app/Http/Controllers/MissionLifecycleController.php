<?php

namespace App\Http\Controllers;

use App\Events\MissionUpdated;
use App\Models\Mission;
use App\Services\Payments\MissionPaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MissionLifecycleController extends Controller
{
    public function __construct(private MissionPaymentService $paymentService)
    {
    }

    public function generateQr(Mission $mission): JsonResponse
    {
        $this->authorizeLiner($mission);

        if (! $mission->qr_token) {
            $mission->update([
                'qr_token' => (string) Str::uuid(),
            ]);
            MissionUpdated::dispatch($mission->fresh());
        }

        $fresh = $mission->fresh();

        return response()->json([
            'data' => [
                'token' => $fresh->qr_token,
                'mission' => ApiResponse::mission($fresh),
            ],
        ]);
    }

    public function verifyQr(Request $request, Mission $mission): JsonResponse
    {
        $this->authorizeClient($mission);

        $data = $request->validate([
            'token' => ['required', 'uuid'],
        ]);

        abort_if($mission->qr_token !== $data['token'], 422, 'QR code invalide.');

        $mission->update([
            'progress_status' => 'done',
            'status' => 'completed',
            'booking_status' => 'completed',
            'payment_status' => 'ready_for_capture',
            'qr_verified_at' => now(),
            'completed_at' => now(),
        ]);

        $fresh = $mission->fresh();
        $this->paymentService->capture($fresh);

        $fresh->refresh();
        MissionUpdated::dispatch($fresh);

        return response()->json([
            'data' => ApiResponse::mission($fresh),
        ]);
    }

    public function authorizePayment(Mission $mission): JsonResponse
    {
        $this->authorizeClient($mission);

        $this->paymentService->authorize($mission);

        $fresh = $mission->fresh();
        MissionUpdated::dispatch($fresh);

        return response()->json([
            'data' => ApiResponse::mission($fresh),
        ]);
    }

    private function authorizeClient(Mission $mission): void
    {
        abort_if(request()->user()->id !== $mission->client_id, 403);
    }

    private function authorizeLiner(Mission $mission): void
    {
        abort_if(request()->user()->id !== $mission->liner_id, 403);
    }
}
