<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppSettingApiController extends Controller
{
    protected array $fallbackResolvers = [
        'firebase_frontend' => 'resolveFirebaseFrontend',
    ];

    public function index(): JsonResponse
    {
        $settings = AppSetting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get()
            ->map(function (AppSetting $setting) {
                $value = $setting->value;
                if ((empty($value) || $value === []) && isset($this->fallbackResolvers[$setting->key])) {
                    $resolver = $this->fallbackResolvers[$setting->key];
                    $value = $this->{$resolver}();
                }

                return [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'label' => $setting->label,
                    'group' => $setting->group,
                    'description' => $setting->description,
                    'type' => $setting->type,
                    'value' => $value,
                ];
            });

        return response()->json([
            'data' => $settings,
        ]);
    }

    public function reload(): JsonResponse
    {
        $settings = AppSetting::query()->get();

        foreach ($settings as $setting) {
            $resolver = $this->fallbackResolvers[$setting->key] ?? null;
            if (! $resolver) {
                continue;
            }
            $fallback = $this->{$resolver}();
            if (! empty($fallback)) {
                $setting->value = $fallback;
                $setting->save();
            }
        }

        return response()->json([
            'message' => 'Paramètres remis à jour depuis .env / config.',
        ]);
    }
    public function update(Request $request, AppSetting $setting): JsonResponse
    {
        $payload = $request->validate([
            'value' => ['required'],
        ]);

        $setting->value = $payload['value'];
        $setting->save();

        return response()->json([
            'data' => [
                'id' => $setting->id,
                'key' => $setting->key,
                'label' => $setting->label,
                'group' => $setting->group,
                'description' => $setting->description,
                'type' => $setting->type,
                'value' => $setting->value,
            ],
        ]);
    }

    protected function resolveFirebaseFrontend(): array
    {
        return array_filter(config('services.firebase_frontend') ?? []);
    }
}
