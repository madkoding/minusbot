import { create } from 'zustand';
import type { Secret } from '../types';

interface VaultState {
    userSecrets: Secret[];
    adminSecrets: Secret[];
    isLoading: boolean;
    error: string | null;
    setUserSecrets: (secrets: Secret[]) => void;
    setAdminSecrets: (secrets: Secret[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
    userSecrets: [],
    adminSecrets: [],
    isLoading: false,
    error: null,
    setUserSecrets: (userSecrets) => set({ userSecrets }),
    setAdminSecrets: (adminSecrets) => set({ adminSecrets }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
