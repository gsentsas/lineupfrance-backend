<?php

namespace App\Http\Middleware;

use App\Support\Permissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Accès réservé à l’équipe opérations.');
        }

        if ($user->role === 'admin') {
            return $next($request);
        }

        if ($user->hasPermission(Permissions::OPS_ACCESS)) {
            return $next($request);
        }

        $role = $user->team_role ?? $user->role;

        if (in_array($role, ['ops', 'admin'], true)) {
            return $next($request);
        }

        abort(403, 'Accès réservé à l’équipe opérations.');
    }
}
