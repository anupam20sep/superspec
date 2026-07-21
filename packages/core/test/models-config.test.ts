import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseModelsConfig,
  pickHarnessOverride,
  resolveDispatchModel,
} from "../src/models-config.js";

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

const NESTED = `
harness: cursor
tiers:
  economy:
    claude: haiku
    cursor: composer-2
    codex: gpt-5.4
roles:
  implementer:
    claude: claude-sonnet-4-6
    cursor: composer-2.5
  reviewer:
    claude: claude-sonnet-4-6
    cursor: composer-2.5
kinds:
  code: null
  verify:
    claude: sonnet
    cursor: composer-2.5
attempts:
  "1": null
  "2":
    claude: sonnet
    cursor: composer-2.5
  "3":
    claude: opus
    cursor: frontier-high
`;

describe("parseModelsConfig", () => {
  it("parses scalar nested yaml", () => {
    const c = parseModelsConfig(SAMPLE);
    expect(c.harness).toBe("claude");
    expect(c.tiers?.economy).toBe("haiku");
    expect(c.roles?.implementer).toBeNull();
    expect(c.kinds?.["doc-sync"]).toBe("haiku");
  });

  it("parses per-harness maps", () => {
    const c = parseModelsConfig(NESTED);
    expect(c.tiers?.economy).toEqual({
      claude: "haiku",
      cursor: "composer-2",
      codex: "gpt-5.4",
    });
    expect(c.roles?.implementer).toEqual({
      claude: "claude-sonnet-4-6",
      cursor: "composer-2.5",
    });
  });

  it("rejects unknown harness keys in maps", () => {
    expect(() =>
      parseModelsConfig(`
tiers:
  economy:
    gpt: nope
`),
    ).toThrow(/unknown harness key/);
  });
});

describe("pickHarnessOverride", () => {
  it("returns scalar for any harness", () => {
    expect(pickHarnessOverride("sonnet", "cursor")).toBe("sonnet");
    expect(pickHarnessOverride("sonnet", "claude")).toBe("sonnet");
  });

  it("picks map entry for active harness only", () => {
    const ref = { claude: "haiku", cursor: "composer-2" };
    expect(pickHarnessOverride(ref, "claude")).toBe("haiku");
    expect(pickHarnessOverride(ref, "cursor")).toBe("composer-2");
    expect(pickHarnessOverride(ref, "codex")).toBeUndefined();
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

  it("picks nested map entry by harness arg", async () => {
    const cfg = parseModelsConfig(NESTED);
    const claude = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "implementer",
      attempt: 1,
      harness: "claude",
      config: cfg,
    });
    const cursor = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "implementer",
      attempt: 1,
      harness: "cursor",
      config: cfg,
    });
    expect(claude.source).toBe("config-role");
    expect(claude.slug).toBe("claude-sonnet-4-6");
    expect(cursor.slug).toBe("composer-2.5");
  });

  it("falls through when harness key missing in map", async () => {
    const cfg = parseModelsConfig(`
roles:
  implementer:
    claude: sonnet
tiers:
  economy:
    claude: haiku
    cursor: composer-2
`);
    const r = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "implementer",
      attempt: 1,
      harness: "cursor",
      config: cfg,
    });
    // roles.implementer has no cursor → fall through to tiers.economy.cursor
    expect(r.source).toBe("config-tier");
    expect(r.slug).toBe("composer-2");
  });

  it("scalar still applies to all harnesses", async () => {
    const cfg = parseModelsConfig(`
roles:
  implementer: composer-2.5
`);
    for (const harness of ["cursor", "claude", "codex"] as const) {
      const r = await resolveDispatchModel({
        tier: "economy",
        role: "implementer",
        harness,
        config: cfg,
      });
      expect(r.slug).toBe("composer-2.5");
    }
  });

  it("nested attempt still beats role", async () => {
    const r = await resolveDispatchModel({
      tier: "economy",
      kind: "code",
      role: "reviewer",
      attempt: 3,
      harness: "claude",
      config: parseModelsConfig(NESTED),
    });
    expect(r.source).toBe("config-attempt");
    expect(r.slug).toBe("opus");
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
