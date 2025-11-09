import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme';
import { useAuth } from '../context/AuthProvider';
import { getFirebaseAuth } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { loginWithEmail, loading, apiToken, exchangeTokenForRole, remoteConfig } = useAuth();
  const auth = getFirebaseAuth();
  const [form, setForm] = useState({ email: '', password: '', role: 'client' as 'client' | 'liner' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(result => setAppleAvailable(result))
      .catch(() => setAppleAvailable(false));
  }, []);

  const googleConfig = remoteConfig?.auth_google ?? {};
  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    expoClientId: googleConfig.webClientId,
    iosClientId: googleConfig.iosClientId,
    androidClientId: googleConfig.androidClientId,
    webClientId: googleConfig.webClientId,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken ?? googleResponse.params?.id_token;
      if (idToken) {
        handleFirebaseCredential(GoogleAuthProvider.credential(idToken));
      }
    }
  }, [googleResponse]);

  const handleFirebaseCredential = async (credential: any) => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await signInWithCredential(auth, credential);
      await exchangeTokenForRole(form.role);
      setMessage('Connexion réussie via fournisseur externe.');
    } catch (_error) {
      setError("Impossible d'authentifier ce fournisseur.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await loginWithEmail({ email: form.email.trim(), password: form.password, role: form.role });
      setMessage('Connexion réussie. Les écrans missions/wallet/KYC consommeront vos données réelles.');
    } catch (_error) {
      setError('Impossible de se connecter avec ces identifiants Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('Token Apple manquant');
      }
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.user,
      });
      await handleFirebaseCredential(firebaseCredential);
    } catch (error: any) {
      if (error?.code === 'ERR_CANCELED') {
        return;
      }
      setError("Connexion Apple impossible, vérifiez votre configuration.");
    }
  };

  return (
    <View style={styles.container}>
      <SectionCard title="Connexion Firebase" subtitle="Échange le token Firebase contre l’API Laravel">
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="liner@lineup.fr" placeholderTextColor={palette.muted} autoCapitalize="none" value={form.email} onChangeText={value => setForm(prev => ({ ...prev, email: value }))} />
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput style={styles.input} placeholder="••••••" placeholderTextColor={palette.muted} secureTextEntry value={form.password} onChangeText={value => setForm(prev => ({ ...prev, password: value }))} />
            <Text style={styles.label}>Rôle attendu</Text>
            <View style={styles.roleRow}>
              {(['client', 'liner'] as const).map(role => (
                <Text key={role} style={[styles.role, form.role === role && styles.roleActive]} onPress={() => setForm(prev => ({ ...prev, role }))}>
                  {role === 'client' ? 'Client' : 'Liner'}
                </Text>
              ))}
            </View>
            <Text style={styles.helper}>Token actuel : {apiToken ? `${apiToken.slice(0, 8)}…` : 'aucun'}</Text>
            <Text style={styles.button} onPress={submitting ? undefined : onSubmit}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </Text>
            <View style={styles.providerRow}>
              <Pressable
                style={[styles.providerButton, !googleRequest && styles.providerDisabled]}
                disabled={!googleRequest || submitting}
                onPress={() => promptGoogle()}
              >
                <Text style={styles.providerText}>Continuer avec Google</Text>
              </Pressable>
              {Platform.OS === 'ios' && appleAvailable && (
                <Pressable style={styles.providerButton} onPress={handleApple} disabled={submitting}>
                  <Text style={styles.providerText}>Continuer avec Apple</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.phoneBlock}>
              <Text style={styles.label}>Téléphone (SMS OTP)</Text>
              <Text style={styles.helper}>
                La vérification SMS sera réactivée dès que l’intégration Expo (Firebase Phone Auth) sera stabilisée.
              </Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.success}>{message}</Text> : null}
          </View>
        )}
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  form: {
    gap: 12,
  },
  label: {
    color: palette.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    color: palette.text,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  role: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
  },
  roleActive: {
    backgroundColor: palette.primary,
    borderColor: 'transparent',
  },
  helper: {
    color: palette.muted,
  },
  button: {
    textAlign: 'center',
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 12,
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#ff9ea8',
  },
  success: {
    color: '#4ade80',
  },
  providerRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  providerButton: {
    flex: 1,
    minWidth: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  providerDisabled: {
    opacity: 0.5,
  },
  providerText: {
    color: palette.text,
    fontWeight: '600',
  },
  phoneBlock: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 10,
  },
});
