<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SocialSettings extends Settings
{

    public static function group(): string
    {
        return 'social';
    }
}