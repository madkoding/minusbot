import type { UpdateEntry, UpdateStatus } from "@shared/types";
import { apiClient } from "../lib/apiClient";

export const updateService = {
    getStatusAsAdmin: async (): Promise<UpdateStatus> => {
        const response = await apiClient.get("/admin/update/status");
        return response.data;
    },

    checkAsAdmin: async (): Promise<{ updates: UpdateEntry[] }> => {
        const response = await apiClient.post("/admin/update/check");
        return response.data;
    },

    performUpdateAsAdmin: async (): Promise<{ stdout: string; stderr: string }> => {
        const response = await apiClient.post("/admin/update/now");
        return response.data;
    },

    switchChannelAsAdmin: async (branch: string): Promise<{ success: boolean; branch: string }> => {
        const response = await apiClient.post("/admin/update/switch", { branch });
        return response.data;
    }
};
