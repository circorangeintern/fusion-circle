import { NotificationType } from "@prisma/client";
import { prisma } from "../shared/prisma/prisma";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
}: CreateNotificationParams) => {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
    },
  });
};