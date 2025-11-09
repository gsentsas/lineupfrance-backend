<?php

namespace App\Models;

use App\Models\TeamRole;
use App\Support\Permissions;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laragear\WebAuthn\Contracts\WebAuthnAuthenticatable;
use Laragear\WebAuthn\WebAuthnAuthentication;
use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\UuidInterface;

class User extends Authenticatable implements WebAuthnAuthenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, WebAuthnAuthentication;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'team_role',
        'team_permissions',
        'firebase_uid',
        'phone',
        'avatar_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'team_permissions' => 'array',
        ];
    }

    public function clientProfile()
    {
        return $this->hasOne(ClientProfile::class);
    }

    public function linerProfile()
    {
        return $this->hasOne(LinerProfile::class);
    }

    public function linerPreference()
    {
        return $this->hasOne(LinerPreference::class);
    }

    public function paymentMethods()
    {
        return $this->hasMany(PaymentMethod::class);
    }

    public function payoutAccounts()
    {
        return $this->hasMany(PayoutAccount::class);
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function clientMissions()
    {
        return $this->hasMany(Mission::class, 'client_id');
    }

    public function linerMissions()
    {
        return $this->hasMany(Mission::class, 'liner_id');
    }

    public function assignTeamRole(?string $role, array $permissions = []): void
    {
        $this->team_role = $role;
        $this->team_permissions = $permissions;
        $this->save();
    }

    public function hasTeamRole(string ...$roles): bool
    {
        if (! $this->team_role) {
            return false;
        }

        return in_array($this->team_role, $roles, true);
    }

    public function teamRoleDefinition(): ?TeamRole
    {
        if (! $this->team_role) {
            return null;
        }

        return TeamRole::where('name', $this->team_role)->first();
    }

    public function teamPermissions(): array
    {
        $permissions = [];

        if ($this->team_permissions && is_array($this->team_permissions)) {
            $permissions = $this->team_permissions;
        } elseif ($role = $this->teamRoleDefinition()) {
            $permissions = $role->permissions ?? [];
        }

        return array_values(array_unique(array_merge($permissions, $this->legacyRolePermissions())));
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->role === 'admin' || $this->hasTeamRole('admin')) {
            return true;
        }

        return in_array($permission, $this->teamPermissions(), true);
    }

    public function hasAnyPermission(string ...$permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    public function webAuthnId(): UuidInterface
    {
        $namespace = Uuid::uuid5(Uuid::NAMESPACE_URL, config('app.url', 'lineup-france'));

        return Uuid::uuid5($namespace, (string) $this->getKey());
    }

    private function legacyRolePermissions(): array
    {
        return match ($this->role) {
            'ops' => [
                Permissions::OPS_ACCESS,
                Permissions::MISSIONS_VIEW,
                Permissions::MISSIONS_MANAGE,
                Permissions::CLIENTS_VIEW,
                Permissions::LINERS_VIEW,
                Permissions::PAYMENTS_VIEW,
                Permissions::PAYMENTS_MANAGE,
            ],
            default => [],
        };
    }
}
