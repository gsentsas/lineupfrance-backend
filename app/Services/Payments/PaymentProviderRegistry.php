<?php

namespace App\Services\Payments;

use App\Models\PaymentProviderSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;

class PaymentProviderRegistry
{
    public function all(): Collection
    {
        return PaymentProviderSetting::query()->get();
    }

    public function apply(): void
    {
        $providers = $this->all()->keyBy('provider');

        if ($stripe = $providers->get('stripe')) {
            $credentials = $stripe->credentials ?? [];
            Config::set('services.stripe', [
                'secret' => $credentials['secretKey'] ?? env('STRIPE_SECRET'),
                'publishable_key' => $credentials['publishableKey'] ?? env('STRIPE_KEY'),
                'webhook_secret' => $credentials['webhookSecret'] ?? env('STRIPE_WEBHOOK_SECRET'),
                'connect_client_id' => $credentials['connectClientId'] ?? env('STRIPE_CONNECT_CLIENT_ID'),
                'apple_pay_merchant_id' => $credentials['applePayMerchantId'] ?? null,
                'enabled' => $this->isLive($stripe),
            ]);
        }

        if ($paypal = $providers->get('paypal')) {
            $credentials = $paypal->credentials ?? [];
            Config::set('services.paypal', [
                'client_id' => $credentials['clientId'] ?? env('PAYPAL_CLIENT_ID'),
                'secret' => $credentials['secret'] ?? env('PAYPAL_SECRET'),
                'webhook_id' => $credentials['webhookId'] ?? env('PAYPAL_WEBHOOK_ID'),
                'mode' => $credentials['mode'] ?? env('PAYPAL_MODE', 'sandbox'),
                'enabled' => $this->isLive($paypal),
            ]);
        }

        if ($adyen = $providers->get('adyen')) {
            $credentials = $adyen->credentials ?? [];
            Config::set('services.adyen', [
                'api_key' => $credentials['apiKey'] ?? env('ADYEN_API_KEY'),
                'client_key' => $credentials['clientKey'] ?? env('ADYEN_CLIENT_KEY'),
                'merchant_account' => $credentials['merchantAccount'] ?? env('ADYEN_MERCHANT_ACCOUNT'),
                'hmac_key' => $credentials['hmacKey'] ?? env('ADYEN_HMAC_KEY'),
                'enabled' => $this->isLive($adyen),
            ]);
        }

        if ($applePay = $providers->get('apple_pay')) {
            $credentials = $applePay->credentials ?? [];
            Config::set('services.apple_pay', [
                'merchant_id' => $credentials['merchantId'] ?? env('APPLE_PAY_MERCHANT_ID'),
                'certificate_path' => $credentials['certificatePath'] ?? env('APPLE_PAY_CERTIFICATE_PATH'),
                'certificate_password' => $credentials['certificatePassword'] ?? env('APPLE_PAY_CERTIFICATE_PASSWORD'),
                'enabled' => $this->isLive($applePay),
            ]);
        }

        if ($googlePay = $providers->get('google_pay')) {
            $credentials = $googlePay->credentials ?? [];
            Config::set('services.google_pay', [
                'merchant_id' => $credentials['merchantId'] ?? env('GOOGLE_PAY_MERCHANT_ID'),
                'gateway_merchant_id' => $credentials['gatewayMerchantId'] ?? env('GOOGLE_PAY_GATEWAY_MERCHANT_ID'),
                'enabled' => $this->isLive($googlePay),
            ]);
        }
    }

    private function isLive(PaymentProviderSetting $setting): bool
    {
        return (bool) ($setting->admin_approved && $setting->enabled);
    }
}
