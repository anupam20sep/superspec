import { describe, it, expect } from "vitest";
import { formatForgeStatusReport, formatSyncStatusReport, formatCommandError, formatNextTaskReport, formatBeginTaskReport, formatRecordResultReport } from "../src/cli-output.js";

describe("cli output formatters", () => {
  it("formatForgeStatusReport verbose includes summary line", () => {
    const out = formatForgeStatusReport(
      { total: 2, done: 1, blocked: 0, pending: 1, inProgress: 0, complete: false },
      { dir: "/specs/foo", statusPath: "/specs/foo/status.md" },
      true,
    );
    expect(out).toContain("SuperSpec forge-status:");
    expect(out).toContain("status.md");
    expect(out).toContain('"complete": false');
  });

  it("formatSyncStatusReport verbose mentions path", () => {
    const out = formatSyncStatusReport(
      {
        path: "specs/foo/status.md",
        snapshot: {
          feature: "foo",
          updatedAt: "t",
          frRows: [{ fr: "FR-001", text: "x", status: "pending", tasks: ["T001"] }],
          taskRows: [],
          summary: { total: 1, done: 0, inProgress: 0, blocked: 0, pending: 1 },
        },
      },
      true,
    );
    expect(out).toContain("wrote specs/foo/status.md");
    expect(out).toContain("FR-001");
  });

  it("formatCommandError returns JSON error payload", () => {
    const out = formatCommandError("sync-status", new Error("missing --spec"));
    expect(out).toContain("FAILED");
    expect(out).toContain('"ok": false');
  });

  it("formatNextTaskReport verbose names the task", () => {
    const out = formatNextTaskReport(
      { id: "T001", title: "api", frRefs: ["FR-001"], dependsOn: [], complexity: "mechanical", kind: "code" },
      { dir: "specs/foo" },
      true,
    );
    expect(out).toContain("SuperSpec next-task: T001");
    expect(out).toContain('"id": "T001"');
  });

  it("formatBeginTaskReport verbose confirms in progress", () => {
    const out = formatBeginTaskReport("T002", { dir: "specs/foo" }, true);
    expect(out).toContain("T002 marked in progress");
  });

  it("formatRecordResultReport verbose shows verdict", () => {
    const out = formatRecordResultReport("T001", true, { statusPath: "specs/foo/status.md" }, true);
    expect(out).toContain("T001 passed");
    expect(out).toContain("status.md");
  });
});
