<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Mission extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'client_id',
        'liner_id',
        'title',
        'description',
        'type',
        'location_label',
        'location_lat',
        'location_lng',
        'distance_km',
        'scheduled_at',
        'duration_minutes',
        'budget_cents',
        'commission_cents',
        'currency',
        'client_rating',
        'client_feedback',
        'status',
        'progress_status',
        'booking_status',
        'payment_status',
        'qr_token',
        'qr_verified_at',
        'completed_at',
        'published_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'location_lat' => 'float',
        'location_lng' => 'float',
        'distance_km' => 'float',
        'client_rating' => 'float',
        'qr_verified_at' => 'datetime',
        'completed_at' => 'datetime',
        'client_rated_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function (self $model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function liner()
    {
        return $this->belongsTo(User::class, 'liner_id');
    }

    public function applications()
    {
        return $this->hasMany(MissionApplication::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class);
    }
}
