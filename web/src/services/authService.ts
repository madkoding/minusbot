import { apiClient } from "../lib/apiClient";

export const authService = {
    login: async (credentials: any): Promise<any> => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },
};
