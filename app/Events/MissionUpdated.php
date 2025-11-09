<?php

namespace App\Events;

use App\Models\Mission;
use App\Support\ApiResponse;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MissionUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public Mission $mission)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("mission.{$this->mission->id}")];
    }

    public function broadcastAs(): string
    {
        return 'mission.updated';
    }

    public function broadcastWith(): array
    {
        $mission = $this->mission->fresh() ?? $this->mission;

        return [
            'mission' => ApiResponse::mission($mission),
        ];
    }
}
