<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpsRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_ops_console(): void
    {
        $this->get('/ops')->assertRedirect('/login');
    }

    public function test_admin_can_access_ops_console_shell(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin);

        $this->get('/ops')
            ->assertOk()
            ->assertSee('ops-root', false)
            ->assertSee('LineUp Ops Console', false);
    }
}
