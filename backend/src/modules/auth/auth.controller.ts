import { error, log } from "console";
import { Request, Response, NextFunction } from "express";
import {
    getUser,
    comparePassword, checkActivatedStatus,
    //  createAdmin,
    //     deactivateAdminService, getAdminsService, getAdminByIdService,
    LogoutService, saveOtpToDb
} from "./auth.service"
import { createSession } from "../../shared/sessionHandler"
import { generatePassword, generateResetToken } from "../../utils/passwordGenerator";
import { hashPassword } from "../../utils/passwordHandler";
import { sendEmail } from "../email/email.service"
import { resetPasswordTemplate } from "../email/templates/passwordreset";
import jwt from "jsonwebtoken";
import { getObjectById, updateObject, findAndDeleteById, findUniqueObject, findAndDeleteObject } from "../../shared/prisma/repoLayer";
import { prisma } from "../../shared/prisma/prisma";
import { logAudit } from "../../utils/auditLogger";

export const loginController = async (req: Request, res: Response) => {
    const user = await getUser(req.body.email, res);
    const isCorrectPassword = await comparePassword(user.passwordHash, req.body.password, res);
    if (!isCorrectPassword) { return };
    const isActivated = checkActivatedStatus(user, res);
    if (!isActivated) { return }

    await createSession(req, { id: user.id, role: user.role });

    logAudit({
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "USER",
        entityId: user.id,
        details: { email: user.email, role: user.role },
    });

    return res.status(200).json({
        status: "success",
        statusCode: "OK",
        message: "Login successful",
        data: {
            id: user.id,
            userName: user.firstName,
            role: user.role
        }
    })

}

export const logoutController = async (req: Request, res: Response) => {
    await LogoutService(req, res)
}
export const forgotPasswordController = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { email: req.body.email } });

        if (user) {
            const { token, jti } = generateResetToken(user.id);
            const jtiHash = await hashPassword(jti);
            await saveOtpToDb(jtiHash, user.id);

            const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

            try {
                await sendEmail(user.email, "Reset your password", resetPasswordTemplate(user.firstName, resetUrl));
            } catch (emailError) {
                console.error("Failed to send reset email:", emailError);
                // don't let email failure change the response
            }
        }

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "If an account with that email exists, a password reset link has been sent.",
            error: null,
        });
    } catch (error) {
        console.error("forgotPasswordController error:", error);
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            error: null,
        });
    }
};
export const resetPasswordController = async (req: Request, res: Response) => {

    try {
        const payload = jwt.verify(
            req.body.token,
            process.env.JWT_RESET_SECRET!
        );


        if (
            !payload ||
            typeof payload === "string" ||
            typeof payload.sub !== "number" ||
            typeof payload.jti !== "string"
            //|| typeof payload.tokenHash !== "string"
        ) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Invalid or expired password reset token.",
                error: null
            });
        }

        const token = await findUniqueObject(prisma.passwordResetToken, {
            userId: Number(payload.sub),
        });
        if (!token) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Invalid or expired password reset token.",
                error: null
            });
        }

        const isJtiValid = await comparePassword(token.tokenHash, payload.jti, res);
        if (!isJtiValid) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Invalid or expired password reset token.",
                error: null
            });
        }

        const isExpired = token.expiresAt < new Date();
        if (isExpired) {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Invalid or expired password reset token.",
                error: null
            });
        }

        const hashedPassword = await hashPassword(req.body.password);

        await updateObject(prisma.user, { id: Number(payload.sub) }, { passwordHash: hashedPassword });
        await findAndDeleteObject(prisma.passwordResetToken, { userId: Number(payload.sub) });

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Password reset successful. You can now log in with new password.",
            error: null
        });

    } catch (error) {
        console.error("resetPasswordController error:", error);
        return res.status(401).json({
            success: false,
            code: "INVALID_TOKEN",
            message: "Invalid or expired password reset token.",
            error: null
        });

    }

}


