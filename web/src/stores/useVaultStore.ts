import { create } from 'zustand';

interface VaultState {
    vaults: string[];
    selectedVault: string | null;
    keys: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;
    setVaults: (vaults: string[]) => void;
    setSelectedVault: (vault: string | null) => void;
    setKeys: (keys: Record<string, boolean>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
    vaults: [],
    selectedVault: null,
    keys: {},
    isLoading: false,
    error: null,
    setVaults: (vaults) => set({ vaults }),
    setSelectedVault: (selectedVault) => set({ selectedVault }),
    setKeys: (keys) => set({ keys }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
