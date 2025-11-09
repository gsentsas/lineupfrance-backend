<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;

class AppSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = AppSetting::all()->mapWithKeys(function (AppSetting $setting) {
            $value = $setting->value;

            if ($setting->key === 'auth_google') {
                $value = Arr::only($value ?? [], ['webClientId', 'iosClientId', 'androidClientId', 'serverClientId']);
            } elseif ($setting->key === 'auth_apple') {
                $value = Arr::only($value ?? [], ['serviceId', 'redirectUri']);
            } elseif ($setting->key === 'stripe') {
                $value = Arr::only($value ?? [], ['publishableKey', 'applePayMerchantId', 'enabled', 'mode']);
            }

            return [
                $setting->key => $value,
            ];
        });

        return response()->json([
            'data' => $settings,
        ]);
    }
}
