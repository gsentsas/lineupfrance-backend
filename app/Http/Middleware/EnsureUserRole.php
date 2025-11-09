<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Authentification requise.');
        }

        if (empty($roles)) {
            return $next($request);
        }

        $teamRole = $user->team_role;
        $userRole = $user->role;

        $allowed = collect($roles)->contains(function (string $role) use ($userRole, $teamRole) {
            if ($role === 'admin') {
                return $userRole === 'admin' || in_array($teamRole, ['admin', 'ops'], true);
            }

            return $userRole === $role;
        });

        if (! $allowed) {
            abort(403, 'Action réservée aux rôles : '.implode(', ', $roles));
        }

        return $next($request);
    }
}
