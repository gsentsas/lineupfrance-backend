<?php

namespace App\Jobs\Payments\PayPal;

use App\Services\Payments\PaymentReconciler;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class HandlePayoutBatchSuccess implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly array $event)
    {
    }

    public function handle(PaymentReconciler $reconciler): void
    {
        $reconciler->handlePayPalPayout($this->event);
    }
}
