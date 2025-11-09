import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchRemoteSettings } from '../services/config';
import { useToast } from '../context/ToastProvider';

const REFETCH_INTERVAL = 5 * 60 * 1000;

export default function useFirebaseRemoteConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const previousConfigRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);
  const toast = useToast();

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      }
      setError('');
      try {
        const data = await fetchRemoteSettings();
        setConfig(data);

        const serialized = JSON.stringify(data?.firebase_frontend ?? {});
        if (previousConfigRef.current && previousConfigRef.current !== serialized) {
          toast.show('Configuration Firebase mise à jour, reconnexion…');
        }
        previousConfigRef.current = serialized;
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
        }
    } catch (_error) {
      setError('Impossible de charger la configuration Firebase distante.');
    } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    load(true);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        load();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    const interval = setInterval(() => {
      if (isMounted) {
        load();
      }
    }, REFETCH_INTERVAL);

    return () => {
      isMounted = false;
      sub.remove();
      clearInterval(interval);
    };
  }, [load]);

  return { config, loading, error, reload: load };
}
