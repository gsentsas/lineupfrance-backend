import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fetchOpsOverview } from '../../../services/ops';
import { palette } from '../../../theme';

export default function LiveStatsPanel() {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOpsOverview();
      setOverview(data);
    } catch (_error) {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator color={palette.primary} />;
  }

  return (
    <View style={styles.row}>
      <StatCard label="Missions actives" value={overview?.stats?.missions_active ?? '--'} trend={`${overview?.stats?.missions_queueing ?? 0} en file`} />
      <StatCard
        label="Paiements"
        value={`€${(overview?.payments?.pending_payouts ?? 0).toFixed(1)}k`}
        trend="Autorisation en attente"
      />
      <StatCard
        label="Volume semaine"
        value={`€${(overview?.payments?.volume_week ?? 0).toFixed(1)}k`}
        trend="+ mission premium"
      />
    </View>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string | number; trend: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.trend}>{trend}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    minWidth: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    backgroundColor: palette.card,
  },
  label: { color: palette.muted },
  value: { color: palette.text, fontSize: 20, fontWeight: '700', marginVertical: 4 },
  trend: { color: palette.muted, fontSize: 12 },
});
