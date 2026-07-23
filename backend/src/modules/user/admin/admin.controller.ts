import { Response, Request, NextFunction, response } from "express";
import { prisma } from "../../../shared/prisma/prisma";
import { logAudit } from "../../../utils/auditLogger";
import { createUniqueSchoolPin } from "../../../utils/passwordGenerator"
import { createSchoolService, updateSchoolService } from "./admin.services"
import { success } from "zod/v4";

export const createSchoolController = async (req: Request, res: Response, next: NextFunction) => {
    try {

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
                schoolName: school.name,
                caWeight: school.caWeight,
                examWeight: school.examWeight,
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



export const updateSchoolController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schoolPin = req.params.pin;

        if (!schoolPin) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "School PIN is required.",
                error: null,
            });
        }

        const result = await updateSchoolService(schoolPin, req.body);

        if (!result.success) {
            const { statusCode, ...response } = result;
            return res.status(statusCode).json(response);
        }

        try {
            await logAudit({
                userId: req.user?.id,
                action: "UPDATE_SCHOOL",
                entityType: "SCHOOL",
                entityId: result.data.id,
                details: req.body,
            });
        } catch (error) {
            req.log.error({ err: error, userId: req.user?.id }, "Failed to write audit log for updateSchoolController");
        }

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};