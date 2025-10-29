<?php

namespace App\Providers\Filament;

use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Navigation\MenuItem;
use Filament\Navigation\NavigationGroup;
use Filament\Navigation\NavigationItem;

use Filament\Http\Middleware\Authenticate as FilamentAuthenticate;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\SetLocale;

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;

use BezhanSalleh\FilamentShield\FilamentShieldPlugin;
// CORRIGER CE "use" (g minuscule)
//use Jeffgreco13\FilamentBreezy\BreezyCore;
use Filament\SpatieLaravelSettingsPlugin\SpatieLaravelSettingsPlugin;
use Filament\SpatieLaravelMediaLibraryPlugin\SpatieLaravelMediaLibraryPlugin;
use TomatoPHP\FilamentMediaManager\FilamentMediaManagerPlugin;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')

            ->login()

            ->brandName(config('app.name') . ' Admin')
            ->favicon(asset('favicon.ico'))
            ->viteTheme('resources/css/filament/admin/theme.css')
            ->colors([
                'primary' => Color::Indigo,
                'info'    => Color::Sky,
                'success' => Color::Emerald,
                'warning' => Color::Amber,
                'danger'  => Color::Rose,
            ])
            ->sidebarCollapsibleOnDesktop()
            ->maxContentWidth('7xl')
            ->globalSearchDebounce(500)
            ->darkMode(true)

            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')

            ->navigationGroups([
                NavigationGroup::make('Tableau de bord & Analytics')->icon('heroicon-o-home'),
                NavigationGroup::make('Utilisateurs & Accès')->icon('heroicon-o-user-group'),
                NavigationGroup::make('Contenus')->icon('heroicon-o-rectangle-stack'),
                NavigationGroup::make('Missions')->icon('heroicon-o-map'),
                NavigationGroup::make('Système')->icon('heroicon-o-cog-6-tooth'),
                NavigationGroup::make('Paramètres du site')->icon('heroicon-o-wrench-screwdriver'),
            ])

            ->navigation(function (): array {
                return [
                    // Dashboard
                    NavigationItem::make('Dashboard')
                        ->group('Tableau de bord & Analytics')
                        ->icon('heroicon-o-home')
                        ->url(fn () => route('filament.admin.pages.dashboard'))
                        ->isActiveWhen(fn () => request()->routeIs('filament.admin.pages.dashboard'))
                        ->sort(1),

                    // Missions
                    NavigationItem::make('Missions')
                        ->group('Missions')
                        ->icon('heroicon-o-map')
                        ->url('/admin/missions')
                        ->sort(10),

                    NavigationItem::make('Liners')
                        ->group('Missions')
                        ->icon('heroicon-o-rectangle-stack')
                        ->url('/admin/liners')
                        ->sort(11),

                    NavigationItem::make('Clients')
                        ->group('Missions')
                        ->icon('heroicon-o-briefcase')
                        ->url('/admin/clients')
                        ->sort(12),

                    // Contenus
                    NavigationItem::make('Articles du blog')
                        ->group('Contenus')
                        ->icon('heroicon-o-newspaper')
                        ->url('/admin/blog/posts')
                        ->sort(20),

                    NavigationItem::make('Catégories du blog')
                        ->group('Contenus')
                        ->icon('heroicon-o-square-3-stack-3d')
                        ->url('/admin/blog/categories')
                        ->sort(21),

                    NavigationItem::make('Bannières')
                        ->group('Contenus')
                        ->icon('heroicon-o-photo')
                        ->url('/admin/banner/contents')
                        ->sort(22),

                    NavigationItem::make('Bibliothèque médias')
                        ->group('Contenus')
                        ->icon('heroicon-o-photo')
                        ->url('/admin/media')
                        ->sort(23),

                    NavigationItem::make('Menus du site')
                        ->group('Contenus')
                        ->icon('heroicon-o-bars-3')
                        ->url('/admin/menus')
                        ->sort(24),

                    // Utilisateurs & Accès
                    NavigationItem::make('Utilisateurs')
                        ->group('Utilisateurs & Accès')
                        ->icon('heroicon-o-user')
                        ->url('/admin/users')
                        ->sort(30),

                    NavigationItem::make('Rôles & Permissions')
                        ->group('Utilisateurs & Accès')
                        ->icon('heroicon-o-key')
                        ->url('/admin/shield/roles')
                        ->sort(31),

                    // Système
                    NavigationItem::make('Journal d’activité')
                        ->group('Système')
                        ->icon('heroicon-o-clipboard-document-list')
                        ->url('/admin/activity-logs')
                        ->sort(40),

                    NavigationItem::make('Logs applicatifs')
                        ->group('Système')
                        ->icon('heroicon-o-document-text')
                        ->url('/log-viewer')
                        ->sort(41),

                    NavigationItem::make('Webhooks')
                        ->group('Système')
                        ->icon('heroicon-o-link')
                        ->url('/admin/webhooks')
                        ->sort(42),

                    // Paramètres
                    NavigationItem::make('Paramètres généraux')
                        ->group('Paramètres du site')
                        ->icon('heroicon-o-cog-8-tooth')
                        ->url('/admin/settings/site')
                        ->sort(50),

                    NavigationItem::make('Mail')
                        ->group('Paramètres du site')
                        ->icon('heroicon-o-envelope')
                        ->url('/admin/settings/mail')
                        ->sort(51),

                    NavigationItem::make('SEO')
                        ->group('Paramètres du site')
                        ->icon('heroicon-o-chart-bar-square')
                        ->url('/admin/settings/seo')
                        ->sort(52),

                    NavigationItem::make('Scripts')
                        ->group('Paramètres du site')
                        ->icon('heroicon-o-code-bracket')
                        ->url('/admin/settings/scripts')
                        ->sort(53),

                    NavigationItem::make('Réseaux sociaux')
                        ->group('Paramètres du site')
                        ->icon('heroicon-o-share')
                        ->url('/admin/settings/social')
                        ->sort(54),
                ];
            })

            ->userMenuItems([
                'profile' => MenuItem::make()->label('Mon profil'),
                MenuItem::make()->label('Documentation')->url('https://docs.lineup.local')->icon('heroicon-o-book-open'),
            ])

   /*         ->plugins([
                FilamentShieldPlugin::make(),
                // Breezy: profil + 2FA + tokens (ajoute le lien "Mon profil" dans le menu utilisateur et la nav)
                BreezyCore::make()
                    ->myProfile(
                        shouldRegisterUserMenu: true,
                        shouldRegisterNavigation: true,
                        navigationGroup: 'Paramètres du site',
                        userMenuLabel: 'Mon profil',
                        hasAvatars: false, // mets true si tu gères l’avatar (voir doc)
                    )
                    ->enableTwoFactorAuthentication(),
                SpatieLaravelSettingsPlugin::make(),
                SpatieLaravelMediaLibraryPlugin::make(),
                FilamentMediaManagerPlugin::make(),
            ])*/


            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
                SetLocale::class,
            ])

            ->authMiddleware([
                FilamentAuthenticate::class,
            ]);
    }
}
