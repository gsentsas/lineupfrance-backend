<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class AdminDashboardApiController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $totalMissions = Mission::count();
        $completedMissions = Mission::where('status', 'completed')->count();
        $activeMissions = Mission::whereIn('status', ['published', 'accepted', 'in_progress'])->count();
        $missionsQueueing = Mission::where('status', 'published')->whereNull('liner_id')->count();

        $newMissionsToday = Mission::whereDate('created_at', Carbon::today())->count();
        $totalClients = User::where('role', 'client')->count();
        $totalLiners = User::where('role', 'liner')->count();

        $revenueCents = WalletTransaction::where('type', 'debit')
            ->where('status', 'completed')
            ->sum('amount_cents');

        $pendingPayoutsCents = WalletTransaction::where('type', 'credit')
            ->where('status', 'pending')
            ->sum('amount_cents');

        $weekVolumeCents = WalletTransaction::where('type', 'debit')
            ->where('status', 'completed')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->sum('amount_cents');

        $stats = [
            'revenue' => round($revenueCents / 100, 2),
            'pendingPayouts' => round($pendingPayoutsCents / 100, 2),
            'activeMissions' => $activeMissions,
            'missionsQueueing' => $missionsQueueing,
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
            ->get()
            ->map(fn (Mission $mission) => ApiResponse::mission($mission))
            ->all();

        $recentTransactions = ApiResponse::walletTransactions(
            WalletTransaction::query()
                ->with('user')
                ->latest()
                ->limit(6)
                ->get()
        );

        $notifications = Notification::query()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Notification $notification) => ApiResponse::notification($notification))
            ->all();

        $topLiners = User::with('linerProfile')
            ->where('role', 'liner')
            ->get()
            ->sortByDesc(fn (User $user) => $user->linerProfile->rating ?? 0)
            ->take(4)
            ->values()
            ->map(function (User $liner) {
                $profile = $liner->linerProfile;

                return [
                    'id' => $liner->id,
                    'name' => $liner->name,
                    'rating' => $profile->rating ?? null,
                    'availability' => $profile->availability ?? null,
                    'missionsCompleted' => $profile->missions_completed ?? 0,
                ];
            })
            ->all();

        $topClients = User::with('clientProfile')
            ->where('role', 'client')
            ->latest()
            ->take(4)
            ->get()
            ->map(function (User $client) {
                $profile = $client->clientProfile;

                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                    'preferredCommunication' => $profile->preferred_communication ?? null,
                ];
            })
            ->all();

        return response()->json([
            'data' => [
                'stats' => [
                    'missions_active' => $stats['activeMissions'],
                    'missions_queueing' => $stats['missionsQueueing'],
                    'clients' => $stats['clients'],
                    'liners' => $stats['liners'],
                    'completion_rate' => $stats['completionRate'],
                    'new_missions_today' => $stats['newMissionsToday'],
                ],
                'payments' => [
                    'pending_payouts' => round($pendingPayoutsCents / 100_000, 1),
                    'volume_week' => round($weekVolumeCents / 100_000, 1),
                    'revenue' => $stats['revenue'],
                ],
                'upcomingMissions' => $upcomingMissions,
                'recentTransactions' => $recentTransactions,
                'notifications' => $notifications,
                'topLiners' => $topLiners,
                'topClients' => $topClients,
                'generated_at' => Carbon::now()->toISOString(),
            ],
        ]);
    }
}
