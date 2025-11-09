<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_provider_settings', function (Blueprint $table) {
            $table->string('health_status')->default('unknown');
            $table->timestamp('last_webhook_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_provider_settings', function (Blueprint $table) {
            $table->dropColumn(['health_status', 'last_webhook_at']);
        });
    }
};
