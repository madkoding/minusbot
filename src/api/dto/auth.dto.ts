import { z } from "zod";

export const LoginDTO = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export type LoginDTO = z.infer<typeof LoginDTO>;
