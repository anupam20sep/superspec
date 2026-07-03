import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`,
  );
}

export async function scaffold(
  templatesDir: string,
  targetDir: string,
  vars: Record<string, string>,
): Promise<string[]> {
  const written: string[] = [];
  await mkdir(targetDir, { recursive: true });

  const entries = await readdir(templatesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith("-template.md")) continue;
    const raw = await readFile(join(templatesDir, entry.name), "utf8");
    const rendered = interpolate(raw, vars);
    const outName = entry.name.replace(/-template\.md$/, ".md");
    const outPath = join(targetDir, outName);
    await writeFile(outPath, rendered, "utf8");
    written.push(outPath);
  }

  return written.sort();
}
