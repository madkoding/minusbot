import { z } from "zod";

export const UpdateVaultKeyDTO = z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string(),
});

export type UpdateVaultKeyDTO = z.infer<typeof UpdateVaultKeyDTO>;
