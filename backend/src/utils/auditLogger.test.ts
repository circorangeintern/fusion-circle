import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../shared/prisma/prisma";
import { safeLogAudit } from "./auditLogger";

vi.mock("../shared/prisma/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("safeLogAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not throw when the database write fails", async () => {
    vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(new Error("db down"));

    await expect(
      safeLogAudit({
        userId: 1,
        action: "TEST_ACTION",
        entityType: "USER",
        entityId: 1,
        details: { foo: "bar" },
      })
    ).resolves.toBeUndefined();
  });
});
