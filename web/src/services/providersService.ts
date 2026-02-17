import type { AIProvider, BaseAIClient } from "@shared/types";

import { apiClient } from "../lib/apiClient";

export const providersService = {
    list: async (): Promise<AIProvider[]> => {
        const res = await apiClient.get('/user/providers');
        return res.data;
    },

    listAsAdmin: async (): Promise<AIProvider[]> => {
        const res = await apiClient.get('/admin/providers');
        return res.data;
    },

    listClients: async (): Promise<BaseAIClient[]> => {
        const res = await apiClient.get('/user/providers/clients');
        return res.data;
    },

    listClientsAsAdmin: async (): Promise<BaseAIClient[]> => {
        const res = await apiClient.get('/admin/providers/clients');
        return res.data;
    },

    save: async (provider: any): Promise<any> => {
        const res = await apiClient.post('/user/providers', provider);
        return res.data;
    },

    saveAsAdmin: async (provider: any): Promise<any> => {
        const res = await apiClient.post('/admin/providers', provider);
        return res.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/user/providers/${id}`);
    },

    deleteAsAdmin: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/providers/${id}`);
    },

    activate: async (id: string | null, type: string, isGlobal?: boolean): Promise<void> => {
        await apiClient.post("/user/providers/activate", { id, type, is_global_setting: isGlobal });
    },

    activateAsAdmin: async (id: string | null, type: string): Promise<void> => {
        await apiClient.post("/admin/providers/activate", { id, type });
    },

    listModels: async (id: string): Promise<string[]> => {
        const resp = await apiClient.get(`/user/providers/${id}/list-models`);
        return resp.data;
    },

    listModelsAsAdmin: async (id: string): Promise<string[]> => {
        const resp = await apiClient.get(`/admin/providers/${id}/list-models`);
        return resp.data;
    },

    listModelsByConfig: async (config: any): Promise<any[]> => {
        const resp = await apiClient.post(`/user/providers/list-models`, config);
        return resp.data;
    },

    listModelsByConfigAsAdmin: async (config: any): Promise<any[]> => {
        const resp = await apiClient.post(`/admin/providers/list-models`, config);
        return resp.data;
    }
};
