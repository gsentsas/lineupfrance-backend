import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseApp: FirebaseApp | null = null;
let currentConfig: FirebaseOptions | null = null;

export function ensureFirebaseApp(config: FirebaseOptions) {
  if (!firebaseApp || !currentConfig || JSON.stringify(currentConfig) !== JSON.stringify(config)) {
    firebaseApp = initializeApp(config, firebaseApp?.name ?? undefined);
    currentConfig = config;
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  if (!firebaseApp) {
    throw new Error('Firebase app not initialised. Call ensureFirebaseApp first.');
  }
  return getAuth(firebaseApp);
}
