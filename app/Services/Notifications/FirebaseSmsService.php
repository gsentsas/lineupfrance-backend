<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\Exception\MessagingException;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseSmsService
{
    public function __construct(private Messaging $messaging)
    {
    }

    public function send(?string $phone, string $body): void
    {
        if (! $phone) {
            return;
        }

        $topic = $this->topicFromPhone($phone);

        $message = CloudMessage::withTarget('topic', $topic)
            ->withNotification(Notification::create('LineUp France', $body))
            ->withData([
                'type' => 'sms',
                'phone' => $phone,
                'message' => $body,
            ]);

        try {
            $this->messaging->send($message);
        } catch (MessagingException|FirebaseException $e) {
            Log::warning('[FirebaseSMS] Unable to deliver message.', [
                'phone' => $phone,
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function topicFromPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: 'unknown';

        return 'sms-'.$digits;
    }
}
