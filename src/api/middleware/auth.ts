import jwt from "jsonwebtoken";

import { UserManager } from "@/data/users";
import { getJWTSecret } from "@/data/storage";

export const authenticate = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Unauthorized");

    try {
        const secret = await getJWTSecret();
        const decoded = jwt.verify(token, secret) as any;
        const session = UserManager.getSession(decoded.sessionId);

        if (!session || session.userId !== decoded.userId) {
            return res.status(401).send("Invalid session");
        }

        req.user = UserManager.getUserById(decoded.userId);
        req.sessionId = decoded.sessionId;
        next();
    } catch {
        res.status(401).send("Unauthorized");
    }
};

export const adminOnly = (req: any, res: any, next: any) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "root")) return next();
    res.status(403).send("Forbidden");
};
