import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { TaskKind } from "./types.js";
import type { ModelTier, RouteRole } from "./model-router.js";
import {
  mapHarnessModel,
  type HarnessId,
  type ThinkingHint,
  type HarnessModelRecommendation,
} from "./harness-model-map.js";

export interface ModelsConfig {
  harness?: HarnessId;
  tiers?: Partial<Record<ModelTier, string | null>>;
  thinking?: Partial<Record<ModelTier, ThinkingHint | string | null>>;
  roles?: Partial<Record<RouteRole, string | null>>;
  kinds?: Partial<Record<TaskKind, string | null>>;
  attempts?: Record<string, string | null | undefined>;
}

export interface ResolveDispatchModelInput {
  tier: ModelTier;
  role?: RouteRole;
  kind?: TaskKind;
  attempt?: number;
  harness?: HarnessId;
  /** Project root that may contain .superspec/models.yaml */
  projectRoot?: string;
  /** Pre-loaded config (tests); skips disk when set */
  config?: ModelsConfig | null;
}

export interface ResolvedDispatchModel extends HarnessModelRecommendation {
  source: "config-kind" | "config-role" | "config-attempt" | "config-tier" | "builtin";
  configPath: string | null;
}

function isBlank(value: string | null | undefined): boolean {
  return value == null || String(value).trim() === "";
}

function asModel(value: string | null | undefined): string | undefined {
  if (isBlank(value)) return undefined;
  return String(value).trim();
}

function asThinking(value: string | null | undefined): ThinkingHint | undefined {
  if (isBlank(value)) return undefined;
  const v = String(value).trim().toLowerCase();
  if (v === "minimal" || v === "medium" || v === "high") return v;
  return undefined;
}

function asHarness(value: unknown): HarnessId | undefined {
  if (value === "cursor" || value === "claude" || value === "codex") return value;
  return undefined;
}

export function parseModelsConfig(text: string): ModelsConfig {
  const raw = parseYaml(text) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return {};
  return {
    harness: asHarness(raw.harness),
    tiers: (raw.tiers ?? undefined) as ModelsConfig["tiers"],
    thinking: (raw.thinking ?? undefined) as ModelsConfig["thinking"],
    roles: (raw.roles ?? undefined) as ModelsConfig["roles"],
    kinds: (raw.kinds ?? undefined) as ModelsConfig["kinds"],
    attempts: (raw.attempts ?? undefined) as ModelsConfig["attempts"],
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load optional models config. Missing file → null (use skill/builtin defaults).
 * Prefers `<projectRoot>/.superspec/models.yaml`, then `~/.superspec/models.yaml`.
 */
export async function loadModelsConfig(
  projectRoot?: string,
): Promise<{ config: ModelsConfig; path: string } | null> {
  const candidates: string[] = [];
  if (projectRoot) {
    candidates.push(join(resolve(projectRoot), ".superspec", "models.yaml"));
  }
  candidates.push(join(homedir(), ".superspec", "models.yaml"));

  for (const path of candidates) {
    if (!(await exists(path))) continue;
    const text = await readFile(path, "utf8");
    return { config: parseModelsConfig(text), path };
  }
  return null;
}

/**
 * Resolve concrete model slug for dispatch.
 * Order: kinds → attempts → roles → tiers → built-in harness map.
 * Attempt overrides run before role so forge review ladders can escalate
 * even when roles.reviewer is set. Null/blank values fall through.
 */
export async function resolveDispatchModel(
  input: ResolveDispatchModelInput,
): Promise<ResolvedDispatchModel> {
  const loaded =
    input.config !== undefined
      ? input.config
        ? { config: input.config, path: "(inline)" }
        : null
      : await loadModelsConfig(input.projectRoot);

  const config = loaded?.config;
  const configPath = loaded?.path ?? null;
  const harness: HarnessId =
    input.harness ?? config?.harness ?? "cursor";
  const builtin = mapHarnessModel(input.tier, harness);
  const role: RouteRole = input.role ?? "implementer";
  const attempt = Math.max(1, input.attempt ?? 1);

  const kindModel = input.kind ? asModel(config?.kinds?.[input.kind]) : undefined;
  if (kindModel) {
    return {
      ...builtin,
      harness,
      slug: kindModel,
      thinkingHint: asThinking(config?.thinking?.[input.tier]) ?? builtin.thinkingHint,
      source: "config-kind",
      configPath,
    };
  }

  const attemptModel = asModel(config?.attempts?.[String(attempt)]);
  if (attemptModel) {
    return {
      ...builtin,
      harness,
      slug: attemptModel,
      thinkingHint: asThinking(config?.thinking?.[input.tier]) ?? builtin.thinkingHint,
      source: "config-attempt",
      configPath,
    };
  }

  const roleModel = asModel(config?.roles?.[role]);
  if (roleModel) {
    return {
      ...builtin,
      harness,
      slug: roleModel,
      thinkingHint: asThinking(config?.thinking?.[input.tier]) ?? builtin.thinkingHint,
      source: "config-role",
      configPath,
    };
  }

  const tierModel = asModel(config?.tiers?.[input.tier]);
  if (tierModel) {
    return {
      ...builtin,
      harness,
      slug: tierModel,
      thinkingHint: asThinking(config?.thinking?.[input.tier]) ?? builtin.thinkingHint,
      source: "config-tier",
      configPath,
    };
  }

  return {
    ...builtin,
    harness,
    thinkingHint: asThinking(config?.thinking?.[input.tier]) ?? builtin.thinkingHint,
    source: "builtin",
    configPath,
  };
}
