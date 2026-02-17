import { apiClient } from "../lib/apiClient";
import type { Settings, SystemSettings } from "../types";

export const settingsService = {
    get: async (): Promise<Settings> => {
        const res = await apiClient.get('/user/settings');
        return res.data;
    },

    getAsAdmin: async (): Promise<Settings> => {
        const res = await apiClient.get('/admin/settings/global');
        return res.data;
    },

    getSystemAsAdmin: async (): Promise<SystemSettings> => {
        const res = await apiClient.get('/admin/settings/system');
        return res.data;
    },

    save: async (data: Partial<Settings>): Promise<void> => {
        await apiClient.put('/user/settings', data);
    },

    saveAsAdmin: async (data: Partial<Settings>): Promise<void> => {
        await apiClient.put('/admin/settings/global', data);
    },

    saveSystemAsAdmin: async (data: Partial<SystemSettings>): Promise<void> => {
        await apiClient.put('/admin/settings/system', data);
    }
};
