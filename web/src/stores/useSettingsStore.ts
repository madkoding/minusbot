import { create } from 'zustand';

interface SettingsState {
    settings: any | null;
    isLoading: boolean;
    error: string | null;
    setSettings: (settings: any) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: null,
    isLoading: false,
    error: null,
    setSettings: (settings) => set({ settings }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
