# Webhooks – Production Setup (lineupfrance.com)

## 1. Endpoints

| Provider | URL (prod) | Notes |
|----------|------------|-------|
| Stripe   | `https://lineupfrance.com/api/webhooks/stripe` | Requires `STRIPE_WEBHOOK_SECRET`. Events handled: `payment_intent.succeeded`, `payout.paid`. |
| PayPal   | `https://lineupfrance.com/api/webhooks/paypal` | Requires `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE=live`. Events handled: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.PAYOUTSBATCH.SUCCESS`. |

## 2. Environment variables (`.env`)

```dotenv
APP_URL=https://lineupfrance.com

STRIPE_SECRET=sk_live_xxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

PAYPAL_MODE=live
PAYPAL_CLIENT_ID=ATS9Tay-mqlcIEDKtvdh1ANcpxerK4sCBQYrMjH-IMmXKLywNLS4UM5s0FT0Ygt3qyLDkaLhIndypeJy
PAYPAL_SECRET=EFvbhEvPMN9Sp4hLl-AGLX_3Z4kZfXsDXBj-Vjf5ZHRSMkqY4YPcV5boSMhvpDw3zTBGTne2y8VKafdV
PAYPAL_WEBHOOK_ID=5TC71826CN8775806
```

> ⚠️ **Sécurité** : stockez ces secrets via votre gestionnaire d’ENV (Forge, Vapor, Docker secrets, etc.) et non en clair dans le repo.

## 3. Prérequis d’infrastructure

- **HTTPS obligatoire** : Stripe & PayPal exigent des webhook HTTPS valides.
- **Queue worker** : `php artisan queue:work --queue=default` doit tourner en continu pour que les jobs déclenchés par les webhooks s’exécutent.
- **Diffusion temps réel** : si vous activez Echo (Pusher/Laravel WebSockets) en production, configurez `BROADCAST_DRIVER`, les clés Pusher, et ouvrez `/broadcasting/auth`.

## 4. Configuration côté Stripe

1. Console Stripe → Developers → Webhooks → `Add endpoint`
2. URL : `https://lineupfrance.com/api/webhooks/stripe`
3. Événements à envoyer :
   - `payment_intent.succeeded`
   - `payout.paid`
4. Enregistrez et copiez le `Signing secret`, renseignez `STRIPE_WEBHOOK_SECRET`.
5. Assurez-vous que les PaymentIntents créés incluent `metadata[mission_id]`.

## 5. Configuration côté PayPal

1. Console PayPal → *My Apps & Credentials* → Webhooks → `Add Webhook`.
2. URL : `https://lineupfrance.com/api/webhooks/paypal`
3. Événements :
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.PAYOUTSBATCH.SUCCESS`
4. Notez l’identifiant du webhook et renseignez `PAYPAL_WEBHOOK_ID`.
5. Fournissez `custom_id` (mission UUID) lors des captures et un `sender_batch_id` unique pour les payouts.

## 6. Monitoring & logs

- Les webhooks sont loggés (`storage/logs/laravel.log`). Surveillez les warnings :
  - `Missing mission_id` / `custom_id` : ajoutez ces champs côté Stripe/PayPal.
  - `Invalid webhook signature` : vérifiez secrets & environnements.
- En cas de redelivery, Stripe/PayPal réessaient automatiquement (consultez leurs dashboards).

## 7. Déploiement

1. Déployer le code.
2. Mettre à jour les variables d’environnement (Stripe / PayPal).
3. `php artisan config:clear && php artisan queue:restart`.
4. Tester les webhooks via les outils fournis par Stripe/PayPal en mode live ou via CLI (`stripe trigger`, `PayPal simulate event`).

> ℹ️ **Monitoring Ops** : chaque webhook réussi/échoué met à jour `payment_provider_settings.health_status`, `last_webhook_at`, `last_failure_at` et le message associé. L’Ops console consomme ces champs pour afficher la santé Stripe/PayPal/Adyen/Apple Pay/Google Pay en temps réel.
