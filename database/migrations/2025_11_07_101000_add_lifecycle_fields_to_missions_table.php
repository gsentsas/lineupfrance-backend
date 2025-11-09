<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->string('booking_status')->default('open')->after('progress_status');
            $table->string('payment_status')->default('pending')->after('booking_status');
            $table->uuid('qr_token')->nullable()->after('payment_status');
            $table->timestamp('qr_verified_at')->nullable()->after('qr_token');
            $table->timestamp('completed_at')->nullable()->after('qr_verified_at');
            $table->unsignedInteger('commission_cents')->default(0)->after('budget_cents');
        });
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->dropColumn([
                'booking_status',
                'payment_status',
                'qr_token',
                'qr_verified_at',
                'completed_at',
                'commission_cents',
            ]);
        });
    }
};
