import { create } from 'zustand';

import type { AIProvider, BaseAIClient } from '@shared/types';

interface ProvidersState {
    userProviders: AIProvider[];
    adminProviders: AIProvider[];
    clients: BaseAIClient[];
    isLoading: boolean;
    error: string | null;
    setUserProviders: (providers: AIProvider[]) => void;
    setAdminProviders: (providers: AIProvider[]) => void;
    setClients: (clients: BaseAIClient[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useProvidersStore = create<ProvidersState>((set) => ({
    userProviders: [],
    adminProviders: [],
    clients: [],
    isLoading: false,
    error: null,
    setUserProviders: (userProviders) => set({ userProviders }),
    setAdminProviders: (adminProviders) => set({ adminProviders }),
    setClients: (clients) => set({ clients }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
