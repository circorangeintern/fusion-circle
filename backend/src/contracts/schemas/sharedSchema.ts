import { z } from "zod";
import { registry } from "../registry";


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

// Notification schema (shared across Student/Teacher endpoints)
export const NotificationSchema = z.object({
    id: z.number(),
    userId: z.number(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    isRead: z.boolean(),
    readAt: z.string().nullable().optional(),
    entityType: z.string().nullable().optional(),
    entityId: z.number().nullable().optional(),
    createdAt: z.string(),
});

export const GetNotificationsResponseSchema = z.object({
    success: z.literal(true),
    code: z.literal("OK"),
    message: z.string(),
    data: z.object({
        notifications: z.array(NotificationSchema),
        count: z.number(),
        total: z.number(),
        unreadCount: z.number(),
        markedAsRead: z.number(),
    }),
});

// Register shared notification schemas
registry.register("Notification", NotificationSchema);
registry.register("GetNotificationsResponse", GetNotificationsResponseSchema);