import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseModelsConfig, resolveDispatchModel } from "../src/models-config.js";

const SAMPLE = `
harness: claude
tiers:
  economy: haiku
  standard: sonnet
  frontier: opus
thinking:
  economy: minimal
  standard: medium
  frontier: high
roles:
  implementer: null
  reviewer: sonnet
kinds:
  code: null
  verify: sonnet
  provision: null
  signoff: sonnet
  doc-sync: haiku
attempts:
  "1": null
  "2": sonnet
  "3": opus
`;

describe("parseModelsConfig", () => {
  it("parses one-level nested yaml", () => {
    const c = parseModelsConfig(SAMPLE);
    expect(c.harness).toBe("claude");
    expect(c.tiers?.economy).toBe("haiku");
    expect(c.roles?.implementer).toBeNull();
    expect(c.kinds?.["doc-sync"]).toBe("haiku");
  });
});

describe("resolveDispatchModel", () => {
  it("uses builtin when no config", async () => {
    const r = await resolveDispatchModel({ tier: "economy", config: null, harness: "cursor" });
    expect(r.source).toBe("builtin");
    expect(r.slug).toBeTruthy();
  });

  it("prefers kind over tier", async () => {
    const r = await resolveDispatchModel({
      tier: "economy",
      kind: "verify",
      role: "implementer",
      config: parseModelsConfig(SAMPLE),
    });
    expect(r.source).toBe("config-kind");
    expect(r.slug).toBe("sonnet");
  });

  it("uses role when kind is blank", async () => {
    const r = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "reviewer",
      attempt: 1,
      config: parseModelsConfig(SAMPLE),
    });
    expect(r.source).toBe("config-role");
    expect(r.slug).toBe("sonnet");
  });

  it("prefers attempt over role so review ladders can escalate", async () => {
    const r = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "reviewer",
      attempt: 3,
      config: parseModelsConfig(SAMPLE),
    });
    expect(r.source).toBe("config-attempt");
    expect(r.slug).toBe("opus");
  });

  it("uses attempt when kind and role blank", async () => {
    const r = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "implementer",
      attempt: 3,
      config: parseModelsConfig(SAMPLE),
    });
    expect(r.source).toBe("config-attempt");
    expect(r.slug).toBe("opus");
  });

  it("uses tier when others blank", async () => {
    const r = await resolveDispatchModel({
      tier: "frontier",
      kind: "code",
      role: "implementer",
      attempt: 1,
      config: parseModelsConfig(SAMPLE),
    });
    expect(r.source).toBe("config-tier");
    expect(r.slug).toBe("opus");
    expect(r.thinkingHint).toBe("high");
  });

  it("loads from project .superspec/models.yaml when present", async () => {
    const root = await mkdtemp(join(tmpdir(), "superspec-models-"));
    try {
      await mkdir(join(root, ".superspec"), { recursive: true });
      await writeFile(join(root, ".superspec", "models.yaml"), SAMPLE, "utf8");
      const r = await resolveDispatchModel({
        tier: "economy",
        kind: "doc-sync",
        projectRoot: root,
      });
      expect(r.source).toBe("config-kind");
      expect(r.slug).toBe("haiku");
      expect(r.configPath).toContain("models.yaml");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
