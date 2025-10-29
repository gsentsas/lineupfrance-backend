<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ScriptsSettings extends Settings
{

    public static function group(): string
    {
        return 'scripts';
    }
}