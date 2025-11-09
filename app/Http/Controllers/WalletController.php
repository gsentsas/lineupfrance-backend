<?php

namespace App\Http\Controllers;

use App\Models\WalletTransaction;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function clientSummary(Request $request): JsonResponse
    {
        return response()->json($this->summaryFor($request->user()->id));
    }

    public function linerSummary(Request $request): JsonResponse
    {
        return response()->json($this->summaryFor($request->user()->id));
    }

    private function summaryFor(int $userId): array
    {
        $transactions = WalletTransaction::query()
            ->where('user_id', $userId)
            ->latest()
            ->get();

        $balance = $transactions->reduce(function ($carry, WalletTransaction $tx) {
            return $carry + ($tx->type === 'credit' ? $tx->amount_cents : -$tx->amount_cents);
        }, 0);

        $pending = $transactions
            ->where('status', 'pending')
            ->reduce(function ($carry, WalletTransaction $tx) {
                return $carry + ($tx->type === 'credit' ? $tx->amount_cents : -$tx->amount_cents);
            }, 0);

        $currency = $transactions->first()->currency ?? 'EUR';

        return [
            'wallet' => [
                'balance_cents' => $balance,
                'pending_cents' => $pending,
                'currency' => $currency,
                'updated_at' => now()->toISOString(),
            ],
            'transactions' => ApiResponse::walletTransactions($transactions),
        ];
    }
}
