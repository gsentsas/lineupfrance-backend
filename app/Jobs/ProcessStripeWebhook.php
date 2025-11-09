<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessStripeWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly array $event)
    {
    }

    public function handle(\App\Services\Payments\StripeEventRouter $router): void
    {
        Log::debug('[StripeWebhook] Dispatching event.', [
            'event_type' => $this->event['type'] ?? null,
        ]);

        $router->route($this->event);
    }
}
