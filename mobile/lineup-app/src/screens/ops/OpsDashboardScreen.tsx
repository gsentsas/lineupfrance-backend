import { StyleSheet, View } from 'react-native';
import SectionCard from '../../components/SectionCard';
import PushStatusBanner from '../../components/PushStatusBanner';
import { palette } from '../../theme';
import LiveStatsPanel from './components/LiveStatsPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import OpsRestricted from './components/OpsRestricted';
import { useAuth } from '../../context/AuthProvider';

export default function OpsDashboardScreen() {
  const { pushStatus } = useAuth();
  return (
    <OpsRestricted>
      <View style={styles.container}>
        <SectionCard title="Ops Dashboard" subtitle="Monitoring missions, paiements, alertes en direct">
          <PushStatusBanner state={pushStatus} role="ops" />
          <LiveStatsPanel />
          <QuickActionsPanel />
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
    gap: 16,
  },
});
