import { apiClient } from "../lib/apiClient";
import type { Stat } from "../types";

export const statsService = {
    get: async (): Promise<any> => {
        const res = await apiClient.get('/user/stats');
        return res.data;
    },

    getAsAdmin: async (): Promise<any> => {
        const res = await apiClient.get('/admin/stats');
        return res.data;
    }
};
