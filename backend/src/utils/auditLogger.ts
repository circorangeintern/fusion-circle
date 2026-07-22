import { prisma } from "../shared/prisma/prisma";

export interface AuditLogParams {
    userId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    details?: Record<string, any>;
}

/**
 * Log a high-value business action into PostgreSQL (AuditLog).
 * Safe, asynchronous, and non-blocking.
 */
export const logAudit = async (params: AuditLogParams): Promise<void> => {
    const { userId, action, entityType, entityId, details } = params;

    // Fire and forget so business logic doesn't block or fail
    Promise.resolve().then(async () => {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: userId ?? null,
                    action,
                    entityType,
                    entityId: entityId ?? null,
                    details: details ? JSON.parse(JSON.stringify(details)) : undefined,
                },
            });

            console.log(
                `[AUDIT LOG] Action: ${action} | Entity: ${entityType}:${entityId ?? "N/A"} | User: ${userId ?? "System"}`
            );
        } catch (error) {
            console.error("[AUDIT LOG ERROR] Failed to record audit entry:", error);
        }
    });
};
