import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { initProject, formatInitReport } from "../src/init.js";

describe("initProject", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "superspec-init-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("creates repo layout at root, not arbitrary docs paths", async () => {
    const result = await initProject({ root, mode: "lite", verbose: true });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("lite");
    expect(result.filesWritten).toBeGreaterThanOrEqual(8);
    expect(result.templateScaffoldCount).toBeGreaterThanOrEqual(6);
    expect(resolve(result.root)).toBe(resolve(root));
    await access(join(root, "constitution.md"));
    await access(join(root, ".superspec", "README.md"));
    await access(join(root, ".superspec", "templates", "spec.md"));
    await access(join(root, "specs", ".gitkeep"));
    const constitution = await readFile(join(root, "constitution.md"), "utf8");
    expect(constitution).toContain("**Mode**: lite");
    expect(result.log.some((l) => l.includes("wrote"))).toBe(true);
  });

  it("creates program.md in full mode only", async () => {
    const result = await initProject({ root, mode: "full" });
    expect(result.filesWritten).toBeGreaterThan(8);
    await access(join(root, "program.md"));
  });

  it("refuses re-init when constitution exists", async () => {
    await initProject({ root, mode: "lite" });
    await expect(initProject({ root, mode: "lite" })).rejects.toThrow(/already exists/);
  });

  it("does not write models.yaml by default", async () => {
    const result = await initProject({ root, mode: "lite" });
    expect(result.ok).toBe(true);
    await access(join(root, ".superspec", "templates", "models.example.yaml"));
    await expect(access(join(root, ".superspec", "models.yaml"))).rejects.toThrow();
    expect(result.log.some((l) => l.includes("skipped .superspec/models.yaml"))).toBe(true);
  });

  it("writes models.yaml when withModels is true", async () => {
    const result = await initProject({ root, mode: "lite", withModels: true });
    expect(result.ok).toBe(true);
    await access(join(root, ".superspec", "models.yaml"));
    const body = await readFile(join(root, ".superspec", "models.yaml"), "utf8");
    expect(body).toContain("tiers:");
    expect(body).toContain("kinds:");
  });

  it("formatInitReport includes summary and JSON", () => {
    const report = formatInitReport({
      ok: true,
      mode: "lite",
      root: "/tmp/proj",
      cwd: "/tmp",
      templatesDir: "/pkg/templates",
      filesWritten: 2,
      templateScaffoldCount: 6,
      written: ["constitution.md", ".superspec/templates/spec.md"],
      log: ["SuperSpec init starting (mode=lite)"],
    });
    expect(report).toContain("SuperSpec init: OK");
    expect(report).toContain('"ok": true');
    expect(report).toContain("constitution.md");
  });
});
