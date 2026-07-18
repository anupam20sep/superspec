import { describe, it, expect } from "vitest";
import { parsePlan, extractTaskDeps } from "../src/plan-parser.js";

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
      "**Depends on:** 0.1",
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
        dependsOn: ["0.1"],
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

  it("extracts bare FR ids when Implements has qualifiers", () => {
    const md = [
      "### Task T001: Bootstrap",
      "**Implements:** FR-001, FR-002 (config bootstrap part), FR-007 (storage)",
      "**Depends on:** none",
    ].join("\n");

    expect(parsePlan(md)[0].frRefs).toEqual(["FR-001", "FR-002", "FR-007"]);
  });

  it("ignores prose and TODO in Depends on; only real T### ids", () => {
    const md = [
      "### Task T001: First",
      "**Implements:** FR-001",
      "",
      "### Task T002: Second",
      "**Implements:** FR-002",
      "**Depends on:** The previous task T001, TODO cleanup",
    ].join("\n");

    expect(parsePlan(md)[1].dependsOn).toEqual(["T001"]);
  });

  it("resolves decimal task ids in Depends on", () => {
    const md = [
      "### Task 0.1: Schema",
      "**Implements:** FR-010",
      "",
      "### Task 0.2: Persist",
      "**Implements:** FR-011",
      "**Depends on:** 0.1",
    ].join("\n");

    expect(parsePlan(md)[1].dependsOn).toEqual(["0.1"]);
  });

  it("parses Depends On case-insensitively", () => {
    const md = [
      "### Task T001: A",
      "**Implements:** FR-001",
      "",
      "### Task T002: B",
      "**Implements:** FR-002",
      "**Depends On:** T001",
    ].join("\n");

    expect(parsePlan(md)[1].dependsOn).toEqual(["T001"]);
  });

  it("parses Kind from heading [Kind: …] tag", () => {
    const md = [
      "### Task T014: Seed [Kind: provision]",
      "**Implements:** FR-030",
      "**Depends on:** none",
    ].join("\n");

    const task = parsePlan(md)[0];
    expect(task.kind).toBe("provision");
    expect(task.title).toBe("Seed");
  });

  it("prefers **Kind:** field over heading tag", () => {
    const md = [
      "### Task T015: Mixed [Kind: provision]",
      "**Kind:** verify",
      "**Implements:** FR-031",
    ].join("\n");

    expect(parsePlan(md)[0].kind).toBe("verify");
  });

  it("resolves bare integer and lowercase T deps when tasks exist", () => {
    const md2 = [
      "### Task 1: First",
      "**Implements:** FR-001",
      "",
      "### Task T002: Second",
      "**Implements:** FR-002",
      "**Depends on:** 1",
      "",
      "### Task T003: Third",
      "**Implements:** FR-003",
      "**Depends on:** t002",
    ].join("\n");

    const tasks = parsePlan(md2);
    expect(tasks[1].dependsOn).toEqual(["1"]);
    expect(tasks[2].dependsOn).toEqual(["T002"]);
  });

  it("does not treat version prose as a bare-integer dep", () => {
    const md = [
      "### Task 18: Legacy",
      "**Implements:** FR-018",
      "",
      "### Task T019: Modern",
      "**Implements:** FR-019",
      "**Depends on:** requires Node 18",
    ].join("\n");

    expect(parsePlan(md)[1].dependsOn).toEqual([]);
  });

  it("does not pull bare ints out of decimal task ids", () => {
    const known = new Set(["0.1", "1", "0"]);
    expect(extractTaskDeps("0.1", known)).toEqual(["0.1"]);
  });

  it("normalizes lowercase task headings", () => {
    const md = ["### Task t010: Lower", "**Implements:** FR-010"].join("\n");
    expect(parsePlan(md)[0].id).toBe("T010");
  });
});
