<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('mission.{missionId}', function ($user, $missionId) {
    $missionId = (string) $missionId;

    $isClient = $user->clientMissions()->where('id', $missionId)->exists();
    $isLiner = $user->linerMissions()->where('id', $missionId)->exists();

    return $isClient || $isLiner;
});
