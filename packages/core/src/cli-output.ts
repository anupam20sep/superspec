import type { InitResult } from "./init.js";
import { formatInitError, formatInitReport } from "./init.js";

export function emitInitSuccess(result: InitResult, verbose: boolean): string {
  if (verbose) return formatInitReport(result);
  return JSON.stringify(result, null, 2);
}

export function emitInitFailure(err: unknown): string {
  return formatInitError(err);
}
