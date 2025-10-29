<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class MailSettings extends Settings
{

    public static function group(): string
    {
        return 'mail';
    }
}