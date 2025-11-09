<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\Mission;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public function logMission(?Mission $mission, string $event, ?string $description = null, array $meta = []): void
    {
        /** @var User|null $actor */
        $actor = Auth::user();

        AuditLog::create([
            'actor_id' => $actor?->id,
            'mission_id' => $mission?->id,
            'event' => $event,
            'description' => $description,
            'meta' => $meta,
        ]);
    }
}
