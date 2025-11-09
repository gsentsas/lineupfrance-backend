<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class TeamApiController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $members = User::query()
            ->whereNotNull('team_role')
            ->orWhere('role', 'admin')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'team_role', 'role']);

        $data = $members->map(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->team_role ?? $user->role,
        ]);

        return response()->json(['data' => $data]);
    }
}
