<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->decimal('client_rating', 3, 2)->nullable()->after('commission_cents');
            $table->text('client_feedback')->nullable()->after('client_rating');
            $table->timestamp('client_rated_at')->nullable()->after('client_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->dropColumn(['client_rating', 'client_feedback', 'client_rated_at']);
        });
    }
};
