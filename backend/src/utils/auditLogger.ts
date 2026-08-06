import { prisma } from "../shared/prisma/prisma";
import { logger } from "../shared/logger";

export interface AuditLogParams {
    userId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    details?: Record<string, any>;
}

const serializeDetails = (details?: Record<string, any>) => {
    if (!details) {
        return undefined;
    }

    try {
        return JSON.parse(JSON.stringify(details));
    } catch (error) {
        logger.warn({ err: error }, "Failed to serialize audit details, falling back to a safe payload");
        return { error: "Failed to serialize audit details" };
    }
};

export const logAudit = async (params: AuditLogParams): Promise<void> => {
    const { userId, action, entityType, entityId, details } = params;

    try {
        await prisma.auditLog.create({
            data: {
                userId: userId ?? null,
                action,
                entityType,
                entityId: entityId ?? null,
                details: serializeDetails(details),
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
};

export const safeLogAudit = async (params: AuditLogParams): Promise<void> => {
    try {
        await logAudit(params);
    } catch (error) {
        logger.error(
            { err: error, action: params.action, entityType: params.entityType, entityId: params.entityId ?? null, userId: params.userId ?? null },
            "[AUDIT LOG WRAPPER ERROR] Failed to record audit entry"
        );
    }
};
