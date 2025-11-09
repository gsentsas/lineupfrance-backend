import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushDevice } from '../services/api';
import { useToast } from '../context/ToastProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationState =
  | { status: 'idle' }
  | { status: 'registering' }
  | { status: 'success'; token: string }
  | { status: 'error'; error?: string };

export default function usePushRegistration(enabled: boolean): PushRegistrationState {
  const [state, setState] = useState<PushRegistrationState>({ status: 'idle' });
  const successShownRef = useRef(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      successShownRef.current = false;
      setState({ status: 'idle' });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: 'registering' });

    async function register() {
      if (!Device.isDevice) {
        setState({ status: 'error', error: 'Simulateur: notifications locales seulement.' });
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        setState({ status: 'error', error: 'Notifications non autorisées.' });
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      await registerPushDevice({
        token,
        platform: `${Platform.OS}-expo`,
      });

      if (cancelled) return;

      setState({ status: 'success', token });
      if (!successShownRef.current) {
        toast.show('Notifications push activées pour ce device.');
        successShownRef.current = true;
      }
    }

    register().catch(error => {
      if (cancelled) return;
      const message = error?.message ?? 'Enregistrement push impossible.';
      setState({ status: 'error', error: message });
      toast.show('Activation push impossible. Vérifiez les autorisations.', { type: 'error' });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, toast]);

  return state;
}
