import { prisma } from "../../shared/prisma/prisma";
import { Role, AccountStatus, User, Prisma } from "@prisma/client";
import { getUserByEmail, createObject, deactivateAccountById, getObjectsByField } from "../../shared/prisma/repoLayer";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import "express-session";
import { log } from "node:console";
import { UserArgs } from "@prisma/client/runtime/client";




export const getUser = async (email: string, res: Response) => {
    const user = await getUserByEmail(prisma.superAdmin, email);
    if (!user) {
        return res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "User not found",
            error: null
        })
    }

    return user
}

export const comparePassword = async (hashedPassword: string, userPassword: string, res: Response) => {
    const isCorrectPassword = await bcrypt.compare(userPassword, hashedPassword);
    if (!isCorrectPassword) {
        return res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "Invalid password",
            error: null
        })
    }
}


// controller
export const createAdmin = async (res: Response, dataObj: any, password: string) => {


    try {
        const data: Prisma.UserUncheckedCreateInput = {
            email: dataObj.email,
            passwordHash: dataObj.passwordHash,
            role: Role.ADMIN,
            status: AccountStatus.ACTIVATED,
            firstName: dataObj.firstName,
            lastName: dataObj.lastName,
            phoneNumber: dataObj.phoneNumber
        }

        const { passwordHash, ...rest } = data;
        const responseData = {
            ...rest,
            temporaryPassword: password
        }

        await createObject(prisma.user, data);

        return res.status(201).json({
            success: true,
            code: "CREATED",
            message: "Admin created successfully",
            data: responseData,
        })

    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Admin with email already exist",
                error: error
            });

        }
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create admin.",
            error: error
        });

    }
};


export const deactivateAdminService = async (id: number, res: Response) => {
    try {
        await deactivateAccountById(prisma.user, id);
        return res.status(204).send();

    } catch (error: any) {
        if (error.code === "P2025") {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "No matching record, nothing deleted",
                error: error
            });
        }
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to deactivate admin.",
            error: error
        });
    }

}



export const getAdminsService = async (res: Response) => {
    try {
        const admins: User[] = await getObjectsByField(prisma.user, "role", Role.ADMIN);
        const safeAdmins = admins.map(({ passwordHash, ...rest }) => rest);

        return res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Admins retrieved successfully",
            data: safeAdmins,
        });
    } catch (error) {
        console.error("getAdminsService error:", error);
        return res.status(500).json({
            status: "error",
            statusCode: 500,
            message: "Failed to retrieve admins",
            error: error
        });
    }
};


export const getAdminByIdService = async (id: number, res: Response) => {
    try {
        const admins: User[] = await getObjectsByField(prisma.user, "id", id);


        if (!admins[0]) {
            return res.status(404).json({
                success: false,
                code: "NOT_FOUND",
                message: "Admin not found",
                error: null
            });
        }

        const { passwordHash, ...safeAdmin } = admins[0];


        return res.status(200).json({
            status: "success",
            statusCode: 200,
            message: "Admin retrieved successfully",
            data: safeAdmin,
        });
    } catch (error) {
        console.error("getAdminByIdService error:", error);
        return res.status(500).json({
            status: "error",
            statusCode: 500,
            message: "Failed to retrieve admin",
            error: error
        });
    }
};


export const superAdminLogoutService = (
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