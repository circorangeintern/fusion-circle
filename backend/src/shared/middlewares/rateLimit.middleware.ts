import rateLimit from "express-rate-limit";

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // 100 requests per IP per window
    standardHeaders: true,    // adds RateLimit-* headers
    legacyHeaders: false,     // disables deprecated X-RateLimit-* headers
    message: { message: "Too many requests, please try again later" },
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // only 5 attempts per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts, try again later" },
    skipSuccessfulRequests: false, //  count all attempts against the limit
});

