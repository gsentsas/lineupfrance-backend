<?php

namespace Database\Seeders;

use App\Models\PaymentProviderSetting;
use Illuminate\Database\Seeder;

class PaymentProviderSettingSeeder extends Seeder
{
    private const PROVIDERS = [
        'stripe' => [
            'secretKey' => null,
            'publishableKey' => null,
            'webhookSecret' => null,
            'connectClientId' => null,
            'applePayMerchantId' => null,
        ],
        'paypal' => [
            'clientId' => null,
            'secret' => null,
            'webhookId' => null,
            'mode' => 'sandbox',
        ],
        'adyen' => [
            'apiKey' => null,
            'clientKey' => null,
            'merchantAccount' => null,
            'hmacKey' => null,
        ],
        'apple_pay' => [
            'merchantId' => null,
            'certificatePath' => null,
            'certificatePassword' => null,
        ],
        'google_pay' => [
            'merchantId' => null,
            'gatewayMerchantId' => null,
        ],
    ];

    public function run(): void
    {
        foreach (self::PROVIDERS as $provider => $credentials) {
            PaymentProviderSetting::updateOrCreate(
                ['provider' => $provider],
                [
                    'credentials' => $credentials,
                    'enabled' => false,
                    'health_status' => 'unknown',
                    'last_webhook_at' => null,
                    'last_status_message' => null,
                    'last_failure_at' => null,
                ],
            );
        }
    }
}
