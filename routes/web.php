<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminMissionController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminTeamController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminDashboardApiController;
use App\Http\Controllers\Admin\ClientTableController;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\LinerLocationController;
use App\Http\Controllers\Admin\LinerTableController;
use App\Http\Controllers\Admin\MissionTableController;
use App\Http\Controllers\Admin\NotificationFeedController;
use App\Http\Controllers\Admin\QuickActionController;
use App\Http\Controllers\Admin\PaymentProviderController;
use App\Http\Controllers\Admin\TeamMemberController;
use App\Http\Controllers\Admin\TeamRoleController;
use App\Http\Controllers\Admin\PayoutAccountTableController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

$opsApiRoutes = function () {
    Route::get('/overview', AdminDashboardApiController::class);
    Route::get('/payment-providers', [PaymentProviderController::class, 'index']);
    Route::get('/payment-providers/{provider}', [PaymentProviderController::class, 'show']);
    Route::put('/payment-providers/{provider}', [PaymentProviderController::class, 'update']);
    Route::get('/payout-accounts', PayoutAccountTableController::class);
    Route::get('/missions', MissionTableController::class);
    Route::get('/clients', ClientTableController::class);
    Route::get('/liners', LinerTableController::class);
    Route::get('/notifications', NotificationFeedController::class);
    Route::get('/notifications/stream', [NotificationController::class, 'stream']);
    Route::get('/team', [TeamMemberController::class, 'index']);
    Route::put('/team/{user}', [TeamMemberController::class, 'update']);
    Route::get('/team-roles', [TeamRoleController::class, 'index']);
    Route::post('/team-roles', [TeamRoleController::class, 'store']);
    Route::put('/team-roles/{teamRole}', [TeamRoleController::class, 'update']);
    Route::delete('/team-roles/{teamRole}', [TeamRoleController::class, 'destroy']);
    Route::post('/quick-actions/test-mission', [QuickActionController::class, 'createTestMission']);
    Route::post('/quick-actions/broadcast', [QuickActionController::class, 'broadcast']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store']);
    Route::put('/announcements/{announcement}', [AnnouncementController::class, 'update']);
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    Route::get('/liners/locations', LinerLocationController::class);
};

Route::get('/', LandingController::class)->name('landing');

Route::get('/{landingPage}', LandingController::class)
    ->where('landingPage', 'connexion|creer-mission|bonjour-lineup');

Route::get('/app', function () {
    return view('react', [
        'title' => 'LineUp Web • Expérience Client & Liner',
        'entry' => 'resources/js/web/main.jsx',
        'rootId' => 'web-app-root',
        'payload' => [
            'links' => [
                'landingUrl' => route('landing'),
                'opsUrl' => route('admin.login'),
                'consoleUrl' => route('admin.dashboard'),
            ],
        ],
    ]);
})->name('web.app');

Route::get('/app/react', function () {
    return view('react', [
        'title' => 'LineUp App • Préversion React',
        'entry' => 'resources/js/app_portal/main.jsx',
        'rootId' => 'app-react-root',
        'payload' => [
            'firebase' => config('services.firebase_frontend'),
        ],
    ]);
})->name('web.app.react');

Route::middleware(['auth', 'admin.access'])
    ->prefix('ops')
    ->group(function () use ($opsApiRoutes) {
        $opsView = function () {
            return view('react', [
                'title' => 'LineUp Ops Console',
                'entry' => 'resources/js/ops/main.jsx',
                'rootId' => 'ops-root',
                'payload' => [
                    'user' => auth()->user()?->only(['name', 'role']),
                ],
            ]);
        };

        Route::prefix('api')->group($opsApiRoutes);

        Route::get('/', $opsView)->name('ops.react');
        Route::get('/{any}', $opsView)
            ->where('any', '^(?!api/).*');
    });

Route::get('/admin/login', [AdminAuthController::class, 'showLogin'])->middleware('guest')->name('admin.login');
Route::post('/admin/login', [AdminAuthController::class, 'login'])->middleware('guest')->name('admin.login.post');
Route::get('/login', fn () => redirect()->route('admin.login'))->middleware('guest')->name('login');

Route::middleware(['auth', 'admin.access'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () use ($opsApiRoutes) {
        $adminSpa = function () {
            return view('react', [
                'title' => 'LineUp Ops • Back-office',
                'entry' => 'resources/js/admin/main.jsx',
                'rootId' => 'admin-root',
                'payload' => [
                    'user' => auth()->user()?->only(['name', 'role']),
                ],
            ]);
        };

        Route::prefix('api')->group($opsApiRoutes);

        Route::get('/', $adminSpa)->name('dashboard');
        Route::get('{any}', $adminSpa)->where('any', '^(?!api/).*');
        Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');
    });
