import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import SectionCard from '../../components/SectionCard';
import { palette } from '../../theme';
import { fetchOpsActiveLiners } from '../../services/ops';
import OpsRestricted from './components/OpsRestricted';

export default function OpsLiveMapScreen() {
  const [liners, setLiners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOpsActiveLiners();
      setLiners(data);
    } catch (_error) {
      setError('Impossible de récupérer la carte des liners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <OpsRestricted>
      <View style={styles.container}>
        <SectionCard
          title="Liners actifs"
          subtitle="Vue carte – utilisez l’Ops console web pour la carte interactive"
          actions={<Text onPress={load}>Rafraîchir</Text>}
        >
          {loading ? (
            <ActivityIndicator color={palette.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.list}>
              {liners.map(liner => (
                <View key={liner.id} style={styles.item}>
                  <Text style={styles.name}>{liner.name}</Text>
                  <Text style={styles.meta}>
                    {liner.status} • {liner.location?.label ?? 'Position inconnue'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      </View>
    </OpsRestricted>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  list: {
    gap: 12,
  },
  item: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
  },
  name: {
    color: palette.text,
    fontWeight: '600',
  },
  meta: {
    color: palette.muted,
  },
  error: {
    color: '#ff9ea8',
  },
});
