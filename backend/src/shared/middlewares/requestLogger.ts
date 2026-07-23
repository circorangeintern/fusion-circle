import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";


export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        const logPayload = {
            method,
            url: originalUrl,
            statusCode,
            responseTime: `${duration}ms`,
            ip,
            userId: (req as any).user?.id ?? null,
        };

        if (statusCode >= 500) {
            logger.error(logPayload, "HTTP request completed with server error");
        } else if (statusCode >= 400) {
            logger.warn(logPayload, "HTTP request completed with client error");
        } else {
            logger.info(logPayload, "HTTP request completed");
        }
    });

    next();
};
