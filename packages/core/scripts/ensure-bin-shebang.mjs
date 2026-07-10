#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SHEBANG = "#!/usr/bin/env node\n";
const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const bins = [
  join(pkgRoot, "bin", "superspec.js"),
  join(pkgRoot, "dist", "cli.js"),
  join(pkgRoot, "dist", "mcp-server.js"),
];

for (const path of bins) {
  let text = await readFile(path, "utf8");
  if (!text.startsWith("#!")) {
    text = SHEBANG + text;
  }
  await writeFile(path, text, "utf8");
}
