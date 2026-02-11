import { apiClient } from "../lib/apiClient";

export const userService = {
    list: async () => {
        const res = await apiClient.get('/admin/users');
        return res.data;
    },
    create: async (data: any) => {
        return await apiClient.post('/admin/users', data);
    },
    delete: async (id: string) => {
        return await apiClient.delete(`/admin/users/${id}`);
    }
};
