<?php

namespace App\Providers;

use App\Services\Payments\PaymentProviderRegistry;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaymentProviderRegistry::class, function () {
            return new PaymentProviderRegistry();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (Schema::hasTable('payment_provider_settings')) {
            $this->app->make(PaymentProviderRegistry::class)->apply();
        }
    }
}
