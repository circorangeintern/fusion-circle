import { beforeEach, describe, expect, it, vi } from "vitest";
import * as auditStore from "./auditStore";
import { safeLogAudit } from "./auditLogger";

vi.mock("./auditStore", () => ({
  writeAudit: vi.fn(),
}));

describe("safeLogAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not throw when the database write fails", async () => {
    vi.mocked(auditStore.writeAudit).mockRejectedValueOnce(new Error("db down"));

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
