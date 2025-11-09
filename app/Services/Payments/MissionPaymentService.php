<?php

namespace App\Services\Payments;

use App\Models\Mission;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class MissionPaymentService
{
    /**
     * Reserve funds when a client valide une candidature.
     */
    public function authorize(Mission $mission): void
    {
        if ($mission->payment_status !== 'pending') {
            return;
        }

        DB::transaction(function () use ($mission) {
            WalletTransaction::create([
                'user_id' => $mission->client_id,
                'type' => 'debit',
                'status' => 'pending',
                'amount_cents' => $mission->budget_cents,
                'currency' => $mission->currency,
                'description' => "Pré-autorisation mission {$mission->title}",
                'counterparty' => 'LineUp Escrow',
                'method' => 'card',
            ]);

            $mission->update([
                'payment_status' => 'authorized',
            ]);
        });
    }

    /**
     * Capture funds and pay the liner/admin commissions once la mission est validée.
     */
    public function capture(Mission $mission): void
    {
        if ($mission->payment_status === 'captured') {
            return;
        }

        DB::transaction(function () use ($mission) {
            $commission = (int) round($mission->budget_cents * 0.15);
            $linerAmount = $mission->budget_cents - $commission;
            $adminUserId = User::query()->where('role', 'admin')->value('id') ?? $mission->client_id;

            WalletTransaction::create([
                'user_id' => $mission->client_id,
                'type' => 'debit',
                'status' => 'completed',
                'amount_cents' => $mission->budget_cents,
                'currency' => $mission->currency,
                'description' => "Mission {$mission->title} réglée",
                'counterparty' => 'LineUp Escrow',
                'method' => 'card',
            ]);

            WalletTransaction::create([
                'user_id' => $mission->liner_id,
                'type' => 'credit',
                'status' => 'completed',
                'amount_cents' => $linerAmount,
                'currency' => $mission->currency,
                'description' => "Mission {$mission->title} payée",
                'counterparty' => 'LineUp Client',
                'method' => 'wallet',
            ]);

            WalletTransaction::create([
                'user_id' => $adminUserId,
                'type' => 'credit',
                'status' => 'completed',
                'amount_cents' => $commission,
                'currency' => $mission->currency,
                'description' => "Commission mission {$mission->title}",
                'counterparty' => 'LineUp Commission',
                'method' => 'wallet',
            ]);

            $mission->update([
                'payment_status' => 'captured',
                'commission_cents' => $commission,
            ]);
        });
    }
}
