<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationFeedController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = min($request->integer('limit', 25), 50);

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Notification $notification) => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'category' => $notification->category,
                'readAt' => optional($notification->read_at)->toISOString(),
                'createdAt' => optional($notification->created_at)->toISOString(),
            ]);

        return response()->json([
            'data' => $notifications,
        ]);
    }
}
