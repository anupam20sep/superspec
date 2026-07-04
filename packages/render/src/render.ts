import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { readSkill } from "./skill-reader.js";
import type { Target } from "./targets.js";

export async function render(contentSkillsDir: string, target: Target, outRoot: string): Promise<string[]> {
  const written: string[] = [];
  const entries = await readdir(contentSkillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(contentSkillsDir, entry.name, "SKILL.md");
    let raw: string;
    try {
      raw = await readFile(skillPath, "utf8");
    } catch {
      continue; // directory without a SKILL.md (e.g. references handled elsewhere)
    }
    const skill = readSkill(raw, entry.name);
    for (const file of target.render(skill, outRoot)) {
      await mkdir(dirname(file.path), { recursive: true });
      await writeFile(file.path, file.content, "utf8");
      written.push(file.path);
    }
  }

  return written.sort();
}
