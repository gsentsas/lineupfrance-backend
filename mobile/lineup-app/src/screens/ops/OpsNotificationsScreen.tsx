import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import SectionCard from '../../components/SectionCard';
import PushStatusBanner from '../../components/PushStatusBanner';
import { palette } from '../../theme';
import { fetchOpsNotifications } from '../../services/ops';
import OpsRestricted from './components/OpsRestricted';
import { useAuth } from '../../context/AuthProvider';

export default function OpsNotificationsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { pushStatus } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchOpsNotifications();
      setItems(data);
    } catch (_error) {
      setError('Impossible de charger les notifications Ops.');
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
        <SectionCard title="Notifications Ops" subtitle="Diffusions, alertes PSP et incidents" actions={<Text onPress={load}>Actualiser</Text>}>
          <PushStatusBanner state={pushStatus} role="ops" />
          {loading ? (
            <ActivityIndicator color={palette.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.meta}>{item.createdAt ? new Date(item.createdAt).toLocaleString('fr-FR') : ''}</Text>
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
  error: {
    color: '#ff9ea8',
  },
  item: {
    paddingVertical: 8,
  },
  title: {
    color: palette.text,
    fontWeight: '600',
  },
  message: {
    color: palette.muted,
  },
  meta: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 8,
  },
});
