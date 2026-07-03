import { describe, it, expect } from "vitest";
import { lintPlan } from "../src/plan-lint.js";

describe("lintPlan placeholder detection", () => {
  it("flags TODO/TBD and vague-instruction placeholders with line numbers", () => {
    const md = [
      "### Task T001: Do it", // 1
      "- [ ] Step 1: TODO write this later", // 2
      "- [ ] Step 2: Add appropriate error handling", // 3
    ].join("\n");

    const findings = lintPlan(md);
    const rules = findings.map((f) => f.rule);
    expect(rules).toContain("no-tbd");
    expect(rules).toContain("no-vague-error");
    expect(findings.find((f) => f.rule === "no-tbd")?.line).toBe(2);
  });
});

describe("lintPlan TDD cycle detection", () => {
  it("flags a task with no failing-test step", () => {
    const md = [
      "### Task T001: Missing tests",
      "- [ ] Step 1: Write the code",
      "- [ ] Step 2: Ship it",
    ].join("\n");

    const findings = lintPlan(md);
    expect(findings.some((f) => f.rule === "no-tdd-cycle")).toBe(true);
  });

  it("does not flag a task that has failing + passing test steps", () => {
    const md = [
      "### Task T001: Good task",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 2: Run it to verify it passes",
    ].join("\n");

    const findings = lintPlan(md);
    expect(findings.some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });
});
