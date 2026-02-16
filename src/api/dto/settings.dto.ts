import { z } from "zod";

export const UserSettingsDTO = z.object({
    model_id: z.string().optional(),
    ai_endpoint: z.string().url().optional(),
    colors: z.boolean().optional(),
    disabled_tools: z.array(z.string()).optional(),
    disabled_skills: z.array(z.string()).optional(),
});

export const GlobalSettingsDTO = UserSettingsDTO;

export const SystemSettingsDTO = z.object({
    web_port: z.number().int().min(1024).max(65535),
    updater_channel: z.enum(["stable", "nightly", "development"]),
    updater_stable_url: z.string().url(),
    updater_nightly_url: z.string().url(),
});

export const ToggleToolDTO = z.object({
    name: z.string().min(1, "Tool name is required"),
});

export const ToggleSkillDTO = z.object({
    id: z.string().min(1, "Skill ID is required"),
});

export type UserSettingsDTO = z.infer<typeof UserSettingsDTO>;
export type GlobalSettingsDTO = z.infer<typeof GlobalSettingsDTO>;
export type SystemSettingsDTO = z.infer<typeof SystemSettingsDTO>;
export type ToggleToolDTO = z.infer<typeof ToggleToolDTO>;
export type ToggleSkillDTO = z.infer<typeof ToggleSkillDTO>;
