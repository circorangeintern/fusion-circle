import { Request } from "express";
import { Role } from "@prisma/client";

type SessionUser = {
    id: string;
    role: Role;
};



export const createSession = (
    req: Request,
    user: SessionUser
): Promise<void> => {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) {
                return reject(err);
            }

            req.session.userId = user.id;
            req.session.role = user.role;

            req.session.save((err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    });
};


