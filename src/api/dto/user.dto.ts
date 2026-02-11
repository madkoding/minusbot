import { z } from "zod";

export const CreateUserDTO = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["admin", "user"]).default("user"),
});

export const UpdateUserDTO = z.object({
    id: z.string(),
    username: z.string().min(3).optional(),
    password: z.string().min(8).optional(),
    role: z.enum(["admin", "user"]).optional(),
});

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;
export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;
