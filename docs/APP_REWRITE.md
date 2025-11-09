# Migration Flutter → React / React Native

L’objectif est de reproduire 1:1 l’expérience utilisateur (clients, liners, Ops) dans des applications React (web) et React Native (mobile), tout en conservant les endpoints existants exposés par Laravel. Ce document sert de plan d’attaque.

## Architecture retenue

- **Backend Laravel** : reste la source de vérité (APIs, auth Firebase, paiements). Aucun endpoint n’est supprimé.
- **React Web** : nouvelle entrée Vite `resources/js/app_portal/main.jsx` servie sur `/app/react`. Elle deviendra le remplaçant de l’app Flutter web.
- **React Native (à venir)** : dossier `mobile/` (Expo) partagera le même design system et les mêmes hooks réseau. Il sera branché plus tard sur TestFlight / Play Store.
- **Monorepo** : tout vit dans ce dépôt. On garde les consoles Ops/Admin existantes + la nouvelle app client/liner.

## Étapes

1. **Socle UI** (fait) : landing React + router illustrant les écrans clés (role-choice, onboarding client/liner, dashboards). Les écrans affichent clairement que la publication de mission reste réservée aux clients inscrits.
2. **Flux critiques web** (en cours) :
   - Auth Firebase multi-fournisseurs (email, Apple, Google, téléphone) + échange de token Laravel (déjà branché dans `/app/react`).
   - Création de mission côté client : formulaire React branché sur `POST /api/missions` avec prérequis paiement/KYC.
   - Chat mission (clients & liners) : même API que Flutter avec stockage hors-ligne (IndexedDB) et pièces jointes.
   - Notifications push : enregistrement FCM web + `/api/push/register`.
3. **React Native** : reprise des mêmes composants dans un projet Expo. Les modules natifs (push, caméras, Apple/Google Pay) seront branchés selon la roadmap.
4. **Switch progressif** : Flutter continue de tourner jusqu’à validation complète des parcours React. Les stores seront mis à jour une fois la parité atteinte.

## Ce qui reste à faire

- Brancher les pages React web sur les endpoints Laravel (`/api/missions`, `/api/wallet`, etc.).
- Écran publication mission React (formulaire complet + validations).
- Tutoriel liner interactif (composants animations).
- Intégration chat + notifications (Firebase / Pusher).
- Mise en place du repo React Native + tests sur appareils.

## Expo / React Native – état actuel

Un dossier `mobile/lineup-app` a été initialisé avec Expo 52, React Navigation et une skin commune à l’app web. Le projet importe directement le design system via `shared-design/tokens.ts` pour garantir la parité visuelle.

### Structure

- `App.tsx` / `src/App.tsx` : navigation stack (Landing, rôle, dashboards client/liner, missions, wallet, notifications, tutoriel, KYC).
- `src/services/api.ts` : client Axios configuré avec `EXPO_PUBLIC_API_BASE_URL` + `EXPO_PUBLIC_API_TOKEN` (ou `expo.extra`). Les écrans consomment les mêmes endpoints que Flutter (`/api/missions`, `/api/liner/kyc`, `/api/client/wallet`, etc.).
- `src/screens/*` : premières déclinaisons des écrans Flutter (CTA role-choice, listes missions, wallet, KYC checklist, tutoriel liner, centre de notifications).
- `src/components` : briques réutilisables (cards, status pills) stylées avec les tokens.

### Commandes

```
cd mobile/lineup-app
npm install
npm run start
```

Variables utiles :

- `EXPO_PUBLIC_API_BASE_URL` : URL Laravel (ex : `http://127.0.0.1:8000`).
- `EXPO_PUBLIC_API_TOKEN` : token Sanctum/Firebase pour tester les flux protégés tant que l’auth Firebase native n’est pas branchée.
- `EXPO_PUBLIC_FIREBASE_*` : renseignez les clés Firebase (API key, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId) pour activer la connexion email/mot de passe et l’échange de token côté mobile.

> Smoke test rapide : créez un token Laravel (ou exécutez le login Firebase sur `/app/react`) puis exportez `EXPO_PUBLIC_API_TOKEN=<token>` avant `npm run start`. Les écrans Missions / Wallet / KYC de l’app Expo consommeront immédiatement le backend en lecture seule. Ensuite, supprimez cette variable et utilisez l’écran “Connexion Firebase” de l’app pour générer un vrai token via `POST /api/auth/firebase`.

### Gestion centralisée des identifiants Google / Apple

- L’onglet **Paramètres** de la console admin expose désormais deux cartes “Google Sign-In” et “Apple Sign-In”. Elles alimentent la table `app_settings` (`auth_google`, `auth_apple`) et remplacent les valeurs par défaut du `.env`.  
- Une troisième carte “Firebase (Web & Mobile)” permet de renseigner l’intégralité du bundle public (API key, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId, vapidKey). Les apps React/Expo lisent ces valeurs via `GET /api/settings` et n’ont plus besoin d’être rebuildées pour un changement d’environnement.  
- Le front React et l’app Expo lisent automatiquement les identifiants publics via `GET /api/settings` (`auth_google`, `auth_apple` retournent uniquement les champs nécessaires côté client).  
- Les champs sensibles (secret OAuth, private key Apple) restent côté admin/API et ne sont jamais exposés publiquement.

La prochaine étape côté mobile consiste à brancher Firebase Auth (email/Apple/Google/téléphone), les push natifs et les modules de paiement (Stripe/PayPal/Adyen, Apple/Google Pay) avant génération IPA/APK.

Chaque incrément sera livré derrière `/app/react` jusqu’à la bascule finale.
