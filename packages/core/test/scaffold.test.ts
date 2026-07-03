import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffold } from "../src/scaffold.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "superspec-scaffold-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("scaffold", () => {
  it("renders templates, interpolates vars, and strips the -template suffix", async () => {
    const templatesDir = join(root, "templates");
    const targetDir = join(root, "out");
    await mkdir(templatesDir, { recursive: true });
    await writeFile(join(templatesDir, "spec-template.md"), "# Spec for {{FEATURE}}\n", "utf8");

    const written = await scaffold(templatesDir, targetDir, { FEATURE: "URL Shortener" });

    expect(written).toEqual([join(targetDir, "spec.md")]);
    expect(await readFile(join(targetDir, "spec.md"), "utf8")).toBe("# Spec for URL Shortener\n");
  });

  it("leaves unknown tokens untouched", async () => {
    const templatesDir = join(root, "templates");
    await mkdir(templatesDir, { recursive: true });
    await writeFile(join(templatesDir, "design-template.md"), "{{MISSING}}", "utf8");

    await scaffold(templatesDir, join(root, "out"), {});

    expect(await readFile(join(root, "out", "design.md"), "utf8")).toBe("{{MISSING}}");
  });
});
