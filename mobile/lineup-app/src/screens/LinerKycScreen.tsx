import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme';
import { fetchKyc, submitKyc, toggleKycChecklist } from '../services/api';
import type { KycChecklistItem, KycPayload } from '../types';

export default function LinerKycScreen() {
  const [kyc, setKyc] = useState<KycPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchKyc();
      setKyc(data);
    } catch (_error) {
      setError('Impossible de récupérer la check-list KYC sans authentification liner.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (item: KycChecklistItem, value: boolean) => {
    setSaving(true);
    try {
      const data = await toggleKycChecklist(item.id, value);
      setKyc(data);
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const data = await submitKyc('review');
      setKyc(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SectionCard title="KYC" subtitle="Checklist identique à Flutter">
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : kyc ? (
          <View>
            <Text style={styles.meta}>Statut: {kyc.status}</Text>
            {kyc.checklist?.map(item => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                <Switch
                  thumbColor={item.completed ? palette.secondary : palette.border}
                  value={item.completed}
                  onValueChange={value => toggle(item, value)}
                  disabled={saving}
                />
              </View>
            ))}
            <Pressable style={styles.submit} onPress={submit} disabled={saving}>
              <Text style={styles.submitText}>Envoyer en revue</Text>
            </Pressable>
          </View>
        ) : null}
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
  meta: {
    color: palette.muted,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: palette.text,
    flex: 1,
    marginRight: 12,
  },
  submit: {
    backgroundColor: palette.secondary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#ff9ea8',
  },
});
