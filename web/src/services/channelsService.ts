import { apiClient } from "../lib/apiClient";

export const channelsService = {
    list: async (path: string) => {
        const res = await apiClient.get(path);
        return res.data.data;
    },
    getConfig: async (path: string, id: string, isAdmin: boolean) => {
        const res = await apiClient.get(isAdmin ? `${path}/${id}/vault` : `${path}/${id}`);
        return res.data.data;
    },
    save: async (path: string, id: string, data: any, isAdmin: boolean) => {
        if (isAdmin) {
            return await apiClient.put(`${path}/${id}/vault`, { secrets: data.secrets });
        } else {
            return await apiClient.put(`${path}/${id}`, data);
        }
    },
    delete: async (path: string, id: string) => {
        return await apiClient.delete(`${path}/${id}`);
    }
};
