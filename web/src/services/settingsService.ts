import { apiClient } from "../lib/apiClient";

export const settingsService = {
    get: async (path: string) => {
        const res = await apiClient.get(path);
        return res.data;
    },
    save: async (path: string, data: any) => {
        return await apiClient.put(path, data);
    }
};
