import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SectionCard from '../components/SectionCard';
import StatusPill from '../components/StatusPill';
import { palette } from '../theme';
import { fetchMissionChat, fetchMissionDetail, sendMissionChatMessage } from '../services/api';
import type { ChatMessage, MissionDetail } from '../types';
import type { RootStackParamList } from '../types/navigation';
import { useToast } from '../context/ToastProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'MissionDetail'>;

export default function MissionDetailScreen({ route }: Props) {
  const { missionId, role } = route.params;
  const [mission, setMission] = useState<MissionDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const toast = useToast();

  const load = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const [detail, chat] = await Promise.all([
          fetchMissionDetail(missionId),
          fetchMissionChat(missionId, role),
        ]);
        setMission(detail);
        setMessages(normalizeChat(chat));
      } catch (_error) {
        toast.show('Impossible de récupérer la mission en direct.', { type: 'error' });
      } finally {
        if (initial) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [missionId, role, toast],
  );

  useEffect(() => {
    load({ initial: true });
    const interval = setInterval(() => load(), 15000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const body = input.trim();
    if (!body) {
      return;
    }
    setSending(true);
    try {
      await sendMissionChatMessage(missionId, role, { body });
      setInput('');
      const chat = await fetchMissionChat(missionId, role);
      setMessages(normalizeChat(chat));
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (_error) {
      toast.show('Message non envoyé. Vérifiez votre connexion.', { type: 'error' });
    } finally {
      setSending(false);
    }
  }, [missionId, role, input, toast]);

  const timeline = useMemo(() => buildTimeline(mission), [mission]);

  if (loading && !mission) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.primary} />
        <Text style={styles.loadingText}>Préparation du suivi en direct…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ListHeaderComponent={
          <View style={styles.container}>
            <SectionCard
              title={mission?.title ?? 'Mission'}
              subtitle={mission?.location?.label ?? 'Lieu confidentiel'}
              actions={
                <StatusPill
                  label={mission?.status ?? 'pending'}
                  variant={mission?.status === 'completed' ? 'solid' : 'ghost'}
                />
              }
            >
              <Text style={styles.metaText}>
                {mission?.scheduledAt
                  ? `RDV ${new Date(mission.scheduledAt).toLocaleString('fr-FR')}`
                  : 'Date en attente'}
              </Text>
              <Text style={styles.metaText}>
                Durée estimée : {mission?.durationMinutes ? `${mission.durationMinutes} min` : '—'}
              </Text>
              <Text style={styles.metaText}>
                Budget : {formatCurrency(mission?.budgetCents ?? 0, mission?.currency ?? 'EUR')}
              </Text>
              {mission?.liner ? (
                <View style={styles.linerRow}>
                  <Text style={styles.metaText}>Liner :</Text>
                  <Text style={styles.badge}>{mission.liner.name ?? `#${mission.liner.id}`}</Text>
                </View>
              ) : (
                <Text style={styles.metaText}>Assignation en cours…</Text>
              )}
              {mission?.location?.latitude && mission?.location?.longitude ? (
                <Pressable
                  style={styles.mapButton}
                  onPress={() => openMaps(mission.location!.latitude!, mission.location!.longitude!, mission?.title)}
                >
                  <Text style={styles.mapButtonText}>Ouvrir la carte</Text>
                </Pressable>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Suivi en direct"
              subtitle="Synchronisé avec la timeline Flutter"
              actions={
                <Pressable style={styles.refreshButton} onPress={() => load()}>
                  {refreshing ? (
                    <ActivityIndicator size="small" color={palette.text} />
                  ) : (
                    <Text style={styles.refreshText}>Rafraîchir</Text>
                  )}
                </Pressable>
              }
            >
              {timeline.map(item => (
                <View key={item.label} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, item.done && styles.timelineDotActive]} />
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineLabel}>{item.label}</Text>
                    <Text style={styles.timelineDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </SectionCard>

            <SectionCard
              title="Chat mission"
              subtitle="Photos, QR et confirmations temps réel"
              actions={
                refreshing ? (
                  <ActivityIndicator size="small" color={palette.primary} />
                ) : (
                  <Pressable style={styles.refreshButton} onPress={() => load()}>
                    <Text style={styles.refreshText}>Actualiser</Text>
                  </Pressable>
                )
              }
            >
              <View style={styles.chatContainer}>
                {messages.length === 0 ? (
                  <Text style={styles.emptyChat}>Aucun message pour le moment.</Text>
                ) : (
                  <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <ChatBubble message={item} currentRole={role} />}
                    contentContainerStyle={styles.chatList}
                  />
                )}
                <View style={styles.composer}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Envoyer une instruction…"
                    placeholderTextColor={palette.muted}
                    multiline
                  />
                  <Pressable
                    style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!input.trim() || sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.sendButtonText}>Envoyer</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </SectionCard>
          </View>
        }
        data={[]}
        renderItem={null}
      />
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ message, currentRole }: { message: ChatMessage; currentRole: 'client' | 'liner' }) {
  const isMine = (message.role ?? '').toLowerCase() === currentRole.toLowerCase();
  return (
    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
      <Text style={styles.bubbleAuthor}>{message.user?.name ?? message.role ?? 'LineUp'}</Text>
      <Text style={styles.bubbleBody}>{message.body}</Text>
      <Text style={styles.bubbleMeta}>
        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('fr-FR') : '—'}
      </Text>
    </View>
  );
}

