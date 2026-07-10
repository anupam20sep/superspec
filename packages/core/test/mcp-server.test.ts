import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { buildToolDefinitions } from "../src/mcp-server.js";

describe("MCP tool definitions", () => {
  it("exposes the expected tool names", () => {
    const names = buildToolDefinitions().map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "begin-task",
        "build-matrix",
        "forge-status",
        "init",
        "lint-design",
        "lint-plan",
        "lint-spec",
        "list-personas",
        "next-task",
        "record-result",
        "route-model",
        "scaffold",
        "sync-status",
      ].sort(),
    );
  });

  it("build-matrix handler returns matrix + gaps as JSON text", async () => {
    const tool = buildToolDefinitions().find((t) => t.name === "build-matrix")!;
    const res = await tool.handler({
      specText: "- **FR-001**: a\n- **FR-002**: b",
      planText: "### Task T001: x\n**Implements:** FR-001",
    });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.gaps).toEqual(["FR-002"]);
  });

  it("route-model handler routes by complexity", async () => {
    const tool = buildToolDefinitions().find((t) => t.name === "route-model")!;
    const res = await tool.handler({ complexity: "complex" });
    expect(JSON.parse(res.content[0].text)).toEqual({ model: "strong" });
  });

  it("route-model handler routes moderate complexity to fast model", async () => {
    const tool = buildToolDefinitions().find((t) => t.name === "route-model")!;
    const res = await tool.handler({ complexity: "moderate" });
    expect(JSON.parse(res.content[0].text)).toEqual({ model: "fast" });
  });

  it("route-model schema accepts moderate and complex complexity values", () => {
    const tool = buildToolDefinitions().find((t) => t.name === "route-model")!;
    const schema = z.object(tool.schema);
    expect(() => schema.parse({ complexity: "moderate" })).not.toThrow();
    expect(() => schema.parse({ complexity: "complex" })).not.toThrow();
  });
});

const FORGE_PLAN =
  "### Task T001: First\n**Implements:** FR-001\n\n### Task T002: Second\n**Implements:** FR-002\n**Depends on:** T001\n";

describe("forge loop MCP tools persisted round-trip", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "superspec-mcp-forge-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("next-task, record-result, and forge-status persist state across calls", async () => {
    const nextTool = buildToolDefinitions().find((t) => t.name === "next-task")!;
    const recordTool = buildToolDefinitions().find((t) => t.name === "record-result")!;
    const statusTool = buildToolDefinitions().find((t) => t.name === "forge-status")!;

    const first = JSON.parse(
      (await nextTool.handler({ planText: FORGE_PLAN, stateDir: root })).content[0].text,
    );
    expect(first.task.id).toBe("T001");

    await recordTool.handler({
      planText: FORGE_PLAN,
      stateDir: root,
      taskId: "T001",
      passed: true,
    });

    const second = JSON.parse(
      (await nextTool.handler({ planText: FORGE_PLAN, stateDir: root })).content[0].text,
    );
    expect(second.task.id).toBe("T002");

    const status = JSON.parse(
      (await statusTool.handler({ planText: FORGE_PLAN, stateDir: root })).content[0].text,
    );
    expect(status).toEqual({
      total: 2,
      done: 1,
      blocked: 0,
      pending: 1,
      inProgress: 0,
      complete: false,
    });
  });

  it("forge-status without stateDir uses fresh state", async () => {
    const statusTool = buildToolDefinitions().find((t) => t.name === "forge-status")!;
    const status = JSON.parse((await statusTool.handler({ planText: FORGE_PLAN })).content[0].text);
    expect(status).toEqual({
      total: 2,
      done: 0,
      blocked: 0,
      pending: 2,
      inProgress: 0,
      complete: false,
    });
  });
});

describe("list-personas MCP tool", () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "superspec-mcp-persona-"));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("discovers personas from claude and cursor agents dirs", async () => {
    const claudeDir = join(root, ".claude", "agents");
    const cursorDir = join(root, ".cursor", "agents");
    await mkdir(claudeDir, { recursive: true });
    await mkdir(cursorDir, { recursive: true });
    await writeFile(
      join(claudeDir, "backend-developer.md"),
      "---\nname: backend-developer\ndescription: Server-side work.\n---\n\nBody",
      "utf8",
    );
    await writeFile(
      join(cursorDir, "frontend-developer.md"),
      "---\nname: frontend-developer\ndescription: UI work.\n---\n\nBody",
      "utf8",
    );

    const tool = buildToolDefinitions().find((t) => t.name === "list-personas")!;
    const res = await tool.handler({ claudeAgentsDir: claudeDir, cursorAgentsDir: cursorDir });
    const payload = JSON.parse(res.content[0].text);

    expect(payload).toHaveLength(2);
    expect(payload.map((p: { name: string }) => p.name).sort()).toEqual([
      "backend-developer",
      "frontend-developer",
    ]);
  });

  it("returns [] when called with no args", async () => {
    const tool = buildToolDefinitions().find((t) => t.name === "list-personas")!;
    const res = await tool.handler({});
    expect(JSON.parse(res.content[0].text)).toEqual([]);
  });
});
