<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('admin.dashboard');
        }

        return view('react', [
            'title' => 'LineUp Ops • Connexion',
            'entry' => 'resources/js/admin/auth.jsx',
            'rootId' => 'admin-auth-root',
            'payload' => [
                'loginUrl' => route('admin.login.post'),
                'csrf' => csrf_token(),
            ],
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, true)) {
            throw ValidationException::withMessages([
                'email' => 'Identifiants invalides ou accès non autorisé.',
            ]);
        }

        $request->session()->regenerate();

        $role = Auth::user()->team_role ?? Auth::user()->role;

        if (! in_array($role, ['ops', 'admin'], true)) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Compte non autorisé sur la console admin.',
            ]);
        }

        return redirect()->intended(route('admin.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::guard()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
