<?php

namespace App\Http\Controllers;

use App\Models\PayoutAccount;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PayoutAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->payoutAccounts
                ->sortByDesc('is_default')
                ->values()
                ->map(fn (PayoutAccount $account) => ApiResponse::payoutAccount($account))
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['required', Rule::in(['stripe', 'paypal'])],
            'label' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string'],
            'isDefault' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ]);

        $account = $request->user()->payoutAccounts()->create([
            'provider' => $data['provider'],
            'label' => $data['label'],
            'status' => $data['status'] ?? 'active',
            'is_default' => (bool) ($data['isDefault'] ?? false),
            'meta' => $data['meta'] ?? [],
        ]);

        if ($account->is_default) {
            $request->user()->payoutAccounts()
                ->where('id', '!=', $account->id)
                ->update(['is_default' => false]);

            $request->user()->linerProfile()->updateOrCreate([], [
                'payout_method_id' => $account->id,
            ]);
        }

        return response()->json(ApiResponse::payoutAccount($account), 201);
    }

    public function update(Request $request, PayoutAccount $payoutAccount): JsonResponse
    {
        abort_if($payoutAccount->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string'],
            'isDefault' => ['sometimes', 'boolean'],
            'meta' => ['sometimes', 'array'],
        ]);

        if (array_key_exists('label', $data)) {
            $payoutAccount->label = $data['label'];
        }
        if (array_key_exists('status', $data)) {
            $payoutAccount->status = $data['status'];
        }
        if (array_key_exists('meta', $data)) {
            $payoutAccount->meta = $data['meta'];
        }
        if (array_key_exists('isDefault', $data)) {
            $payoutAccount->is_default = (bool) $data['isDefault'];
            if ($payoutAccount->is_default) {
                $request->user()->payoutAccounts()
                    ->where('id', '!=', $payoutAccount->id)
                    ->update(['is_default' => false]);

                $request->user()->linerProfile()->updateOrCreate([], [
                    'payout_method_id' => $payoutAccount->id,
                ]);
            }
        }

        $payoutAccount->save();

        return response()->json(ApiResponse::payoutAccount($payoutAccount));
    }

    public function destroy(Request $request, PayoutAccount $payoutAccount): JsonResponse
    {
        abort_if($payoutAccount->user_id !== $request->user()->id, 403);

        $wasDefault = $payoutAccount->is_default;
        $payoutAccount->delete();

        if ($wasDefault) {
            $request->user()->linerProfile()->update([
                'payout_method_id' => null,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
