import { useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { useProvidersStore } from "../stores/useProvidersStore";
import type { AIProvider, AIClient } from "../stores/useProvidersStore";

export { type AIProvider, type AIClient };

export function useProviders() {
    const {
        providers,
        clients,
        isLoading,
        hasFetched,
        fetchProviders,
        saveProvider,
        deleteProvider,
        activateProvider
    } = useProvidersStore();

    useEffect(() => {
        if (!hasFetched) {
            fetchProviders();
        }
    }, [hasFetched, fetchProviders]);

    const listModels = async (id: string) => {
        const resp = await apiClient.get(`/user/providers/${id}/list-models`);
        return resp.data;
    };

    const listModelsByConfig = async (config: any) => {
        const resp = await apiClient.post(`/user/providers/list-models`, config);
        return resp.data;
    };

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
