import { useCallback } from 'react';
import { settingsService } from '../services/settingsService';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useSettings(apiPath: string) {
    const {
        settings,
        isLoading,
        error,
        setSettings,
        setLoading,
        setError
    } = useSettingsStore();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingsService.get(apiPath);
            setSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [apiPath, setLoading, setSettings, setError]);

    const saveSettings = async (data: any) => {
        setLoading(true);
        try {
            await settingsService.save(apiPath, data);
            await fetchSettings();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        settings,
        isLoading,
        error,
        fetchSettings,
        saveSettings
    };
}
