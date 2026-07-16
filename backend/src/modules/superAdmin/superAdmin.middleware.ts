import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { success } from "zod/v4";

export const validate = (schema: ZodSchema) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const result = schema.safeParse(req.body);


        if (!result.success) {
            return res.status(400).json({
                success: false,
                code: "BAD_REQUEST",
                message: "Validation failed",
                errors: result.error.flatten()
            });
        }

        req.body = result.data;
        next();
    };
};
