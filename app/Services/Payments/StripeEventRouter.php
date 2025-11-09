<?php

namespace App\Services\Payments;

use App\Jobs\Payments\Stripe\HandlePaymentIntentSucceeded;
use App\Jobs\Payments\Stripe\HandlePayoutPaid;
use Illuminate\Support\Facades\Log;

class StripeEventRouter
{
    /**
     * @param  array<string, mixed>  $event
     */
    public function route(array $event): void
    {
        $type = $event['type'] ?? null;

        match ($type) {
            'payment_intent.succeeded' => HandlePaymentIntentSucceeded::dispatch($event),
            'payout.paid' => HandlePayoutPaid::dispatch($event),
            default => Log::info('[StripeWebhook] Unhandled event type.', ['type' => $type]),
        };
    }
}
