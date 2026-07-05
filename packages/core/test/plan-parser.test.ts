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
      "**Complexity:** complex",
    ].join("\n");

    expect(parsePlan(md)).toEqual([
      {
        id: "T001",
        title: "Create URL model",
        frRefs: ["FR-001", "FR-002"],
        dependsOn: [],
        complexity: "mechanical",
        kind: "code",
      },
      {
        id: "T002",
        title: "Add redirect handler",
        frRefs: ["FR-003"],
        dependsOn: ["T001"],
        complexity: "complex",
        kind: "code",
      },
    ]);
  });

  it("parses a task tagged moderate complexity", () => {
    const md = [
      "### Task T003: Refactor config loader",
      "**Implements:** FR-004",
      "**Depends on:** none",
      "**Complexity:** moderate",
    ].join("\n");

    expect(parsePlan(md)).toEqual([
      {
        id: "T003",
        title: "Refactor config loader",
        frRefs: ["FR-004"],
        dependsOn: [],
        complexity: "moderate",
        kind: "code",
      },
    ]);
  });

  it("defaults complexity to mechanical and refs/deps to empty when absent", () => {
    expect(parsePlan("### Task T009: Bare task")).toEqual([
      {
        id: "T009",
        title: "Bare task",
        frRefs: [],
        dependsOn: [],
        complexity: "mechanical",
        kind: "code",
      },
    ]);
  });

  it("parses decimal task ids (0.1 style) with all metadata", () => {
    const md = [
      "### Task 0.1: Design database schema",
      "**Implements:** FR-010",
      "**Depends on:** none",
      "**Complexity:** complex",
      "",
      "### Task 0.2: Implement persistence layer",
      "**Implements:** FR-011, FR-012",
      "**Depends on:** T001",
      "**Complexity:** mechanical",
    ].join("\n");

    expect(parsePlan(md)).toEqual([
      {
        id: "0.1",
        title: "Design database schema",
        frRefs: ["FR-010"],
        dependsOn: [],
        complexity: "complex",
        kind: "code",
      },
      {
        id: "0.2",
        title: "Implement persistence layer",
        frRefs: ["FR-011", "FR-012"],
        dependsOn: ["T001"],
        complexity: "mechanical",
        kind: "code",
      },
    ]);
  });

  it("parses task kind", () => {
    const md = [
      "### Task T010: Run smoke check",
      "**Implements:** FR-020",
      "**Depends on:** none",
      "**Complexity:** mechanical",
      "**Kind:** verify",
    ].join("\n");

    expect(parsePlan(md)[0].kind).toBe("verify");
  });
});
