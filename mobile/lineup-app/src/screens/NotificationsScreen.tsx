import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import SectionCard from '../components/SectionCard';
import PushStatusBanner from '../components/PushStatusBanner';
import { palette } from '../theme';
import { fetchNotifications, markNotification } from '../services/api';
import type { NotificationItem } from '../types';
import { useAuth } from '../context/AuthProvider';

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { apiToken } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchNotifications();
      setItems(normalizeNotifications(data));
    } catch (_error) {
      setError('Authentifiez-vous pour récupérer les notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!apiToken) {
      return () => undefined;
    }

    pollTimer.current = setInterval(() => {
      load().catch(() => {});
    }, 15000);

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [apiToken, load]);

  const markAsRead = async (id: string) => {
    try {
      await markNotification(id);
      setItems(current => current.map(item => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)));
    } catch (_error) {
      setError('Impossible de mettre à jour la notification.');
    }
  };

  return (
    <View style={styles.container}>
      <PushStatusBanner />
      <SectionCard
        title="Notifications"
        subtitle="Flux identique à l’app Flutter"
        actions={
          <Pressable style={styles.refresh} onPress={load}>
            <Text style={styles.refreshText}>Rafraîchir</Text>
          </Pressable>
        }
      >
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <NotificationRow item={item} onRead={markAsRead} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SectionCard>
    </View>
  );
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: (id: string) => void }) {
  return (
    <View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>{item.createdAt ? new Date(item.createdAt).toLocaleString('fr-FR') : '—'}</Text>
        {!item.readAt && (
          <Pressable onPress={() => onRead(item.id)}>
            <Text style={styles.action}>Marquer lu</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  refresh: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshText: {
    color: palette.text,
  },
  error: {
    color: '#ff9ea8',
  },
  separator: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 12,
  },
  title: {
    color: palette.text,
    fontWeight: '600',
  },
  message: {
    color: palette.muted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  meta: {
    color: palette.muted,
  },
  action: {
    color: palette.secondary,
    fontWeight: '600',
  },
});

function normalizeNotifications(list: NotificationItem[] = []) {
  return [...list].sort((a, b) => {
    const dateA = new Date(a.createdAt ?? 0).getTime();
    const dateB = new Date(b.createdAt ?? 0).getTime();
    return dateB - dateA;
  });
}
