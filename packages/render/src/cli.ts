import { fileURLToPath } from "node:url";
import { render } from "./render.js";
import { INTEGRATION_REGISTRY } from "./targets.js";

export async function runRender(contentSkillsDir: string, outRoot: string): Promise<string[]> {
  const all: string[] = [];
  for (const target of INTEGRATION_REGISTRY) {
    all.push(...(await render(contentSkillsDir, target, outRoot)));
  }
  return all;
}

async function main(): Promise<void> {
  const written = await runRender("content/skills", ".");
  process.stdout.write(written.join("\n") + "\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
