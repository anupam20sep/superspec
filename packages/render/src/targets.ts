import { join } from "node:path";
import type { Skill } from "./skill-reader.js";

export interface RenderedFile {
  path: string;
  content: string;
}

export interface Target {
  name: string;
  render(skill: Skill, outRoot: string): RenderedFile[];
}

function skillFile(outRoot: string, subdir: string, name: string, skill: Skill): RenderedFile {
  return {
    path: join(outRoot, subdir, name, "SKILL.md"),
    content: `---\n${skill.frontmatter}\n---\n${skill.body}`,
  };
}

// Single output layout: repo-root `skills/` (same as obra/superpowers).
// Claude Code and Cursor's `.cursor-plugin/plugin.json` both consume this path.
export const skillsTarget: Target = {
  name: "skills",
  render: (skill, outRoot) => [skillFile(outRoot, "skills", skill.name, skill)],
};

/** @deprecated Use skillsTarget — kept as alias for existing imports/tests. */
export const claudeTarget = skillsTarget;

// NOTE: a `copilotTarget` following this exact same Target interface will be added here when
// GitHub Copilot support is picked up (deferred plan). Its shape is already proven by the
// architecture doc: map a stage skill (`superspec-<stage>`) to `.github/prompts/<stage>.prompt.md`
// with `mode: agent` frontmatter, and map the entry skill (`using-superspec`) to
// `.github/copilot-instructions.md`. No other file in this module needs to change to add it —
// just add the target object and append it to INTEGRATION_REGISTRY below.

export const INTEGRATION_REGISTRY: Target[] = [skillsTarget];
