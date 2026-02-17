import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

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

export function useProviders() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [clients, setClients] = useState<AIClient[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const [providersResp, clientsResp] = await Promise.all([
                apiClient.get("/user/providers"),
                apiClient.get("/user/providers/clients")
            ]);
            setProviders(providersResp.data);
            setClients(clientsResp.data);
        } catch (error) {
            console.error("Failed to fetch providers:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveProvider = async (provider: any) => {
        await apiClient.post("/user/providers", provider);
        await fetchProviders();
    };

    const deleteProvider = async (id: string) => {
        await apiClient.delete(`/user/providers/${id}`);
        await fetchProviders();
    };

    const activateProvider = async (id: string | null, type: string, isGlobal?: boolean) => {
        await apiClient.post("/user/providers/activate", { id, type, is_global_setting: isGlobal });
        await fetchProviders();
    };

    const listModels = async (id: string) => {
        const resp = await apiClient.get(`/user/providers/${id}/list-models`);
        return resp.data;
    };

    const listModelsByConfig = async (config: any) => {
        const resp = await apiClient.post(`/user/providers/list-models`, config);
        return resp.data;
    };

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    return {
        providers,
        clients,
        isLoading,
        fetchProviders,
        saveProvider,
        deleteProvider,
        activateProvider,
        listModels,
        listModelsByConfig
    };
}
