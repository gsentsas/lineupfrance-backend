import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { triggerOpsQuickAction } from '../../../services/ops';
import { palette } from '../../../theme';
import { useToast } from '../../../context/ToastProvider';

const ACTIONS = [
  { key: 'mission', title: 'Mission test', endpoint: '/api/admin/quick-actions/test-mission' },
  { key: 'broadcast', title: 'Broadcast Ops', endpoint: '/api/admin/quick-actions/broadcast', payload: { title: 'Info Ops', message: 'Test mobile' } },
];

export default function QuickActionsPanel() {
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const run = async action => {
    if (busy) return;
    setBusy(action.key);
    try {
      await triggerOpsQuickAction(action.endpoint, action.payload);
      toast.show(`Action ${action.title} envoyée.`);
    } catch (_error) {
      toast.show("Impossible d'exécuter l'action.", { type: 'error' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      {ACTIONS.map(action => (
        <Pressable key={action.key} style={styles.button} onPress={() => run(action)} disabled={busy === action.key}>
          {busy === action.key ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{action.title}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 140,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: palette.primary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
