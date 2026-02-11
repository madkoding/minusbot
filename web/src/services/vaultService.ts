import { apiClient } from "../lib/apiClient";

export const vaultService = {
    list: async (path: string) => {
        const res = await apiClient.get(path);
        return res.data;
    },
    getKeys: async (path: string, id: string) => {
        const res = await apiClient.get(`${path}/${id}`);
        return res.data;
    },
    updateKey: async (path: string, id: string, key: string, value: string) => {
        return await apiClient.put(`${path}/${id}`, { key, value });
    },
    deleteKey: async (path: string, id: string, key: string) => {
        return await apiClient.delete(`${path}/${id}/${key}`);
    }
};
