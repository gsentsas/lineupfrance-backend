<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_signup_profile_sync_updates_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Temp User',
            'email' => 'temp@example.com',
            'role' => 'client',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/profile', [
            'role' => 'liner',
            'fullName' => 'Samira Diallo',
            'phone' => '+33600000000',
            'email' => 'samira@example.com',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('user.role', 'liner')
            ->assertJsonPath('user.name', 'Samira Diallo');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'liner',
            'phone' => '+33600000000',
            'email' => 'samira@example.com',
        ]);

        $this->assertDatabaseHas('liner_profiles', [
            'user_id' => $user->id,
        ]);
    }

    public function test_sync_validates_email_uniqueness(): void
    {
        $existing = User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/profile', [
            'role' => 'client',
            'email' => $existing->email,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }
}
