<?php

namespace App\Http\Controllers\Webhook;

use App\Exceptions\InvalidWebhookSignatureException;
use App\Jobs\ProcessPayPalWebhook;
use App\Services\Payments\PaymentProviderHealthService;
use App\Services\Payments\PayPalWebhookVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PayPalWebhookController
{
    public function __construct(
        private readonly PayPalWebhookVerifier $verifier,
        private readonly PaymentProviderHealthService $healthService,
    ) {}

    public function __invoke(Request $request): Response|JsonResponse
    {
        $payload = $request->json()->all() ?? [];

        try {
            $event = $this->verifier->verify($payload, $request->headers->all());
        } catch (InvalidWebhookSignatureException $exception) {
            $this->healthService->recordFailure('paypal', $exception->getMessage());
            Log::warning('[PayPalWebhook] Signature rejected.', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['error' => 'invalid signature'], Response::HTTP_BAD_REQUEST);
        }

        Log::info('[PayPalWebhook] Event validated.', [
            'event_type' => $event['event_type'] ?? null,
            'id' => $event['id'] ?? null,
        ]);

        $this->healthService->recordSuccess('paypal', sprintf('Event %s', $event['event_type'] ?? 'unknown'));

        ProcessPayPalWebhook::dispatch($event);

        return response()->accepted();
    }
}
