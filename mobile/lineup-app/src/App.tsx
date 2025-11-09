import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import LandingScreen from './screens/LandingScreen';
import RoleChoiceScreen from './screens/RoleChoiceScreen';
import AuthScreen from './screens/AuthScreen';
import ClientDashboardScreen from './screens/ClientDashboardScreen';
import ClientMissionsScreen from './screens/ClientMissionsScreen';
import WalletScreen from './screens/WalletScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import LinerDashboardScreen from './screens/LinerDashboardScreen';
import LinerMissionsScreen from './screens/LinerMissionsScreen';
import LinerTutorialScreen from './screens/LinerTutorialScreen';
import LinerKycScreen from './screens/LinerKycScreen';
import MissionDetailScreen from './screens/MissionDetailScreen';
import OpsDashboardScreen from './screens/ops/OpsDashboardScreen';
import OpsMissionsScreen from './screens/ops/OpsMissionsScreen';
import OpsNotificationsScreen from './screens/ops/OpsNotificationsScreen';
import OpsLiveMapScreen from './screens/ops/OpsLiveMapScreen';
import OpsAnnouncementsScreen from './screens/ops/OpsAnnouncementsScreen';
import navigationRef from './navigation/navigationRef';
import { navigationTheme } from './theme';
import type { RootStackParamList } from './types/navigation';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { ToastProvider } from './context/ToastProvider';
import { withOpsGuard } from './navigation/guards/withOpsGuard';

const Stack = createNativeStackNavigator<RootStackParamList>();
const OpsDashboardGuarded = withOpsGuard(OpsDashboardScreen);
const OpsMissionsGuarded = withOpsGuard(OpsMissionsScreen);
const OpsNotificationsGuarded = withOpsGuard(OpsNotificationsScreen);
const OpsLiveMapGuarded = withOpsGuard(OpsLiveMapScreen);
const OpsAnnouncementsGuarded = withOpsGuard(OpsAnnouncementsScreen);

function AppNavigator() {
  const { isOps } = useAuth();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, any>;
      const target = data?.route || data?.target;
      if (target === 'OpsNotifications' && isOps && navigationRef.isReady()) {
        navigationRef.navigate('OpsNotifications');
      }
    });

    Notifications.getLastNotificationResponseAsync().then(response => {
      const data = response?.notification.request.content.data as Record<string, any> | undefined;
      if (data?.route === 'OpsNotifications' && isOps && navigationRef.isReady()) {
        navigationRef.navigate('OpsNotifications');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isOps]);

  const linking = useMemo(
    () => ({
      prefixes: [
        Constants.expoConfig?.scheme ? `${Constants.expoConfig.scheme}://` : 'lineup://',
        'https://lineup.app',
      ],
      config: {
        screens: {
          OpsNotifications: 'ops/notifications',
          OpsDashboard: 'ops/dashboard',
        },
      },
    }),
    [],
  );

  return (
    <NavigationContainer theme={navigationTheme} linking={linking} ref={navigationRef}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="RoleChoice" component={RoleChoiceScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ClientHome" component={ClientDashboardScreen} />
        <Stack.Screen name="ClientMissions" component={ClientMissionsScreen} />
        <Stack.Screen name="MissionDetail" component={MissionDetailScreen} />
        <Stack.Screen name="ClientWallet">
          {() => <WalletScreen role="client" />}
        </Stack.Screen>
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="LinerHome" component={LinerDashboardScreen} />
        <Stack.Screen name="LinerMissions" component={LinerMissionsScreen} />
        <Stack.Screen name="LinerWallet">
          {() => <WalletScreen role="liner" />}
        </Stack.Screen>
        <Stack.Screen name="LinerTutorial" component={LinerTutorialScreen} />
        <Stack.Screen name="LinerKyc" component={LinerKycScreen} />
        <Stack.Screen name="OpsDashboard" component={OpsDashboardGuarded} />
        <Stack.Screen name="OpsMissions" component={OpsMissionsGuarded} />
        <Stack.Screen name="OpsNotifications" component={OpsNotificationsGuarded} />
        <Stack.Screen name="OpsLiveMap" component={OpsLiveMapGuarded} />
        <Stack.Screen name="OpsAnnouncements" component={OpsAnnouncementsGuarded} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function StripeProviderBridge({ children }: { children: ReactNode }) {
  const { remoteConfig } = useAuth();
  const publishableKey = remoteConfig?.stripe?.publishableKey ?? '';
  const merchantId = remoteConfig?.stripe?.applePayMerchantId ?? 'merchant.com.lineup';

  if (!publishableKey) {
    return null;
  }

  return (
    <StripeProvider publishableKey={publishableKey} merchantIdentifier={merchantId}>
      {children}
    </StripeProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <StripeProviderBridge>
            <AppNavigator />
          </StripeProviderBridge>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
