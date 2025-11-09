<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LinerPreferenceControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_liner_can_view_and_update_preferences(): void
    {
        $liner = User::factory()->create(['role' => 'liner']);

        Sanctum::actingAs($liner);

        $show = $this->getJson('/api/liner/preferences');
        $show->assertOk()
            ->assertJsonPath('data.nightMissions', false)
            ->assertJsonPath('data.maxDistanceKm', 5)
            ->assertJsonPath('data.minEarningEuros', 10)
            ->assertJsonPath('data.autoAccept', false);

        $update = $this->putJson('/api/liner/preferences', [
            'nightMissions' => true,
            'maxDistanceKm' => 15,
            'minEarningEuros' => 25,
            'autoAccept' => true,
        ]);

        $update->assertOk()
            ->assertJsonPath('data.nightMissions', true)
            ->assertJsonPath('data.maxDistanceKm', 15)
            ->assertJsonPath('data.minEarningEuros', 25)
            ->assertJsonPath('data.autoAccept', true);

        $this->assertDatabaseHas('liner_preferences', [
            'user_id' => $liner->id,
            'night_missions' => true,
            'max_distance_km' => 15,
            'min_earning_euros' => 25,
            'auto_accept' => true,
        ]);
    }
}
