import { apiClient } from "../lib/apiClient";
import type { Secret } from "../types";

export const vaultService = {
    list: async (): Promise<Secret[]> => {
        const res = await apiClient.get('/user/vault');
        return res.data;
    },

    listAsAdmin: async (): Promise<Secret[]> => {
        const res = await apiClient.get('/admin/vault');
        return res.data;
    },

    getKeys: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/user/vault/${id}`);
        return res.data;
    },

    getKeysAsAdmin: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/admin/vault/${id}`);
        return res.data;
    },

    updateKey: async (id: string, key: string, value: string): Promise<any> => {
        return await apiClient.put(`/user/vault/${id}`, { key, value });
    },

    updateKeyAsAdmin: async (id: string, key: string, value: string): Promise<any> => {
        return await apiClient.put(`/admin/vault/${id}`, { key, value });
    },

    deleteKey: async (id: string, key: string): Promise<any> => {
        return await apiClient.delete(`/user/vault/${id}/${key}`);
    },

    deleteKeyAsAdmin: async (id: string, key: string): Promise<any> => {
        return await apiClient.delete(`/admin/vault/${id}/${key}`);
    }
};
