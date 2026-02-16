import { apiClient } from "../lib/apiClient";

export interface UpdateEntry {
    version: string;
    changes: string[];
    name: string;
    type: "update" | "securitypatch" | "hotfix";
}

export interface UpdateStatus {
    currentVersion: string;
    currentBranch: string;
    channel: string;
    updates: UpdateEntry[];
}

export const updateService = {
    getStatus: async (): Promise<UpdateStatus> => {
        const response = await apiClient.get("/admin/update/status");
        return response.data;
    },

    check: async (): Promise<{ updates: UpdateEntry[] }> => {
        const response = await apiClient.post("/admin/update/check");
        return response.data;
    },

    performUpdate: async (): Promise<{ stdout: string; stderr: string }> => {
        const response = await apiClient.post("/admin/update/now");
        return response.data;
    },

    switchChannel: async (branch: string): Promise<{ success: boolean; branch: string }> => {
        const response = await apiClient.post("/admin/update/switch", { branch });
        return response.data;
    }
};
