import { create } from 'zustand';
import type { Integration } from '../types';

interface IntegrationsState {
    userIntegrations: any;
    adminIntegrations: any;
    selectedIntegration: any | null;
    setSelectedIntegration: (integration: any | null) => void;
    isLoading: boolean;
    error: string | null;
    setUserIntegrations: (integrations: any) => void;
    setAdminIntegrations: (integrations: any) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set) => ({
    userIntegrations: { available: [], configs: {} },
    adminIntegrations: { available: [], configs: {} },
    selectedIntegration: null,
    setSelectedIntegration: (selectedIntegration) => set({ selectedIntegration }),
    isLoading: false,
    error: null,
    setUserIntegrations: (userIntegrations) => set({ userIntegrations }),
    setAdminIntegrations: (adminIntegrations) => set({ adminIntegrations }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
