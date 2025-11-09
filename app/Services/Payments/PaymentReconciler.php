<?php

namespace App\Services\Payments;

use App\Models\Mission;
use App\Models\Notification;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentReconciler
{
    public function handleStripePaymentIntent(array $event): void
    {
        $object = Arr::get($event, 'data.object', []);
        $missionId = Arr::get($object, 'metadata.mission_id');

        if (! $missionId) {
            Log::warning('[StripeWebhook] PaymentIntent missing mission_id metadata.', ['event_id' => $event['id'] ?? null]);
            return;
        }

        $mission = Mission::find($missionId);
        if (! $mission) {
            Log::warning('[StripeWebhook] Mission not found for payment intent.', ['mission_id' => $missionId]);
            return;
        }

        $amount = (int) ($object['amount_received'] ?? $object['amount'] ?? 0);
        $currency = strtoupper($object['currency'] ?? $mission->currency ?? 'EUR');
        $paymentIntentId = $object['id'] ?? null;

        DB::transaction(function () use ($mission, $amount, $currency, $paymentIntentId, $event) {
            $this->storeWalletTransaction(
                $mission->client_id,
                [
                    'type' => 'debit',
                    'status' => 'completed',
                    'amount_cents' => $amount,
                    'currency' => $currency,
                    'description' => $mission->title,
                    'counterparty' => optional($mission->liner)->name,
                    'method' => 'Stripe',
                    'meta' => [
                        'provider' => 'stripe',
                        'external_id' => $paymentIntentId,
                        'mission_id' => $mission->id,
                        'event_id' => $event['id'] ?? null,
                    ],
                ]
            );

            if ($mission->liner_id) {
                $this->storeWalletTransaction(
                    $mission->liner_id,
                    [
                        'type' => 'credit',
                        'status' => 'pending',
                        'amount_cents' => $amount,
                        'currency' => $currency,
                        'description' => $mission->title,
                        'counterparty' => optional($mission->client)->name,
                        'method' => 'Stripe',
                        'meta' => [
                            'provider' => 'stripe',
                            'source_payment_intent' => $paymentIntentId,
                            'mission_id' => $mission->id,
                        ],
                    ]
                );
            }

            if ($mission->status === 'published') {
                $mission->status = 'accepted';
                $mission->progress_status = $mission->progress_status === 'cancelled' ? 'pending' : $mission->progress_status;
            }
            $mission->save();

            $this->notifyUser($mission->client, 'Paiement réussi', sprintf('Votre mission « %s » a été réglée (%s %s).', $mission->title, number_format($amount / 100, 2, ',', ' '), $currency));
        });
    }

    public function handleStripePayout(array $event): void
    {
        $payout = Arr::get($event, 'data.object', []);
        $paymentIntentId = Arr::get($payout, 'metadata.source_payment_intent');

        if (! $paymentIntentId) {
            Log::info('[StripeWebhook] Payout without source payment intent metadata.', ['payout_id' => $payout['id'] ?? null]);
            return;
        }

        $transaction = WalletTransaction::query()
            ->where('meta->provider', 'stripe')
            ->where('meta->source_payment_intent', $paymentIntentId)
            ->first();

        if (! $transaction) {
            Log::info('[StripeWebhook] Liner wallet transaction not found for payout.', ['payment_intent' => $paymentIntentId]);
            return;
        }

        $transaction->status = 'completed';
        $transaction->method = 'Stripe Payout';
        $transaction->meta = array_merge($transaction->meta ?? [], [
            'payout_id' => $payout['id'] ?? null,
        ]);
        $transaction->save();

        $this->notifyUser(
            $transaction->user,
            'Virement effectué',
            'Un virement Stripe vient d’être versé sur votre compte.'
        );
    }

    public function handlePayPalCapture(array $event): void
    {
        $resource = $event['resource'] ?? [];
        $missionId = Arr::get($resource, 'custom_id');

        if (! $missionId) {
            Log::warning('[PayPalWebhook] Capture missing custom_id (mission reference).', ['event_id' => $event['id'] ?? null]);
            return;
        }

        $mission = Mission::find($missionId);
        if (! $mission) {
            Log::warning('[PayPalWebhook] Mission not found for capture.', ['mission_id' => $missionId]);
            return;
        }

        $amount = (int) round(((float) ($resource['amount']['value'] ?? 0)) * 100);
        $currency = strtoupper($resource['amount']['currency_code'] ?? $mission->currency ?? 'EUR');
        $captureId = $resource['id'] ?? null;

        DB::transaction(function () use ($mission, $amount, $currency, $captureId, $event) {
            $this->storeWalletTransaction(
                $mission->client_id,
                [
                    'type' => 'debit',
                    'status' => 'completed',
                    'amount_cents' => $amount,
                    'currency' => $currency,
                    'description' => $mission->title,
                    'counterparty' => optional($mission->liner)->name,
                    'method' => 'PayPal',
                    'meta' => [
                        'provider' => 'paypal',
                        'external_id' => $captureId,
                        'mission_id' => $mission->id,
                        'event_id' => $event['id'] ?? null,
                    ],
                ]
            );

            if ($mission->liner_id) {
                $this->storeWalletTransaction(
                    $mission->liner_id,
                    [
                        'type' => 'credit',
                        'status' => 'pending',
                        'amount_cents' => $amount,
                        'currency' => $currency,
                        'description' => $mission->title,
                        'counterparty' => optional($mission->client)->name,
                        'method' => 'PayPal',
                        'meta' => [
                            'provider' => 'paypal',
                            'source_capture_id' => $captureId,
                            'mission_id' => $mission->id,
                        ],
                    ]
                );
            }

            if ($mission->status === 'published') {
                $mission->status = 'accepted';
                $mission->progress_status = $mission->progress_status === 'cancelled' ? 'pending' : $mission->progress_status;
            }
            $mission->save();

            $this->notifyUser(
                $mission->client,
                'Paiement PayPal validé',
                sprintf('Votre mission « %s » a été réglée via PayPal (%s %s).', $mission->title, number_format($amount / 100, 2, ',', ' '), $currency)
            );
        });
    }

    public function handlePayPalPayout(array $event): void
    {
        $batchId = Arr::get($event, 'resource.batch_header.payout_batch_id');
        $senderBatchId = Arr::get($event, 'resource.batch_header.sender_batch_header.sender_batch_id');

        if (! $senderBatchId) {
            Log::info('[PayPalWebhook] Payout success missing sender_batch_id.');
            return;
        }

        $transaction = WalletTransaction::query()
            ->where('meta->provider', 'paypal')
            ->where(function ($query) use ($senderBatchId, $batchId) {
                $query->where('meta->sender_batch_id', $senderBatchId);
                if ($batchId) {
                    $query->orWhere('meta->payout_batch_id', $batchId);
                }
            })
            ->first();

        if (! $transaction) {
            Log::info('[PayPalWebhook] No wallet transaction found for payout batch.', [
                'sender_batch_id' => $senderBatchId,
            ]);
            return;
        }

        $transaction->status = 'completed';
        $transaction->method = 'PayPal Payout';
        $transaction->meta = array_merge($transaction->meta ?? [], [
            'payout_batch_id' => $batchId,
            'sender_batch_id' => $senderBatchId,
        ]);
        $transaction->save();

        $this->notifyUser(
            $transaction->user,
            'Virement PayPal effectué',
            'Votre payout PayPal a bien été crédité.'
        );
    }

    private function storeWalletTransaction(int $userId, array $attributes): WalletTransaction
    {
        $query = WalletTransaction::query()
            ->where('user_id', $userId)
            ->where('meta->provider', $attributes['meta']['provider'] ?? null)
            ->when(
                $attributes['meta']['external_id'] ?? null,
                fn ($builder, $externalId) => $builder->where('meta->external_id', $externalId)
            )
            ->when(
                $attributes['meta']['source_payment_intent'] ?? null,
                fn ($builder, $sourceIntent) => $builder->where('meta->source_payment_intent', $sourceIntent)
            )
            ->when(
                $attributes['meta']['source_capture_id'] ?? null,
                fn ($builder, $captureId) => $builder->where('meta->source_capture_id', $captureId)
            )
            ->first();

        if ($query) {
            $query->fill($attributes);
            $query->save();
            return $query;
        }

        return WalletTransaction::create(array_merge($attributes, [
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
        ]));
    }

    private function notifyUser(?User $user, string $title, string $message): void
    {
        if (! $user) {
            return;
        }

        Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'category' => 'payment',
        ]);
    }
}
