<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => $notifications->map(fn (Notification $notification) => ApiResponse::notification($notification))->all(),
        ]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        abort_if($notification->user_id !== $request->user()->id, 403);

        $notification->read_at = now();
        $notification->save();

        return response()->json(ApiResponse::notification($notification));
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['status' => 'ok']);
    }

    public function stream(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_unless($user, 401);

        if ($request->hasSession()) {
            $request->session()->save(); // release session lock for long-running stream
        }

        $ttlSeconds = 90;
        $sleepSeconds = 8;

        return response()->stream(function () use ($user, $ttlSeconds, $sleepSeconds) {
            $lastId = 0;
            $start = microtime(true);
            $lastHeartbeat = 0;

            while (!connection_aborted() && (microtime(true) - $start) < $ttlSeconds) {
                $notifications = Notification::query()
                    ->where('user_id', $user->id)
                    ->when($lastId, fn ($query) => $query->where('id', '>', $lastId))
                    ->latest('id')
                    ->limit(20)
                    ->get()
                    ->sortBy('id')
                    ->values();

                if ($notifications->isNotEmpty()) {
                    $lastId = $notifications->last()->id;
                    $payload = [
                        'type' => 'notifications',
                        'items' => $notifications
                            ->map(fn (Notification $notification) => ApiResponse::notification($notification))
                            ->all(),
                    ];
                    echo 'data: '.json_encode($payload)."\n\n";
                    if (ob_get_level() > 0) {
                        @ob_flush();
                    }
                    flush();
                } elseif ((microtime(true) - $lastHeartbeat) >= 15) {
                    echo 'data: '.json_encode([
                        'type' => 'ping',
                        'time' => now()->toIso8601String(),
                    ])."\n\n";
                    if (ob_get_level() > 0) {
                        @ob_flush();
                    }
                    flush();
                    $lastHeartbeat = microtime(true);
                }

                sleep($sleepSeconds);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
