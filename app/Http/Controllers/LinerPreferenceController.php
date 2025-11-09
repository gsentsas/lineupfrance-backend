<?php

namespace App\Http\Controllers;

use App\Models\LinerPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LinerPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $preference = $this->firstOrCreate($request);

        return response()->json(['data' => $this->serialize($preference)]);
    }

    public function update(Request $request): JsonResponse
    {
        $preference = $this->firstOrCreate($request);

        $data = $request->validate([
            'nightMissions' => ['nullable', 'boolean'],
            'maxDistanceKm' => ['nullable', 'numeric', 'min:1', 'max:100'],
            'minEarningEuros' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'autoAccept' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('nightMissions', $data)) {
            $preference->night_missions = (bool) $data['nightMissions'];
        }
        if (array_key_exists('maxDistanceKm', $data)) {
            $preference->max_distance_km = (int) round($data['maxDistanceKm']);
        }
        if (array_key_exists('minEarningEuros', $data)) {
            $preference->min_earning_euros = (int) round($data['minEarningEuros']);
        }
        if (array_key_exists('autoAccept', $data)) {
            $preference->auto_accept = (bool) $data['autoAccept'];
        }

        $preference->save();

        return response()->json(['data' => $this->serialize($preference)]);
    }

    private function firstOrCreate(Request $request): LinerPreference
    {
        return LinerPreference::firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'night_missions' => false,
                'max_distance_km' => 5,
                'min_earning_euros' => 10,
                'auto_accept' => false,
            ],
        );
    }

    private function serialize(LinerPreference $preference): array
    {
        return [
            'nightMissions' => (bool) $preference->night_missions,
            'maxDistanceKm' => (int) $preference->max_distance_km,
            'minEarningEuros' => (int) $preference->min_earning_euros,
            'autoAccept' => (bool) $preference->auto_accept,
            'updatedAt' => $preference->updated_at?->toISOString(),
        ];
    }
}
