import { useNavigation } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { palette } from '../theme';
import { useAuth } from '../context/AuthProvider';

export default function RoleChoiceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isOps } = useAuth();

  const handleOpsPress = () => {
    if (!isOps) {
      Alert.alert('Accès Ops requis', 'Connectez-vous avec un compte Ops/Admin pour accéder à cette section.');
      return;
    }
    navigation.navigate('OpsDashboard');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisissez votre expérience</Text>
      <View style={styles.row}>
        <RoleCard
          title="Client"
          bullets={['Mission instantanée', 'Timeline temps réel', 'Paiement sécurisé']}
          onPress={() => navigation.navigate('ClientHome')}
        />
        <RoleCard
          title="Liner"
          bullets={['Tutoriel interactif', 'Check-list KYC', 'Wallet & payouts']}
          variant="ghost"
          onPress={() => navigation.navigate('LinerHome')}
        />
        <RoleCard
          title="Ops / Admin"
          bullets={['Dashboard missions', 'Notifications live', 'Carte active']}
          variant="outline"
          onPress={handleOpsPress}
          disabled={!isOps}
          helper={!isOps ? 'Réservé aux comptes Ops/Admin' : undefined}
        />
      </View>
    </View>
  );
}

function RoleCard({
  title,
  bullets,
  onPress,
  variant = 'primary',
  disabled = false,
  helper,
}: {
  title: string;
  bullets: string[];
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <Pressable
      style={[
        styles.card,
        variant === 'ghost' && styles.cardGhost,
        variant === 'outline' && styles.cardOutline,
        disabled && styles.cardDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      {bullets.map(bullet => (
        <Text key={bullet} style={styles.bullet}>
          • {bullet}
        </Text>
      ))}
      {helper && <Text style={styles.helper}>{helper}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 24,
    padding: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardGhost: {
    backgroundColor: 'transparent',
  },
  cardOutline: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 8,
  },
  bullet: {
    color: palette.muted,
    marginBottom: 4,
  },
  helper: {
    marginTop: 8,
    color: palette.muted,
    fontSize: 12,
  },
});
