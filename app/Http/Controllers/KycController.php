<?php

namespace App\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KycController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->linerProfile()->firstOrCreate([]);

        return response()->json(ApiResponse::linerKyc($profile));
    }

    public function toggleChecklist(Request $request, string $item): JsonResponse
    {
        $profile = $request->user()->linerProfile()->firstOrCreate([]);
        $checklist = collect($profile->kyc_checklist ?? [
            ['id' => 'identity', 'label' => "Pièce d'identité", 'completed' => false],
            ['id' => 'selfie', 'label' => 'Selfie de confirmation', 'completed' => false],
            ['id' => 'background', 'label' => 'Extrait de casier judiciaire', 'completed' => false],
            ['id' => 'address', 'label' => 'Justificatif de domicile', 'completed' => false],
        ])->map(function ($entry) use ($item, $request) {
            if ($entry['id'] === $item) {
                $entry['completed'] = (bool) $request->boolean('completed');
            }

            return $entry;
        })->all();

        $profile->kyc_checklist = $checklist;
        $profile->save();

        return response()->json(ApiResponse::linerKyc($profile));
    }

    public function submit(Request $request): JsonResponse
    {
        $profile = $request->user()->linerProfile()->firstOrCreate([]);

        $data = $request->validate([
            'status' => ['nullable', Rule::in(['in_progress', 'review', 'verified', 'rejected'])],
        ]);

        $profile->kyc_status = $data['status'] ?? 'in_progress';
        $profile->kyc_last_submitted = now();
        $profile->save();

        return response()->json(ApiResponse::linerKyc($profile));
    }
}
