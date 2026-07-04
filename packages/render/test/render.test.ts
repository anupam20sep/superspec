import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render } from "../src/render.js";
import { cursorTarget } from "../src/targets.js";

let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "superspec-render-")); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

describe("render", () => {
  it("renders each skill dir through a target and writes files", async () => {
    const skills = join(root, "content", "skills");
    await mkdir(join(skills, "superspec-explore"), { recursive: true });
    await writeFile(join(skills, "superspec-explore", "SKILL.md"), "---\nname: superspec-explore\ndescription: d\n---\nBody", "utf8");

    const out = join(root, "out");
    const written = await render(skills, cursorTarget, out);

    expect(written).toEqual([join(out, ".cursor", "skills", "superspec-explore", "SKILL.md")]);
    const content = await readFile(written[0], "utf8");
    expect(content).toContain("---");
    expect(content).toContain("name: superspec-explore");
    expect(content).toContain("Body");
  });
});
