<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LinerPreferenceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'night_missions' => fake()->boolean(30),
            'max_distance_km' => fake()->numberBetween(1, 20),
            'min_earning_euros' => fake()->numberBetween(5, 50),
            'auto_accept' => fake()->boolean(10),
        ];
    }
}
