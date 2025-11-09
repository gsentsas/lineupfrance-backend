import { useCallback, useEffect, useState } from 'react';
import { fetchRemoteSettings } from '../services/config';

export default function useRemoteFirebaseConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRemoteSettings();
      setConfig(data);
    } catch (_error) {
      setError('Impossible de charger la configuration Firebase distante.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { config, loading, error, reload: load };
}
