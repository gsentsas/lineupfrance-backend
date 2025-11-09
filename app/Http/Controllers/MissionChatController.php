<?php

namespace App\Http\Controllers;

use App\Events\MissionMessageCreated;
use App\Models\ChatMessage;
use App\Models\Mission;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MissionChatController extends Controller
{
    public function index(Request $request, Mission $mission): JsonResponse
    {
        $this->authorizeParticipant($request->user(), $mission);

        $messages = $mission->chatMessages()
            ->with('user')
            ->latest()
            ->limit(100)
            ->get()
            ->sortBy('created_at')
            ->values();

        return response()->json([
            'data' => $messages->map(fn (ChatMessage $message) => ApiResponse::chatMessage($message))->all(),
        ]);
    }

    public function store(Request $request, Mission $mission): JsonResponse
    {
        $user = $request->user();
        $this->authorizeParticipant($user, $mission);

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $files = $request->file('attachments', []);
        if (! is_array($files)) {
            $files = [$files];
        }

        $hasBody = filled($data['body'] ?? null);
        $hasFiles = collect($files)->filter()->isNotEmpty();

        if (! $hasBody && ! $hasFiles) {
            return response()->json([
                'message' => 'Un message ou une pièce jointe est requis.',
                'errors' => [
                    'body' => ['Un message ou une pièce jointe est requis.'],
                ],
            ], 422);
        }

        $attachments = $hasFiles ? $this->storeAttachments($mission, $files) : [];

        $message = $mission->chatMessages()->create([
            'user_id' => $user->id,
            'role' => $user->role,
            'body' => $data['body'] ?? '',
            'attachments' => $attachments,
        ]);

        MissionMessageCreated::dispatch($message->fresh('user'));

        return response()->json([
            'data' => ApiResponse::chatMessage($message->fresh('user')),
        ], 201);
    }

    private function authorizeParticipant($user, Mission $mission): void
    {
        abort_unless(
            $user &&
            ($user->hasTeamRole('ops', 'admin') ||
                $user->role === 'admin' ||
                $mission->client_id === $user->id ||
                $mission->liner_id === $user->id),
            403,
            'Accès non autorisé à cette conversation.'
        );
    }

    private function storeAttachments(Mission $mission, array $files): array
    {
        $disk = Storage::disk('public');
        $directory = 'chat/'.$mission->id;

        return collect($files)
            ->filter()
            ->map(function ($file) use ($disk, $directory) {
                $path = $file->store($directory, ['disk' => 'public']);
                $mime = $file->getMimeType() ?? $file->getClientMimeType();

                return [
                    'id' => (string) Str::uuid(),
                    'name' => $file->getClientOriginalName() ?: basename($path),
                    'mime' => $mime,
                    'type' => $mime && str_starts_with($mime, 'image/') ? 'image' : 'file',
                    'size' => $file->getSize(),
                    'url' => $disk->url($path),
                ];
            })
            ->values()
            ->all();
    }
}
