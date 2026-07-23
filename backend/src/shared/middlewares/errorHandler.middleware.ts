import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";

export const errorHandler = (
    err: Error & { status?: number },
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const status = err.status || 500;

    logger.error(
        { err, statusCode: status, method: req.method, url: req.originalUrl, userId: (req as any).user?.id ?? null },
        "Unhandled error caught by global error handler"
    );

    res.status(status).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? status === 500
                    ? "Internal Server Error"
                    : "Request not allowed"
                : err.message,
    });
};