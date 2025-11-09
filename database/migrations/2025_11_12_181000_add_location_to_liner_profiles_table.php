<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('liner_profiles', function (Blueprint $table) {
            $table->decimal('last_lat', 10, 7)->nullable();
            $table->decimal('last_lng', 10, 7)->nullable();
            $table->string('last_location_label')->nullable();
            $table->timestamp('last_seen_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('liner_profiles', function (Blueprint $table) {
            $table->dropColumn(['last_lat', 'last_lng', 'last_location_label', 'last_seen_at']);
        });
    }
};
