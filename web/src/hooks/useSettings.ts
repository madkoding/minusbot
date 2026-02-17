import { useCallback } from 'react';
import { settingsService } from '../services/settingsService';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useSettings() {
    const { userSettings, isLoading, error, setUserSettings, setLoading, setError } = useSettingsStore();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingsService.get();
            setUserSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setUserSettings, setError]);

    const saveSettings = async (data: any) => {
        setLoading(true);
        try {
            await settingsService.save(data);
            if (userSettings) {
                setUserSettings({ ...userSettings, ...data });
            }
            setError(null);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { settings: userSettings, isLoading, error, fetchSettings, saveSettings };
}

export function useSettingsAsAdmin() {
    const { adminSettings, isLoading, error, setAdminSettings, setLoading, setError } = useSettingsStore();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingsService.getAsAdmin();
            setAdminSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setAdminSettings, setError]);

    const saveSettings = async (data: any) => {
        setLoading(true);
        try {
            await settingsService.saveAsAdmin(data);
            if (adminSettings) {
                setAdminSettings({ ...adminSettings, ...data });
            }
            setError(null);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { settings: adminSettings, isLoading, error, fetchSettings, saveSettings };
}

export function useSystemSettingsAsAdmin() {
    const { systemSettings, isLoading, error, setSystemSettings, setLoading, setError } = useSettingsStore();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await settingsService.getSystemAsAdmin();
            setSystemSettings(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setSystemSettings, setError]);

    const saveSettings = async (data: any) => {
        setLoading(true);
        try {
            await settingsService.saveSystemAsAdmin(data);
            if (systemSettings) {
                setSystemSettings({ ...systemSettings, ...data });
            }
            setError(null);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { settings: systemSettings, isLoading, error, fetchSettings, saveSettings };
}
