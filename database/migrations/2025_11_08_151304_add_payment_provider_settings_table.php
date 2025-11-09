<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_provider_settings', function (Blueprint $table) {
            $table->id();
            $table->string('provider'); // stripe, paypal, adyen, apple_pay, google_pay
            $table->json('credentials')->nullable();
            $table->boolean('enabled')->default(false);
            $table->timestamps();

            $table->unique('provider');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_provider_settings');
    }
};
