<?php

namespace App\Services\Payments;

use App\Models\PaymentProviderSetting;
use Illuminate\Support\Carbon;

class PaymentProviderHealthService
{
    public function recordSuccess(string $provider, ?string $message = null): void
    {
        $setting = $this->resolve($provider);

        $setting->forceFill([
            'health_status' => 'healthy',
            'last_webhook_at' => Carbon::now(),
            'last_status_message' => $message,
        ])->save();
    }

    public function recordFailure(string $provider, string $message): void
    {
        $setting = $this->resolve($provider);

        $setting->forceFill([
            'health_status' => 'error',
            'last_failure_at' => Carbon::now(),
            'last_status_message' => $message,
        ])->save();
    }

    private function resolve(string $provider): PaymentProviderSetting
    {
        return PaymentProviderSetting::firstOrCreate(
            ['provider' => $provider],
            [
                'enabled' => false,
                'credentials' => [],
                'health_status' => 'unknown',
            ],
        );
    }
}
