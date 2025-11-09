import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { palette } from '../theme';
import SectionCard from '../components/SectionCard';
import PushStatusBanner from '../components/PushStatusBanner';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthProvider';

export default function ClientDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { pushStatus } = useAuth();

  return (
    <View style={styles.container}>
      <SectionCard title="Espace client" subtitle="Publiez et suivez vos missions.">
        <PushStatusBanner state={pushStatus} role="client" />
        <View style={styles.row}>
          <ActionButton label="Mes missions" onPress={() => navigation.navigate('ClientMissions')} />
          <ActionButton label="Wallet & paiements" onPress={() => navigation.navigate('ClientWallet')} />
          <ActionButton label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        </View>
        <Text style={styles.helper}>Les visiteurs doivent être authentifiés (Firebase) pour créer une mission réelle.</Text>
      </SectionCard>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helper: {
    color: palette.muted,
    marginTop: 12,
  },
});
