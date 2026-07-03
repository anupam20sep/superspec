import { describe, it, expect } from "vitest";
import { parsePlan } from "../src/plan-parser.js";

describe("parsePlan", () => {
  it("parses tasks with refs, deps, and complexity", () => {
    const md = [
      "### Task T001: Create URL model",
      "**Implements:** FR-001, FR-002",
      "**Depends on:** none",
      "**Complexity:** mechanical",
      "",
      "### Task T002: Add redirect handler",
      "**Implements:** FR-003",
      "**Depends on:** T001",
      "**Complexity:** heavy",
    ].join("\n");

    expect(parsePlan(md)).toEqual([
      { id: "T001", title: "Create URL model", frRefs: ["FR-001", "FR-002"], dependsOn: [], complexity: "mechanical" },
      { id: "T002", title: "Add redirect handler", frRefs: ["FR-003"], dependsOn: ["T001"], complexity: "heavy" },
    ]);
  });

  it("defaults complexity to mechanical and refs/deps to empty when absent", () => {
    expect(parsePlan("### Task T009: Bare task")).toEqual([
      { id: "T009", title: "Bare task", frRefs: [], dependsOn: [], complexity: "mechanical" },
    ]);
  });
});
