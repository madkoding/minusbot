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
    // User Config
    getConfig: async (path: string, id: string) => {
        const res = await apiClient.get(`${path}/${id}/config`);
        return res.data;
    },
    saveConfig: async (path: string, id: string, config: any) => {
        const res = await apiClient.put(`${path}/${id}/config`, config);
        return res.data;
    },
    // User Data (Files)
    listData: async (path: string, id: string) => {
        const res = await apiClient.get(`${path}/${id}/data`);
        return res.data;
    },
    getFile: async (path: string, id: string, filename: string) => {
        const res = await apiClient.get(`${path}/${id}/data/${filename}`);
        return res.data;
    },
    saveFile: async (path: string, id: string, filename: string, content: string) => {
        const res = await apiClient.put(`${path}/${id}/data/${filename}`, { content });
        return res.data;
    },
    // Scripts
    listScripts: async (path: string, id: string) => {
        const res = await apiClient.get(`${path}/${id}/scripts`);
        return res.data;
    },
    getScript: async (path: string, id: string, filename: string) => {
        const res = await apiClient.get(`${path}/${id}/scripts/${filename}`);
        return res.data;
    },
    saveScript: async (path: string, id: string, filename: string, content: string) => {
        const res = await apiClient.put(`${path}/${id}/scripts/${filename}`, { content });
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
