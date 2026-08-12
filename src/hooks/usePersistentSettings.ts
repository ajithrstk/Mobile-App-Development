import { useCallback, useEffect, useState } from 'react';
import { defaultSettings, settingsService, type AppSettings } from '../services/settings/settingsService';

export function usePersistentSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    void settingsService.getSettings().then((storedSettings) => {
      if (mounted) {
        setSettings(storedSettings);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const nextSettings = await settingsService.updateSettings(patch);
    setSettings(nextSettings);
  }, []);

  return {
    loading,
    settings,
    updateSettings,
  };
}
