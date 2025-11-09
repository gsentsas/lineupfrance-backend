import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SectionCard from '../components/SectionCard';
import StatusPill from '../components/StatusPill';
import { palette } from '../theme';
import { fetchClientMissions } from '../services/api';
import type { MissionSummary } from '../types';
import type { RootStackParamList } from '../types/navigation';
import { createStripePaymentIntent } from '../services/payments';
import { useAuth } from '../context/AuthProvider';
import { useToast } from '../context/ToastProvider';

const STATUS_PRESETS = {
  active: 'published,accepted,in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

type PresetKey = keyof typeof STATUS_PRESETS;

export default function ClientMissionsScreen() {
  const [preset, setPreset] = useState<PresetKey>('active');
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const stripe = useStripe();
  const { remoteConfig } = useAuth();
  const [paying, setPaying] = useState<{ id: string; method: 'apple' | 'google' | '' }>({ id: '', method: '' });
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchClientMissions({ status: STATUS_PRESETS[preset], limit: 20 });
      setMissions(data);
    } catch (_error) {
      setError("Impossible de charger les missions. Fournissez un token d'API valide dans EXPO_PUBLIC_API_TOKEN.");
      toast.show('Chargement des missions impossible.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [preset, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMissionPayment = async (mission: MissionSummary, method: 'apple' | 'google') => {
    if (!remoteConfig?.stripe?.publishableKey) {
      Alert.alert('Stripe', 'Configurez Stripe dans le back-office pour activer Apple/Google Pay.');
      return;
    }
    if (!mission.budgetCents) {
      Alert.alert('Mission', 'Budget mission indisponible.');
      return;
    }

    setPaying({ id: mission.id, method });
    try {
      const intent = await createStripePaymentIntent({ missionId: mission.id });
      const amountLabel = (mission.budgetCents / 100).toFixed(2);
      if (method === 'apple') {
        if (!(await stripe.isApplePaySupported())) {
          Alert.alert('Apple Pay', 'Activez Apple Pay sur cet appareil.');
          setPaying({ id: '', method: '' });
          return;
        }
        const present = await stripe.presentApplePay({
          cartItems: [{ label: mission.title ?? 'Mission LineUp', amount: amountLabel }],
          country: 'FR',
          currency: 'EUR',
        });
        if (present.error) {
          Alert.alert('Apple Pay', present.error.message ?? 'Transaction interrompue.');
          setPaying({ id: '', method: '' });
          return;
        }
        const confirm = await stripe.confirmApplePayPayment(intent.clientSecret);
        if (confirm.error) {
          Alert.alert('Apple Pay', confirm.error.message ?? 'Confirmation impossible.');
          setPaying({ id: '', method: '' });
          return;
        }
      } else {
        const init = await stripe.initGooglePay({
          testEnv: (remoteConfig?.stripe?.mode ?? 'test') !== 'live',
          merchantName: 'LineUp',
          merchantCountryCode: 'FR',
          existingPaymentMethodRequired: false,
        });
        if (init.error) {
          Alert.alert('Google Pay', init.error.message ?? 'Google Pay indisponible.');
          setPaying({ id: '', method: '' });
          return;
        }
        const present = await stripe.presentGooglePay({
          currencyCode: 'EUR',
          amount: amountLabel,
        });
        if (present.error) {
          Alert.alert('Google Pay', present.error.message ?? 'Transaction interrompue.');
          setPaying({ id: '', method: '' });
          return;
        }
        const confirm = await stripe.confirmGooglePayPayment(intent.clientSecret);
        if (confirm.error) {
          Alert.alert('Google Pay', confirm.error.message ?? 'Confirmation impossible.');
          setPaying({ id: '', method: '' });
          return;
        }
      }
      toast.show('Paiement confirmé. Mission mise à jour.');
      await load();
    } catch (_error) {
      toast.show('Impossible de finaliser le paiement.', { type: 'error' });
      Alert.alert('Paiement', 'Impossible de créer ou confirmer ce paiement.');
    } finally {
      setPaying({ id: '', method: '' });
    }
  };

  return (
    <View style={styles.container}>
      <SectionCard
        title="Missions client"
        subtitle="Filtrage statut identique au parcours Flutter"
        actions={
          <View style={styles.pillRow}>
            {Object.keys(STATUS_PRESETS).map(key => (
              <Pressable key={key} style={[styles.pill, preset === key && styles.pillActive]} onPress={() => setPreset(key as PresetKey)}>
                <Text style={[styles.pillText, preset === key && styles.pillTextActive]}>{
                  key === 'active' ? 'En cours' : key === 'completed' ? 'Terminées' : 'Annulées'
                }</Text>
              </Pressable>
            ))}
          </View>
        }
      >
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <FlatList
            data={missions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MissionRow
                  mission={item}
                  paying={paying}
                  onPay={(mission, method) => handleMissionPayment(mission, method)}
                  stripeAvailable={Boolean(remoteConfig?.stripe?.publishableKey)}
                  onFollow={() =>
                    navigation.navigate('MissionDetail', {
                      missionId: item.id,
                      role: 'client',
                      title: item.title,
                    })
                  }
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SectionCard>
    </View>
  );
}

function MissionRow({
  mission,
  paying,
  onPay,
  stripeAvailable,
  onFollow,
}: {
  mission: MissionSummary;
  paying: { id: string; method: 'apple' | 'google' | '' };
  onPay: (mission: MissionSummary, method: 'apple' | 'google') => void;
  stripeAvailable: boolean;
  onFollow: () => void;
}) {
  const canAuthorize =
    stripeAvailable &&
    mission.status !== 'completed' &&
    mission.status !== 'cancelled' &&
    (mission.paymentStatus === 'pending' || mission.paymentStatus === 'authorized' || !mission.paymentStatus);

  return (
    <View>
      <Text style={styles.missionTitle}>{mission.title}</Text>
      <Text style={styles.meta}>{mission.location?.label ?? 'Lieu à confirmer'}</Text>
      <View style={styles.chips}>
        <StatusPill label={mission.status} />
        {mission.progressStatus ? <StatusPill label={mission.progressStatus} variant="ghost" /> : null}
      </View>
      <Text style={styles.meta}>Budget: {formatCurrency(mission.budgetCents ?? 0, mission.currency)}</Text>
      {canAuthorize && (
        <View style={styles.payRow}>
          {Platform.OS === 'ios' && (
            <Pressable
              style={[styles.payButton, paying.id === mission.id && paying.method === 'apple' && styles.payButtonDisabled]}
              onPress={() => onPay(mission, 'apple')}
              disabled={paying.method === 'apple'}
            >
              <Text style={styles.payButtonText}>Apple Pay</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.payButton, paying.id === mission.id && paying.method === 'google' && styles.payButtonDisabled]}
            onPress={() => onPay(mission, 'google')}
            disabled={paying.method === 'google'}
          >
            <Text style={styles.payButtonText}>Google Pay</Text>
          </Pressable>
        </View>
      )}
      <Pressable style={styles.followButton} onPress={onFollow}>
        <Text style={styles.followButtonText}>Suivre & chat</Text>
      </Pressable>
    </View>
  );
}

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format((amount ?? 0) / 100);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: palette.primary,
    borderColor: 'transparent',
  },
  pillText: {
    color: palette.muted,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#ff9ea8',
  },
  separator: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 12,
  },
  missionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: palette.muted,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  payRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  payButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  payButtonText: {
    color: palette.text,
    fontWeight: '600',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  followButton: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
