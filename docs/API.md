# LineUp API Reference (Draft)

## Authentication

### POST `/api/auth/firebase`
Exchange a Firebase ID token for a Sanctum API token.

Payload:
```json
{ "idToken": "string", "role": "client|liner" }
```

Response:
```json
{ "token": "string", "role": "client", "user": { ... } }
```

### POST `/api/auth/firebase/logout`
Revokes the current Sanctum token. Requires `Authorization: Bearer`.

---

## Profile & Accounts

| Endpoint | Description |
|----------|-------------|
| `POST /api/profile` | Sync onboarding data (role selection, full name, phone, email). |
| `GET /api/me` | Returns aggregated profile, payment methods, payout accounts. |
| `PUT /api/me/client` | Update client info (`name`, `phone`, `address`, preferences). |
| `PUT /api/me/liner` | Update liner bio, availability, payout choice. |
| `GET /api/liner/preferences` | Retrieve saved liner availability/preferences toggles. |
| `PUT /api/liner/preferences` | Update liner preferences (`nightMissions`, `maxDistanceKm`, etc.). |
| `GET /api/admin/payment-providers` | _(Admin)_ List Stripe/PayPal/Adyen/Apple Pay/Google Pay credentials. |
| `PUT /api/admin/payment-providers/{provider}` | _(Admin)_ Update credentials + enabled flag for a provider. |
| `GET /api/admin/overview` | _(Admin)_ Aggregated stats + latest missions/clients/liners. |
| `POST /api/admin/quick-actions/test-mission` | _(Admin)_ Create a sample mission for demos/testing. |
| `POST /api/admin/quick-actions/broadcast` | _(Admin)_ Push a notification (title/message) to the Ops feed. |
| `GET /api/admin/notifications` | _(Admin)_ Latest Ops notifications/alerts (scoped to the current admin). |
| `GET /api/notifications/stream` | _(Auth)_ Server-Sent Events stream for the signed-in user's notifications (clients/liners/admin). |
| `GET /api/admin/missions` | _(Admin)_ Paginated missions table with filters + search. |
| `GET /api/admin/clients` | _(Admin)_ Paginated clients table with status filters (`active`, `idle`, `vip`). |
| `GET /api/admin/liners` | _(Admin)_ Paginated liners table with KYC + rating filters. |
| `GET /api/admin/payout-accounts` | _(Admin/Ops)_ Lists saved payout accounts (provider, owner, status, updatedAt). |
| `GET /api/admin/announcements` | _(Admin/Ops)_ Returns broadcast cards for Ops/Expo (title, body, category, author). |
| `POST /api/admin/announcements` | _(Admin)_ Create a new announcement (requires `title`, `body`). |
| `PUT /api/admin/announcements/{id}` | _(Admin)_ Update an announcement. |
| `DELETE /api/admin/announcements/{id}` | _(Admin)_ Remove an announcement. |
| `GET /api/admin/liners/locations` | _(Admin/Ops)_ Returns liner coordinates + mission metadata for live map dashboards. |

### Payments & Payouts
- `GET /api/payments/methods`
- `POST /api/payments/methods`
- `PATCH /api/payments/methods/{id}` (set `isDefault`, rename, toggle status)
- `DELETE /api/payments/methods/{id}`
- `GET /api/liner/payout-accounts`
- Same pattern as above for payout accounts.

Payload schema aligns with the frontend store (`provider`, `label`, `meta`, `isDefault`).

**Admin PSP management**

- `GET /api/admin/payment-providers`
  ```json
  {
    "data": [
      {
        "provider": "stripe",
        "label": "Stripe",
        "enabled": true,
        "credentials": {
          "secretKey": "sk_live_...",
          "publishableKey": "pk_live_...",
          "webhookSecret": "whsec_...",
          "connectClientId": "ca_...",
          "applePayMerchantId": "merchant.fr.lineup"
        },
        "fields": [
          { "key": "secretKey", "label": "Secret key", "type": "secret", "required": true },
          { "key": "publishableKey", "label": "Publishable key", "type": "text", "required": true }
        ],
        "health": {
          "status": "healthy",
          "message": "Event payment_intent.succeeded",
          "lastWebhookAt": "2025-11-08T14:34:00+01:00",
          "lastFailureAt": null,
          "isStale": false
        }
      }
    ]
  }
  ```
- `PUT /api/admin/payment-providers/stripe`
  ```json
  {
    "enabled": true,
    "credentials": {
      "secretKey": "sk_live_...",
      "publishableKey": "pk_live_...",
      "webhookSecret": "whsec_...",
      "connectClientId": "ca_...",
      "applePayMerchantId": "merchant.fr.lineup"
    }
  }
  ```
