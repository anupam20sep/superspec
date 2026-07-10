import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** True when this module is the process entry script (npm bin / npx / node dist/cli.js). */
export function isDirectRun(moduleUrl: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    return resolve(fileURLToPath(moduleUrl)) === resolve(argv1);
  } catch {
    return false;
  }
}
