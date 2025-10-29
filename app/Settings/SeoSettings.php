<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SeoSettings extends Settings
{

    public static function group(): string
    {
        return 'seo';
    }
}