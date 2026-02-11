import { apiClient } from "../lib/apiClient";

export const skillsService = {
    list: async (path: string) => {
        const res = await apiClient.get(path);
        return res.data;
    },
    getDetail: async (path: string, id: string) => {
        const res = await apiClient.get(`${path}/${id}`);
        return res.data;
    },
    getVault: async (path: string, id: string) => {
        const res = await apiClient.get(`${path}/${id}/vault`);
        return res.data;
    },
    save: async (path: string, data: any) => {
        const res = await apiClient.post(path, data);
        return res.data;
    },
    toggleAdmin: async (id: string) => {
        const res = await apiClient.post(`/admin/skills/${id}/toggle`);
        return res.data;
    },
    toggleUserGlobal: async (id: string) => {
        const res = await apiClient.post('/user/settings/toggle-skill', { id });
        return res.data;
    },
    delete: async (path: string, id: string) => {
        const res = await apiClient.delete(`${path}/${id}`);
        return res.data;
    },
    updateVault: async (path: string, id: string, key: string, value: string) => {
        const res = await apiClient.put(`${path}/${id}/vault`, { key, value });
        return res.data;
    }
};
