import { prisma } from "../../shared/prisma/prisma";
import { Role, AccountStatus, User, Prisma } from "@prisma/client";
import { getUserByEmail, createObject, deactivateAccountById, getObjectsByField, upsertObject } from "../../shared/prisma/repoLayer";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import "express-session";
import { hashPassword } from "../../utils/passwordHandler";
import { log } from "node:console";
import { UserArgs } from "@prisma/client/runtime/client";
import { boolean } from "zod/v4";




export const getUser = async (email: string, res: Response) => {
    try {
        const user = await getUserByEmail(prisma.user, email);
        if (!user) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "User not found",
                error: null
            })
        }

        return user
    } catch (error) {
        return res.status(500).json({
            success: false,
            code: "INTERNAL SERVER ERROR",
            message: "internal server error",
            error: error
        })
    }

}

export const comparePassword = async (hashedPassword: string, userPassword: string, res: Response): Promise<boolean> => {
    const isCorrectPassword = await bcrypt.compare(userPassword, hashedPassword);
    if (!isCorrectPassword) {
        res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "Invalid password",
            error: null
        })
        return false
    }
    return true
}

export const checkActivatedStatus = (
    user: User,
    res: Response
): boolean => {
    if (user.status === AccountStatus.DEACTIVATED) {
        res.status(403).json({
            success: false,
            code: "FORBIDDEN",
            message: "Account has been deactivated. Please contact your school administrator.",
            error: null
        });
        return false;
    }

    if (user.status === AccountStatus.PENDING) {
        res.status(403).json({
            success: false,
            code: "FORBIDDEN",
            message: "Your account has not been activated yet. Please contact your school administrator.",
            error: null
        });
        return false;
    }

    return true;
}

export const LogoutService = (
    req: Request,
    res: Response
): void => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to logout.",
                error: err
            });
        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(204).send();
    });
};

export const saveOtpToDb = async (tokenHash: string, userId: number) => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await upsertObject(
        prisma.passwordResetToken,
        { userId },
        {
            userId,
            tokenHash,
            expiresAt,
             createdAt : new Date(Date.now()),
        },
        {
            tokenHash,
            expiresAt,
             createdAt :new Date(Date.now()),
        }
    );
}

