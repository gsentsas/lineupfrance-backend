<?php

namespace App\Services\Payments;

use App\Jobs\Payments\PayPal\HandlePayoutBatchSuccess;
use App\Jobs\Payments\PayPal\HandlePaymentCaptureCompleted;
use Illuminate\Support\Facades\Log;

class PayPalEventRouter
{
    /**
     * @param  array<string, mixed>  $event
     */
    public function route(array $event): void
    {
        $type = $event['event_type'] ?? null;

        match ($type) {
            'PAYMENT.CAPTURE.COMPLETED' => HandlePaymentCaptureCompleted::dispatch($event),
            'PAYMENT.PAYOUTSBATCH.SUCCESS' => HandlePayoutBatchSuccess::dispatch($event),
            default => Log::info('[PayPalWebhook] Unhandled event type.', ['event_type' => $type]),
        };
    }
}
