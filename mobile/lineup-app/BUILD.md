## Build & Submission Checklist

This Expo project is ready for EAS Build/Submissions. Keep the following references handy when triggering APK/AAB/IPA builds.

### Credentials & IDs

| Item | Value | Notes |
| --- | --- | --- |
| Google Play developer account ID | `5347762782469861882` | Needed when creating Play Console service accounts / verifying uploads. |
| Firebase management service agent | `service-527646708759@gcp-sa-firebase.iam.gserviceaccount.com` | Automatically created by Firebase; keep granted roles. |
| Firebase Admin SDK service account | `firebase-adminsdk-fbsvc@lineup-react.iam.gserviceaccount.com` (`lineup-react-firebase-adminsdk-fbsvc-8d9bd99f1e.json`, API key `AQ.Ab8RN6J3iLPg_RjVUsZ2vCikDF22RiER00A6Kq5Dx_rgH0Ju-A`) | Use for server-side Firebase Admin calls. |
| Android developer API key | `AQ.Ab8RN6LAaGXGfAJna9q4BIDmx3WaThnVFHgS4C-Y7TGk-k7slQ` (service: `lineup@lineup-react.iam.gserviceaccount.com`) | Keep outside of Git; pass via `EXPO_PUBLIC_FIREBASE_API_KEY` or backend settings if needed. |
| Web push (VAPID) key | `BLAPaQ7TZPURZEyYB8ZFmSPE9uqz1X0wrLgzRy6xxt16QK7QJWRV-OR3Vb8b_oujOt_oAz9SqBxzI5DhCOr0mAw` | Inject into `/api/settings` for Expo web push + backend parity. |
| Firebase iOS app ID | `1:527646708759:ios:45a2833f7f37138d83b852` (`app-1-527646708759-ios-45a2833f7f37138d83b852`) | Matches `GoogleService-Info.plist` copied into this repo. |
| Android keystore | `credentials/android/lineup-release.jks` | Passwords stored in `credentials.json` / `lineup_vo/android/key.properties` (`LineUp2025$`). |
| Apple bundle identifier | `com.lineup.app` | Declared in `app.config.ts`. |

### Required files already checked in

- `google-services.json` and `GoogleService-Info.plist` (copied from the Flutter app) sit at the Expo project root and are referenced by `app.config.ts`.
- `credentials.json` points EAS Build to the local keystore so builds are signed out‑of‑the-box.
- `eas.json` defines:
  - `productionAndroid` (store / app bundle / local credentials).
  - `production` (store / iOS). Update placeholder Apple IDs before running `eas build -p ios`.
  - Submission targets for Play (service account JSON expected at `credentials/google-play-service-account.json`) and App Store Connect (fill in your Apple account + ASC app ID).

### Build commands

```bash
cd /Users/gsent/Documents/bo-lineup/mobile/lineup-app
npm install   # first time only

# Android (AAB signed with local JKS)
npx eas build -p android --profile productionAndroid
npx eas submit -p android --profile production   # once google-play-service-account.json is present

# iOS (requires Apple ID / Asc App ID updates in eas.json)
npx eas build -p ios --profile production
npx eas submit -p ios --profile production
```

> Tip: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SANCTUM_TOKEN`, and Firebase front‑end keys should come from `/admin/settings` so the app consumes the latest config at runtime. Update the `env` blocks inside `eas.json` (or set CI secrets) before triggering remote builds.
