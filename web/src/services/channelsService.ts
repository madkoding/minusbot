import { apiClient } from "../lib/apiClient";
import type { Channel } from "../types";

export const channelsService = {
    list: async (): Promise<Channel[]> => {
        const res = await apiClient.get('/user/channels');
        return res.data.data;
    },

    listAsAdmin: async (): Promise<Channel[]> => {
        const res = await apiClient.get('/admin/channels');
        return res.data.data;
    },

    toggle: async (id: string): Promise<void> => {
        await apiClient.post(`/user/channels/${id}/toggle`);
    },

    toggleAsAdmin: async (id: string): Promise<void> => {
        await apiClient.post(`/admin/channels/${id}/toggle`);
    },

    save: async (id: string, data: Partial<Channel>): Promise<void> => {
        await apiClient.put(`/user/channels/${id}`, data);
    },

    saveAsAdmin: async (id: string, data: Partial<Channel>): Promise<void> => {
        await apiClient.put(`/admin/channels/${id}`, data);
    }
};
