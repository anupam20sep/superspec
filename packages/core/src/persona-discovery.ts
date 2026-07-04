import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { readSkill, frontmatterField } from "@superspec/render";

export interface Persona {
  name: string;
  description: string;
  source: "claude" | "cursor";
  path: string;
}

async function loadPersonasFromDir(dir: string, source: "claude" | "cursor"): Promise<Persona[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // Directory doesn't exist (or isn't readable) — contributes zero personas.
    return [];
  }

  const personas: Persona[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const path = join(dir, entry.name);
    let markdown: string;
    try {
      markdown = await readFile(path, "utf8");
    } catch {
      continue;
    }

    const { frontmatter } = readSkill(markdown, entry.name);
    if (!frontmatter) continue;

    // frontmatterField's regex uses \s* after the key, which can swallow an empty
    // value's trailing newline and bleed into the next line. Guard against that by
    // rejecting values that themselves look like a "key: value" frontmatter line.
    const keyLinePattern = /^[A-Za-z0-9_-]+:\s/;
    const name = frontmatterField(frontmatter, "name");
    const description = frontmatterField(frontmatter, "description");
    if (!name || !description) continue;
    if (keyLinePattern.test(name) || keyLinePattern.test(description)) continue;

    personas.push({ name, description, source, path });
  }

  return personas;
}

export async function discoverPersonas(agentsDirs: {
  claude?: string;
  cursor?: string;
}): Promise<Persona[]> {
  const [claudePersonas, cursorPersonas] = await Promise.all([
    agentsDirs.claude ? loadPersonasFromDir(agentsDirs.claude, "claude") : Promise.resolve([]),
    agentsDirs.cursor ? loadPersonasFromDir(agentsDirs.cursor, "cursor") : Promise.resolve([]),
  ]);

  // Merge by name; .claude/agents/ wins on collision since it's Claude Code's own native convention.
  const byName = new Map<string, Persona>();
  for (const persona of cursorPersonas) byName.set(persona.name, persona);
  for (const persona of claudePersonas) byName.set(persona.name, persona);

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}
