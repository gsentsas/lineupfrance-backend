<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ChatMessage extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'mission_id',
        'user_id',
        'role',
        'body',
        'attachments',
    ];

    protected $casts = [
        'attachments' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $message) {
            if (! $message->id) {
                $message->id = (string) Str::uuid();
            }
        });
    }

    public function mission()
    {
        return $this->belongsTo(Mission::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
