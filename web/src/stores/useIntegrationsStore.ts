import { create } from 'zustand';

interface IntegrationsState {
    available: any[];
    configs: Record<string, any>;
    isLoading: boolean;
    error: string | null;
    setData: (data: { available: any[], configs: Record<string, any> }) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
    available: [],
    configs: {},
    isLoading: false,
    error: null,
    setData: (data) => set({ available: data.available, configs: data.configs }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
