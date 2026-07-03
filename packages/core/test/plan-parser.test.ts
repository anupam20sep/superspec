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

  it("parses decimal task ids (0.1 style) with all metadata", () => {
    const md = [
      "### Task 0.1: Design database schema",
      "**Implements:** FR-010",
      "**Depends on:** none",
      "**Complexity:** heavy",
      "",
      "### Task 0.2: Implement persistence layer",
      "**Implements:** FR-011, FR-012",
      "**Depends on:** T001",
      "**Complexity:** mechanical",
    ].join("\n");

    expect(parsePlan(md)).toEqual([
      { id: "0.1", title: "Design database schema", frRefs: ["FR-010"], dependsOn: [], complexity: "heavy" },
      { id: "0.2", title: "Implement persistence layer", frRefs: ["FR-011", "FR-012"], dependsOn: ["T001"], complexity: "mechanical" },
    ]);
  });
});
