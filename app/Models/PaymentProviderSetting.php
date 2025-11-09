<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentProviderSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'credentials',
        'enabled',
        'enabled_at',
        'enabled_by',
        'admin_approved',
        'admin_approved_at',
        'admin_approved_by',
        'health_status',
        'last_webhook_at',
        'last_status_message',
        'last_failure_at',
    ];

    protected $casts = [
        'credentials' => 'array',
        'enabled' => 'boolean',
        'admin_approved' => 'boolean',
        'last_webhook_at' => 'datetime',
        'last_failure_at' => 'datetime',
        'admin_approved_at' => 'datetime',
        'enabled_at' => 'datetime',
    ];
}
