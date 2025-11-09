<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\FirebaseAuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\PayoutAccountController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\MissionApplicationController;
use App\Http\Controllers\MissionLifecycleController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\KycController;
use App\Http\Controllers\Admin\AdminDashboardApiController;
use App\Http\Controllers\Admin\ClientTableController;
use App\Http\Controllers\Admin\LinerTableController;
use App\Http\Controllers\Admin\MissionTableController;
use App\Http\Controllers\Admin\NotificationFeedController;
use App\Http\Controllers\Admin\OverviewController;
use App\Http\Controllers\Admin\QuickActionController;
use App\Http\Controllers\Admin\TeamApiController;
use App\Http\Controllers\Admin\AppSettingApiController;
use App\Http\Controllers\Admin\PayoutAccountTableController;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\AppSettingController;
use App\Http\Controllers\Admin\PaymentProviderController;
use App\Http\Controllers\Payments\StripeMobileController;
use App\Http\Controllers\Webhook\StripeWebhookController;
use App\Http\Controllers\Webhook\PayPalWebhookController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\MissionChatController;
use App\Http\Controllers\Auth\PasskeyController;
use App\Http\Controllers\LinerPreferenceController;

Route::post('/webhooks/stripe', StripeWebhookController::class)->name('webhooks.stripe');
Route::post('/webhooks/paypal', PayPalWebhookController::class)->name('webhooks.paypal');

Route::get('/settings', [AppSettingController::class, 'index']);

Route::post('/auth/firebase', [FirebaseAuthController::class, 'exchange']);
Route::post('/auth/firebase/logout', [FirebaseAuthController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/auth/firebase/refresh', [FirebaseAuthController::class, 'refresh'])->middleware('auth:sanctum');
Route::get('/auth/passkeys/login/options', [PasskeyController::class, 'loginOptions']);
Route::post('/auth/passkeys/login/verify', [PasskeyController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/passkeys/register/options', [PasskeyController::class, 'registrationOptions']);
    Route::post('/auth/passkeys/register/verify', [PasskeyController::class, 'register']);
    Route::get('/me', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'sync']);
    Route::get('/missions/{mission}', [MissionController::class, 'show']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/stream', [NotificationController::class, 'stream']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/push/register', [DeviceTokenController::class, 'store']);

    Route::middleware('role:client')->group(function () {
        Route::put('/me/client', [ProfileController::class, 'updateClient']);

        Route::get('/payments/methods', [PaymentMethodController::class, 'index']);
        Route::post('/payments/methods', [PaymentMethodController::class, 'store']);
        Route::patch('/payments/methods/{paymentMethod}', [PaymentMethodController::class, 'update']);
        Route::delete('/payments/methods/{paymentMethod}', [PaymentMethodController::class, 'destroy']);

        Route::get('/missions', [MissionController::class, 'clientIndex']);
        Route::post('/missions', [MissionController::class, 'store']);
        Route::put('/missions/{mission}', [MissionController::class, 'update']);
        Route::post('/missions/{mission}/cancel', [MissionController::class, 'cancel']);
        Route::post('/missions/{mission}/review', [MissionController::class, 'review']);
        Route::get('/missions/{mission}/applications', [MissionApplicationController::class, 'index']);
        Route::post('/missions/{mission}/applications/{application}/decision', [MissionApplicationController::class, 'decide']);
        Route::post('/missions/{mission}/authorize-payment', [MissionLifecycleController::class, 'authorizePayment']);
        Route::post('/missions/{mission}/verify-qr', [MissionLifecycleController::class, 'verifyQr']);
        Route::get('/missions/{mission}/chat', [MissionChatController::class, 'index']);
        Route::post('/missions/{mission}/chat', [MissionChatController::class, 'store']);

        Route::get('/client/wallet', [WalletController::class, 'clientSummary']);

        Route::post('/payments/stripe/setup-intent', [StripeMobileController::class, 'createSetupIntent']);
        Route::post('/payments/stripe/payment-intent', [StripeMobileController::class, 'createPaymentIntent']);
    });

    Route::middleware('role:liner')->group(function () {
        Route::put('/me/liner', [ProfileController::class, 'updateLiner']);

        Route::get('/liner/payout-accounts', [PayoutAccountController::class, 'index']);
        Route::post('/liner/payout-accounts', [PayoutAccountController::class, 'store']);
        Route::patch('/liner/payout-accounts/{payoutAccount}', [PayoutAccountController::class, 'update']);
        Route::delete('/liner/payout-accounts/{payoutAccount}', [PayoutAccountController::class, 'destroy']);

        Route::get('/liner/missions', [MissionController::class, 'linerIndex']);
        Route::post('/liner/missions/{mission}/applications', [MissionApplicationController::class, 'store']);
        Route::post('/liner/missions/{mission}/accept', [MissionController::class, 'accept']);
        Route::post('/liner/missions/{mission}/status', [MissionController::class, 'updateStatus']);
        Route::get('/liner/missions/{mission}/qr', [MissionLifecycleController::class, 'generateQr']);
        Route::get('/liner/missions/{mission}/chat', [MissionChatController::class, 'index']);
        Route::post('/liner/missions/{mission}/chat', [MissionChatController::class, 'store']);
        Route::get('/liner/favorite-clients', [MissionController::class, 'favoriteClients']);

        Route::get('/liner/wallet', [WalletController::class, 'linerSummary']);
        Route::get('/liner/preferences', [LinerPreferenceController::class, 'show']);
        Route::put('/liner/preferences', [LinerPreferenceController::class, 'update']);

        Route::get('/liner/kyc', [KycController::class, 'show']);
        Route::patch('/liner/kyc/checklist/{item}', [KycController::class, 'toggleChecklist']);
        Route::patch('/liner/kyc/submit', [KycController::class, 'submit']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', AdminDashboardApiController::class);
        Route::get('/admin/overview', OverviewController::class);
        Route::post('/admin/settings/reload', [AppSettingApiController::class, 'reload']);
        Route::get('/admin/missions', MissionTableController::class);
        Route::get('/admin/clients', ClientTableController::class);
        Route::get('/admin/liners', LinerTableController::class);
        Route::get('/admin/payment-providers', [PaymentProviderController::class, 'index']);
        Route::get('/admin/payment-providers/{provider}', [PaymentProviderController::class, 'show']);
        Route::put('/admin/payment-providers/{provider}', [PaymentProviderController::class, 'update']);
        Route::get('/admin/payout-accounts', PayoutAccountTableController::class);
        Route::post('/admin/quick-actions/test-mission', [QuickActionController::class, 'createTestMission']);
        Route::post('/admin/quick-actions/broadcast', [QuickActionController::class, 'broadcast']);
        Route::get('/admin/notifications', NotificationFeedController::class);
        Route::get('/admin/liners/locations', \App\Http\Controllers\Admin\LinerLocationController::class);
        Route::get('/admin/team', TeamApiController::class);
        Route::get('/admin/settings', [AppSettingApiController::class, 'index']);
        Route::put('/admin/settings/{setting}', [AppSettingApiController::class, 'update']);
        Route::get('/admin/announcements', [AnnouncementController::class, 'index']);
        Route::post('/admin/announcements', [AnnouncementController::class, 'store']);
        Route::put('/admin/announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('/admin/announcements/{announcement}', [AnnouncementController::class, 'destroy']);
    });
});
