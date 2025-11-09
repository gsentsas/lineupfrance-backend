# LineUp Backend – Setup rapide

## 1. Prérequis
- PHP 8.2+
- Composer
- SQLite (par défaut) ou MySQL/PostgreSQL si vous modifiez `.env`
- Node 18+ (pour les assets facultatifs)

## 2. Installation
```bash
composer install
cp .env.example .env
php artisan key:generate
```

Si vous restez sur SQLite, assurez-vous que `database/database.sqlite` existe :
```bash
touch database/database.sqlite
```

## 3. Configuration d’environnement
- `APP_URL=http://localhost:8000`
- `FRONTEND_URL=http://localhost:5174`
- `SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:5174`
- Clé Google Maps : `GOOGLE_MAPS_KEY`
- Firebase Admin : placez votre JSON de service dans `storage/firebase/firebase-service-account.json` et pointez `FIREBASE_CREDENTIALS` dessus.
- Stripe : `STRIPE_SECRET`, `STRIPE_CONNECT_CLIENT_ID`, `STRIPE_WEBHOOK_SECRET` pour la vérification des signatures.
- PayPal : `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE` (`sandbox` ou `live`).

## 4. Données de démo
```bash
php artisan migrate --seed
```
La seed `DemoSeeder` crée :
- un client (Clara) avec méthodes de paiement et missions
- un liner (Samir) avec comptes de versement, KYC et portefeuille
- un compte Ops (`ops@lineupfrance.com` / `LineUp2025!`) pour accéder à la console `/admin`
- Des comptes prêts à l'emploi pour les tests manuels :

| Rôle  | Email                    | Mot de passe          | Notes                                     |
|-------|--------------------------|-----------------------|-------------------------------------------|
| Admin | `admin@lineupfrance.com` | `LineUpAdmin2025!`    | Accès `/admin`, rôle `admin` (ops).       |
| Client| `client@lineupfrance.com`| `LineUpClient2025!`   | Profil client basique, missions à créer.  |
| Liner | `liner@lineupfrance.com` | `LineUpLiner2025!`    | Profil Liner, KYC `not_started`.          |

## 5. Authentification Ops
- Page de connexion : `https://lineupfrance.com/admin/login`
- Utilise le guard `web` (sessions). Configurez vos Ops supplémentaires via `php artisan tinker` ou un panneau d’administration.
- Toute la zone `/admin/*` est protégée par le middleware `admin.access` (rôles `ops` ou `admin`).

## 5. Lancer l’API
```bash
php artisan serve
```
L’API écoute sur `http://127.0.0.1:8000`.

## 6. Tests
```bash
php artisan test
```
Les tests couvrent :
- filtrage & statut des missions
- workflow KYC (liste, checklist, soumission)
- webhooks et évènements sont mis en file via des Jobs — lancez `php artisan queue:work` pour les traiter.

## 7. Intégration front
- Installez les dépendances Vite/React à la racine du projet : `npm install`
- Lancez le dev server multi-entrées (landing, app_portal, ops, admin) : `npm run dev`
- Build production (utilisé par Laravel Vite) : `npm run build`
- Les entrées disponibles :
  - `resources/js/landing/main.jsx` → `/`
  - `resources/js/app_portal/main.jsx` → `/app/react`
  - `resources/js/ops/main.jsx` → `/ops`
  - `resources/js/admin/main.jsx` → `/admin`
- Chaque console lit automatiquement les endpoints `/ops/api/*` et `/admin/api/*` exposés par Laravel.
- Configurez le front Expo dans `mobile/lineup-app` (voir `docs/APP_REWRITE.md`) : `cd mobile/lineup-app && npm install && npm run start`.

Pour la configuration Firebase/Stripe côté web & Expo, utilisez `/admin/api/settings` ou l’écran Settings de la console admin : aucune recompilation n’est nécessaire, les apps récupèrent `/api/settings` au focus.

## 8. Temps réel & webhooks
- Les canaux privés sont déclarés dans `routes/channels.php` (`user.{id}`, `mission.{id}`). Configurez Pusher/Laravel WebSockets puis chargez Echo côté front.
- Les événements émis : `MissionUpdated`, `NotificationCreated`.
- Placeholders webhooks : `POST /api/webhooks/stripe`, `POST /api/webhooks/paypal`. Branchez la validation des signatures et déclenchez vos jobs.
- Voir `docs/WEBHOOKS.md` pour la configuration production (lineupfrance.com).

## 9. Traductions FR/EN
- Les consoles Ops & Admin disposent d’un toggle FR/EN (FR par défaut) et toutes les chaînes sont gérées via des dictionnaires (`resources/js/ops/App.jsx`, `resources/js/admin/AdminApp.jsx`).
- Pour ajouter/modifier une chaîne, éditez les objets `translations.fr` et `translations.en`, puis utilisez `t('ma.cle')` dans les composants.
- Les placeholders (`{name}`, `{count}`, etc.) sont gérés via `formatTemplate`.
- Le guide complet se trouve dans [`docs/LOCALES.md`](LOCALES.md) ; partagez la même clé lorsque vous implémentez la parité dans le SPA React (`resources/js/app_portal`) ou l’app Expo.
