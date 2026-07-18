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

  it("flags a task with decimal PR.task numbering (0.1, 5.3) when missing TDD cycle", () => {
    const md = [
      "### Task 0.1: Missing TDD cycle",
      "- [ ] Step 1: Write the code",
      "- [ ] Step 2: Deploy it",
    ].join("\n");

    const findings = lintPlan(md);
    const tddFinding = findings.find((f) => f.rule === "no-tdd-cycle");
    expect(tddFinding).toBeDefined();
    expect(tddFinding?.message).toContain("Task 0.1");
  });

  it("does not require TDD cycle for verify-kind tasks", () => {
    const md = [
      "### Task T010: Smoke check",
      "**Kind:** verify",
      "- [ ] Step 1: Run staging smoke",
      "Run: `npm run smoke`",
      "Expected: all checks pass",
    ].join("\n");

    const findings = lintPlan(md);
    expect(findings.some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });

  it("does not flag GREEN prose variants (Run to verify pass)", () => {
    const md = [
      "### Task T001: Good task",
      "**Kind:** code",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 2: Run to verify it fails",
      "- [ ] Step 4: Run to verify pass",
    ].join("\n");

    const findings = lintPlan(md);
    expect(findings.some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });

  it("does not flag Expected: PASS as missing green", () => {
    const md = [
      "### Task T002: Expected pass",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 4: Run tests. Expected: PASS",
    ].join("\n");

    expect(lintPlan(md).some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });

  it("does not treat verify password as a green step", () => {
    const md = [
      "### Task T003: Auth",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 3: Implement verify password hashing",
    ].join("\n");

    expect(lintPlan(md).some((f) => f.rule === "no-tdd-cycle")).toBe(true);
  });

  it("accepts arrow green prose", () => {
    const md = [
      "### Task T004: Arrow",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 4: Run suite → pass",
    ].join("\n");

    expect(lintPlan(md).some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });

  it("accepts ASCII arrow green prose", () => {
    const md = [
      "### Task T006: Ascii arrow",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 4: Run suite -> pass",
    ].join("\n");

    expect(lintPlan(md).some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });

  it("does not require TDD for heading [Kind: provision]", () => {
    const md = [
      "### Task T014: Seed [Kind: provision]",
      "- [ ] Step 1: Run seed script",
      "script: scripts/seed.sh",
    ].join("\n");

    expect(lintPlan(md).some((f) => f.rule === "no-tdd-cycle")).toBe(false);
  });

  it("flags verify-kind tasks missing command proof", () => {
    const md = [
      "### Task T011: Bad verify",
      "**Kind:** verify",
      "- [ ] Step 1: Check it works",
    ].join("\n");

    expect(lintPlan(md).some((f) => f.rule === "no-verify-proof")).toBe(true);
  });

  it("flags malformed FR ids that are not FR-###", () => {
    const md = [
      "### Task T005: Bad FR",
      "**Implements:** FR-1, FR-0010",
      "- [ ] Step 1: Write the failing test",
      "- [ ] Step 4: Expected: PASS",
    ].join("\n");

    const frFindings = lintPlan(md).filter((f) => f.rule === "fr-id-format");
    expect(frFindings.map((f) => f.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("FR-1"),
        expect.stringContaining("FR-0010"),
      ]),
    );
  });

  it("does not require TDD for lowercase verify heading when Kind is verify", () => {
    const md = [
      "### Task t010: Smoke check",
      "**Kind:** verify",
      "- [ ] Step 1: Run staging smoke",
      "Run: `npm run smoke`",
      "Expected: all checks pass",
    ].join("\n");

    const findings = lintPlan(md);
    expect(findings.some((f) => f.rule === "no-tdd-cycle")).toBe(false);
    expect(findings.some((f) => f.rule === "no-verify-proof")).toBe(false);
  });
});
