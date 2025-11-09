<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Carbon;
use Illuminate\View\View;

class AdminDashboardController extends Controller
{
    public function __invoke(): View
    {
        $totalMissions = Mission::count();
        $completedMissions = Mission::where('status', 'completed')->count();
        $activeMissions = Mission::whereIn('status', ['published', 'accepted', 'in_progress'])->count();

        $newMissionsToday = Mission::whereDate('created_at', Carbon::today())->count();
        $totalClients = User::where('role', 'client')->count();
        $totalLiners = User::where('role', 'liner')->count();

        $revenueCents = WalletTransaction::where('type', 'debit')
            ->where('status', 'completed')
            ->sum('amount_cents');

        $pendingPayoutsCents = WalletTransaction::where('type', 'credit')
            ->where('status', 'pending')
            ->sum('amount_cents');

        $stats = [
            'revenue' => $revenueCents / 100,
            'pendingPayouts' => $pendingPayoutsCents / 100,
            'activeMissions' => $activeMissions,
            'completionRate' => $totalMissions > 0 ? round(($completedMissions / $totalMissions) * 100) : 0,
            'newMissionsToday' => $newMissionsToday,
            'clients' => $totalClients,
            'liners' => $totalLiners,
        ];

        $upcomingMissions = Mission::query()
            ->with(['client', 'liner'])
            ->whereDate('scheduled_at', '>=', Carbon::today())
            ->orderBy('scheduled_at')
            ->limit(6)
            ->get();

        $recentTransactions = WalletTransaction::query()
            ->with('user')
            ->latest()
            ->limit(6)
            ->get();

        $recentNotifications = Notification::query()
            ->latest()
            ->limit(5)
            ->get();

        $topLiners = User::with('linerProfile')
            ->where('role', 'liner')
            ->get()
            ->sortByDesc(fn (User $user) => $user->linerProfile->rating ?? 0)
            ->take(4)
            ->values();

        $topClients = User::with('clientProfile')
            ->where('role', 'client')
            ->latest()
            ->take(4)
            ->get();

        return view('admin.dashboard', [
            'stats' => $stats,
            'upcomingMissions' => $upcomingMissions,
            'recentTransactions' => $recentTransactions,
            'notifications' => $recentNotifications,
            'topLiners' => $topLiners,
            'topClients' => $topClients,
        ]);
    }
}
