import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme';
import { fetchClientWallet, fetchLinerWallet, fetchPayoutAccounts } from '../services/api';
import type { WalletSummary, WalletTransaction } from '../types';
import { createStripePaymentIntent, createStripeSetupIntent } from '../services/payments';
import { useAuth } from '../context/AuthProvider';

type WalletRole = 'client' | 'liner';

interface Props {
  role: WalletRole;
}

export default function WalletScreen({ role }: Props) {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payoutAccounts, setPayoutAccounts] = useState<any[]>([]);
  const [amount, setAmount] = useState('25');
  const [payBusy, setPayBusy] = useState<'apple' | 'google' | 'setup' | ''>('');
  const { remoteConfig } = useAuth();
  const stripe = useStripe();
  const isClient = role === 'client';
  const isLiner = role === 'liner';
  const stripeReady = Boolean(remoteConfig?.stripe?.publishableKey);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = role === 'liner' ? await fetchLinerWallet() : await fetchClientWallet();
      setSummary(data);
      if (role === 'liner') {
        const accounts = await fetchPayoutAccounts();
        setPayoutAccounts(accounts ?? []);
      }
    } catch (_error) {
      setError('Wallet indisponible sans authentification.');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureAmount = () => {
    const value = Math.round(parseFloat(amount.replace(',', '.')) * 100);
    if (!value || Number.isNaN(value) || value < 50) {
      Alert.alert('Montant invalide', 'Saisissez un montant supérieur ou égal à 0,50€.');
      return null;
    }
    return value;
  };

  const handleApplePay = async () => {
    const amountCents = ensureAmount();
    if (!amountCents) return;
    if (!(await stripe.isApplePaySupported())) {
      Alert.alert('Apple Pay indisponible', 'Activez Apple Pay sur cet appareil.');
      return;
    }
    setPayBusy('apple');
    try {
      const intent = await createStripePaymentIntent({
        amountCents,
        currency: 'EUR',
        description: 'Recharge wallet LineUp',
      });
      const present = await stripe.presentApplePay({
        cartItems: [{ label: 'Recharge LineUp', amount: (amountCents / 100).toFixed(2) }],
        country: 'FR',
        currency: 'EUR',
      });
      if (present.error) {
        Alert.alert('Apple Pay', present.error.message ?? 'Transaction annulée.');
        return;
      }
      const confirm = await stripe.confirmApplePayPayment(intent.clientSecret);
      if (confirm.error) {
        Alert.alert('Apple Pay', confirm.error.message ?? 'Erreur pendant la confirmation.');
        return;
      }
      Alert.alert('Paiement confirmé', 'Votre recharge sera visible sous peu.');
    } catch (_error) {
      Alert.alert('Apple Pay', 'Impossible de créer le paiement.');
    } finally {
      setPayBusy('');
    }
  };

  const handleGooglePay = async () => {
    const amountCents = ensureAmount();
    if (!amountCents) return;
    setPayBusy('google');
    try {
      const intent = await createStripePaymentIntent({
        amountCents,
        currency: 'EUR',
        description: 'Recharge wallet LineUp',
      });
      const init = await stripe.initGooglePay({
        testEnv: (remoteConfig?.stripe?.mode ?? 'test') !== 'live',
        merchantName: 'LineUp',
        merchantCountryCode: 'FR',
        billingAddressConfig: { format: 'FULL', isRequired: true },
        existingPaymentMethodRequired: false,
      });
      if (init.error) {
        Alert.alert('Google Pay', init.error.message ?? 'Google Pay indisponible.');
        setPayBusy('');
        return;
      }
      const present = await stripe.presentGooglePay({
        currencyCode: 'EUR',
        amount: (amountCents / 100).toFixed(2),
      });
      if (present.error) {
        Alert.alert('Google Pay', present.error.message ?? 'Transaction annulée.');
        setPayBusy('');
        return;
      }
      const confirm = await stripe.confirmGooglePayPayment(intent.clientSecret);
      if (confirm.error) {
        Alert.alert('Google Pay', confirm.error.message ?? 'Confirmation impossible.');
        setPayBusy('');
        return;
      }
      Alert.alert('Paiement confirmé', 'Votre recharge sera visible sous peu.');
    } catch (_error) {
      Alert.alert('Google Pay', 'Impossible de créer le paiement.');
    } finally {
      setPayBusy('');
    }
  };

  const handleSetupPayout = async () => {
    setPayBusy('setup');
    try {
      const intent = await createStripeSetupIntent();
      const init = await stripe.initPaymentSheet({
        merchantDisplayName: 'LineUp',
        setupIntentClientSecret: intent.clientSecret,
        style: 'automatic',
      });
      if (init.error) {
        Alert.alert('Stripe', init.error.message ?? 'Impossible de préparer la saisie.');
        setPayBusy('');
        return;
      }
      const present = await stripe.presentPaymentSheet();
      if (present.error) {
        Alert.alert('Stripe', present.error.message ?? 'Action annulée.');
        setPayBusy('');
        return;
      }
      Alert.alert('Compte enregistré', 'Votre moyen de versement est prêt pour les prochains payouts.');
    } catch (_error) {
      Alert.alert('Stripe', 'Impossible de créer le setup intent.');
    } finally {
      setPayBusy('');
    }
  };

  return (
    <View style={styles.container}>
      <SectionCard title={`Wallet ${role}`} subtitle="Données réelles depuis /api/client|liner/wallet">
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : summary ? (
          <View>
            <View style={styles.metrics}>
              <Metric label="Disponible" value={formatCurrency(summary.wallet.balance_cents ?? 0, summary.wallet.currency)} />
              <Metric label="En attente" value={formatCurrency(summary.wallet.pending_cents ?? 0, summary.wallet.currency)} />
            </View>
            <FlatList
              data={summary.transactions ?? []}
              keyExtractor={item => item.id}
              style={styles.list}
              renderItem={({ item }) => <TransactionRow tx={item} />}
            />
            {isClient && (
              <View style={styles.topUpCard}>
                <Text style={styles.topUpTitle}>Recharger mon wallet</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="25"
                  placeholderTextColor={palette.muted}
                />
                {stripeReady ? (
                  <View style={styles.payRow}>
                    {Platform.OS === 'ios' && (
                      <Pressable
                        style={[styles.payButton, payBusy === 'apple' && styles.payButtonDisabled]}
                        onPress={handleApplePay}
                        disabled={payBusy === 'apple'}
                      >
                        <Text style={styles.payButtonText}>Apple Pay</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.payButton, payBusy === 'google' && styles.payButtonDisabled]}
                      onPress={handleGooglePay}
                      disabled={payBusy === 'google'}
                    >
                      <Text style={styles.payButtonText}>Google Pay</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.helper}>Configurez Stripe dans l’admin pour activer Apple/Google Pay.</Text>
                )}
              </View>
            )}
            {isLiner && (
              <View style={styles.payoutCard}>
                <Text style={styles.topUpTitle}>Configurer mon compte de versement</Text>
                {stripeReady ? (
                  <Pressable
                    style={[styles.payButton, payBusy === 'setup' && styles.payButtonDisabled]}
                    onPress={handleSetupPayout}
                    disabled={payBusy === 'setup'}
                  >
                    <Text style={styles.payButtonText}>Enregistrer via Stripe</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.helper}>Activez Stripe dans le back-office pour ajouter un compte.</Text>
                )}
                {payoutAccounts.length ? (
                  <View>
                    {payoutAccounts.map(account => (
                      <View key={account.id} style={styles.payoutItem}>
                        <Text style={styles.payoutLabel}>{account.label ?? 'Compte Stripe'}</Text>
                        <Text style={styles.helper}>{account.status ?? 'pending'}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.helper}>Aucun compte de versement enregistré.</Text>
                )}
              </View>
            )}
          </View>
        ) : null}
      </SectionCard>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  return (
    <View style={styles.txRow}>
      <View>
        <Text style={styles.txTitle}>{tx.description ?? 'Transaction'}</Text>
        <Text style={styles.txMeta}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString('fr-FR') : '—'}</Text>
      </View>
      <Text style={[styles.amount, tx.type === 'credit' ? styles.credit : styles.debit]}>
        {tx.type === 'credit' ? '+' : '-'}
        {formatCurrency(tx.amountCents, tx.currency)}
      </Text>
    </View>
  );
}

function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount / 100);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  error: {
    color: '#ff9ea8',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricLabel: {
    color: palette.muted,
  },
  metricValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '600',
  },
  list: {
    maxHeight: 320,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingVertical: 10,
  },
  txTitle: {
    color: palette.text,
    fontWeight: '600',
  },
  txMeta: {
    color: palette.muted,
  },
  amount: {
    fontWeight: '700',
  },
  credit: {
    color: palette.secondary,
  },
  debit: {
    color: '#ff7ac3',
  },
  topUpCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 12,
  },
  topUpTitle: {
    color: palette.text,
    fontWeight: '600',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    color: palette.text,
  },
  payRow: {
    flexDirection: 'row',
    gap: 12,
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
  helper: {
    color: palette.muted,
  },
  payoutCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 12,
  },
  payoutItem: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 8,
    marginTop: 8,
  },
  payoutLabel: {
    color: palette.text,
    fontWeight: '600',
  },
});
