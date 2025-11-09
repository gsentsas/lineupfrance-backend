<?php

namespace App\Http\Controllers\Admin;

use App\Events\MissionUpdated;
use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QuickActionController extends Controller
{
    public function createTestMission(Request $request): JsonResponse
    {
        $client = $request->user();

        $mission = Mission::create([
            'client_id' => $client->id,
            'title' => 'Mission test Ops '.Str::upper(Str::random(4)),
            'description' => 'Mission de démonstration créée depuis la console.',
            'status' => 'published',
            'progress_status' => 'pending',
            'payment_status' => 'pending',
            'booking_status' => 'open',
            'budget_cents' => 2000,
            'commission_cents' => 300,
            'currency' => 'EUR',
            'location_label' => 'LineUp HQ',
            'published_at' => now(),
        ]);

        MissionUpdated::dispatch($mission);

        return response()->json([
            'data' => [
                'id' => $mission->id,
                'title' => $mission->title,
                'status' => $mission->status,
            ],
        ], 201);
    }

    public function broadcast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:500'],
        ]);

        $recipients = User::query()
            ->where('role', 'admin')
            ->orWhereNotNull('team_role')
            ->pluck('id')
            ->unique()
            ->values();

        foreach ($recipients as $userId) {
            Notification::create([
                'user_id' => $userId,
                'title' => $data['title'],
                'message' => $data['message'],
                'category' => 'ops',
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
