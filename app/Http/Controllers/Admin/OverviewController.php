<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OverviewController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $missions = Mission::query()
            ->with(['client', 'liner'])
            ->latest('published_at')
            ->limit(10)
            ->get()
            ->map(fn (Mission $mission) => [
                'id' => $mission->id,
                'title' => $mission->title,
                'status' => $mission->status,
                'progress' => $mission->progress_status,
                'paymentStatus' => $mission->payment_status,
                'budgetEuros' => $mission->budget_cents / 100,
                'client' => $mission->client?->name,
                'liner' => $mission->liner?->name,
                'publishedAt' => optional($mission->published_at)->toISOString(),
            ]);

        $clients = User::query()
            ->where('role', 'client')
            ->latest()
            ->limit(8)
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'joinedAt' => optional($user->created_at)->toISOString(),
            ]);

        $liners = User::query()
            ->where('role', 'liner')
            ->latest()
            ->limit(8)
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'joinedAt' => optional($user->created_at)->toISOString(),
            ]);

        $stats = [
            'missions_active' => Mission::where('status', 'in_progress')->count(),
            'missions_queueing' => Mission::where('progress_status', 'queueing')->count(),
            'payments_pending' => Mission::where('payment_status', 'pending')->count(),
            'payments_scheduled' => Mission::where('payment_status', 'authorized')->count(),
        ];

        return response()->json([
            'data' => [
                'stats' => $stats,
                'missions' => $missions,
                'clients' => $clients,
                'liners' => $liners,
                'payments' => [
                    'volume_week' => (float) Mission::whereBetween(
                        'created_at',
                        [Carbon::now()->subDays(7), Carbon::now()],
                    )->sum(DB::raw('budget_cents / 100')),
                    'pending_payouts' => Mission::where('payment_status', 'pending')->sum(
                        DB::raw('budget_cents / 100'),
                    ),
                ],
            ],
        ]);
    }
}
