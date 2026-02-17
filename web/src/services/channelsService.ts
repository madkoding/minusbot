import { apiClient } from "../lib/apiClient";
import type { ChannelStatus, ChannelDetail } from "@shared/types";

export const channelsService = {
    list: async (): Promise<ChannelStatus[]> => {
        const res = await apiClient.get('/user/channels');
        return res.data.data;
    },

    listAsAdmin: async (): Promise<ChannelStatus[]> => {
        const res = await apiClient.get('/admin/channels');
        return res.data.data;
    },

    get: async (id: string): Promise<ChannelDetail> => {
        const res = await apiClient.get(`/user/channels/${id}`);
        return res.data.data;
    },

    toggle: async (id: string): Promise<void> => {
        await apiClient.post(`/user/channels/${id}/toggle`);
    },

    toggleAsAdmin: async (id: string): Promise<void> => {
        await apiClient.post(`/admin/channels/${id}/toggle`);
    },

    save: async (id: string, data: any): Promise<void> => {
        await apiClient.put(`/user/channels/${id}`, data);
    },

    saveAsAdmin: async (id: string, data: any): Promise<void> => {
        await apiClient.put(`/admin/channels/${id}`, data);
    },

    getVault: async (id: string): Promise<Record<string, string>> => {
        const res = await apiClient.get(`/admin/channels/${id}/vault`);
        return res.data.data;
    },

    saveVault: async (id: string, secrets: Record<string, string>): Promise<void> => {
        await apiClient.put(`/admin/channels/${id}/vault`, { secrets });
    }
};
