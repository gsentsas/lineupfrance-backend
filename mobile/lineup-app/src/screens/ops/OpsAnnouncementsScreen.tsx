import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import SectionCard from '../../components/SectionCard';
import { palette } from '../../theme';
import { fetchOpsAnnouncements, publishOpsAnnouncement } from '../../services/ops';
import { useToast } from '../../context/ToastProvider';
import OpsRestricted from './components/OpsRestricted';

export default function OpsAnnouncementsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '' });
  const [posting, setPosting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOpsAnnouncements();
      setItems(data);
    } catch (_error) {
      toast.show('Impossible de charger les annonces Ops.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setPosting(true);
    try {
      await publishOpsAnnouncement(form);
      toast.show('Annonce publiée.');
      setForm({ title: '', body: '' });
      load();
    } catch (_error) {
      toast.show('Publication impossible.', { type: 'error' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <OpsRestricted>
      <View style={styles.container}>
        <SectionCard title="Annonces Ops" subtitle="Blog interne, flash info, notes d’exploitation">
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Titre"
              placeholderTextColor={palette.muted}
              value={form.title}
              onChangeText={value => setForm(current => ({ ...current, title: value }))}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Message"
              placeholderTextColor={palette.muted}
              multiline
              numberOfLines={4}
              value={form.body}
              onChangeText={value => setForm(current => ({ ...current, body: value }))}
            />
            <Pressable style={styles.submit} onPress={submit} disabled={posting}>
              <Text style={styles.submitText}>{posting ? 'Publication…' : 'Publier'}</Text>
            </Pressable>
          </View>
          <View style={styles.list}>
            {loading ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              items.map(item => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.meta}>{item.createdAt ? new Date(item.createdAt).toLocaleString('fr-FR') : ''}</Text>
                </View>
              ))
            )}
          </View>
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
  form: {
    gap: 8,
    marginBottom: 16,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    color: palette.text,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submit: {
    borderRadius: 16,
    backgroundColor: palette.primary,
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    backgroundColor: palette.card,
  },
  title: {
    color: palette.text,
    fontWeight: '600',
  },
  body: {
    color: palette.muted,
    marginVertical: 6,
  },
  meta: {
    color: palette.muted,
    fontSize: 12,
  },
});
