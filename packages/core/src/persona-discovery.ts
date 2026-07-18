import { readdir, readFile, access } from "node:fs/promises";
import { join, resolve, dirname, isAbsolute } from "node:path";
import { homedir } from "node:os";
import { readSkill, frontmatterField } from "@superspec-dev/render";

export type PersonaSource = "claude" | "cursor" | "codex";

export interface Persona {
  name: string;
  description: string;
  source: PersonaSource;
  path: string;
}

export interface DiscoverPersonasOptions {
  /** Explicit Claude agents dir(s). Relative paths resolve against projectRoot. */
  claude?: string | string[];
  /** Explicit Cursor agents dir(s). Relative paths resolve against projectRoot. */
  cursor?: string | string[];
  /** Explicit Codex agents dir(s). Relative paths resolve against projectRoot. */
  codex?: string | string[];
  /** Project root for defaults and relative paths. Default: detect from cwd. */
  projectRoot?: string;
  /** Starting directory for project-root detection. Default: process.cwd(). */
  cwd?: string;
  /**
   * When true (default), also scan standard project + home agent locations.
   * Set false to only use explicit `claude` / `cursor` / `codex` dirs.
   */
  includeDefaults?: boolean;
  /** Include `~/.claude|cursor|codex/agents` when using defaults. Default true. */
  includeHome?: boolean;
}

const PROJECT_MARKERS = [".git", ".claude", ".cursor", ".codex", "package.json"] as const;

/** Walk upward from `start` looking for a project root marker. */
export async function findProjectRoot(start: string): Promise<string> {
  let dir = resolve(start);
  for (;;) {
    for (const marker of PROJECT_MARKERS) {
      try {
        await access(join(dir, marker));
        return dir;
      } catch {
        // try next marker
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

/** Standard agent directories for a project (and optionally the user home). */
export function defaultPersonaDirs(
  projectRoot: string,
  options: { includeHome?: boolean; home?: string } = {},
): { claude: string[]; cursor: string[]; codex: string[] } {
  const includeHome = options.includeHome !== false;
  const home = options.home ?? homedir();
  const claude = [join(projectRoot, ".claude", "agents")];
  const cursor = [join(projectRoot, ".cursor", "agents")];
  const codex = [join(projectRoot, ".codex", "agents")];
  if (includeHome) {
    claude.push(join(home, ".claude", "agents"));
    cursor.push(join(home, ".cursor", "agents"));
    codex.push(join(home, ".codex", "agents"));
  }
  return { claude, cursor, codex };
}

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveDir(path: string, projectRoot: string): string {
  return isAbsolute(path) ? path : resolve(projectRoot, path);
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

async function collectTomlFiles(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTomlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".toml")) {
      files.push(full);
    }
  }
  return files;
}

function parseTomlStringField(text: string, key: string): string | undefined {
  // name = "value" or name = 'value' (single line)
  const re = new RegExp(`^\\s*${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)')\\s*$`, "m");
  const m = text.match(re);
  return m?.[1] ?? m?.[2];
}

async function loadMarkdownPersonas(dir: string, source: PersonaSource): Promise<Persona[]> {
  const files = await collectMarkdownFiles(dir);
  const personas: Persona[] = [];
  const keyLinePattern = /^[A-Za-z0-9_-]+:\s/;

  for (const path of files) {
    let markdown: string;
    try {
      markdown = await readFile(path, "utf8");
    } catch {
      continue;
    }

    const { frontmatter } = readSkill(markdown, path);
    if (!frontmatter) continue;

    const name = frontmatterField(frontmatter, "name");
    const description = frontmatterField(frontmatter, "description");
    if (!name || !description) continue;
    if (keyLinePattern.test(name) || keyLinePattern.test(description)) continue;

    personas.push({ name, description, source, path });
  }

  return personas;
}

async function loadTomlPersonas(dir: string): Promise<Persona[]> {
  const files = await collectTomlFiles(dir);
  const personas: Persona[] = [];

  for (const path of files) {
    let text: string;
    try {
      text = await readFile(path, "utf8");
    } catch {
      continue;
    }
    const name = parseTomlStringField(text, "name");
    const description = parseTomlStringField(text, "description");
    if (!name || !description) continue;
    personas.push({ name, description, source: "codex", path });
  }

  return personas;
}

async function loadPersonasFromDir(dir: string, source: PersonaSource): Promise<Persona[]> {
  if (source === "codex") {
    const [md, toml] = await Promise.all([loadMarkdownPersonas(dir, "codex"), loadTomlPersonas(dir)]);
    return [...md, ...toml];
  }
  return loadMarkdownPersonas(dir, source);
}

/**
 * Discover specialized agent personas from Claude / Cursor / Codex agent directories.
 *
 * By default scans (under detected project root + home):
 * - `.claude/agents/`, `~/.claude/agents/`
 * - `.cursor/agents/`, `~/.cursor/agents/`
 * - `.codex/agents/`, `~/.codex/agents/` (markdown + TOML)
 *
 * Explicit dirs are always included. Relative paths resolve against `projectRoot`
 * (not the MCP process cwd alone).
 */
export async function discoverPersonas(
  options: DiscoverPersonasOptions = {},
): Promise<Persona[]> {
  const cwd = options.cwd ?? process.cwd();
  const projectRoot = options.projectRoot
    ? resolve(options.projectRoot)
    : await findProjectRoot(cwd);
  const includeDefaults = options.includeDefaults !== false;
  const includeHome = options.includeHome !== false;

  const claudeDirs = asList(options.claude).map((p) => resolveDir(p, projectRoot));
  const cursorDirs = asList(options.cursor).map((p) => resolveDir(p, projectRoot));
  const codexDirs = asList(options.codex).map((p) => resolveDir(p, projectRoot));

  if (includeDefaults) {
    const defaults = defaultPersonaDirs(projectRoot, { includeHome });
    claudeDirs.push(...defaults.claude);
    cursorDirs.push(...defaults.cursor);
    codexDirs.push(...defaults.codex);
  }

  const uniq = (dirs: string[]) => [...new Set(dirs)];

  const [claudePersonas, cursorPersonas, codexPersonas] = await Promise.all([
    Promise.all(uniq(claudeDirs).map((d) => loadPersonasFromDir(d, "claude"))).then((a) => a.flat()),
    Promise.all(uniq(cursorDirs).map((d) => loadPersonasFromDir(d, "cursor"))).then((a) => a.flat()),
    Promise.all(uniq(codexDirs).map((d) => loadPersonasFromDir(d, "codex"))).then((a) => a.flat()),
  ]);

  // Merge by name: cursor < codex < claude (claude wins — native Claude Code convention).
  const byName = new Map<string, Persona>();
  for (const persona of cursorPersonas) byName.set(persona.name, persona);
  for (const persona of codexPersonas) byName.set(persona.name, persona);
  for (const persona of claudePersonas) byName.set(persona.name, persona);

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}
