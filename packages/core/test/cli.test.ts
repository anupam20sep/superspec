import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/cli.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "superspec-cli-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("runCli matrix", () => {
  it("prints a coverage matrix with gaps and exits 0", async () => {
    const specPath = join(root, "spec.md");
    const planPath = join(root, "plan.md");
    await writeFile(specPath, "- **FR-001**: a\n- **FR-002**: b\n", "utf8");
    await writeFile(planPath, "### Task T001: x\n**Implements:** FR-001\n", "utf8");

    const { code, stdout } = await runCli(["matrix", "--spec", specPath, "--plan", planPath]);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(parsed.gaps).toEqual(["FR-002"]);
    expect(parsed.matrix.complete).toBe(false);
  });
});

describe("runCli lint", () => {
  it("prints findings for a placeholder", async () => {
    const planPath = join(root, "plan.md");
    await writeFile(planPath, "### Task T001: x\n- [ ] Step 1: TODO later\n", "utf8");

    const { code, stdout } = await runCli(["lint", "--plan", planPath]);
    expect(code).toBe(0);
    const findings = JSON.parse(stdout);
    expect(findings.some((f: { rule: string }) => f.rule === "no-tbd")).toBe(true);
  });
});

describe("runCli unknown command", () => {
  it("reports an error but still exits 0 (advise-only)", async () => {
    const { code, stdout } = await runCli(["frobnicate"]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/unknown command/i);
  });
});
