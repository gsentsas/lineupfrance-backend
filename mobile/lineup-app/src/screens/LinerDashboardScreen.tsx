import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import SectionCard from '../components/SectionCard';
import PushStatusBanner from '../components/PushStatusBanner';
import { palette } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthProvider';

export default function LinerDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { pushStatus } = useAuth();
  return (
    <View style={styles.container}>
      <SectionCard title="Espace liner" subtitle="KYC, tutoriel, missions et wallet.">
        <PushStatusBanner state={pushStatus} role="liner" />
        <View style={styles.row}>
          <Action label="Missions" onPress={() => navigation.navigate('LinerMissions')} />
          <Action label="Wallet" onPress={() => navigation.navigate('LinerWallet')} />
          <Action label="Tutoriel" onPress={() => navigation.navigate('LinerTutorial')} />
          <Action label="KYC" onPress={() => navigation.navigate('LinerKyc')} />
        </View>
        <Text style={styles.helper}>Les mêmes endpoints Riverpod sont réutilisés côté React Native.</Text>
      </SectionCard>
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
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
    backgroundColor: palette.secondary,
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
