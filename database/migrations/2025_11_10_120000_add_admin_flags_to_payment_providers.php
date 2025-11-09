
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_provider_settings', function (Blueprint $table) {
            $table->boolean('admin_approved')->default(false);
            $table->timestamp('admin_approved_at')->nullable();
            $table->foreignId('admin_approved_by')->nullable()->constrained('users');
            $table->timestamp('enabled_at')->nullable();
            $table->foreignId('enabled_by')->nullable()->constrained('users');
        });

        Schema::create('payment_provider_audits', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('action');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('payment_provider_settings', function (Blueprint $table) {
            $table->dropForeign(['admin_approved_by']);
            $table->dropForeign(['enabled_by']);
            $table->dropColumn(['admin_approved', 'admin_approved_at', 'admin_approved_by', 'enabled_at', 'enabled_by']);
        });

        Schema::dropIfExists('payment_provider_audits');
    }
};
