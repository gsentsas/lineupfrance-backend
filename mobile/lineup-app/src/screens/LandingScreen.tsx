import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View, Pressable, ScrollView, Platform } from 'react-native';
import { gradient, palette } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import usePwaInstallPrompt from '../hooks/usePwaInstallPrompt';

export default function LandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { canInstall, promptInstall } = usePwaInstallPrompt();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={gradient} style={styles.hero}>
        <Text style={styles.eyebrow}>LineUp • Mobile</Text>
        <Text style={styles.title}>Attendez moins, vivez plus.</Text>
        <Text style={styles.subtitle}>Parité complète avec l’app Flutter : missions client, dashboards liner et tutoriel.</Text>
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => navigation.navigate('RoleChoice')}>
            <Text style={styles.primaryText}>Choisir mon rôle</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate('ClientHome')}>
            <Text style={styles.secondaryText}>Aperçu client</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.secondaryText}>Se connecter (Firebase)</Text>
          </Pressable>
          {Platform.OS === 'web' && canInstall && (
            <Pressable style={styles.pwa} onPress={promptInstall}>
              <Text style={styles.pwaText}>Installer la PWA</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
      <View style={styles.grid}>
        <Card
          title="Client"
          subtitle="Créer des missions, suivre la timeline, valider les paiements"
          onPress={() => navigation.navigate('ClientHome')}
        />
        <Card
          title="Liner"
          subtitle="Tutoriel interactif, KYC, missions favorites"
          onPress={() => navigation.navigate('LinerHome')}
        />
      </View>
    </ScrollView>
  );
}

function Card({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: palette.background,
    flexGrow: 1,
  },
  pwa: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pwaText: {
    color: '#fff',
    fontWeight: '600',
  },
  hero: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 12,
  },
  subtitle: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  primary: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryText: {
    color: palette.primary,
    fontWeight: '600',
  },
  secondary: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    gap: 16,
  },
  card: {
    borderRadius: 24,
    backgroundColor: palette.card,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: palette.muted,
    marginTop: 4,
  },
});
