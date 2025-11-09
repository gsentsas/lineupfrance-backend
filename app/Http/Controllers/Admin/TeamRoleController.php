<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeamRole;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamRoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = TeamRole::orderBy('label')->get();

        return response()->json([
            'data' => $roles->map(fn (TeamRole $role) => $this->format($role))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);

        $role = TeamRole::create($data);

        return response()->json(['data' => $this->format($role)], 201);
    }

    public function update(Request $request, TeamRole $teamRole): JsonResponse
    {
        if ($teamRole->name === 'admin') {
            abort(403, 'Le rôle administrateur ne peut pas être modifié.');
        }

        $data = $this->validatePayload($request, $teamRole->id);

        $teamRole->update($data);

        return response()->json(['data' => $this->format($teamRole->fresh())]);
    }

    public function destroy(TeamRole $teamRole): JsonResponse
    {
        if (in_array($teamRole->name, TeamRole::defaultRoles(), true)) {
            abort(403, 'Ce rôle système ne peut pas être supprimé.');
        }

        if (TeamRole::query()->count() <= 1) {
            abort(422, 'Il doit rester au moins un rôle disponible.');
        }

        $teamRole->delete();

        return response()->json(['status' => 'deleted']);
    }

    private function validatePayload(Request $request, ?int $roleId = null): array
    {
        $permissions = Permissions::all();

        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('team_roles', 'name')->ignore($roleId),
            ],
            'label' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => [Rule::in($permissions)],
        ]);
    }

    private function format(TeamRole $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'label' => $role->label,
            'description' => $role->description,
            'permissions' => $role->permissions ?? [],
        ];
    }
}
