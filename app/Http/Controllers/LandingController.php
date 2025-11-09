<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class LandingController extends Controller
{
    public function __invoke(Request $request): View|RedirectResponse
    {
        if ($this->shouldRedirectToMobileApp($request)) {
            return redirect()->to($this->mobileAppUrl());
        }

        $defaults = [
            'hero' => [
                'badge' => 'Nouveau sur LineUp',
                'title' => "Attendez moins,\nvivez plus.",
                'subtitle' => 'Publiez une mission et laissez un Liner patienter à votre place.',
                'cta' => 'Créer une mission',
                'tagline' => 'Suivi en temps réel • Paiement sécurisé',
                'backgroundImage' => null,
            ],
            'onboarding_highlights' => [
                [
                    'title' => 'Mission en 60 secondes',
                    'description' => 'Décrivez votre besoin et publiez une mission instantanément.',
                ],
                [
                    'title' => 'Paiement sécurisé',
                    'description' => 'Vos paiements sont gérés via Stripe et PayPal.',
                ],
                [
                    'title' => 'Suivi temps réel',
                    'description' => 'Chat, notifications et tracking live du Liner.',
                ],
            ],
            'support_contacts' => [
                'email' => 'support@lineupfrance.com',
                'phone' => '+33 1 02 03 04 05',
                'availability' => '7j/7 • 8h - 22h',
            ],
        ];

        $settings = $this->getSettingsSafely();

        $hero = array_merge($defaults['hero'], (array) $settings->get('hero', []));
        $highlights = collect($settings->get('onboarding_highlights', $defaults['onboarding_highlights']))
            ->map(fn ($item) => [
                'title' => data_get($item, 'title'),
                'description' => data_get($item, 'description'),
            ])
            ->filter(fn ($card) => $card['title'])
            ->values()
            ->all();

        if (empty($highlights)) {
            $highlights = $defaults['onboarding_highlights'];
        }

        $support = array_merge($defaults['support_contacts'], (array) $settings->get('support_contacts', []));
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $pageSlug = trim(request()->path(), '/');
        $extraPages = ['connexion', 'creer-mission', 'bonjour-lineup'];
        $currentPage = in_array($pageSlug, $extraPages, true) ? $pageSlug : 'home';

        $payload = [
            'hero' => $hero,
            'highlights' => $highlights,
            'support' => $support,
            'metrics' => [
                ['label' => 'Missions publiées', 'value' => '1 200+'],
                ['label' => 'Liners vérifiés', 'value' => '480'],
                ['label' => 'Note moyenne', 'value' => '4,9/5'],
            ],
            'timeline' => [
                ['time' => '09:12', 'label' => 'Mission publiée', 'status' => 'Créée'],
                ['time' => '09:18', 'label' => 'Liner accepté', 'status' => 'Assignée'],
                ['time' => '09:42', 'label' => 'Liner en route', 'status' => 'Tracking'],
                ['time' => '10:05', 'label' => 'Preuve envoyée', 'status' => 'Terminée'],
            ],
            'links' => [
                'login' => "{$frontendUrl}/auth?mode=login",
                'signup' => "{$frontendUrl}/role-choice",
                'ops' => auth()->check()
                    ? route('admin.dashboard')
                    : route('admin.login'),
                'opsLabel' => auth()->check() ? 'Retour au back-office' : 'Connexion Ops',
                'opsLoggedIn' => auth()->check(),
                'mobileApp' => $this->mobileAppUrl(),
                'appStore' => config('services.landing.app_store_url'),
                'playStore' => config('services.landing.play_store_url'),
            ],
            'user' => auth()->user()?->only(['name', 'role']),
            'page' => $currentPage,
        ];

        return view('react', [
            'title' => 'LineUp France — Attendez moins, vivez plus.',
            'entry' => 'resources/js/landing/main.jsx',
            'rootId' => 'landing-root',
            'payload' => $payload,
        ]);
    }

    private function shouldRedirectToMobileApp(Request $request): bool
    {
        if ($request->boolean('desktop')) {
            return false;
        }

        $agent = strtolower($request->userAgent() ?? '');
        if ($agent === '') {
            return false;
        }

        $keywords = ['iphone', 'android', 'ipad', 'mobile', 'ipod'];

        foreach ($keywords as $keyword) {
            if (str_contains($agent, $keyword)) {
                return true;
            }
        }

        return false;
    }

    private function mobileAppUrl(): string
    {
        return config('services.landing.mobile_app_url') ?? route('web.app.react');
    }

    /**
     * @return Collection<string, mixed>
     */
    private function getSettingsSafely(): Collection
    {
        try {
            return AppSetting::query()
                ->get()
                ->keyBy('key')
                ->map(fn (AppSetting $setting) => $setting->value ?? null);
        } catch (QueryException $exception) {
            // Table not migrated yet (e.g. during first install or unit tests) → fallback to defaults.
            if (app()->environment(['local', 'testing'])) {
                report($exception);
            }

            return collect();
        }
    }
}
