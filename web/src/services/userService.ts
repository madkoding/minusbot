import { apiClient } from "../lib/apiClient";
import type { User } from "../types";

export const userService = {
    getMe: async (): Promise<User> => {
        const res = await apiClient.get('/auth/me');
        return res.data;
    },

    listAsAdmin: async (): Promise<User[]> => {
        const res = await apiClient.get('/admin/users');
        return res.data;
    },

    createAsAdmin: async (data: any): Promise<any> => {
        return await apiClient.post('/admin/users', data);
    },

    deleteAsAdmin: async (id: string): Promise<any> => {
        return await apiClient.delete(`/admin/users/${id}`);
    }
};
