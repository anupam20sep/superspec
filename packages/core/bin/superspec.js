#!/usr/bin/env node
/**
 * npm/npx bin entry — always runs the CLI (do not rely on dist/cli.js self-detection).
 */
import { runCliMain } from "../dist/cli.js";

try {
  const code = await runCliMain(process.argv.slice(2));
  process.exitCode = code;
} catch (err) {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
}
