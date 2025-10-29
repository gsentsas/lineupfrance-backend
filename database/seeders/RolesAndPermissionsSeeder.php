<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissions de base (exemple)
        $perms = [
            'users.view', 'users.create', 'users.update', 'users.delete',
            'missions.view', 'missions.create', 'missions.update', 'missions.delete',
            'liners.view', 'liners.create', 'liners.update', 'liners.delete',
            'posts.view', 'posts.create', 'posts.update', 'posts.delete',
            'settings.manage',
        ];

        foreach ($perms as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        // Rôles
        $super = Role::firstOrCreate(['name' => 'Super Admin']);
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $manager = Role::firstOrCreate(['name' => 'Manager']);
        $user = Role::firstOrCreate(['name' => 'User']);

        // Super Admin a tout
        $super->givePermissionTo(Permission::all());

        // Admin a large scope
        $admin->givePermissionTo([
            'users.view', 'users.create', 'users.update',
            'missions.view', 'missions.create', 'missions.update',
            'liners.view', 'liners.create', 'liners.update',
            'posts.view', 'posts.create', 'posts.update',
            'settings.manage',
        ]);

        // Manager métier
        $manager->givePermissionTo([
            'missions.view', 'missions.create', 'missions.update',
            'liners.view', 'liners.create', 'liners.update',
            'posts.view',
        ]);
    }
}
