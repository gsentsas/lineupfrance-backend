import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import SectionCard from '../../components/SectionCard';
import { palette } from '../../theme';
import { fetchOpsMissions } from '../../services/ops';
import OpsRestricted from './components/OpsRestricted';

export default function OpsMissionsScreen() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOpsMissions();
      setRows(data);
    } catch (_error) {
      setError('Impossible de récupérer les missions Ops.');
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
        <SectionCard title="Missions Ops" subtitle="Vue d’ensemble des missions côté Ops" actions={<Text onPress={load}>Rafraîchir</Text>}>
          {loading ? (
            <ActivityIndicator color={palette.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={rows}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.meta}>
                      {item.client?.name ?? 'Client'} • {item.status}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{item.budgetLabel ?? ''}</Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: palette.text,
    fontWeight: '600',
  },
  meta: {
    color: palette.muted,
  },
  amount: {
    color: palette.text,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 12,
  },
  error: {
    color: '#ff9ea8',
  },
});
