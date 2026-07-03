import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { parseSpec } from "./spec-parser.js";
import { parsePlan } from "./plan-parser.js";
import { buildMatrix, matrixGaps } from "./matrix.js";
import { lintPlan } from "./plan-lint.js";
import { scaffold } from "./scaffold.js";

export interface CliResult {
  code: number;
  stdout: string;
}

export async function runCli(argv: string[]): Promise<CliResult> {
  const [command, ...rest] = argv;

  if (command === "matrix") {
    const { values } = parseArgs({
      args: rest,
      options: { spec: { type: "string" }, plan: { type: "string" } },
    });
    const missing = [
      values.spec === undefined ? "--spec" : null,
      values.plan === undefined ? "--plan" : null,
    ].filter((x): x is string => x !== null);
    if (missing.length > 0) {
      return { code: 0, stdout: `Error: missing required argument ${missing.join(", ")}` };
    }
    try {
      const spec = parseSpec(await readFile(values.spec as string, "utf8"));
      const tasks = parsePlan(await readFile(values.plan as string, "utf8"));
      const matrix = buildMatrix(spec.requirements, tasks);
      return { code: 0, stdout: JSON.stringify({ matrix, gaps: matrixGaps(matrix) }, null, 2) };
    } catch (err) {
      return { code: 0, stdout: `Error: ${(err as Error).message}` };
    }
  }

  if (command === "lint") {
    const { values } = parseArgs({ args: rest, options: { plan: { type: "string" } } });
    if (values.plan === undefined) {
      return { code: 0, stdout: "Error: missing required argument --plan" };
    }
    try {
      const findings = lintPlan(await readFile(values.plan as string, "utf8"));
      return { code: 0, stdout: JSON.stringify(findings, null, 2) };
    } catch (err) {
      return { code: 0, stdout: `Error: ${(err as Error).message}` };
    }
  }

  if (command === "scaffold") {
    const { values } = parseArgs({
      args: rest,
      options: { templates: { type: "string" }, out: { type: "string" } },
    });
    const missing = [
      values.templates === undefined ? "--templates" : null,
      values.out === undefined ? "--out" : null,
    ].filter((x): x is string => x !== null);
    if (missing.length > 0) {
      return { code: 0, stdout: `Error: missing required argument ${missing.join(", ")}` };
    }
    try {
      const written = await scaffold(values.templates as string, values.out as string, {});
      return { code: 0, stdout: JSON.stringify({ written }, null, 2) };
    } catch (err) {
      return { code: 0, stdout: `Error: ${(err as Error).message}` };
    }
  }

  return { code: 0, stdout: `Unknown command: ${command ?? "(none)"}. Try: matrix | lint | scaffold` };
}

async function main(): Promise<void> {
  const { stdout } = await runCli(process.argv.slice(2));
  process.stdout.write(stdout + "\n");
}

// Run main only when invoked directly as the CLI entry point.
if (process.argv[1] && process.argv[1].endsWith("cli.js")) {
  void main();
}
