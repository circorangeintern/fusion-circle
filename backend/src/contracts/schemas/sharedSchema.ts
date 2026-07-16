import { z } from "zod";


export const ErrorResponseSchema = z.object({
    success: z.literal(false),
    code: z.string(),
    message: z.string(),
    error: z.any().nullable().optional(),
});

export const ValidationErrorSchema = z.object({
    success: z.literal(false),
    code: z.literal("BAD_REQUEST"),
    message: z.literal("Validation failed"),

    errors: z.any(),
});