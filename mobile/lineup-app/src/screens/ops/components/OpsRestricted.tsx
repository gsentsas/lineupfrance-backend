import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../context/AuthProvider';
import { palette } from '../../../theme';

export default function OpsRestricted({ children }: { children: ReactNode }) {
  const { isOps, profileLoading } = useAuth();

  if (profileLoading) {
    return (
      <View style={styles.locked}>
        <ActivityIndicator color={palette.primary} />
        <Text style={styles.text}>Chargement du profil Ops…</Text>
      </View>
    );
  }

  if (!isOps) {
    return (
      <View style={styles.locked}>
        <Text style={styles.title}>Accès Ops requis</Text>
        <Text style={styles.text}>Connectez-vous avec un compte Ops/Admin pour consulter ces écrans.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  locked: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  text: {
    color: palette.muted,
    textAlign: 'center',
  },
});
