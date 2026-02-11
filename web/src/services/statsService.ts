import { apiClient } from "../lib/apiClient";

export const statsService = {
    getUserStats: async () => {
        const res = await apiClient.get('/user/stats');
        return res.data;
    },
    getAdminStats: async () => {
        const res = await apiClient.get('/admin/stats');
        return res.data;
    }
};
