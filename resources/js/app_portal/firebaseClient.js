import { initializeApp } from 'firebase/app';
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPhoneNumber,
    RecaptchaVerifier,
} from 'firebase/auth';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

let firebaseApp = null;
let authInstance = null;
let messagingInstance = null;

export function initFirebase(config) {
    if (firebaseApp || !config?.apiKey) {
        return authInstance;
    }
    firebaseApp = initializeApp(config);
    authInstance = getAuth(firebaseApp);
    setPersistence(authInstance, browserLocalPersistence);
    return authInstance;
}

export function getFirebaseAuth() {
    if (!authInstance) {
        throw new Error('Firebase not initialised');
    }
    return authInstance;
}

export function emailPasswordAuth({ email, password, mode = 'login' }) {
    const auth = getFirebaseAuth();
    if (mode === 'register') {
        return createUserWithEmailAndPassword(auth, email, password);
    }
    return signInWithEmailAndPassword(auth, email, password);
}

export function providerAuth(providerId) {
    const auth = getFirebaseAuth();
    if (providerId === 'google') {
        return signInWithPopup(auth, new GoogleAuthProvider());
    }
    if (providerId === 'apple') {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        return signInWithPopup(auth, provider);
    }
    throw new Error('Unsupported provider');
}

export function phoneAuth({ phoneNumber, recaptchaContainer }) {
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, recaptchaContainer, {
        size: 'invisible',
    });
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export function firebaseLogout() {
    const auth = getFirebaseAuth();
    return signOut(auth);
}

export async function getMessagingToken(vapidKey) {
    if (!firebaseApp) return null;
    if (!vapidKey) return null;
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
    if (!messagingInstance) {
        messagingInstance = getMessaging(firebaseApp);
    }
    try {
        const token = await getToken(messagingInstance, { vapidKey });
        return token;
    } catch (error) {
        console.warn('Unable to get FCM token', error);
        return null;
    }
}
