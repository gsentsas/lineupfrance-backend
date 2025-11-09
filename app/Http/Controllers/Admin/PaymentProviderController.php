<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentProviderAudit;
use App\Models\PaymentProviderSetting;
use App\Support\Permissions;
use App\Services\Payments\PaymentProviderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class PaymentProviderController extends Controller
{
    private const PROVIDERS = [
        'stripe' => [
            'label' => 'Stripe',
            'fields' => [
                ['key' => 'secretKey', 'label' => 'Secret key', 'type' => 'secret', 'required' => true],
                ['key' => 'publishableKey', 'label' => 'Publishable key', 'type' => 'text', 'required' => true],
                ['key' => 'webhookSecret', 'label' => 'Webhook secret', 'type' => 'secret', 'required' => true],
                ['key' => 'connectClientId', 'label' => 'Connect client ID', 'type' => 'text', 'required' => false],
                ['key' => 'applePayMerchantId', 'label' => 'Apple Pay merchant ID', 'type' => 'text', 'required' => false],
            ],
        ],
        'paypal' => [
            'label' => 'PayPal',
            'fields' => [
                ['key' => 'clientId', 'label' => 'Client ID', 'type' => 'text', 'required' => true],
                ['key' => 'secret', 'label' => 'Client secret', 'type' => 'secret', 'required' => true],
                ['key' => 'webhookId', 'label' => 'Webhook ID', 'type' => 'text', 'required' => true],
                ['key' => 'mode', 'label' => 'Mode (live/sandbox)', 'type' => 'text', 'required' => false],
            ],
        ],
        'adyen' => [
            'label' => 'Adyen',
            'fields' => [
                ['key' => 'apiKey', 'label' => 'API key', 'type' => 'secret', 'required' => true],
                ['key' => 'clientKey', 'label' => 'Client key', 'type' => 'text', 'required' => true],
                ['key' => 'merchantAccount', 'label' => 'Merchant account', 'type' => 'text', 'required' => true],
                ['key' => 'hmacKey', 'label' => 'Webhook HMAC key', 'type' => 'secret', 'required' => true],
            ],
        ],
        'apple_pay' => [
            'label' => 'Apple Pay',
            'fields' => [
                ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text', 'required' => true],
                ['key' => 'certificatePath', 'label' => 'Certificat .p12 (path)', 'type' => 'text', 'required' => false],
                ['key' => 'certificatePassword', 'label' => 'Mot de passe certificat', 'type' => 'secret', 'required' => false],
            ],
        ],
        'google_pay' => [
            'label' => 'Google Pay',
            'fields' => [
                ['key' => 'merchantId', 'label' => 'Merchant ID', 'type' => 'text', 'required' => true],
                ['key' => 'gatewayMerchantId', 'label' => 'Gateway merchant ID', 'type' => 'text', 'required' => true],
            ],
        ],
    ];

    public function __construct(private PaymentProviderRegistry $registry)
    {
    }

    public function index(): JsonResponse
    {
        $settings = PaymentProviderSetting::all()->keyBy('provider');

        $data = collect(self::PROVIDERS)->map(function ($definition, $provider) use ($settings) {
            return $this->formatPayload(
                $provider,
                $definition,
                $settings->get($provider),
            );
        })->values();

        return response()->json(['data' => $data]);
    }

    public function show(string $provider): JsonResponse
    {
        $definition = $this->definitionFor($provider);
        $setting = PaymentProviderSetting::where('provider', $provider)->first();

        return response()->json([
            'data' => $this->formatPayload($provider, $definition, $setting),
        ]);
    }

    public function update(Request $request, string $provider): JsonResponse
    {
        $definition = $this->definitionFor($provider);

        $rules = [
            'enabled' => ['nullable', 'boolean'],
            'adminApproved' => ['nullable', 'boolean'],
            'credentials' => ['nullable', 'array'],
        ];

        foreach ($definition['fields'] as $field) {
            $fieldRules = [$field['required'] ? 'required_with:credentials' : 'nullable', 'string'];
            $rules['credentials.'.$field['key']] = $fieldRules;
        }

        $validated = $request->validate($rules);

        $setting = PaymentProviderSetting::firstOrNew(['provider' => $provider]);

        $user = $request->user();
        $canManageSettings = $user && $user->hasPermission(Permissions::SETTINGS_MANAGE);
        $canManagePayments = $user && $user->hasPermission(Permissions::PAYMENTS_MANAGE);

        if (isset($validated['credentials'])) {
            if (! $canManageSettings) {
                abort(403, 'Vous ne pouvez pas modifier ces identifiants.');
            }
            $setting->credentials = $validated['credentials'];
            $this->recordAudit($provider, 'credentials.updated', $user?->id, ['keys' => array_keys($validated['credentials'])]);
        }

        if (array_key_exists('adminApproved', $validated)) {
            if (! $canManageSettings) {
                abort(403, 'Validation réservée aux administrateurs.');
            }

            $approved = (bool) $validated['adminApproved'];
            $setting->admin_approved = $approved;
            $setting->admin_approved_at = $approved ? now() : null;
            $setting->admin_approved_by = $approved ? $user?->id : null;

            if (! $approved) {
                $setting->enabled = false;
                $setting->enabled_at = null;
                $setting->enabled_by = null;
            }

            $this->recordAudit($provider, $approved ? 'admin.approved' : 'admin.revoked', $user?->id);
        }

        if (array_key_exists('enabled', $validated)) {
            if (! $canManagePayments) {
                abort(403, 'Activation réservée à l’équipe Ops.');
            }
            if (! $setting->admin_approved) {
                abort(422, "Ce PSP doit d’abord être validé par l’administrateur.");
            }

            $enabled = (bool) $validated['enabled'];
            $setting->enabled = $enabled;
            $setting->enabled_at = $enabled ? now() : null;
            $setting->enabled_by = $enabled ? $user?->id : null;

            $this->recordAudit($provider, $enabled ? 'ops.enabled' : 'ops.disabled', $user?->id);
        }

        $setting->save();

        $this->registry->apply();

        return response()->json([
            'data' => $this->formatPayload($provider, $definition, $setting),
        ]);
    }

    private function definitionFor(string $provider): array
    {
        $definition = self::PROVIDERS[$provider] ?? null;

        if (! $definition) {
            throw ValidationException::withMessages([
                'provider' => ['Provider inconnu.'],
            ]);
        }

        return $definition;
    }

    private function formatPayload(
        string $provider,
        array $definition,
        ?PaymentProviderSetting $setting,
    ): array {
        $credentials = $setting?->credentials ?? [];

        foreach ($definition['fields'] as $field) {
            $credentials[$field['key']] = $credentials[$field['key']] ?? null;
        }

        $health = $this->healthPayload($setting);

        return [
            'provider' => $provider,
            'label' => $definition['label'],
            'enabled' => (bool) ($setting?->enabled ?? false),
            'enabledAt' => optional($setting?->enabled_at)->toISOString(),
            'enabledBy' => $setting?->enabled_by,
            'adminApproved' => (bool) ($setting?->admin_approved ?? false),
            'adminApprovedAt' => optional($setting?->admin_approved_at)->toISOString(),
            'adminApprovedBy' => $setting?->admin_approved_by,
            'credentials' => $credentials,
            'fields' => $definition['fields'],
            'healthStatus' => $health['status'],
            'lastWebhookAt' => $health['lastWebhookAt'],
            'health' => $health,
            'availableForOps' => (bool) ($setting?->admin_approved ?? false),
        ];
    }

    /**
     * @return array{status: string, message: ?string, lastWebhookAt: ?string, lastFailureAt: ?string, isStale: bool}
     */
    private function healthPayload(?PaymentProviderSetting $setting): array
    {
        $status = $setting?->health_status ?? 'unknown';
        $lastWebhookAt = $setting?->last_webhook_at;
        $lastFailureAt = $setting?->last_failure_at;
        $message = $setting?->last_status_message;

        if ($lastWebhookAt instanceof Carbon) {
            $staleThreshold = Carbon::now()->subMinutes(30);
            if ($lastWebhookAt->lessThan($staleThreshold) && $status === 'healthy') {
                $status = 'stale';
            }
        }

        $isStale = $lastWebhookAt
            ? Carbon::now()->diffInMinutes($lastWebhookAt) >= 30
            : true;

        return [
            'status' => $status,
            'message' => $message,
            'lastWebhookAt' => optional($lastWebhookAt)->toISOString(),
            'lastFailureAt' => optional($lastFailureAt)->toISOString(),
            'isStale' => $isStale,
        ];
    }

    private function recordAudit(string $provider, string $action, ?int $userId, array $payload = []): void
    {
        PaymentProviderAudit::create([
            'provider' => $provider,
            'action' => $action,
            'user_id' => $userId,
            'payload' => $payload,
        ]);
    }
}
