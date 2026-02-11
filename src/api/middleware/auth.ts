import jwt from "jsonwebtoken";
import { UserManager } from "../../users";

const JWT_SECRET = process.env.JWT_SECRET || "minusbot-super-secret-123";

export const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Unauthorized");

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
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