- `GET /api/admin/overview`
  ```json
  {
    "data": {
      "stats": { "missions_active": 12, "missions_queueing": 4, ... },
      "missions": [{ "id": "...", "title": "Mission Fnac", "status": "published", ... }],
      "clients": [{ "id": 12, "name": "Clara Dubois", "joinedAt": "2025-11-08T..." }],
      "liners": [...],
      "payments": { "volume_week": 12.4, "pending_payouts": 3.1 }
    }
  }
  ```
- `POST /api/admin/quick-actions/broadcast`
  ```json
  { "title": "Flash info", "message": "Incident réglé." }
  ```

### Admin announcements

- `GET /api/admin/announcements`
  ```json
  {
    "data": [
      {
        "id": "annc-01JFKF4YJWQ9P",
        "title": "Maintenance Stripe",
        "body": "Les paiements express seront gelés de 02h à 03h.",
        "category": "ops",
        "publishedAt": "2025-11-12T08:30:00+01:00",
        "author": { "id": 4, "name": "LineUp Admin", "email": "admin@lineupfrance.com" }
      }
    ]
  }
  ```
- `POST /api/admin/announcements`
  ```json
  { "title": "Incident Slack", "body": "Webhook Slack en maintenance.", "category": "ops" }
  ```

### Admin payout accounts

- `GET /api/admin/payout-accounts`
  ```json
  {
    "data": [
      {
        "id": "acct-12",
        "provider": "stripe",
        "label": "Compte principal Samir",
        "status": "pending",
        "isDefault": true,
        "user": { "id": 43, "name": "Samir Koulibaly", "email": "samir@lineup" },
        "updatedAt": "2025-11-11T09:41:00+01:00"
      }
    ]
  }
  ```

### Liner live locations

- `GET /api/admin/liners/locations`
  ```json
  {
    "data": [
      {
        "linerId": 43,
        "linerName": "Samir Koulibaly",
        "missionId": "mission-123",
        "missionTitle": "Fnac Champs-Élysées",
        "last_lat": 48.8733,
        "last_lng": 2.3032,
        "status": "in_progress",
        "updatedAt": "2025-11-12T11:15:00+01:00"
      }
    ]
  }
  ```

- `GET /api/admin/missions`
  - Query params: `status`, `progress`, `paymentStatus`, `search`, `client`, `liner`, `from`, `to`, `sort=published_at:desc`, `page`, `perPage` (<=100).
  - Response:
    ```json
    {
      "data": [
        {
          "id": "mission-id",
          "title": "Attente Fnac — billets",
          "status": "accepted",
          "progressStatus": "pending",
          "paymentStatus": "authorized",
          "budgetCents": 18000,
          "currency": "EUR",
          "scheduledAt": "2025-11-09T10:00:00+01:00",
          "client": { "id": 12, "name": "Clara Dubois" },
          "liner": { "id": 43, "name": "Samir Koulibaly", "rating": 4.9 },
          "applicationsCount": 3
        }
      ],
      "meta": { "currentPage": 1, "perPage": 20, "total": 52, "filters": { "status": ["accepted"] } }
    }
    ```

- `GET /api/admin/clients`
  - Query params: `status=active|idle|vip`, `search`, `from`, `to`, `page`, `perPage`.
  - Response:
    ```json
    {
      "data": [
        {
          "id": 12,
          "name": "Clara Dubois",
          "email": "clara@lineup",
          "missionsTotal": 18,
          "missionsActive": 2,
          "lifetimeValueEuros": 3120,
          "lastMissionAt": "2025-11-08T15:10:00+01:00",
          "status": "active",
          "preferredCommunication": "sms"
        }
      ]
    }
    ```

- `GET /api/admin/liners`
  - Query params: `status=verified|pending|rejected`, `ratingMin`, `ratingMax`, `search`, `page`, `perPage`.
  - Response:
    ```json
    {
      "data": [
        {
          "id": 43,
          "name": "Samir Koulibaly",
          "rating": 4.8,
          "missionsTotal": 128,
          "missionsActive": 3,
          "earningsEuros": 2290,
          "kycStatus": "approved",
          "availability": "Lun-Dim • 7h - 22h",
          "payoutReady": true
        }
      ]
    }
    ```

---

## Missions

### `GET /api/missions`
List missions for the authenticated client.

Query parameters:
- `status=published,accepted`
- `progress=en_route`
- `search=apple`
- `limit=25`

