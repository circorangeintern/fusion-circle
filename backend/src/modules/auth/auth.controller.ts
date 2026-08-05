import { Request, Response } from "express";

import {
    getUser,
    comparePassword,
    checkActivatedStatus,
    LogoutService,
    saveOtpToDb,
} from "./auth.service";
import { createSession } from "../../shared/sessionHandler";
import { generatePassword, generateResetToken, generateOtp } from "../../utils/passwordGenerator";
import { hashPassword } from "../../utils/passwordHandler";
import { sendEmail } from "../email/email.service";
import { resetPasswordTemplate } from "../email/templates/passwordreset";
import { activationOtpTemplate } from "../email/templates/activationOtp";
import jwt from "jsonwebtoken";
import {
    getObjectById,
    updateObject,
    findAndDeleteById,
    findUniqueObject,
    findAndDeleteObject,
} from "../../shared/prisma/repoLayer";
import { prisma } from "../../shared/prisma/prisma";
import { logAudit } from "../../utils/auditLogger";

export const loginController = async (req: Request, res: Response) => {
    const user = await getUser(req.body.email, res);
    if (!user) {
        return;
    }
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
            console.time("save otp to db")
            await saveOtpToDb(jtiHash, user.id);
            console.timeEnd("save otp to db")
            const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
            console.time("send email")
            // try {
            void sendEmail(user.email, "Reset your password", resetPasswordTemplate(user.firstName, resetUrl)).catch((err) => {
                req.log.error({ err, userId: user.id }, "Failed to send password reset email");
            });
            console.timeEnd("send email")

            //     } catch (emailError) {
            //         console.error("Failed to send reset email:", emailError);
            //         // don't let email failure change the response
            //     }
        }

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "If an account with that email exists, a password reset link has been sent.",
            error: null,
        });
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "forgotPasswordController failed");
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
        req.log.error({ err: error, userId: req.user?.id }, "resetPasswordController failed");
        return res.status(401).json({
            success: false,
            code: "INVALID_TOKEN",
            message: "Invalid or expired password reset token.",
            error: null
        });

    }

}

export const activateUserController = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: req.body.email },
            include: {
                student: true,
                teacher: true,
            },
        });

        if (!user) {
            req.log.error(
                { email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName },
                "activateUserController user not found"
            );
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "User details could not be found.",
                error: null,
            });
        }
if(user.role !== "STUDENT" && user.role !== "TEACHER") {
            req.log.error(
                { email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName, role: user.role },
                "activateUserController invalid role"
            );
return res.status(403).json({
                success: false,
                code: "FORBIDEEN",
                message: "User can't perform this action. Invalid role.",
                error: null,
            });
        }
        const nameMatch = user.firstName.toLowerCase() === req.body.firstName.toLowerCase()
            && user.lastName.toLowerCase() === req.body.lastName.toLowerCase();

        const student = user.student;
        const teacher = user.teacher;

        const studentMatch = student && nameMatch &&
            (req.body.year ? student.year === req.body.year : true) &&
            (req.body.class ? student.class === req.body.class : true) &&
            (req.body.department ? student.department === req.body.department : true);

        const teacherMatch = teacher && nameMatch &&
            !req.body.year &&
            (req.body.class ? teacher.studentClass === req.body.class : true) &&
            (req.body.department ? teacher.department === req.body.department : true);

        if (!studentMatch && !teacherMatch) {
            req.log.error(
                {
                    userId: user.id,
                    email: req.body.email,
                    studentProfile: student,
                    teacherProfile: teacher,
                    provided: {
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        year: req.body.year,
                        class: req.body.class,
                        department: req.body.department,
                    },
                },
                "activateUserController profile details mismatch"
            );

            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "User details do not match any student or teacher account.",
                error: null,
            });
        }

        const otp = generateOtp(6);

        void sendEmail(
            user.email,
            "Account Activation OTP",
            activationOtpTemplate(user.firstName, otp)
        ).catch((err) => {
            req.log.error({ err, userId: user.id }, "Failed to send activation OTP email");
        });

        return res.status(200).json({
            success: true,
            code: "OK",
            message: "Email found and OTP has been sent to the user email.",
            error: null,
        });
    } catch (error) {
        req.log.error({ err: error, email: req.body.email }, "activateUserController failed");
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            error: null,
        });
    }
}
