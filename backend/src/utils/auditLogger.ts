import { prisma } from "../shared/prisma/prisma";
import { logger } from "../shared/logger";

export interface AuditLogParams {
    userId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    details?: Record<string, any>;
}


export const logAudit = async (params: AuditLogParams): Promise<void> => {
    const { userId, action, entityType, entityId, details } = params;

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

            logger.info(
                { action, entityType, entityId: entityId ?? null, userId: userId ?? null },
                "Audit log recorded"
            );
        } catch (error) {
            logger.error(
                { err: error, action, entityType, entityId: entityId ?? null, userId: userId ?? null },
                "[AUDIT LOG ERROR] Failed to record audit entry"
            );
        }
    });
};