Response:
```json
{
  "data": [
    {
      "id": "mission-id",
      "title": "File Adidas",
      "location": { "label": "26 Bd Haussmann...", "latitude": 48.87 },
      "scheduledAt": "2025-11-10T08:00:00+01:00",
      "durationMinutes": 90,
      "budgetCents": 1500,
      "currency": "EUR",
      "status": "in_progress",
      "progressStatus": "en_route"
    }
  ],
  "meta": {
    "total": 3,
    "filters": { "status": ["in_progress"] }
  }
}
```

### `GET /api/liner/missions`
Same payload, with additional filter `assigned=all|mine|open`.

### `POST /api/missions`
Creates a mission for the current client.
```json
{
  "title": "File billetterie",
  "type": "evenement",
  "location": { "label": "5 Bd du Temple, Paris" },
  "scheduledAt": "2025-11-09T10:30:00+01:00",
  "durationMinutes": 120,
  "budgetCents": 1800,
  "description": "Acheter les billets dès l'ouverture."
}
```

### `PUT /api/missions/{id}`
Partial update using the same keys as `POST`.

### `POST /api/missions/{id}/cancel`
Cancels a mission (client only).

### `POST /api/liner/missions/{id}/accept`
Assigns the mission to the authenticated liner.

### `POST /api/liner/missions/{id}/status`
Updates mission workflow.
```json
{ "progressStatus": "en_route" }
```
The controller will automatically flip the mission status to `in_progress` or `completed`.

---

## Wallet & Notifications

| Endpoint | Description |
|----------|-------------|
| `GET /api/client/wallet` | Client balance + transactions |
| `GET /api/liner/wallet` | Liner balance + transactions |
| `GET /api/notifications` | Latest notifications |
| `POST /api/notifications/{id}/read` | Mark single notification as read |
| `POST /api/notifications/read-all` | Mark all as read |
| `GET /api/settings` | Renvoie les contenus configurables (hero onboarding, highlights, contacts support). |

Each wallet response:
```json
{
  "wallet": { "balance_cents": 1800, "pending_cents": 2200, "currency": "EUR" },
  "transactions": [
    {
      "id": "txn-client-1",
      "type": "debit",
      "status": "completed",
      "amount_cents": 1800,
      "currency": "EUR",
      "description": "Mission billetterie Fnac",
      "createdAt": "2025-11-06T09:30:00+01:00"
    }
  ]
}
```

---

## KYC

- `GET /api/liner/kyc`
- `PATCH /api/liner/kyc/checklist/{item}` with `{ "completed": true }`
- `PATCH /api/liner/kyc/submit` with `{ "status": "review" }`

---

## Realtime Channels

Private channels (Laravel Echo / Pusher compatible):

| Channel | Events | Payload |
|---------|--------|---------|
| `private-user.{id}` | `notification.created` | `{ "notification": {...} }` |
| `private-mission.{id}` | `mission.updated` | `{ "mission": {...} }` |

Authorization logic is defined in `routes/channels.php` (clients and liners can only subscribe to their missions).

Events emitted:
- `MissionUpdated` when a mission is created, updated, accepted, cancelled, or progressed.
- `NotificationCreated` on new notification records (observers).

---

## Webhooks

| Endpoint | Description | Sécurité / Traitement |
|----------|-------------|-----------------------|
| `POST /api/webhooks/stripe` | Stripe Connect / Payments webhook receiver. | Signature vérifiée via `StripeWebhookVerifier` (`STRIPE_WEBHOOK_SECRET`). Les évènements `payment_intent.succeeded` & `payout.paid` sont routés vers `HandlePaymentIntentSucceeded` / `HandlePayoutPaid` qui réconcilient missions & portefeuilles. |
| `POST /api/webhooks/paypal` | PayPal Payouts webhook receiver. | Signature validée via `PayPalWebhookVerifier` (client/secret + `PAYPAL_WEBHOOK_ID`). Les évènements `PAYMENT.CAPTURE.COMPLETED` & `PAYMENT.PAYOUTSBATCH.SUCCESS` déclenchent `HandlePaymentCaptureCompleted` / `HandlePayoutBatchSuccess`. |

Les contrôleurs répondent `202 Accepted` après validation puis délèguent le traitement aux jobs (`queue:default`). Assurez-vous qu’un worker tourne en continu.

---

## Broadcasting Setup
- Add your Pusher or Laravel WebSockets credentials in `.env`.
- Ensure the SPA loads Echo (see `workspace/shadcn-ui/src/lib/realtime-client.ts`).
- Sanctum authenticates websocket requests via `/broadcasting/auth`.
