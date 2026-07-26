import { Response, Request, NextFunction, response } from "express";
import { prisma } from "../../../shared/prisma/prisma";
import { logAudit } from "../../../utils/auditLogger";
import { createUniqueSchoolPin } from "../../../utils/passwordGenerator"
import { createSchoolService, updateSchoolService, readSchoolService } from "./admin.services"
import { success } from "zod/v4";

export const createSchoolController = async (req: Request, res: Response, next: NextFunction) => {
    try {


        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.user?.schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "You already manage a school.",
                error: null,
            });
        }

        const pin = await createUniqueSchoolPin();


        const userId = req.user?.id;

        const school = await createSchoolService(req.body, { userId, pin })

        // Audit Log
        await logAudit({
            userId,
            action: "CREATE_SCHOOL",
            entityType: "SCHOOL",
            entityId: school.id,
            details: {
                name: school.name,
                pin: pin,
                email: school.email,
                address: school.address,
                city: school.city,
                state: school.state,
                country: school.country,
                schoolType: school.schoolType,
                description: school.description,
            },
        });

        return res.status(201).json({
            success: true,
            code: "CREATED",
            message: "School created successfully",
            data: school,
        });
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "createSchoolController failed");

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            error: null
        })
    }
};



export const readSchoolController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id
        const result = await readSchoolService(userId);

        if (!result.success) {
            const { statusCode, ...response } = result;
            return res.status(statusCode).json(response);
        }

        try {
            await logAudit({
                userId: req.user?.id,
                action: "READ_SCHOOL",
                entityType: "SCHOOL",
                entityId: result.data.id,
                details: result.data,
            });
        } catch (error) {
            req.log.error({ err: error, userId: req.user?.id }, "Failed to write audit log for readSchoolController");
        }
        return res.status(200).json(result);
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "readSchoolController failed");

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong. Please try again.",
            error: null
        })
    }
};

export const updateSchoolController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schoolId = Number(req.params.id);
        const userSchoolId = Number(req.user?.schoolId);


        if (!userSchoolId) {
            return res.status(403).json({
                success: false,
                code: "FORBIDDEN",
                message: "You do not manage a school.",
                error: null,
            });
        }

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "School ID is required.",
                error: null,
            });
        }

        if (schoolId !== userSchoolId) {
            return res.status(403).json({
                success: false,
                code: "NOT_AUTHORIZED",
                message: "You do not manage this school.",
                error: null,
            });
        }





        const result = await updateSchoolService(schoolId, req.body);

        if (!result.success) {
            const { statusCode, ...response } = result;
            return res.status(statusCode).json(response);
        }

        try {
            await logAudit({
                userId: req.user?.id,
                action: "UPDATE_SCHOOL",
                entityType: "SCHOOL",
                entityId: schoolId,
                details: result.data,
            });
        } catch (error) {
            req.log.error({ err: error, userId: req.user?.id }, "Failed to write audit log for updateSchoolController");
        }

        return res.status(200).json(result);
    } catch (error) {
        req.log.error({ err: error, userId: req.user?.id }, "updateSchoolController failed");
        next(error);
    }
};