import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initProject } from "../src/init.js";

describe("initProject", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "superspec-init-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("creates repo layout at root, not arbitrary docs paths", async () => {
    const result = await initProject({ root, mode: "lite" });
    expect(result.mode).toBe("lite");
    await access(join(root, "constitution.md"));
    await access(join(root, ".superspec", "README.md"));
    await access(join(root, ".superspec", "templates", "spec.md"));
    await access(join(root, "specs", ".gitkeep"));
    const constitution = await readFile(join(root, "constitution.md"), "utf8");
    expect(constitution).toContain("**Mode**: lite");
  });

  it("creates program.md in full mode only", async () => {
    await initProject({ root, mode: "full" });
    await access(join(root, "program.md"));
  });

  it("refuses re-init when constitution exists", async () => {
    await initProject({ root, mode: "lite" });
    await expect(initProject({ root, mode: "lite" })).rejects.toThrow(/already exists/);
  });
});
