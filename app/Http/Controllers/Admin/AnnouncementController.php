<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::query()
            ->with('user')
            ->latest('published_at')
            ->latest()
            ->get();

        return response()->json([
            'data' => $announcements
                ->map(fn (Announcement $announcement) => ApiResponse::announcement($announcement))
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $announcement = Announcement::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'category' => $validated['category'] ?? null,
            'published_at' => now(),
        ]);

        return response()->json([
            'data' => ApiResponse::announcement($announcement->fresh('user')),
        ], 201);
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'body' => ['sometimes', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $announcement->fill($validated);
        $announcement->save();

        return response()->json([
            'data' => ApiResponse::announcement($announcement->fresh('user')),
        ]);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json([
            'status' => 'deleted',
        ]);
    }
}
