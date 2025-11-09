<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_provider_settings', function (Blueprint $table) {
            $table->text('last_status_message')->nullable();
            $table->timestamp('last_failure_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payment_provider_settings', function (Blueprint $table) {
            $table->dropColumn(['last_status_message', 'last_failure_at']);
        });
    }
};
