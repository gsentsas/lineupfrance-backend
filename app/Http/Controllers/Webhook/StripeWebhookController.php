<?php

namespace App\Http\Controllers\Webhook;

use App\Exceptions\InvalidWebhookSignatureException;
use App\Jobs\ProcessStripeWebhook;
use App\Services\Payments\PaymentProviderHealthService;
use App\Services\Payments\StripeWebhookVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class StripeWebhookController
{
    public function __construct(
        private readonly StripeWebhookVerifier $verifier,
        private readonly PaymentProviderHealthService $healthService,
    ) {}

    public function __invoke(Request $request): Response|JsonResponse
    {
        $payload = $request->getContent() ?: '{}';
        $signature = $request->header('Stripe-Signature');

        try {
            $event = $this->verifier->verify($payload, $signature);
        } catch (InvalidWebhookSignatureException $exception) {
            $this->healthService->recordFailure('stripe', $exception->getMessage());
            Log::warning('[StripeWebhook] Signature rejected.', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['error' => 'invalid signature'], Response::HTTP_BAD_REQUEST);
        }

        Log::info('[StripeWebhook] Event validated.', [
            'type' => $event['type'] ?? null,
            'id' => $event['id'] ?? null,
        ]);

        $this->healthService->recordSuccess('stripe', sprintf('Event %s', $event['type'] ?? 'unknown'));

        ProcessStripeWebhook::dispatch($event);

        return response()->accepted();
    }
}
