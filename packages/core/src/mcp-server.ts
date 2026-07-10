import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseSpec } from "./spec-parser.js";
import { parsePlan } from "./plan-parser.js";
import { buildMatrix, matrixGaps } from "./matrix.js";
import { lintPlan } from "./plan-lint.js";
import { lintDesign, lintDesignText } from "./design-lint.js";
import { lintSpec } from "./spec-lint.js";
import { routeModel } from "./model-router.js";
import { scaffold } from "./scaffold.js";
import { initState, forgeStatus, nextTask, recordResult, loadState, saveState, markInProgress } from "./forge-loop.js";
import { discoverPersonas } from "./persona-discovery.js";
import { initProject } from "./init.js";
import { buildStatusSnapshot, writeStatusFile } from "./fr-status.js";

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
      name: "lint-spec",
      description: "Lint spec.md for type, FR/SC completeness, placeholders, and clarification count.",
      schema: { specText: z.string() },
      handler: async (args) => json(lintSpec(args.specText as string)),
    },
    {
      name: "lint-design",
      description: "Lint design.md for incomplete decisions, NEEDS CLARIFICATION, and contract table shape.",
      schema: { designText: z.string() },
      handler: async (args) => json(lintDesignText(args.designText as string)),
    },
    {
      name: "route-model",
      description: "Recommend strong or fast model for a task complexity.",
      schema: { complexity: z.enum(["mechanical", "moderate", "complex"]) },
      handler: async (args) => json({ model: routeModel({ complexity: args.complexity as "mechanical" | "moderate" | "complex" }) }),
    },
    {
      name: "scaffold",
      description: "Render tier templates into a target directory.",
      schema: { templatesDir: z.string(), targetDir: z.string() },
      handler: async (args) => json({ written: await scaffold(args.templatesDir as string, args.targetDir as string, {}) }),
    },
    {
      name: "init",
      description:
        "Bootstrap SuperSpec in a repository: constitution.md at root, specs/, .superspec/templates/, optional program.md (full mode).",
      schema: {
        root: z.string(),
        mode: z.enum(["lite", "full"]),
        templatesDir: z.string().optional(),
        feature: z.string().optional(),
      },
      handler: async (args) =>
        json(
          await initProject({
            root: args.root as string,
            mode: args.mode as "lite" | "full",
            templatesDir: args.templatesDir as string | undefined,
            feature: args.feature as string | undefined,
          }),
        ),
    },
    {
      name: "sync-status",
      description:
        "Write or refresh specs/<feature>/status.md from spec, plan, and persisted forge state (FR + task progress).",
      schema: {
        specDir: z.string(),
        specText: z.string(),
        planText: z.string(),
        stateDir: z.string().optional(),
      },
      handler: async (args) => {
        const tasks = parsePlan(args.planText as string);
        const stateDir = args.stateDir as string | undefined;
        const state =
          stateDir !== undefined
            ? ((await loadState(stateDir)) ?? initState(tasks))
            : initState(tasks);
        const path = await writeStatusFile(
          args.specDir as string,
          args.specText as string,
          args.planText as string,
          state,
        );
        const snapshot = buildStatusSnapshot(
          args.specText as string,
          args.planText as string,
          state,
        );
        return json({ path, snapshot });
      },
    },
    {
      name: "begin-task",
      description: "Mark a forge task as in_progress and persist state.",
      schema: { planText: z.string(), stateDir: z.string(), taskId: z.string() },
      handler: async (args) => {
        const tasks = parsePlan(args.planText as string);
        const state = (await loadState(args.stateDir as string)) ?? initState(tasks);
        markInProgress(state, args.taskId as string);
        await saveState(args.stateDir as string, state);
        return json({ ok: true });
      },
    },
    {
      name: "next-task",
      description: "Return the next DAG-ready pending task from persisted forge state.",
      schema: { planText: z.string(), stateDir: z.string() },
      handler: async (args) => {
        const tasks = parsePlan(args.planText as string);
        const state = (await loadState(args.stateDir as string)) ?? initState(tasks);
        return json({ task: nextTask(tasks, state) });
      },
    },
    {
      name: "record-result",
      description: "Record a pass/fail review verdict for a task and persist forge state.",
      schema: {
        planText: z.string(),
        stateDir: z.string(),
        taskId: z.string(),
        passed: z.boolean(),
        specText: z.string().optional(),
        specDir: z.string().optional(),
      },
      handler: async (args) => {
        const tasks = parsePlan(args.planText as string);
        const state = (await loadState(args.stateDir as string)) ?? initState(tasks);
        recordResult(state, args.taskId as string, args.passed as boolean, {
          maxReviewFailures: 3,
        });
        await saveState(args.stateDir as string, state);
        let statusPath: string | undefined;
        const specText = args.specText as string | undefined;
        const specDir = args.specDir as string | undefined;
        if (specText !== undefined && specDir !== undefined) {
          statusPath = await writeStatusFile(
            specDir,
            specText,
            args.planText as string,
            state,
          );
        }
        return json({ ok: true, statusPath });
      },
    },
    {
      name: "forge-status",
      description:
        "Report forge completion status for plan tasks. Loads persisted state from stateDir when provided; otherwise uses fresh state.",
      schema: { planText: z.string(), stateDir: z.string().optional() },
      handler: async (args) => {
        const tasks = parsePlan(args.planText as string);
        const stateDir = args.stateDir as string | undefined;
        const state =
          stateDir !== undefined
            ? ((await loadState(stateDir)) ?? initState(tasks))
            : initState(tasks);
        return json(forgeStatus(state));
      },
    },
    {
      name: "list-personas",
      description:
        "List specialized sub-agent personas discovered in the target project's .claude/agents and .cursor/agents directories.",
      schema: { claudeAgentsDir: z.string().optional(), cursorAgentsDir: z.string().optional() },
      handler: async (args) =>
        json(
          await discoverPersonas({
            claude: args.claudeAgentsDir as string | undefined,
            cursor: args.cursorAgentsDir as string | undefined,
          }),
        ),
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

export async function runMcpServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && process.argv[1].endsWith("mcp-server.js")) {
  void runMcpServer();
}
