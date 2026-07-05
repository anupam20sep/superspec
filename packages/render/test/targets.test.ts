import { describe, it, expect } from "vitest";
import { skillsTarget, INTEGRATION_REGISTRY } from "../src/targets.js";
import type { Skill } from "../src/skill-reader.js";

const posix = (p: string) => p.replace(/\\/g, "/");

const explore: Skill = { name: "superspec-explore", frontmatter: "name: superspec-explore\ndescription: Use when starting", body: "Explore body" };

describe("skillsTarget", () => {
  it("writes under skills/<name>/SKILL.md", () => {
    const out = skillsTarget.render(explore, "/out");
    expect(posix(out[0].path)).toBe("/out/skills/superspec-explore/SKILL.md");
    expect(out[0].content).toBe("---\nname: superspec-explore\ndescription: Use when starting\n---\nExplore body");
  });
});

describe("registry", () => {
  it("contains the skills target (copilot deferred to a future plan)", () => {
    expect(INTEGRATION_REGISTRY.map((t) => t.name)).toEqual(["skills"]);
  });
});
