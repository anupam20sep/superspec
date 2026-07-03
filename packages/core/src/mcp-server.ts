import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseSpec } from "./spec-parser.js";
import { parsePlan } from "./plan-parser.js";
import { buildMatrix, matrixGaps } from "./matrix.js";
import { lintPlan } from "./plan-lint.js";
import { routeModel } from "./model-router.js";
import { scaffold } from "./scaffold.js";
import { initState, forgeStatus } from "./forge-loop.js";

interface ToolContent {
  content: { type: "text"; text: string }[];
}

export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: Record<string, unknown>) => Promise<ToolContent>;
}

function json(value: unknown): ToolContent {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

export function buildToolDefinitions(): ToolDef[] {
  return [
    {
      name: "build-matrix",
      description: "Build the FR-to-task coverage matrix from spec and plan text.",
      schema: { specText: z.string(), planText: z.string() },
      handler: async (args) => {
        const spec = parseSpec(args.specText as string);
        const tasks = parsePlan(args.planText as string);
        const matrix = buildMatrix(spec.requirements, tasks);
        return json({ matrix, gaps: matrixGaps(matrix) });
      },
    },
    {
      name: "lint-plan",
      description: "Lint plan text for placeholders and missing TDD cycles.",
      schema: { planText: z.string() },
      handler: async (args) => json(lintPlan(args.planText as string)),
    },
    {
      name: "route-model",
      description: "Recommend strong or fast model for a task complexity.",
      schema: { complexity: z.enum(["mechanical", "heavy"]) },
      handler: async (args) => json({ model: routeModel({ complexity: args.complexity as "mechanical" | "heavy" }) }),
    },
    {
      name: "scaffold",
      description: "Render tier templates into a target directory.",
      schema: { templatesDir: z.string(), targetDir: z.string() },
      handler: async (args) => json({ written: await scaffold(args.templatesDir as string, args.targetDir as string, {}) }),
    },
    {
      name: "forge-status",
      description: "Report forge completion status for a set of plan tasks (fresh state).",
      schema: { planText: z.string() },
      handler: async (args) => json(forgeStatus(initState(parsePlan(args.planText as string)))),
    },
  ];
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "superspec", version: "0.1.0" });
  for (const tool of buildToolDefinitions()) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.schema },
      async (args: Record<string, unknown>) => {
        const result = await tool.handler(args);
        return result as ToolContent & { [x: string]: unknown };
      },
    );
  }
  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && process.argv[1].endsWith("mcp-server.js")) {
  void main();
}
