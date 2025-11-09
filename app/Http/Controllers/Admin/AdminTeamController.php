<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class AdminTeamController extends Controller
{
    public function index(Request $request): View
    {
        $team = User::query()
            ->whereIn('team_role', ['ops', 'admin'])
            ->orWhereIn('role', ['ops', 'admin'])
            ->orderBy('name')
            ->get();

        $members = User::query()
            ->whereNotNull('team_role')
            ->orderByDesc('updated_at')
            ->paginate(10);

        $search = $request->string('search')->trim();
        $candidates = User::query()
            ->when($search->isNotEmpty(), function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit(10)
            ->get();

        return view('admin.team', [
            'team' => $team,
            'members' => $members,
            'candidates' => $candidates,
            'search' => $search->toString(),
        ]);
    }

    public function assign(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', Rule::exists('users', 'id')],
            'team_role' => ['required', Rule::in(['ops', 'admin'])],
        ]);

        $user = User::findOrFail($data['user_id']);
        $user->assignTeamRole($data['team_role']);

        return redirect()
            ->route('admin.team')
            ->with('status', "{$user->name} est désormais {$data['team_role']}.");
    }

    public function revoke(Request $request, User $user)
    {
        $user->assignTeamRole(null);

        return redirect()
            ->route('admin.team')
            ->with('status', "{$user->name} a été retiré de l’équipe Ops.");
    }
}
