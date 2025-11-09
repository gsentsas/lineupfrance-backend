<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liner_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('night_missions')->default(false);
            $table->unsignedTinyInteger('max_distance_km')->default(5);
            $table->unsignedSmallInteger('min_earning_euros')->default(10);
            $table->boolean('auto_accept')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liner_preferences');
    }
};
