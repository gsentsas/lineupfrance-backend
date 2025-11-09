<?php

namespace App\Services\Payments;

use App\Exceptions\InvalidWebhookSignatureException;
use Illuminate\Support\Facades\Log;
use JsonException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookVerifier
{
    public function __construct(private readonly ?string $secret = null)
    {
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(string $payload, ?string $signatureHeader): array
    {
        $secret = $this->secret ?? config('services.stripe.webhook_secret');

        if (! $secret) {
            Log::warning('[StripeWebhook] No webhook secret configured.');
            try {
                return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException $exception) {
                throw new InvalidWebhookSignatureException('Stripe payload could not be parsed.', $exception);
            }
        }

        if (! $signatureHeader) {
            throw new InvalidWebhookSignatureException('Stripe signature header missing.');
        }

        try {
            $event = Webhook::constructEvent($payload, $signatureHeader, $secret);
        } catch (SignatureVerificationException $exception) {
            throw new InvalidWebhookSignatureException('Stripe signature verification failed.', $exception);
        } catch (\UnexpectedValueException $exception) {
            throw new InvalidWebhookSignatureException('Stripe payload could not be parsed.', $exception);
        }

        return $event->toArray();
    }
}
