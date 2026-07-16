import { User, Role } from "@prisma/client";
import "express-session";

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

declare module "express-session" {
    interface SessionData {
        userId?: string;
        role?: Role;
    }
}

