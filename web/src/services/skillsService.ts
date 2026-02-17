import { apiClient } from "../lib/apiClient";
import type { Skill } from "../types";

export const skillsService = {
    list: async (): Promise<Skill[]> => {
        const res = await apiClient.get('/user/skills');
        return res.data;
    },

    listAsAdmin: async (): Promise<Skill[]> => {
        const res = await apiClient.get('/admin/skills');
        return res.data;
    },

    getDetail: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}`);
        return res.data;
    },

    getDetailAsAdmin: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/admin/skills/${id}`);
        return res.data;
    },

    getVault: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}/vault`);
        return res.data;
    },

    getVaultAsAdmin: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/admin/skills/${id}/vault`);
        return res.data;
    },

    save: async (data: any): Promise<any> => {
        const res = await apiClient.post('/user/skills', data);
        return res.data;
    },

    saveAsAdmin: async (data: any): Promise<any> => {
        const res = await apiClient.post('/admin/skills', data);
        return res.data;
    },

    // User Config
    getConfig: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}/config`);
        return res.data;
    },

    saveConfig: async (id: string, config: any): Promise<any> => {
        const res = await apiClient.put(`/user/skills/${id}/config`, config);
        return res.data;
    },

    // User Data (Files)
    listData: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}/data`);
        return res.data;
    },

    getFile: async (id: string, filename: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}/data/${filename}`);
        return res.data;
    },

    saveFile: async (id: string, filename: string, content: string): Promise<any> => {
        const res = await apiClient.put(`/user/skills/${id}/data/${filename}`, { content });
        return res.data;
    },

    // Scripts
    listScripts: async (id: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}/scripts`);
        return res.data;
    },

    getScript: async (id: string, filename: string): Promise<any> => {
        const res = await apiClient.get(`/user/skills/${id}/scripts/${filename}`);
        return res.data;
    },

    saveScript: async (id: string, filename: string, content: string): Promise<any> => {
        const res = await apiClient.put(`/user/skills/${id}/scripts/${filename}`, { content });
        return res.data;
    },

    toggleAsAdmin: async (id: string): Promise<any> => {
        const res = await apiClient.post(`/admin/skills/${id}/toggle`);
        return res.data;
    },

    toggle: async (id: string): Promise<any> => {
        const res = await apiClient.post('/user/settings/toggle-skill', { id });
        return res.data;
    },

    delete: async (id: string): Promise<any> => {
        const res = await apiClient.delete(`/user/skills/${id}`);
        return res.data;
    },

    deleteAsAdmin: async (id: string): Promise<any> => {
        const res = await apiClient.delete(`/admin/skills/${id}`);
        return res.data;
    },

    updateVault: async (id: string, key: string, value: string): Promise<any> => {
        const res = await apiClient.put(`/user/skills/${id}/vault`, { key, value });
        return res.data;
    },

    updateVaultAsAdmin: async (id: string, key: string, value: string): Promise<any> => {
        const res = await apiClient.put(`/admin/skills/${id}/vault`, { key, value });
        return res.data;
    }
};
