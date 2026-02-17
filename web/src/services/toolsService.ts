import { apiClient } from "../lib/apiClient";
import type { Tool } from "../types";

export const toolsService = {
    listAllAsAdmin: async (): Promise<Tool[]> => {
        const res = await apiClient.get('/admin/tools');
        return res.data;
    },

    getDisabled: async (): Promise<string[]> => {
        const res = await apiClient.get('/user/settings');
        return res.data.disabled_tools || [];
    },

    getDisabledAsAdmin: async (): Promise<string[]> => {
        const res = await apiClient.get('/admin/settings/global');
        return res.data.disabled_tools || [];
    },

    toggle: async (name: string): Promise<void> => {
        await apiClient.post('/user/settings/toggle-tool', { name });
    },

    toggleAsAdmin: async (name: string): Promise<void> => {
        await apiClient.post('/admin/settings/toggle-global-tool', { name });
    }
};
