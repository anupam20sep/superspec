import { mkdir, readFile, writeFile, access, readdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold } from "./scaffold.js";

export type InitMode = "lite" | "full";

export interface InitOptions {
  root: string;
  mode: InitMode;
  templatesDir?: string;
  feature?: string;
  verbose?: boolean;
}

export interface InitResult {
  ok: boolean;
  mode: InitMode;
  root: string;
  cwd: string;
  templatesDir: string;
  filesWritten: number;
  templateScaffoldCount: number;
  written: string[];
  log: string[];
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

async function countTierTemplates(templatesDir: string): Promise<number> {
  const entries = await readdir(templatesDir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith("-template.md")).length;
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

function rel(root: string, path: string): string {
  const r = resolve(path);
  const base = resolve(root);
  return r.startsWith(base) ? r.slice(base.length).replace(/^[/\\]/, "") || "." : r;
}

/** One-time repository bootstrap with a fixed layout (never arbitrary docs/ paths). */
export async function initProject(options: InitOptions): Promise<InitResult> {
  const { mode } = options;
  const root = resolve(options.root);
  const cwd = process.cwd();
  const templatesDir = resolve(options.templatesDir ?? defaultTemplatesDir());
  const log: string[] = [];
  const written: string[] = [];

  const note = (line: string): void => {
    log.push(line);
  };

  note(`SuperSpec init starting (mode=${mode})`);
  note(`cwd: ${cwd}`);
  note(`root: ${root}`);
  note(`templates: ${templatesDir}`);

  if (!(await exists(templatesDir))) {
    throw new Error(
      `Templates directory not found: ${templatesDir}. Reinstall @superspec-dev/core or pass --templates <path>.`,
    );
  }

  const sourceTemplateCount = await countTierTemplates(templatesDir);
  note(`found ${sourceTemplateCount} tier template(s) (*-template.md)`);
  if (sourceTemplateCount === 0) {
    throw new Error(
      `No *-template.md files in ${templatesDir}. Package install may be corrupt — try npx -y @superspec-dev/core@latest init`,
    );
  }

  if (await exists(join(root, "constitution.md"))) {
    throw new Error(
      `constitution.md already exists at ${join(root, "constitution.md")} — init is one-time. Delete it to re-initialize.`,
    );
  }

  await mkdir(root, { recursive: true });
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(join(root, ".superspec", "templates"), { recursive: true });
  note("created directories: specs/, .superspec/templates/");

  const constitutionPath = await writeConstitution(root, templatesDir, mode);
  written.push(constitutionPath);
  note(`wrote ${rel(root, constitutionPath)}`);

  const readmePath = await writeSuperspecReadme(root);
  written.push(readmePath);
  note(`wrote ${rel(root, readmePath)}`);

  const templateFiles = await scaffold(
    templatesDir,
    join(root, ".superspec", "templates"),
    { FEATURE: options.feature ?? "your-feature" },
  );
  if (templateFiles.length === 0) {
    throw new Error(
      `Scaffold wrote 0 templates from ${templatesDir} — expected ${sourceTemplateCount} file(s) in .superspec/templates/`,
    );
  }
  for (const p of templateFiles) {
    written.push(p);
    note(`wrote ${rel(root, p)}`);
  }

  const gitkeep = join(root, "specs", ".gitkeep");
  if (!(await exists(gitkeep))) {
    await writeFile(gitkeep, "", "utf8");
    written.push(gitkeep);
    note(`wrote ${rel(root, gitkeep)}`);
  }

  if (mode === "full") {
    const programPath = await writeProgram(root, templatesDir);
    written.push(programPath);
    note(`wrote ${rel(root, programPath)}`);
  }

  const sorted = written.map((p) => rel(root, p)).sort();
  note(`done: ${sorted.length} file(s) written under ${root}`);

  return {
    ok: true,
    mode,
    root,
    cwd,
    templatesDir,
    filesWritten: sorted.length,
    templateScaffoldCount: templateFiles.length,
    written: sorted,
    log,
  };
}

export function formatInitReport(result: InitResult): string {
  const lines = [
    `SuperSpec init: OK (${result.mode}) — ${result.filesWritten} file(s) at ${result.root}`,
    ...result.log.map((l) => `  ${l}`),
    "",
    JSON.stringify(result, null, 2),
  ];
  return lines.join("\n");
}

export function formatInitError(err: unknown, partial?: Partial<InitResult>): string {
  const message = err instanceof Error ? err.message : String(err);
  const payload = {
    ok: false,
    error: message,
    filesWritten: partial?.filesWritten ?? 0,
    written: partial?.written ?? [],
    log: partial?.log ?? [`SuperSpec init failed: ${message}`],
    cwd: process.cwd(),
  };
  return [`SuperSpec init: FAILED — ${message}`, "", JSON.stringify(payload, null, 2)].join("\n");
}
