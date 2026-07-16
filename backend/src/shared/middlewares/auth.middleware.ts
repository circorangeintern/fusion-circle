import { Request, Response, NextFunction } from "express"
import { Permission, RolePermissions } from "../permission"
import { rateLimit } from "express-rate-limit"
import { getObjectById } from "../prisma/repoLayer"
import { prisma } from "../prisma/prisma";
import { AccountStatus } from "@prisma/client";
import { log } from "node:console";


export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.session.userId || !req.session.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const account =
            req.session.role === "SUPER_ADMIN"
                ? await getObjectById(prisma.superAdmin, req.session.userId)
                : await getObjectById(prisma.user, req.session.userId);

        if (!account) {
            req.session.destroy(() => { });
            return res.status(401).json({ message: "Unauthorized" });
        }


        if (account.status === AccountStatus.DEACTIVATED) {
            req.session.destroy(() => { });
            return res.status(403).json({ message: "Account is deactivated by super admin" });
        }

        req.user = account;

        next();
    } catch (error) {
        next(error);
    }
};



export function authorize(requiredPermission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userPermissions = RolePermissions[req.user.role];

        if (!userPermissions.includes(requiredPermission)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
}
