<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminUserController extends Controller
{
    public function clients(Request $request): View
    {
        $search = $request->string('search')->trim();

        $clients = User::query()
            ->with('clientProfile')
            ->where('role', 'client')
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        return view('admin.users', [
            'title' => 'Clients',
            'description' => 'Vue d’ensemble des clients ayant publié des missions.',
            'users' => $clients,
            'type' => 'client',
            'search' => $search->toString(),
        ]);
    }

    public function liners(Request $request): View
    {
        $search = $request->string('search')->trim();

        $liners = User::query()
            ->with('linerProfile')
            ->where('role', 'liner')
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        return view('admin.users', [
            'title' => 'Liners',
            'description' => 'Liners actifs, statut KYC et performance globale.',
            'users' => $liners,
            'type' => 'liner',
            'search' => $search->toString(),
        ]);
    }
}
