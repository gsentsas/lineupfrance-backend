<?php

namespace App\Services\Payments;

use App\Exceptions\InvalidWebhookSignatureException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayPalWebhookVerifier
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function verify(array $payload, array $headers): array
    {
        $clientId = config('services.paypal.client_id');
        $secret = config('services.paypal.secret');
        $webhookId = config('services.paypal.webhook_id');
        $mode = config('services.paypal.mode', 'sandbox');

        if (! $clientId || ! $secret || ! $webhookId) {
            Log::warning('[PayPalWebhook] Missing configuration. Skipping signature verification.');
            return $payload;
        }

        $transmissionId = $headers['paypal-transmission-id'][0] ?? null;
        $transmissionTime = $headers['paypal-transmission-time'][0] ?? null;
        $transmissionSig = $headers['paypal-transmission-sig'][0] ?? null;
        $certUrl = $headers['paypal-cert-url'][0] ?? null;
        $authAlgo = $headers['paypal-auth-algo'][0] ?? null;

        if (! $transmissionId || ! $transmissionTime || ! $transmissionSig || ! $certUrl || ! $authAlgo) {
            throw new InvalidWebhookSignatureException('PayPal webhook headers incomplete.');
        }

        $baseUrl = $mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        $response = Http::withBasicAuth($clientId, $secret)
            ->post("{$baseUrl}/v1/notifications/verify-webhook-signature", [
                'transmission_id' => $transmissionId,
                'transmission_time' => $transmissionTime,
                'cert_url' => $certUrl,
                'auth_algo' => $authAlgo,
                'transmission_sig' => $transmissionSig,
                'webhook_id' => $webhookId,
                'webhook_event' => $payload,
            ]);

        if (! $response->ok()) {
            throw new InvalidWebhookSignatureException('PayPal verification request failed.');
        }

        $body = $response->json();
        if (($body['verification_status'] ?? null) !== 'SUCCESS') {
            throw new InvalidWebhookSignatureException('PayPal verification status not successful.');
        }

        return $payload;
    }
}
