<?php

namespace Tests\Feature;

use App\Models\Mission;
use App\Models\Notification;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppPortalParityTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_dashboards_consume_real_payloads(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Mission::factory()->count(2)->create(['client_id' => $client->id, 'status' => 'published']);
        Mission::factory()->completed()->create(['client_id' => $client->id]);
        WalletTransaction::create([
            'user_id' => $client->id,
            'type' => 'debit',
            'status' => 'captured',
            'amount_cents' => 2400,
            'currency' => 'EUR',
            'description' => 'Mission premium',
            'counterparty' => 'LineUp',
            'method' => 'card',
        ]);
        WalletTransaction::create([
            'user_id' => $client->id,
            'type' => 'credit',
            'status' => 'pending',
            'amount_cents' => 1200,
            'currency' => 'EUR',
            'description' => 'Ajustement',
            'counterparty' => 'LineUp',
            'method' => 'card',
        ]);
        Notification::create([
            'user_id' => $client->id,
            'title' => 'Mission publiée',
            'message' => 'Votre mission Fnac est en ligne',
            'category' => 'missions',
        ]);

        Sanctum::actingAs($client);

        $missions = $this->getJson('/api/missions?status=published,completed&limit=5');
        $missions->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['filters']])
            ->assertJsonCount(3, 'data');

        $wallet = $this->getJson('/api/client/wallet');
        $wallet->assertOk()
            ->assertJsonPath('wallet.balance_cents', -1200)
            ->assertJsonCount(2, 'transactions');

        $notifications = $this->getJson('/api/notifications');
        $notifications->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_liner_dashboards_consume_real_payloads(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $liner = User::factory()->create(['role' => 'liner']);
        $assignedMission = Mission::factory()->create([
            'client_id' => $client->id,
            'liner_id' => $liner->id,
            'status' => 'accepted',
            'progress_status' => 'pending',
            'booking_status' => 'confirmed',
        ]);
        Mission::factory()->create([
            'client_id' => $client->id,
            'liner_id' => null,
            'status' => 'published',
        ]);
        WalletTransaction::create([
            'user_id' => $liner->id,
            'type' => 'credit',
            'status' => 'pending',
            'amount_cents' => 3400,
            'currency' => 'EUR',
            'description' => 'Mission '.$assignedMission->title,
            'counterparty' => 'LineUp',
            'method' => 'transfer',
        ]);

        Sanctum::actingAs($liner);

        $missions = $this->getJson('/api/liner/missions?assigned=mine');
        $missions->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedMission->id);

        $wallet = $this->getJson('/api/liner/wallet');
        $wallet->assertOk()
            ->assertJsonPath('wallet.pending_cents', 3400);

        $kyc = $this->getJson('/api/liner/kyc');
        $kyc->assertOk()
            ->assertJsonStructure(['status', 'checklist']);
    }
}
