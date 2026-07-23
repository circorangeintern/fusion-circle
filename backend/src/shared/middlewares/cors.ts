import { CorsOptions } from "cors";

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.CLIENT_URL,
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:5000",
            "http://127.0.0.1:5500",
            "http://localhost:5500",
        ].filter(Boolean) as string[];

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        const error = new Error("Origin not allowed") as Error & {
            status?: number;
        };

        error.status = 403;

        callback(error);
    },
    credentials: true,
};