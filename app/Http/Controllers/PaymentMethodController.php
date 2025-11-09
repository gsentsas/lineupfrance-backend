<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->paymentMethods
                ->sortByDesc('is_default')
                ->values()
                ->map(fn (PaymentMethod $method) => ApiResponse::paymentMethod($method))
                ->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['required', Rule::in(['card', 'paypal', 'stripe'])],
            'label' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string'],
            'isDefault' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ]);

        $method = $request->user()->paymentMethods()->create([
            'provider' => $data['provider'],
            'label' => $data['label'],
            'status' => $data['status'] ?? 'active',
            'is_default' => (bool) ($data['isDefault'] ?? false),
            'meta' => $data['meta'] ?? [],
        ]);

        if ($method->is_default) {
            $request->user()->paymentMethods()
                ->where('id', '!=', $method->id)
                ->update(['is_default' => false]);

            $request->user()->clientProfile()->updateOrCreate([], [
                'default_payment_method_id' => $method->id,
            ]);
        }

        return response()->json(ApiResponse::paymentMethod($method), 201);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        abort_if($paymentMethod->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string'],
            'isDefault' => ['sometimes', 'boolean'],
            'meta' => ['sometimes', 'array'],
        ]);

        if (array_key_exists('label', $data)) {
            $paymentMethod->label = $data['label'];
        }
        if (array_key_exists('status', $data)) {
            $paymentMethod->status = $data['status'];
        }
        if (array_key_exists('meta', $data)) {
            $paymentMethod->meta = $data['meta'];
        }
        if (array_key_exists('isDefault', $data)) {
            $paymentMethod->is_default = (bool) $data['isDefault'];
            if ($paymentMethod->is_default) {
                $request->user()->paymentMethods()
                    ->where('id', '!=', $paymentMethod->id)
                    ->update(['is_default' => false]);

                $request->user()->clientProfile()->updateOrCreate([], [
                    'default_payment_method_id' => $paymentMethod->id,
                ]);
            }
        }

        $paymentMethod->save();

        return response()->json(ApiResponse::paymentMethod($paymentMethod));
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        abort_if($paymentMethod->user_id !== $request->user()->id, 403);

        $wasDefault = $paymentMethod->is_default;
        $paymentMethod->delete();

        if ($wasDefault) {
            $request->user()->clientProfile()->update([
                'default_payment_method_id' => null,
            ]);
        }

        return response()->json(['status' => 'ok']);
    }
}
