<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeamRole;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamMemberController extends Controller
{
    public function index(): JsonResponse
    {
        $members = User::query()
            ->whereNotNull('team_role')
            ->orWhere('role', 'admin')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'team_role', 'team_permissions', 'role']);

        $data = $members->map(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->team_role ?? $user->role,
                'permissions' => $user->team_permissions ?? [],
            ];
        })->all();

        return response()->json(['data' => $data]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'teamRole' => ['required', 'string', Rule::in(TeamRole::pluck('name')->all())],
            'overridePermissions' => ['nullable', 'array'],
            'overridePermissions.*' => [Rule::in(Permissions::all())],
        ]);

        $user->team_role = $data['teamRole'];
        $user->team_permissions = $data['overridePermissions'] ?? null;
        $user->save();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->team_role,
                'permissions' => $user->team_permissions ?? [],
            ],
        ]);
    }
}
