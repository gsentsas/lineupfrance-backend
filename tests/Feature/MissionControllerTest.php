<?php

namespace Tests\Feature;

use App\Models\Mission;
use App\Models\MissionApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MissionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_list_missions_with_filters(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        Mission::factory()->count(2)->create([
            'client_id' => $client->id,
            'status' => 'published',
        ]);
        Mission::factory()->completed()->create([
            'client_id' => $client->id,
        ]);
        Mission::factory()->create(); // Mission d'un autre client

        Sanctum::actingAs($client);

        $response = $this->getJson('/api/missions?status=completed,published&limit=5');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => ['total', 'filters' => ['status', 'progress', 'search']],
            ])
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.filters.status', ['completed', 'published']);
    }

    public function test_liner_can_accept_and_update_mission(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $liner = User::factory()->create(['role' => 'liner']);
        $mission = Mission::factory()->create([
            'client_id' => $client->id,
        ]);

        Sanctum::actingAs($liner);

        $accept = $this->postJson("/api/liner/missions/{$mission->id}/accept");
        $accept->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.linerId', $liner->id);

        $status = $this->postJson("/api/liner/missions/{$mission->id}/status", [
            'progressStatus' => 'en_route',
        ]);

        $status->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.progressStatus', 'en_route');
    }

    public function test_client_can_view_individual_mission_payload(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $mission = Mission::factory()->create([
            'client_id' => $client->id,
            'title' => 'File Fnac',
        ]);

        Sanctum::actingAs($client);

        $response = $this->getJson("/api/missions/{$mission->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $mission->id)
            ->assertJsonPath('data.client.id', $client->id)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'client',
                    'liner',
                    'applicationsCount',
                ],
            ]);
    }

    public function test_liner_can_view_open_mission_with_application_metadata(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $liner = User::factory()->create(['role' => 'liner']);
        $mission = Mission::factory()->create([
            'client_id' => $client->id,
            'liner_id' => null,
            'status' => 'published',
        ]);

        MissionApplication::create([
            'mission_id' => $mission->id,
            'liner_id' => $liner->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($liner);

        $response = $this->getJson("/api/missions/{$mission->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $mission->id)
            ->assertJsonPath('data.myApplication.status', 'pending')
            ->assertJsonPath('data.client.id', $client->id);
    }

    public function test_client_can_drive_full_mission_lifecycle(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $liner = User::factory()->create(['role' => 'liner']);

        Sanctum::actingAs($client);

        $create = $this->postJson('/api/missions', [
            'title' => 'Mission QA',
            'description' => 'File Apple Store',
            'location' => ['label' => 'Apple Store Opéra'],
            'budgetCents' => 2000,
        ])->assertCreated();

        $missionId = $create->json('data.id');

        Sanctum::actingAs($liner);
        $this->postJson("/api/liner/missions/{$missionId}/accept")->assertOk();

        Sanctum::actingAs($client);
        $this->postJson("/api/missions/{$missionId}/authorize-payment")
            ->assertOk()
            ->assertJsonPath('data.paymentStatus', 'authorized');

        Sanctum::actingAs($liner);
        $qrResponse = $this->getJson("/api/liner/missions/{$missionId}/qr")->assertOk();
        $token = $qrResponse->json('data.token');
        $this->assertNotEmpty($token);

        Sanctum::actingAs($client);
        $this->postJson("/api/missions/{$missionId}/verify-qr", ['token' => $token])
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->postJson("/api/missions/{$missionId}/review", ['rating' => 5, 'feedback' => 'Parfait'])
            ->assertOk()
            ->assertJsonPath('data.clientRating', 5)
            ->assertJsonPath('data.clientFeedback', 'Parfait');
    }
}
