import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';

export interface AIProvider {
    id: string;
    name: string;
    type: "text" | "vision" | "image" | "tts" | "stt";
    client: string;
    config: any;
    is_global: boolean;
}

export interface AIClient {
    id: string;
    name: string;
    types: string[];
    options?: any[];
}

interface ProvidersState {
    providers: AIProvider[];
    clients: AIClient[];
    isLoading: boolean;
    hasFetched: boolean;
    fetchProviders: () => Promise<void>;
    saveProvider: (provider: any) => Promise<any>;
    deleteProvider: (id: string) => Promise<void>;
    activateProvider: (id: string | null, type: string, isGlobal?: boolean) => Promise<void>;
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
    providers: [],
    clients: [],
    isLoading: false,
    hasFetched: false,

    fetchProviders: async () => {
        if (get().isLoading) return;

        set({ isLoading: true });
        try {
            const [providersResp, clientsResp] = await Promise.all([
                apiClient.get("/user/providers"),
                apiClient.get("/user/providers/clients")
            ]);
            set({
                providers: providersResp.data,
                clients: clientsResp.data,
                isLoading: false,
                hasFetched: true
            });
        } catch (error) {
            console.error("Failed to fetch providers:", error);
            set({ isLoading: false });
        }
    },

    saveProvider: async (provider: any) => {
        const res = await apiClient.post("/user/providers", provider);
        await get().fetchProviders();
        return res.data;
    },

    deleteProvider: async (id: string) => {
        await apiClient.delete(`/user/providers/${id}`);
        await get().fetchProviders();
    },

    activateProvider: async (id: string | null, type: string, isGlobal?: boolean) => {
        await apiClient.post("/user/providers/activate", { id, type, is_global_setting: isGlobal });
        await get().fetchProviders();
    }
}));
