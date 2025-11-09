<?php

namespace App\Support;

use App\Models\Announcement;
use App\Models\AppSetting;
use App\Models\ChatMessage;
use App\Models\ClientProfile;
use App\Models\LinerProfile;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\PaymentMethod;
use App\Models\PayoutAccount;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Collection;

class ApiResponse
{
    public static function user(User $user): array
    {
        $user->loadMissing([
            'clientProfile',
            'linerProfile',
            'paymentMethods',
            'payoutAccounts',
        ]);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'teamRole' => $user->team_role,
            'teamPermissions' => $user->team_permissions ?? [],
            'phone' => $user->phone,
            'avatarUrl' => $user->avatar_url,
            'clientProfile' => $user->clientProfile ? self::clientProfile($user->clientProfile) : null,
            'linerProfile' => $user->linerProfile ? self::linerProfile($user->linerProfile) : null,
            'paymentMethods' => $user->paymentMethods
                ->sortByDesc('is_default')
                ->values()
                ->map(fn (PaymentMethod $method) => self::paymentMethod($method))
                ->all(),
            'payoutMethods' => $user->payoutAccounts
                ->sortByDesc('is_default')
                ->values()
                ->map(fn (PayoutAccount $account) => self::payoutAccount($account))
                ->all(),
        ];
    }

    public static function paymentProviderSettings(Collection $settings): array
    {
        return $settings
            ->mapWithKeys(fn (AppSetting $setting) => [
                $setting->key => $setting->value + ['label' => $setting->label],
            ])
            ->all();
    }

    public static function clientProfile(ClientProfile $profile): array
    {
        return [
            'address' => $profile->address,
            'preferredCommunication' => $profile->preferred_communication,
            'defaultPaymentMethodId' => $profile->default_payment_method_id,
        ];
    }

    public static function linerProfile(LinerProfile $profile): array
    {
        return [
            'bio' => $profile->bio,
            'hourlyRate' => $profile->hourly_rate,
            'availability' => $profile->availability,
            'rating' => $profile->rating,
            'missionsCompleted' => $profile->missions_completed,
            'payoutMethodId' => $profile->payout_method_id,
            'kyc' => self::linerKyc($profile),
        ];
    }

    public static function linerKyc(LinerProfile $profile): array
    {
        return [
            'status' => $profile->kyc_status ?? 'not_started',
            'lastSubmitted' => optional($profile->kyc_last_submitted)->toISOString(),
            'checklist' => $profile->kyc_checklist ?? [
                ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => false],
                ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => false],
                ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
                ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => false],
            ],
        ];
    }

    public static function paymentMethod(PaymentMethod $method): array
    {
        return [
            'id' => $method->id,
            'provider' => $method->provider,
            'label' => $method->label,
            'status' => $method->status,
            'isDefault' => (bool) $method->is_default,
            'meta' => $method->meta ?? [],
        ];
    }

    public static function payoutAccount(PayoutAccount $account): array
    {
        return [
            'id' => $account->id,
            'provider' => $account->provider,
            'label' => $account->label,
            'status' => $account->status,
            'isDefault' => (bool) $account->is_default,
            'meta' => $account->meta ?? [],
        ];
    }

    public static function mission(Mission $mission): array
    {
        $payload = [
            'id' => $mission->id,
            'title' => $mission->title,
            'description' => $mission->description,
            'type' => $mission->type,
            'location' => [
                'label' => $mission->location_label,
                'latitude' => $mission->location_lat,
                'longitude' => $mission->location_lng,
                'distanceKm' => $mission->distance_km,
            ],
            'scheduledAt' => optional($mission->scheduled_at)->toISOString(),
            'durationMinutes' => $mission->duration_minutes,
            'budgetCents' => $mission->budget_cents,
            'commissionCents' => $mission->commission_cents,
            'clientRating' => $mission->client_rating,
            'clientFeedback' => $mission->client_feedback,
            'currency' => $mission->currency,
            'status' => $mission->status,
            'progressStatus' => $mission->progress_status,
            'bookingStatus' => $mission->booking_status,
            'paymentStatus' => $mission->payment_status,
            'publishedAt' => optional($mission->published_at)->toISOString(),
            'clientId' => $mission->client_id,
            'linerId' => $mission->liner_id,
            'completedAt' => optional($mission->completed_at)->toISOString(),
            'clientRatedAt' => optional($mission->client_rated_at)->toISOString(),
            'applicationsCount' => $mission->applications_count ?? $mission->applications()->count(),
            'liner' => $mission->relationLoaded('liner') && $mission->liner ? [
                'id' => $mission->liner->id,
                'name' => $mission->liner->name,
                'avatarUrl' => $mission->liner->avatar_url,
                'rating' => optional($mission->liner->linerProfile)->rating,
                'missionsCompleted' => optional($mission->liner->linerProfile)->missions_completed,
            ] : null,
        ];

        $payload['client'] = $mission->relationLoaded('client') && $mission->client ? [
            'id' => $mission->client->id,
            'name' => $mission->client->name,
            'avatarUrl' => $mission->client->avatar_url,
            'preferredCommunication' => optional($mission->client->clientProfile)->preferred_communication,
        ] : null;

        if ($mission->relationLoaded('applications')) {
            $application = $mission->applications->first();

            $payload['myApplication'] = $application ? [
                'id' => $application->id,
                'status' => $application->status,
                'message' => $application->message,
                'proposedRateCents' => $application->proposed_rate_cents,
                'submittedAt' => optional($application->created_at)->toISOString(),
                'decidedAt' => optional($application->accepted_at ?? $application->rejected_at)->toISOString(),
            ] : null;
        } else {
            $payload['myApplication'] = null;
        }

        return $payload;
    }

    public static function notification(Notification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'category' => $notification->category,
            'data' => $notification->data ?? [],
            'readAt' => optional($notification->read_at)->toISOString(),
            'createdAt' => optional($notification->created_at)->toISOString(),
        ];
    }

    public static function walletTransactions($transactions): array
    {
        return collect($transactions)
            ->map(fn (WalletTransaction $tx) => [
                'id' => $tx->id,
                'type' => $tx->type,
                'status' => $tx->status,
                'amountCents' => $tx->amount_cents,
                'currency' => $tx->currency,
                'description' => $tx->description,
                'counterparty' => $tx->counterparty,
                'method' => $tx->method,
                'createdAt' => optional($tx->created_at)->toISOString(),
            ])
            ->all();
    }

    public static function chatMessage(ChatMessage $message): array
    {
        return [
            'id' => $message->id,
            'missionId' => $message->mission_id,
            'userId' => $message->user_id,
            'role' => $message->role,
            'body' => $message->body,
            'attachments' => $message->attachments ?? [],
            'createdAt' => optional($message->created_at)->toISOString(),
            'user' => $message->relationLoaded('user') && $message->user ? [
                'id' => $message->user->id,
                'name' => $message->user->name,
                'avatarUrl' => $message->user->avatar_url,
                'role' => $message->user->role,
            ] : null,
        ];
    }

    public static function announcement(Announcement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'category' => $announcement->category,
            'publishedAt' => optional($announcement->published_at)->toIso8601String(),
            'author' => $announcement->relationLoaded('user') && $announcement->user ? [
                'id' => $announcement->user->id,
                'name' => $announcement->user->name,
                'email' => $announcement->user->email,
            ] : null,
            'createdAt' => optional($announcement->created_at)->toIso8601String(),
        ];
    }
}
