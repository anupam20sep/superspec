import { describe, it, expect } from "vitest";
import { buildToolDefinitions } from "../src/mcp-server.js";

describe("MCP tool definitions", () => {
  it("exposes the expected tool names", () => {
    const names = buildToolDefinitions().map((t) => t.name).sort();
    expect(names).toEqual(["build-matrix", "forge-status", "lint-plan", "route-model", "scaffold"].sort());
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
    const res = await tool.handler({ complexity: "heavy" });
    expect(JSON.parse(res.content[0].text)).toEqual({ model: "strong" });
  });
});
