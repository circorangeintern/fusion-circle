import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
    redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers['set-cookie']",
        "req.body.password",
        "req.body.confirmPassword",
        "req.body.token",
    ],
    level: isProduction ? "info" : "debug",
    base: {
        service: "resulttrack-api",
        env: process.env.NODE_ENV ?? "development",
        version: process.env.npm_package_version ?? "1.0.0",
    },
    transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        },
});