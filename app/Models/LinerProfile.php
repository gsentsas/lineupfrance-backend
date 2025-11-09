<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LinerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bio',
        'hourly_rate',
        'availability',
        'rating',
        'missions_completed',
        'payout_method_id',
        'kyc_status',
        'kyc_last_submitted',
        'kyc_checklist',
        'last_lat',
        'last_lng',
        'last_location_label',
        'last_seen_at',
    ];

    protected $casts = [
        'rating' => 'float',
        'kyc_last_submitted' => 'datetime',
        'kyc_checklist' => 'array',
        'last_seen_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
