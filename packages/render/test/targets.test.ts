import { describe, it, expect } from "vitest";
import { claudeTarget, cursorTarget, INTEGRATION_REGISTRY } from "../src/targets.js";
import type { Skill } from "../src/skill-reader.js";

const explore: Skill = { name: "superspec-explore", frontmatter: "name: superspec-explore\ndescription: Use when starting", body: "Explore body" };

describe("claudeTarget", () => {
  it("passes a skill through to skills/<name>/SKILL.md", () => {
    const out = claudeTarget.render(explore, "/out");
    expect(out).toEqual([{ path: "/out/skills/superspec-explore/SKILL.md", content: "---\nname: superspec-explore\ndescription: Use when starting\n---\nExplore body" }]);
  });
});

describe("cursorTarget", () => {
  it("writes under .cursor/skills/", () => {
    expect(cursorTarget.render(explore, "/out")[0].path).toBe("/out/.cursor/skills/superspec-explore/SKILL.md");
  });
});

describe("registry", () => {
  it("contains the two active targets (copilot deferred to a future plan)", () => {
    expect(INTEGRATION_REGISTRY.map((t) => t.name)).toEqual(["claude", "cursor"]);
  });
});
