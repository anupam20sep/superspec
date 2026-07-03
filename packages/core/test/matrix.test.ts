import { describe, it, expect } from "vitest";
import { buildMatrix, matrixGaps } from "../src/matrix.js";
import type { Requirement, Task } from "../src/types.js";

const reqs: Requirement[] = [
  { id: "FR-001", text: "a" },
  { id: "FR-002", text: "b" },
];

const tasks: Task[] = [
  { id: "T001", title: "x", frRefs: ["FR-001"], dependsOn: [], complexity: "mechanical" },
];

describe("buildMatrix", () => {
  it("marks a requirement covered when a task references it", () => {
    const m = buildMatrix(reqs, tasks);
    expect(m.rows).toEqual([
      { fr: "FR-001", tasks: ["T001"], covered: true },
      { fr: "FR-002", tasks: [], covered: false },
    ]);
    expect(m.complete).toBe(false);
  });

  it("is complete only when every requirement is covered", () => {
    const full = buildMatrix([{ id: "FR-001", text: "a" }], tasks);
    expect(full.complete).toBe(true);
  });
});

describe("matrixGaps", () => {
  it("lists uncovered requirement ids", () => {
    expect(matrixGaps(buildMatrix(reqs, tasks))).toEqual(["FR-002"]);
  });
});
