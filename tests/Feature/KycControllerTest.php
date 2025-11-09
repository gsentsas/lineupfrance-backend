<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KycControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_liner_can_manage_kyc_checklist(): void
    {
        $liner = User::factory()->create(['role' => 'liner']);

        Sanctum::actingAs($liner);

        $show = $this->getJson('/api/liner/kyc');
        $show->assertOk()
            ->assertJsonStructure(['status', 'lastSubmitted', 'checklist'])
            ->assertJsonPath('status', 'not_started');

        $toggle = $this->patchJson('/api/liner/kyc/checklist/identity', [
            'completed' => true,
        ]);

        $toggle->assertOk()
            ->assertJson(fn (AssertableJson $json) => $json
                ->where('checklist.0.completed', true)
                ->etc());

        $submit = $this->patchJson('/api/liner/kyc/submit', [
            'status' => 'review',
        ]);

        $submit->assertOk()
            ->assertJson(fn (AssertableJson $json) => $json
                ->where('status', 'review')
                ->whereNotNull('lastSubmitted')
                ->etc());
    }
}
