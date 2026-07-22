import { Request, Response, NextFunction } from "express";

/**
 * Lightweight HTTP request logger middleware for stdout console streaming.
 * Ideal for Render real-time dashboard log tailing.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const statusIcon = statusCode >= 500 ? " " : statusCode >= 400 ? "⚠️" : "✅";

        console.log(
            `[HTTP] ${statusIcon} ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`
        );
    });

    next();
};
