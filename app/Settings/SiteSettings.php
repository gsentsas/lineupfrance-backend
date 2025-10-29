<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SiteSettings extends Settings
{
    public string $name;
    public ?string $logo_light;
    public ?string $logo_dark;

    public static function group(): string { return 'site'; }
}
