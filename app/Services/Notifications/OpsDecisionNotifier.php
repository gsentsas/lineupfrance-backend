<?php

namespace App\Services\Notifications;

use App\Models\Mission;
use App\Models\MissionApplication;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;

class OpsDecisionNotifier
{
    public function __construct(private FirebaseSmsService $smsService)
    {
    }

    public function applicationAccepted(Mission $mission, MissionApplication $application): void
    {
        $liner = $application->liner;
        $client = $mission->client;

        if ($liner) {
            $this->sendEmail(
                $liner->email,
                '✅ Votre candidature LineUp est acceptée',
                sprintf("Félicitations %s ! Vous êtes retenu pour « %s ».\nConnectez-vous pour suivre la mission en direct.", $liner->name, $mission->title)
            );
            $this->smsService->send($liner->phone, "LineUp • Votre candidature est acceptée pour {$mission->title}.");
            $this->createNotification($liner->id, 'Candidature acceptée', "Vous êtes affecté à « {$mission->title} ».", 'mission');
        }

        if ($client) {
            $linerName = $liner?->name ?? 'Un liner';
            $this->sendEmail(
                $client->email,
                '👥 Liner confirmé sur votre mission',
                sprintf("%s rejoint votre mission « %s ». Vous pouvez suivre l’arrivée et le QR de validation dans l’app.", $linerName, $mission->title)
            );
            $this->smsService->send($client->phone, "LineUp • {$linerName} rejoint votre mission « {$mission->title} ».");
            $this->createNotification($client->id, 'Liner confirmé', "{$linerName} prend en charge votre mission.", 'mission');
        }
    }

    public function applicationRejected(Mission $mission, MissionApplication $application): void
    {
        $liner = $application->liner;

        if (! $liner) {
            return;
        }

        $this->sendEmail(
            $liner->email,
            'LineUp • Candidature non retenue',
            sprintf("Votre candidature pour « %s » n'a pas été retenue. Continuez à postuler, d'autres missions arrivent chaque heure !", $mission->title)
        );
        $this->smsService->send($liner->phone, "LineUp • Candidature non retenue pour {$mission->title}.");
        $this->createNotification($liner->id, 'Candidature refusée', "Votre demande pour « {$mission->title} » a été refusée.", 'mission');
    }

    private function sendEmail(?string $email, string $subject, string $body): void
    {
        if (! $email) {
            return;
        }

        Mail::raw($body, function ($message) use ($email, $subject) {
            $message->to($email)->subject($subject);
        });
    }

    private function createNotification(int $userId, string $title, string $message, string $category): void
    {
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'category' => $category,
        ]);
    }
}
