<?php

namespace Tests\Feature;

use App\Models\PaymentProviderSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentProviderControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_update_payment_providers(): void
    {
        PaymentProviderSetting::create([
            'provider' => 'stripe',
            'credentials' => [
                'secretKey' => 'sk_test_x',
                'publishableKey' => 'pk_test_x',
                'webhookSecret' => 'whsec_x',
                'connectClientId' => null,
                'applePayMerchantId' => null,
            ],
            'enabled' => false,
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $index = $this->getJson('/admin/api/payment-providers');
        $index->assertOk()
            ->assertJsonFragment(['provider' => 'stripe']);

        $update = $this->putJson('/admin/api/payment-providers/stripe', [
            'adminApproved' => true,
            'enabled' => true,
            'credentials' => [
                'secretKey' => 'sk_new',
                'publishableKey' => 'pk_new',
                'webhookSecret' => 'whsec_new',
                'connectClientId' => 'connect_123',
                'applePayMerchantId' => 'merchant.fr.lineup',
            ],
        ]);

        $update->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.credentials.secretKey', 'sk_new');

        $this->assertDatabaseHas('payment_provider_settings', [
            'provider' => 'stripe',
            'enabled' => true,
            'admin_approved' => true,
        ]);
    }

    public function test_ops_cannot_enable_without_admin_approval(): void
    {
        PaymentProviderSetting::create([
            'provider' => 'stripe',
            'credentials' => [
                'secretKey' => 'sk_test_x',
                'publishableKey' => 'pk_test_x',
                'webhookSecret' => 'whsec_x',
                'connectClientId' => null,
                'applePayMerchantId' => null,
            ],
            'enabled' => false,
            'admin_approved' => false,
        ]);

        $ops = User::factory()->create(['role' => 'ops']);
        $this->actingAs($ops);

        $response = $this->putJson('/admin/api/payment-providers/stripe', [
            'enabled' => true,
        ]);

        $response->assertStatus(422);
    }
}
