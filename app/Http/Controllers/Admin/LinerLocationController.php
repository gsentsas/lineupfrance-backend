<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class LinerLocationController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $liners = User::query()
            ->with('linerProfile')
            ->whereHas('linerProfile', fn ($query) => $query
                ->whereNotNull('last_lat')
                ->whereNotNull('last_lng'))
            ->orderByDesc('linerProfile.last_seen_at')
            ->limit(100)
            ->get()
            ->map(function (User $user) {
                $profile = $user->linerProfile;
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'status' => $user->liner_status ?? 'active',
                    'location' => [
                        'latitude' => $profile?->last_lat,
                        'longitude' => $profile?->last_lng,
                        'label' => $profile?->last_location_label,
                    ],
                    'lastSeenAt' => optional($profile?->last_seen_at)->toIso8601String(),
                ];
            });

        return response()->json([
            'data' => $liners,
        ]);
    }
}
