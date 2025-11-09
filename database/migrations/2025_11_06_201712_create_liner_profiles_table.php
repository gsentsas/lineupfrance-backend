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
        Schema::create('liner_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete()->unique();
            $table->text('bio')->nullable();
            $table->unsignedInteger('hourly_rate')->default(0); // in euros
            $table->string('availability')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->unsignedInteger('missions_completed')->default(0);
            $table->string('payout_method_id')->nullable();
            $table->string('kyc_status')->default('not_started');
            $table->timestamp('kyc_last_submitted')->nullable();
            $table->json('kyc_checklist')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('liner_profiles');
    }
};
