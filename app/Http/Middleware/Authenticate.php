<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Do not redirect API consumers to a non-existent login route.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }
}
