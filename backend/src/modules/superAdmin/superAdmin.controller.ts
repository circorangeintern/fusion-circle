import { error, log } from "console";
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

    const user = await getUser(req.body.email, res);
    const isCorrectPassword = await comparePassword(user.password, req.body.password, res);
    if (!isCorrectPassword) { return }
    await createSession(req, { id: user.id, role: user.role });
    return res.status(200).json({
        status: "sucess",
        statusCode: 200,
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

    await createAdmin(res, data, password);
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