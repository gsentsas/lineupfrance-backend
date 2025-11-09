<?php

namespace Database\Seeders;

use App\Models\TeamRole;
use App\Support\Permissions;
use Illuminate\Database\Seeder;

class TeamRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin',
                'label' => 'Administrateur',
                'description' => 'Accès complet à toutes les fonctionnalités.',
                'permissions' => Permissions::all(),
            ],
            [
                'name' => 'ops_manager',
                'label' => 'Ops manager',
                'description' => 'Gestion des missions, clients et liners avec accès lecture sur les paiements et paramètres.',
                'permissions' => [
                    Permissions::OPS_ACCESS,
                    Permissions::MISSIONS_VIEW,
                    Permissions::MISSIONS_MANAGE,
                    Permissions::CLIENTS_VIEW,
                    Permissions::CLIENTS_MANAGE,
                    Permissions::LINERS_VIEW,
                    Permissions::LINERS_MANAGE,
                    Permissions::PAYMENTS_VIEW,
                    Permissions::TEAM_VIEW,
                    Permissions::SETTINGS_VIEW,
                ],
            ],
            [
                'name' => 'ops_viewer',
                'label' => 'Ops viewer',
                'description' => 'Consultation des missions, clients, liners et paiements.',
                'permissions' => [
                    Permissions::OPS_ACCESS,
                    Permissions::MISSIONS_VIEW,
                    Permissions::CLIENTS_VIEW,
                    Permissions::LINERS_VIEW,
                    Permissions::PAYMENTS_VIEW,
                ],
            ],
        ];

        foreach ($roles as $role) {
            TeamRole::updateOrCreate(['name' => $role['name']], $role);
        }
    }
}
