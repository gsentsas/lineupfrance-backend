<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use App\Services\Notifications\DeviceSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function __construct(private DeviceSubscriptionService $subscriptionService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'platform' => ['nullable', 'string', 'max:50'],
        ]);

        $user = $request->user()->loadMissing(['clientProfile', 'linerProfile']);

        $device = DeviceToken::query()->updateOrCreate(
            ['token' => $data['token']],
            [
                'user_id' => $user->id,
                'platform' => $data['platform'] ?? 'web',
                'last_seen_at' => now(),
            ]
        );

        if ($topic = $this->topicForUser($user)) {
            $this->subscriptionService->subscribe($topic, $device->token);
        }

        return response()->json([
            'status' => 'ok',
            'topic' => $topic ?? null,
        ]);
    }

    private function topicForUser($user): ?string
    {
        $phone = $user->phone
            ?? $user->clientProfile?->phone
            ?? $user->linerProfile?->phone;

        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (! $digits) {
            return null;
        }

        return 'sms-'.$digits;
    }
}
