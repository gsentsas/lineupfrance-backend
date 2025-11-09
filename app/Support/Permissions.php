<?php

namespace App\Support;

class Permissions
{
    public const OPS_ACCESS = 'ops.access';

    public const MISSIONS_VIEW = 'missions.view';
    public const MISSIONS_MANAGE = 'missions.manage';

    public const CLIENTS_VIEW = 'clients.view';
    public const CLIENTS_MANAGE = 'clients.manage';

    public const LINERS_VIEW = 'liners.view';
    public const LINERS_MANAGE = 'liners.manage';

    public const PAYMENTS_VIEW = 'payments.view';
    public const PAYMENTS_MANAGE = 'payments.manage';

    public const TEAM_VIEW = 'team.view';
    public const TEAM_MANAGE = 'team.manage';

    public const SETTINGS_VIEW = 'settings.view';
    public const SETTINGS_MANAGE = 'settings.manage';

    public const FLUTTER_SETTINGS_MANAGE = 'settings.flutter';

    public static function all(): array
    {
        return [
            self::OPS_ACCESS,
            self::MISSIONS_VIEW,
            self::MISSIONS_MANAGE,
            self::CLIENTS_VIEW,
            self::CLIENTS_MANAGE,
            self::LINERS_VIEW,
            self::LINERS_MANAGE,
            self::PAYMENTS_VIEW,
            self::PAYMENTS_MANAGE,
            self::TEAM_VIEW,
            self::TEAM_MANAGE,
            self::SETTINGS_VIEW,
            self::SETTINGS_MANAGE,
            self::FLUTTER_SETTINGS_MANAGE,
        ];
    }

    public static function grouped(): array
    {
        return [
            'ops' => [
                'label' => 'Console Ops',
                'permissions' => [self::OPS_ACCESS],
            ],
            'missions' => [
                'label' => 'Missions',
                'permissions' => [self::MISSIONS_VIEW, self::MISSIONS_MANAGE],
            ],
            'clients' => [
                'label' => 'Clients',
                'permissions' => [self::CLIENTS_VIEW, self::CLIENTS_MANAGE],
            ],
            'liners' => [
                'label' => 'Liners',
                'permissions' => [self::LINERS_VIEW, self::LINERS_MANAGE],
            ],
            'payments' => [
                'label' => 'Paiements',
                'permissions' => [self::PAYMENTS_VIEW, self::PAYMENTS_MANAGE],
            ],
            'team' => [
                'label' => 'Équipe Ops',
                'permissions' => [self::TEAM_VIEW, self::TEAM_MANAGE],
            ],
            'settings' => [
                'label' => 'Paramètres & Flutter',
                'permissions' => [self::SETTINGS_VIEW, self::SETTINGS_MANAGE, self::FLUTTER_SETTINGS_MANAGE],
            ],
        ];
    }
}
