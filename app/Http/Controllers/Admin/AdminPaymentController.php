<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminPaymentController extends Controller
{
    public function __invoke(Request $request): View
    {
        $type = $request->string('type')->trim();
        $status = $request->string('status')->trim();

        $transactions = WalletTransaction::query()
            ->with('user')
            ->when($type->isNotEmpty(), function ($query) use ($type) {
                $query->whereIn('type', explode(',', $type));
            })
            ->when($status->isNotEmpty(), function ($query) use ($status) {
                $query->whereIn('status', explode(',', $status));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $revenue = WalletTransaction::where('type', 'debit')->where('status', 'completed')->sum('amount_cents');
        $payouts = WalletTransaction::where('type', 'credit')->where('status', 'completed')->sum('amount_cents');
        $pending = WalletTransaction::where('type', 'credit')->where('status', 'pending')->sum('amount_cents');

        return view('admin.payments', [
            'transactions' => $transactions,
            'type' => $type->toString(),
            'status' => $status->toString(),
            'analytics' => [
                'revenue' => $revenue / 100,
                'payouts' => $payouts / 100,
                'pending' => $pending / 100,
            ],
        ]);
    }
}
