<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\LinerProfile;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class FirebaseAuthController extends Controller
{
    public function __construct(private FirebaseAuth $firebaseAuth)
    {
    }

    public function exchange(Request $request): JsonResponse
    {
        $project = config('firebase.default', 'app');
        $credentials =
            config("firebase.projects.{$project}.credentials.file") ??
            config("firebase.projects.{$project}.credentials");

        if (! $credentials) {
            abort(501, 'Firebase integration is not configured on the server.');
        }

        $data = $request->validate([
            'idToken' => ['required', 'string'],
            'role' => ['nullable', Rule::in(['client', 'liner', 'admin'])],
        ]);

        try {
            $verifiedIdToken = $this->firebaseAuth->verifyIdToken($data['idToken']);
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'idToken' => ['Invalid Firebase ID token.'],
            ]);
        }

        $firebaseUid = $verifiedIdToken->claims()->get('sub');
        $firebaseEmail = $verifiedIdToken->claims()->get('email');
        $displayName = $verifiedIdToken->claims()->get('name') ?? 'LineUp User';
        $picture = $verifiedIdToken->claims()->get('picture');

        $user = User::query()
            ->where('firebase_uid', $firebaseUid)
            ->orWhere('email', $firebaseEmail)
            ->first();

        if (! $user) {
            $user = new User();
            $user->password = bcrypt(Str::random(32));
        }

        $user->name = $displayName;
        $user->email = $firebaseEmail ?: ($user->email ?? Str::uuid().'@example.com');
        $user->firebase_uid = $firebaseUid;
        $user->avatar_url = $picture;

        $requestedRole = $request->string('role')->value();

        if ($requestedRole === 'admin' && ! $user->hasTeamRole('ops', 'admin')) {
            throw ValidationException::withMessages([
                'role' => ['Accès admin réservé à l’équipe Ops.'],
            ]);
        }

        if ($requestedRole === 'admin' && $user->hasTeamRole('ops', 'admin')) {
            $user->role = 'admin';
        } elseif ($requestedRole && $requestedRole !== 'admin') {
            $user->role = $requestedRole;
        } elseif (! $user->role) {
            $user->role = 'client';
        }

        $user->save();

        $user->clientProfile()->firstOrCreate([]);
        $user->linerProfile()->firstOrCreate([
            'kyc_checklist' => [
                ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => false],
                ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => false],
                ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
                ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => false],
            ],
        ]);

        $token = $user->createToken('lineup-api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'role' => $user->role,
            'teamRole' => $user->team_role,
            'user' => ApiResponse::user($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['status' => 'ok']);
    }

    public function refresh(Request $request): JsonResponse
    {
        $data = $request->validate([
            'idToken' => ['required', 'string'],
        ]);

        try {
            $verifiedIdToken = $this->firebaseAuth->verifyIdToken($data['idToken']);
        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'idToken' => ['Invalid Firebase ID token.'],
            ]);
        }

        $firebaseUid = $verifiedIdToken->claims()->get('sub');
        $user = $request->user();

        if ($user->firebase_uid !== $firebaseUid) {
            abort(403, 'Le token fourni ne correspond pas à votre session.');
        }

        $user->currentAccessToken()?->delete();
        $token = $user->createToken('lineup-api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'role' => $user->role,
            'teamRole' => $user->team_role,
            'user' => ApiResponse::user($user->fresh()),
        ]);
    }
}