function buildTimeline(mission: MissionDetail | null) {
  if (!mission) return [];
  return [
    {
      label: 'Mission publiée',
      detail: mission.publishedAt
        ? new Date(mission.publishedAt).toLocaleString('fr-FR')
        : 'En attente',
      done: Boolean(mission.publishedAt),
    },
    {
      label: 'Liner assigné',
      detail: mission.liner?.name ?? 'Assignation en cours',
      done: Boolean(mission.liner),
    },
    {
      label: 'Progression',
      detail: mission.progressStatus ? humanizeStatus(mission.progressStatus) : mission.status,
      done: ['in_progress', 'completed'].includes((mission.progressStatus ?? mission.status).toLowerCase()),
    },
    {
      label: 'Preuve / QR',
      detail: mission.completedAt
        ? new Date(mission.completedAt).toLocaleString('fr-FR')
        : 'Attente de validation',
      done: Boolean(mission.completedAt),
    },
    {
      label: 'Avis client',
      detail: mission.clientRatedAt ? 'Envoyé' : 'À renseigner',
      done: Boolean(mission.clientRatedAt),
    },
  ];
}

function normalizeChat(list: ChatMessage[] = []) {
  return [...list].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aDate - bDate;
  });
}

function humanizeStatus(status?: string | null) {
  if (!status) return '—';
  switch (status.toLowerCase()) {
    case 'published':
      return 'Publiée';
    case 'accepted':
      return 'Acceptée';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminée';
    default:
      return status;
  }
}

function formatCurrency(amountCents: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format((amountCents ?? 0) / 100);
}

function openMaps(lat: number, lng: number, title?: string) {
  const fallback = `https://maps.google.com/?q=${lat},${lng}`;
  const apple = `http://maps.apple.com/?ll=${lat},${lng}${title ? `&q=${encodeURIComponent(title)}` : ''}`;
  const google = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(Platform.OS === 'ios' ? apple : google).catch(() => Linking.openURL(fallback));
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: 24,
    gap: 16,
  },
  loading: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: palette.muted,
    marginTop: 12,
  },
  metaText: {
    color: palette.muted,
  },
  badge: {
    color: palette.text,
    fontWeight: '600',
    marginLeft: 6,
  },
  linerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mapButton: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    color: palette.text,
    fontWeight: '600',
  },
  refreshButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.border,
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: palette.primary,
  },
  timelineBody: {
    flex: 1,
  },
  timelineLabel: {
    color: palette.text,
    fontWeight: '600',
  },
  timelineDetail: {
    color: palette.muted,
  },
  chatContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    minHeight: 280,
  },
  chatList: {
    gap: 10,
  },
  emptyChat: {
    textAlign: 'center',
    color: palette.muted,
    paddingVertical: 24,
  },
  composer: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 8,
  },
  input: {
    color: palette.text,
    minHeight: 40,
  },
  sendButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: palette.primary,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '90%',
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: palette.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: palette.border,
  },
  bubbleAuthor: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  bubbleBody: {
    color: '#fff',
  },
  bubbleMeta: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
});
