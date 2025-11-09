<?php

namespace Database\Seeders;

use App\Models\ClientProfile;
use App\Models\LinerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class InitialUsersSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@lineupfrance.com'],
            [
                'name' => 'LineUp Admin',
                'password' => bcrypt('LineUpAdmin2025!'),
                'role' => 'admin',
                'team_role' => 'admin',
                'phone' => '+33107080909',
            ]
        );

        $client = User::updateOrCreate(
            ['email' => 'client@lineupfrance.com'],
            [
                'name' => 'Client LineUp',
                'password' => bcrypt('LineUpClient2025!'),
                'role' => 'client',
                'phone' => '+33611112222',
            ]
        );

        ClientProfile::updateOrCreate(
            ['user_id' => $client->id],
            [
                'address' => '10 Rue Oberkampf, 75011 Paris',
                'preferred_communication' => 'sms',
            ]
        );

        $liner = User::updateOrCreate(
            ['email' => 'liner@lineupfrance.com'],
            [
                'name' => 'Liner LineUp',
                'password' => bcrypt('LineUpLiner2025!'),
                'role' => 'liner',
                'phone' => '+33633334444',
            ]
        );

        LinerProfile::updateOrCreate(
            ['user_id' => $liner->id],
            [
                'bio' => 'Disponible sur Paris pour gérer vos files d’attente.',
                'hourly_rate' => 18,
                'availability' => 'Lun-Dim • 8h-22h',
                'rating' => 5,
                'missions_completed' => 0,
                'kyc_status' => 'not_started',
                'kyc_checklist' => [
                    ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => false],
                    ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => false],
                    ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
                    ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => false],
                ],
            ]
        );
    }
}
