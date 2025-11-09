<?php

namespace App\Http\Controllers;

use App\Models\ClientProfile;
use App\Models\LinerProfile;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(ApiResponse::user($request->user()));
    }

    public function sync(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'role' => ['required', Rule::in(['client', 'liner'])],
            'fullName' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $role = $data['role'];

        if ($user->role !== 'admin') {
            $user->role = $role;
        }

        if (! empty($data['fullName'])) {
            $user->name = trim($data['fullName']);
        }

        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'] ?: null;
        }

        if (! empty($data['email'])) {
            $user->email = strtolower($data['email']);
        }

        $user->save();

        $user->clientProfile()->firstOrCreate([]);
        $user->linerProfile()->firstOrCreate([], [
            'kyc_checklist' => $this->defaultKycChecklist(),
        ]);

        return response()->json([
            'status' => 'ok',
            'user' => ApiResponse::user($user->fresh()),
        ]);
    }

    public function updateClient(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'preferredCommunication' => ['nullable', Rule::in(['sms', 'email', 'push'])],
            'defaultPaymentMethodId' => ['nullable', 'string'],
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }
        $user->save();

        /** @var ClientProfile $profile */
        $profile = $user->clientProfile()->firstOrCreate([]);
        if (array_key_exists('address', $data)) {
            $profile->address = $data['address'];
        }
        if (array_key_exists('preferredCommunication', $data)) {
            $profile->preferred_communication = $data['preferredCommunication'];
        }
        if (array_key_exists('defaultPaymentMethodId', $data)) {
            $profile->default_payment_method_id = $data['defaultPaymentMethodId'];
            if ($data['defaultPaymentMethodId']) {
                $user->paymentMethods()->update(['is_default' => false]);
                $user->paymentMethods()
                    ->where('id', $data['defaultPaymentMethodId'])
                    ->update(['is_default' => true]);
            }
        }
        $profile->save();

        return response()->json(ApiResponse::user($user->fresh()));
    }

    public function updateLiner(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'bio' => ['nullable', 'string'],
            'hourlyRate' => ['nullable', 'numeric', 'min:0'],
            'availability' => ['nullable', 'string', 'max:255'],
            'payoutMethodId' => ['nullable', 'string'],
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }
        $user->save();

        /** @var LinerProfile $profile */
        $profile = $user->linerProfile()->firstOrCreate([]);
        if (array_key_exists('bio', $data)) {
            $profile->bio = $data['bio'];
        }
        if (array_key_exists('hourlyRate', $data) && $data['hourlyRate'] !== null) {
            $profile->hourly_rate = (int) round($data['hourlyRate']);
        }
        if (array_key_exists('availability', $data)) {
            $profile->availability = $data['availability'];
        }
        if (array_key_exists('payoutMethodId', $data)) {
            $profile->payout_method_id = $data['payoutMethodId'];
            if ($data['payoutMethodId']) {
                $user->payoutAccounts()->update(['is_default' => false]);
                $user->payoutAccounts()
                    ->where('id', $data['payoutMethodId'])
                    ->update(['is_default' => true]);
            }
        }
        $profile->save();

        return response()->json(ApiResponse::user($user->fresh()));
    }

    private function defaultKycChecklist(): array
    {
        return [
            ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => false],
            ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => false],
            ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
            ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => false],
        ];
    }
}
