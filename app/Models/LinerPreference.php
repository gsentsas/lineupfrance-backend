<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LinerPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'night_missions',
        'max_distance_km',
        'min_earning_euros',
        'auto_accept',
    ];

    protected $casts = [
        'night_missions' => 'boolean',
        'auto_accept' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
