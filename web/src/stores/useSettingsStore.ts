import { create } from 'zustand';
import type { Settings, SystemSettings } from '../types';

interface SettingsState {
    userSettings: Settings | null;
    adminSettings: Settings | null;
    systemSettings: SystemSettings | null;
    isLoading: boolean;
    error: string | null;
    setUserSettings: (settings: Settings) => void;
    setAdminSettings: (settings: Settings) => void;
    setSystemSettings: (settings: SystemSettings) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    userSettings: null,
    adminSettings: null,
    systemSettings: null,
    isLoading: false,
    error: null,
    setUserSettings: (userSettings) => set({ userSettings }),
    setAdminSettings: (adminSettings) => set({ adminSettings }),
    setSystemSettings: (systemSettings) => set({ systemSettings }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
