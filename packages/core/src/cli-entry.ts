import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

/** True when this module is the process entry script (node dist/cli.js). */
export function isDirectRun(moduleUrl: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    const modulePath = resolve(fileURLToPath(moduleUrl));
    const entry = resolve(argv1);
    if (modulePath === entry) return true;
    if (process.platform === "win32" && modulePath.toLowerCase() === entry.toLowerCase()) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function binEntryName(argv1: string | undefined): string {
  if (!argv1) return "";
  return basename(argv1).replace(/\.(cmd|ps1|exe)$/i, "");
}

