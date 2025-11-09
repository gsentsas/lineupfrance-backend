<?php

namespace App\Http\Controllers\Payments;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Mission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\StripeClient;

class StripeMobileController extends Controller
{
    public function createSetupIntent(Request $request): JsonResponse
    {
        [$stripe, $settings] = $this->stripeClient();

        $intent = $stripe->setupIntents->create([
            'usage' => 'off_session',
            'payment_method_types' => ['card'],
        ]);

        return response()->json([
            'data' => [
                'clientSecret' => $intent->client_secret,
                'publishableKey' => $settings['publishableKey'] ?? config('services.stripe.publishable_key'),
                'applePayMerchantId' => $settings['applePayMerchantId'] ?? null,
            ],
        ]);
    }

    public function createPaymentIntent(Request $request): JsonResponse
    {
        [$stripe, $settings] = $this->stripeClient();
        $user = $request->user();

        $data = $request->validate([
            'missionId' => ['nullable', 'uuid'],
            'amountCents' => ['nullable', 'integer', 'min:50'],
            'currency' => ['nullable', 'string', 'size:3'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $metadata = [];
        if ($data['missionId'] ?? null) {
            $mission = Mission::findOrFail($data['missionId']);
            abort_if($mission->client_id !== $user->id, 403);
            $amount = $mission->budget_cents;
            $currency = strtolower($mission->currency ?? 'eur');
            $description = $mission->title;
            $metadata['mission_id'] = $mission->id;
        } else {
            $amount = $data['amountCents'];
            $currency = strtolower($data['currency'] ?? 'eur');
            $description = $data['description'] ?? 'LineUp Wallet';
        }

        abort_if(empty($amount), 422, 'Montant requis.');

        $intent = $stripe->paymentIntents->create([
            'amount' => $amount,
            'currency' => $currency,
            'description' => $description,
            'metadata' => $metadata,
            'automatic_payment_methods' => ['enabled' => true],
        ]);

        return response()->json([
            'data' => [
                'clientSecret' => $intent->client_secret,
                'publishableKey' => $settings['publishableKey'] ?? config('services.stripe.publishable_key'),
                'applePayMerchantId' => $settings['applePayMerchantId'] ?? null,
                'merchantIdentifier' => $settings['applePayMerchantId'] ?? null,
            ],
        ]);
    }

    private function stripeClient(): array
    {
        $settings = AppSetting::query()->where('key', 'stripe')->first()?->value ?? [];
        $secret = $settings['secretKey'] ?? config('services.stripe.secret');
        abort_if(empty($secret), 422, 'Stripe n’est pas configuré dans le back-office.');

        return [new StripeClient($secret), $settings];
    }
}
