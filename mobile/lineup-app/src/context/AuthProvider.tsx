import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth, ensureFirebaseApp } from '../config/firebase';
import useFirebaseRemoteConfig from '../hooks/useFirebaseRemoteConfig';
import { exchangeFirebaseToken, fetchCurrentUser, logoutFromApi, setSessionToken } from '../services/api';
import usePushRegistration, { PushRegistrationState } from '../hooks/usePushRegistration';

type Role = 'client' | 'liner';

type AuthContextValue = {
  firebaseReady: boolean;
  firebaseUser: unknown | null;
  apiToken: string | null;
  loading: boolean;
  loginWithEmail: (params: { email: string; password: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  exchangeTokenForRole: (role: Role) => Promise<void>;
  remoteConfig: any;
  pushStatus: PushRegistrationState;
  profile: any;
  profileLoading: boolean;
  isOps: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  firebaseReady: false,
  firebaseUser: null,
  apiToken: null,
  loading: true,
  loginWithEmail: async () => {},
  logout: async () => {},
  exchangeTokenForRole: async () => {},
  remoteConfig: null,
  pushStatus: { status: 'idle' },
  profile: null,
  profileLoading: false,
  isOps: false,
});

const TOKEN_KEY = 'lineup_api_token';

export function AuthProvider({ children }: PropsWithChildren) {
  const { config, loading: configLoading } = useFirebaseRemoteConfig();
  useEffect(() => {
    if (config?.firebase_frontend) {
      ensureFirebaseApp(config.firebase_frontend);
    }
  }, [config]);

  if (configLoading || !config?.firebase_frontend) {
    return null;
  }

  const auth = getFirebaseAuth();
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pushStatus = usePushRegistration(Boolean(apiToken));
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(storedToken => {
      if (storedToken) {
        setSessionToken(storedToken);
        setApiToken(storedToken);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setFirebaseReady(true);
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (!apiToken) {
      setProfile(null);
      return;
    }
    let active = true;
    setProfileLoading(true);
    fetchCurrentUser()
      .then(data => {
        if (!active) return;
        setProfile(data);
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
      })
      .finally(() => {
        if (!active) return;
        setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiToken]);

  const exchangeToken = useCallback(
    async (role: Role) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Aucun utilisateur Firebase connecté.');
      }
      const idToken = await currentUser.getIdToken(true);
      const token = await exchangeFirebaseToken(idToken, role);
      setApiToken(token);
      await AsyncStorage.setItem(TOKEN_KEY, token);
    },
    [auth],
  );

  const loginWithEmail = useCallback(
    async ({ email, password, role }: { email: string; password: string; role: Role }) => {
      await signInWithEmailAndPassword(auth, email, password);
      await exchangeToken(role);
    },
    [auth, exchangeToken],
  );

  const logout = useCallback(async () => {
    await logoutFromApi();
    await signOut(auth);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setApiToken(null);
    setSessionToken(undefined);
    setProfile(null);
  }, [auth]);

  useEffect(() => {
    if (!firebaseReady && config?.firebase_frontend) return;
    if (!config?.firebase_frontend) {
      Alert.alert(
        'Configuration Firebase',
        'Impossible de charger la configuration Firebase distante. Vérifiez les paramètres admin.',
      );
    }
  }, [firebaseReady, config]);

  const isOpsUser = useMemo(() => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (typeof profile.teamRole === 'string' && profile.teamRole.toLowerCase().includes('ops')) {
      return true;
    }
    if (Array.isArray(profile.teamPermissions)) {
      return profile.teamPermissions.includes('ops.access');
    }
    return false;
  }, [profile]);

  const value = useMemo(
    () => ({
      firebaseReady,
      firebaseUser,
      apiToken,
      loading,
      loginWithEmail,
      logout,
      exchangeTokenForRole: exchangeToken,
      remoteConfig: config,
      pushStatus,
      profile,
      profileLoading,
      isOps: isOpsUser,
    }),
    [
      apiToken,
      config,
      exchangeToken,
      firebaseReady,
      firebaseUser,
      isOpsUser,
      loading,
      loginWithEmail,
      logout,
      profile,
      profileLoading,
      pushStatus,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
