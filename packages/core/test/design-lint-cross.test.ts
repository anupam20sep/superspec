import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lintDesign } from "../src/design-lint.js";

describe("lintDesign cross-spec resolution", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "superspec-design-lint-"));
    const authDir = join(root, "specs", "001-auth");
    await mkdir(authDir, { recursive: true });
    await writeFile(
      join(authDir, "design.md"),
      [
        "### Produced For Other Specs",
        "| Target spec / consumer | Contract | Version / stability | Notes |",
        "|------------------------|----------|---------------------|-------|",
        "| specs/002-billing | oauth.token.v1 | v1 | stable |",
      ].join("\n"),
      "utf8",
    );
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("resolves consumed contract against upstream produced table", async () => {
    const billing = [
      "### Consumed From Other Specs",
      "| Source spec | Contract | Version / stability | Notes |",
      "|-------------|----------|---------------------|-------|",
      "| specs/001-auth | oauth.token.v1 | v1 | required |",
    ].join("\n");

    expect(await lintDesign(billing, { specsRoot: root })).toEqual([]);
  });

  it("flags unresolved consumed contract", async () => {
    const billing = [
      "### Consumed From Other Specs",
      "| Source spec | Contract | Version / stability | Notes |",
      "|-------------|----------|---------------------|-------|",
      "| specs/001-auth | missing.contract | v1 | — |",
    ].join("\n");

    const findings = await lintDesign(billing, { specsRoot: root });
    expect(findings.some((f) => f.rule === "unresolved-consumed")).toBe(true);
  });
});
