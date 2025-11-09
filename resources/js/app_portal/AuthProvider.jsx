import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { initFirebase, getFirebaseAuth, emailPasswordAuth, providerAuth, phoneAuth, firebaseLogout } from './firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext({
    firebaseReady: false,
    firebaseUser: null,
    apiToken: null,
    loading: true,
    loginWithEmail: async () => {},
    loginWithProvider: async () => {},
    loginWithPhone: async () => {},
    logout: async () => {},
    ensureRole: async () => {},
});

const TOKEN_KEY = 'lineup_token';
const ROLE_KEY = 'lineup_role';

export function AuthProvider({ children, config }) {
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [apiToken, setApiToken] = useState(localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!config?.apiKey) {
            setLoading(false);
            return;
        }
        const auth = initFirebase(config);
        const unsub = onAuthStateChanged(auth, user => {
            setFirebaseUser(user);
            setFirebaseReady(true);
            setLoading(false);
        });
        return () => unsub();
    }, [config]);

    useEffect(() => {
        if (apiToken) {
            axios.defaults.headers.common.Authorization = `Bearer ${apiToken}`;
        } else {
            delete axios.defaults.headers.common.Authorization;
        }
    }, [apiToken]);

    const exchangeToken = async role => {
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('Utilisateur non authentifié.');
        }
        const idToken = await currentUser.getIdToken(true);
        const { data } = await axios.post('/api/auth/firebase', {
            idToken,
            role,
        });
        setApiToken(data.token);
        localStorage.setItem(TOKEN_KEY, data.token);
        if (role) {
            localStorage.setItem(ROLE_KEY, role);
        }
        return data;
    };

    const loginWithEmail = async ({ email, password, mode, role }) => {
        await emailPasswordAuth({ email, password, mode });
        return exchangeToken(role ?? localStorage.getItem(ROLE_KEY) ?? 'client');
    };

    const loginWithProvider = async ({ provider, role }) => {
        await providerAuth(provider);
        return exchangeToken(role ?? localStorage.getItem(ROLE_KEY) ?? 'client');
    };

    const loginWithPhone = async ({ phoneNumber, code, confirmationResult, role, recaptchaContainer }) => {
        let confirmation = confirmationResult;
        if (!confirmation) {
            confirmation = await phoneAuth({ phoneNumber, recaptchaContainer });
            return confirmation;
        }
        await confirmation.confirm(code);
        return exchangeToken(role ?? localStorage.getItem(ROLE_KEY) ?? 'client');
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/firebase/logout');
        } catch (error) {
            // ignore
        }
        await firebaseLogout();
        setApiToken(null);
        localStorage.removeItem(TOKEN_KEY);
    };

    const value = useMemo(
        () => ({
            firebaseReady,
            firebaseUser,
            apiToken,
            loading,
            loginWithEmail,
            loginWithProvider,
            loginWithPhone,
            logout,
        }),
        [firebaseReady, firebaseUser, apiToken, loading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
