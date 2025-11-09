<?php

namespace Tests\Feature\Admin;

use App\Events\NotificationCreated;
use App\Models\Announcement;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\PayoutAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OpsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([NotificationCreated::class]);
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin, ['*']);

        return $admin;
    }

    public function test_admin_can_filter_missions_table(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $liner = User::factory()->create(['role' => 'liner']);

        $completed = Mission::factory()->completed()->create([
            'client_id' => $client->id,
            'liner_id' => $liner->id,
            'title' => 'Mission terminée',
            'payment_status' => 'captured',
        ]);

        Mission::factory()->create([
            'client_id' => $client->id,
            'title' => 'Mission active',
        ]);

        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/missions?status=completed');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $completed->id)
            ->assertJsonPath('meta.filters.status.0', 'completed');
    }

    public function test_admin_can_list_clients_with_status_filters(): void
    {
        $clientActive = User::factory()->create(['role' => 'client', 'name' => 'Active Client']);
        $clientIdle = User::factory()->create(['role' => 'client', 'name' => 'Idle Client']);

        Mission::factory()->create([
            'client_id' => $clientActive->id,
            'status' => 'published',
        ]);

        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/clients?status=active');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Client');

        $idleResponse = $this->getJson('/api/admin/clients?status=idle');
        $idleResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Idle Client');
    }

    public function test_admin_can_list_liners_with_rating_filters(): void
    {
        $linerApproved = User::factory()->create(['role' => 'liner', 'name' => 'Samir']);
        $linerApproved->linerProfile()->create([
            'rating' => 4.8,
            'missions_completed' => 120,
            'kyc_status' => 'approved',
            'availability' => 'Lun-Dim',
        ]);

        $linerPending = User::factory()->create(['role' => 'liner', 'name' => 'Alex']);
        $linerPending->linerProfile()->create([
            'rating' => 3.4,
            'missions_completed' => 10,
            'kyc_status' => 'review',
        ]);

        $this->actingAsAdmin();

        $response = $this->getJson('/api/admin/liners?status=verified&ratingMin=4');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Samir')
            ->assertJsonPath('data.0.kycStatus', 'approved');
    }

    public function test_broadcast_creates_notifications_for_all_ops_users(): void
    {
        $admin = $this->actingAsAdmin();
        $ops = User::factory()->create(['role' => 'admin', 'team_role' => 'ops']);

        $response = $this->postJson('/api/admin/quick-actions/broadcast', [
            'title' => 'Incident Paris',
            'message' => 'File d’attente interrompue.',
        ]);

        $response->assertOk();

        $this->assertGreaterThanOrEqual(2, Notification::whereIn('user_id', [$admin->id, $ops->id])->count());
    }

    public function test_notifications_feed_is_scoped_to_current_user(): void
    {
        $admin = $this->actingAsAdmin();
        $other = User::factory()->create(['role' => 'admin']);

        Notification::create([
            'user_id' => $admin->id,
            'title' => 'Test',
            'message' => 'Ops only',
            'category' => 'ops',
        ]);

        Notification::create([
            'user_id' => $other->id,
            'title' => 'Hidden',
            'message' => 'Should not see',
            'category' => 'ops',
        ]);

        $response = $this->getJson('/api/admin/notifications');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Test');
    }

    public function test_admin_can_manage_announcements(): void
    {
        $this->actingAsAdmin();

        $create = $this->postJson('/api/admin/announcements', [
            'title' => 'Maintenance PSP',
            'body' => 'Stripe en pause de 2h à 3h.',
            'category' => 'ops',
        ]);

        $create->assertCreated()->assertJsonPath('data.title', 'Maintenance PSP');

        $list = $this->getJson('/api/admin/announcements');
        $list->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'ops');

        $announcementId = $list->json('data.0.id');

        $update = $this->putJson("/api/admin/announcements/{$announcementId}", [
            'title' => 'Maintenance Stripe',
        ]);
        $update->assertOk()->assertJsonPath('data.title', 'Maintenance Stripe');
    }

    public function test_admin_can_list_payout_accounts(): void
    {
        $admin = $this->actingAsAdmin();
        $liner = User::factory()->create(['role' => 'liner']);

        PayoutAccount::create([
            'id' => (string) Str::uuid(),
            'user_id' => $liner->id,
            'provider' => 'stripe',
            'label' => 'Compte test',
            'status' => 'pending',
            'is_default' => true,
        ]);

        $response = $this->getJson('/api/admin/payout-accounts');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.label', 'Compte test')
            ->assertJsonPath('data.0.user.name', $liner->name);
    }
}
