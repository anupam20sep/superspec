#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SHEBANG = "#!/usr/bin/env node\n";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const bins = ["cli.js", "mcp-server.js"];

for (const file of bins) {
  const path = join(root, file);
  let text = await readFile(path, "utf8");
  if (!text.startsWith("#!")) {
    text = SHEBANG + text;
  }
  await writeFile(path, text, "utf8");
}
