<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayoutAccount;
use Illuminate\Http\JsonResponse;

class PayoutAccountTableController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $accounts = PayoutAccount::query()
            ->with('user')
            ->latest()
            ->limit(200)
            ->get()
            ->map(fn (PayoutAccount $account) => [
                'id' => $account->id,
                'provider' => $account->provider,
                'label' => $account->label,
                'status' => $account->status,
                'isDefault' => (bool) $account->is_default,
                'user' => [
                    'id' => $account->user?->id,
                    'name' => $account->user?->name,
                    'email' => $account->user?->email,
                ],
                'updatedAt' => optional($account->updated_at)->toIso8601String(),
            ]);

        return response()->json([
            'data' => $accounts,
        ]);
    }
}
