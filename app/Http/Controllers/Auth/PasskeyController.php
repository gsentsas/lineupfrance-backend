<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;
use Laragear\WebAuthn\Http\Requests\AttestationRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PasskeyController extends Controller
{
    public function registrationOptions(AttestationRequest $request): JsonResponse
    {
        $this->ensureConfigured();

        $response = $request->fastRegistration()->toCreate()->toResponse($request);

        return response()->json([
            'data' => $this->decodePayload($response),
        ]);
    }

    public function register(AttestedRequest $request): JsonResponse
    {
        $this->ensureConfigured();

        $credentialId = $request->save([
            'label' => $request->user()?->name ? "Passkey {$request->user()->name}" : null,
        ]);

        return response()->json([
            'status' => 'registered',
            'credentialId' => $credentialId,
        ], 201);
    }

    public function loginOptions(AssertionRequest $request): JsonResponse
    {
        $this->ensureConfigured();

        $validated = $request->validate([
            'email' => ['sometimes', 'email'],
        ]);

        $response = $request->toVerify($validated)->toResponse($request);

        return response()->json([
            'data' => $this->decodePayload($response),
        ]);
    }

    public function login(AssertedRequest $request): JsonResponse
    {
        $this->ensureConfigured();

        /** @var \App\Models\User|null $user */
        $user = $request->login();

        abort_if(! $user instanceof User, 422, 'Impossible de vérifier cette clé biométrique.');

        $this->bootstrapProfiles($user);

        $user->currentAccessToken()?->delete();
        $token = $user->createToken('lineup-api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'role' => $user->role,
            'teamRole' => $user->team_role,
            'user' => ApiResponse::user($user->fresh()),
        ]);
    }

    private function ensureConfigured(): void
    {
        abort_if(! config('webauthn.relying_party.id'), 503, 'Le service Passkey n’est pas configuré (WEBAUTHN_ID manquant).');
    }

    private function decodePayload(SymfonyResponse $response): array
    {
        $decoded = json_decode($response->getContent() ?: '[]', true);

        return is_array($decoded) ? $decoded : [];
    }

    private function bootstrapProfiles(User $user): void
    {
        $user->clientProfile()->firstOrCreate([]);

        $user->linerProfile()->firstOrCreate([
            'kyc_checklist' => [
                ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => false],
                ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => false],
                ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
                ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => false],
            ],
        ]);
    }
}
