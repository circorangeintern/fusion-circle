import { prisma } from "../shared/prisma/prisma";

export interface AuditStoreParams {
    userId?: number | null;
    action: string;
    entityType: string;
    entityId?: number | null;
    details?: Record<string, any> | undefined;
}

export const writeAudit = async (params: AuditStoreParams): Promise<void> => {
    const { userId, action, entityType, entityId, details } = params;

    await prisma.auditLog.create({
        data: {
            userId: userId ?? null,
            action,
            entityType,
            entityId: entityId ?? null,
            details,
        },
    });
};
