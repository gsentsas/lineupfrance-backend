<?php

namespace Database\Factories;

use App\Models\Mission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Mission>
 */
class MissionFactory extends Factory
{
    protected $model = Mission::class;

    public function definition(): array
    {
        $scheduledAt = fake()->dateTimeBetween('+1 hours', '+5 days');

        return [
            'id' => (string) Str::uuid(),
            'client_id' => User::factory(),
            'liner_id' => null,
            'title' => sprintf(
                '%s — %s',
                Arr::random(['Billetterie', 'File d’attente', 'Récupération colis']),
                fake()->city()
            ),
            'description' => fake()->sentence(12),
            'type' => Arr::random(['evenement', 'magasin', 'administration']),
            'location_label' => fake()->streetAddress().' '.fake()->city(),
            'location_lat' => fake()->latitude(48.8, 48.9),
            'location_lng' => fake()->longitude(2.2, 2.4),
            'distance_km' => fake()->randomFloat(1, 0.2, 12),
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => fake()->numberBetween(30, 240),
            'budget_cents' => fake()->numberBetween(500, 4000),
            'commission_cents' => 0,
            'currency' => 'EUR',
            'status' => 'published',
            'progress_status' => 'pending',
            'booking_status' => 'open',
            'payment_status' => 'pending',
            'published_at' => fake()->dateTimeBetween('-2 days', 'now'),
            'qr_token' => null,
            'qr_verified_at' => null,
            'completed_at' => null,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => [
            'status' => 'accepted',
            'progress_status' => 'pending',
            'booking_status' => 'confirmed',
            'payment_status' => 'authorized',
            'liner_id' => User::factory(['role' => 'liner']),
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn () => [
            'status' => 'in_progress',
            'progress_status' => Arr::random(['en_route', 'arrived', 'queueing']),
            'booking_status' => 'in_progress',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => 'completed',
            'progress_status' => 'done',
            'booking_status' => 'completed',
            'payment_status' => 'captured',
            'completed_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => 'cancelled',
            'progress_status' => 'cancelled',
            'booking_status' => 'cancelled',
            'payment_status' => 'cancelled',
        ]);
    }
}
