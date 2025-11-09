<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class AdminSettingController extends Controller
{
    public function index(): View
    {
        $settings = AppSetting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get()
            ->groupBy('group');

        return view('admin.settings', [
            'settingsByGroup' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        /** @var Collection<int, \App\Models\AppSetting> $settings */
        $settings = AppSetting::all()->keyBy('key');

        foreach ($settings as $key => $setting) {
            $value = $request->input("settings.{$key}");
            if ($setting->type === 'json' && is_string($value)) {
                $decoded = json_decode($value, true);
                $setting->value = $decoded ?? $setting->value;
            } elseif (is_array($value)) {
                $setting->value = $value;
            } else {
                $setting->value = ['value' => $value];
            }
            $setting->save();
        }

        return redirect()
            ->route('admin.settings')
            ->with('status', 'Paramètres mis à jour.');
    }
}
