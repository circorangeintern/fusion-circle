import { error, log } from "console";
import { logAudit } from "../../utils/auditLogger";
import { Request, Response, NextFunction } from "express";
import {
    getUser, comparePassword, createAdmin,
    deactivateAdminService, getAdminsService, getAdminByIdService,
    superAdminLogoutService
} from "./superAdmin.service"
import { createSession } from "../../shared/sessionHandler"
import { generatePassword } from "../../utils/passwordGenerator";
import { hashPassword } from "../../utils/passwordHandler";






export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    console.time("find user");
    const user = await getUser(req.body.email, res);
    console.timeEnd("find user");
    console.time("compare password")
    const isCorrectPassword = await comparePassword(user.password, req.body.password, res);
    if (!isCorrectPassword) { return }
    console.timeEnd("compare password")
    console.time("create session")
    await createSession(req, { id: user.id, role: user.role });
    console.timeEnd("create session")
    console.time("audit log")
    logAudit({
        userId: user.id,
        action: "SUPER_ADMIN_LOGIN",
        entityType: "SUPER_ADMIN",
        entityId: user.id,
        details: { email: user.email, role: user.role },
    });
    console.timeEnd("audit log")
    return res.status(200).json({
        success: true,
        code: "SUCCESS",
        message: "Login successful",
        data: {
            id: user.id,
            userName: user.firstName,
            role: user.role
        }
    })
}

export const CreateAdmin = async (req: Request, res: Response) => {

    const password = generatePassword();
    const passwordHash = await hashPassword(password);


    const data = req.body
    data.passwordHash = passwordHash;

    await createAdmin(req, res, data, password);
}



export const DeactivateAdmin = async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Admin ID is required.",
            error: null
        });
    }

    await deactivateAdminService(id, res);


}

export const getAllAdmins = async (req: Request, res: Response) => {
    await getAdminsService(res)
}

export const getAdminById = async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Admin ID is required.",
            error: null
        });
    }

    await getAdminByIdService(id, res)
}


export const logoutController = async (req: Request, res: Response) => {
    await superAdminLogoutService(req, res)
}