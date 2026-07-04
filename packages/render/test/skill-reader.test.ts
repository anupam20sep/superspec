import { describe, it, expect } from "vitest";
import { readSkill, frontmatterField } from "../src/skill-reader.js";

describe("readSkill", () => {
  it("splits frontmatter and body and keeps the dir name", () => {
    const md = "---\nname: superspec-explore\ndescription: Use when starting\n---\nBody line 1\n";
    const s = readSkill(md, "superspec-explore");
    expect(s.name).toBe("superspec-explore");
    expect(frontmatterField(s.frontmatter, "description")).toBe("Use when starting");
    expect(s.body.trim()).toBe("Body line 1");
  });
  it("falls back to whole text as body when no frontmatter", () => {
    const s = readSkill("no fm here", "x");
    expect(s.frontmatter).toBe("");
    expect(s.body).toBe("no fm here");
  });
});
