<?php

namespace App\Events;

use App\Models\ChatMessage;
use App\Support\ApiResponse;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MissionMessageCreated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public ChatMessage $message)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("mission.{$this->message->mission_id}")];
    }

    public function broadcastAs(): string
    {
        return 'mission.message.created';
    }

    public function broadcastWith(): array
    {
        $message = $this->message->loadMissing('user');

        return [
            'message' => ApiResponse::chatMessage($message),
        ];
    }
}
