import type { ExpoConfig } from '@expo/config-types';

type FirebaseExtras = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

type LineUpExtras = {
  apiBaseUrl?: string;
  apiToken?: string;
  firebase?: FirebaseExtras;
};

export default (): ExpoConfig & { extra: LineUpExtras } => ({
  name: 'LineUp',
  slug: 'lineup-mobile',
  owner: 'line_up',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'lineup',
  sdkVersion: '52.0.0',
  assetBundlePatterns: ['**/*'],
  jsEngine: 'hermes',
  plugins: ['expo-notifications', 'expo-updates', 'expo-asset'],
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/23b47e29-3145-43e7-b3d8-a853ca99cf59',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  android: {
    package: 'com.example.lineup_vo',
    googleServicesFile: './google-services.json',
    softwareKeyboardLayoutMode: 'resize',
  },
  ios: {
    bundleIdentifier: 'com.example.lineupVo',
    supportsTablet: false,
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000',
    apiToken: process.env.EXPO_PUBLIC_API_TOKEN ?? '',
    firebase: {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
    eas: {
      projectId: '23b47e29-3145-43e7-b3d8-a853ca99cf59',
    },
  },
});
