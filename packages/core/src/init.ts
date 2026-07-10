import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold } from "./scaffold.js";

export type InitMode = "lite" | "full";

export interface InitOptions {
  root: string;
  mode: InitMode;
  templatesDir?: string;
  feature?: string;
}

export interface InitResult {
  root: string;
  mode: InitMode;
  written: string[];
}

export function defaultTemplatesDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "templates");
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeConstitution(
  root: string,
  templatesDir: string,
  mode: InitMode,
): Promise<string> {
  const raw = await readFile(join(templatesDir, "constitution.md"), "utf8");
  const withMode = raw.replace(
    /^# SuperSpec Constitution\n/,
    `# SuperSpec Constitution\n\n**Mode**: ${mode}\n`,
  );
  const outPath = join(root, "constitution.md");
  await writeFile(outPath, withMode, "utf8");
  return outPath;
}

async function writeProgram(root: string, templatesDir: string): Promise<string> {
  const raw = await readFile(join(templatesDir, "program-template.md"), "utf8");
  const rendered = raw.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    if (key === "DATE") return new Date().toISOString().slice(0, 10);
    return `{{${key}}}`;
  });
  const outPath = join(root, "program.md");
  await writeFile(outPath, rendered, "utf8");
  return outPath;
}

async function writeSuperspecReadme(root: string): Promise<string> {
  const outPath = join(root, ".superspec", "README.md");
  const body = `# SuperSpec workspace metadata

This directory holds **repo-level** SuperSpec scaffolding — not per-feature artifacts.

| Path | Purpose |
|------|---------|
| \`templates/\` | Reference copies of tier templates (spec, plan, design, …) |
| \`README.md\` | This file |

Per-feature forge state lives under each spec directory: \`specs/<feature>/.superspec/state.json\` (gitignored).
Per-feature FR status is committed at \`specs/<feature>/status.md\`.

Do **not** store feature specs here. Use \`specs/<feature>/\` at the repository root.
`;
  await writeFile(outPath, body, "utf8");
  return outPath;
}

/** One-time repository bootstrap with a fixed layout (never arbitrary docs/ paths). */
export async function initProject(options: InitOptions): Promise<InitResult> {
  const { root, mode } = options;
  const templatesDir = options.templatesDir ?? defaultTemplatesDir();
  const written: string[] = [];

  await mkdir(root, { recursive: true });
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(join(root, ".superspec", "templates"), { recursive: true });

  if (await exists(join(root, "constitution.md"))) {
    throw new Error(
      "constitution.md already exists — init is one-time. Remove it only if you intend to re-initialize.",
    );
  }

  written.push(await writeConstitution(root, templatesDir, mode));
  written.push(await writeSuperspecReadme(root));

  const templateFiles = await scaffold(
    templatesDir,
    join(root, ".superspec", "templates"),
    { FEATURE: options.feature ?? "your-feature" },
  );
  written.push(...templateFiles);

  const gitkeep = join(root, "specs", ".gitkeep");
  if (!(await exists(gitkeep))) {
    await writeFile(gitkeep, "", "utf8");
    written.push(gitkeep);
  }

  if (mode === "full") {
    written.push(await writeProgram(root, templatesDir));
  }

  return { root, mode, written: written.sort() };
}
