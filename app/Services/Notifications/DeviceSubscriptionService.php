<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\Exception\MessagingException;

class DeviceSubscriptionService
{
    public function __construct(private Messaging $messaging)
    {
    }

    public function subscribe(string $topic, string $token): void
    {
        try {
            $this->messaging->subscribeToTopic($topic, $token);
        } catch (MessagingException|FirebaseException $e) {
            Log::warning('[FirebaseTopic] subscribe failed', [
                'topic' => $topic,
                'token' => $token,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
