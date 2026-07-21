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

/** Scalar slug, blank, or per-harness map (forge dual Cursor/Claude/Codex). */
export type ModelRef = string | null | Partial<Record<HarnessId, string | null>>;

export interface ModelsConfig {
  harness?: HarnessId;
  tiers?: Partial<Record<ModelTier, ModelRef>>;
  thinking?: Partial<Record<ModelTier, ThinkingHint | string | null>>;
  roles?: Partial<Record<RouteRole, ModelRef>>;
  kinds?: Partial<Record<TaskKind, ModelRef>>;
  attempts?: Record<string, ModelRef | undefined>;
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

const HARNESS_KEYS = new Set<string>(["cursor", "claude", "codex"]);

function isBlank(value: string | null | undefined): boolean {
  return value == null || String(value).trim() === "";
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

/**
 * Resolve a ModelRef for the active harness.
 * - string → same slug for every harness
 * - map → entry for `harness` only; missing/blank → undefined (fall through)
 */
export function pickHarnessOverride(
  value: ModelRef | undefined,
  harness: HarnessId,
): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    return isBlank(value) ? undefined : value.trim();
  }
  if (typeof value === "object") {
    const entry = value[harness];
    if (isBlank(entry ?? undefined)) return undefined;
    return String(entry).trim();
  }
  return undefined;
}

function parseModelRef(raw: unknown, path: string): ModelRef {
  if (raw == null) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const out: Partial<Record<HarnessId, string | null>> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!HARNESS_KEYS.has(k)) {
        throw new Error(`models.yaml ${path}: unknown harness key "${k}" (use cursor|claude|codex)`);
      }
      if (v == null) {
        out[k as HarnessId] = null;
      } else if (typeof v === "string") {
        out[k as HarnessId] = v;
      } else {
        throw new Error(`models.yaml ${path}.${k}: expected string or null`);
      }
    }
    return out;
  }
  throw new Error(`models.yaml ${path}: expected string, null, or harness map`);
}

function parseModelRefMap<K extends string>(
  raw: unknown,
  section: string,
): Partial<Record<K, ModelRef>> | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`models.yaml ${section}: expected a map`);
  }
  const out: Partial<Record<K, ModelRef>> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k as K] = parseModelRef(v, `${section}.${k}`);
  }
  return out;
}

export function parseModelsConfig(text: string): ModelsConfig {
  const raw = parseYaml(text) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return {};
  return {
    harness: asHarness(raw.harness),
    tiers: parseModelRefMap<ModelTier>(raw.tiers, "tiers"),
    thinking: (raw.thinking ?? undefined) as ModelsConfig["thinking"],
    roles: parseModelRefMap<RouteRole>(raw.roles, "roles"),
    kinds: parseModelRefMap<TaskKind>(raw.kinds, "kinds"),
    attempts: parseModelRefMap<string>(raw.attempts, "attempts") as ModelsConfig["attempts"],
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
 * Nested harness maps pick the entry for the active harness only.
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
  const thinkingHint =
    asThinking(config?.thinking?.[input.tier]) ?? builtin.thinkingHint;

  const kindModel = input.kind
    ? pickHarnessOverride(config?.kinds?.[input.kind], harness)
    : undefined;
  if (kindModel) {
    return {
      ...builtin,
      harness,
      slug: kindModel,
      thinkingHint,
      source: "config-kind",
      configPath,
    };
  }

  const attemptModel = pickHarnessOverride(config?.attempts?.[String(attempt)], harness);
  if (attemptModel) {
    return {
      ...builtin,
      harness,
      slug: attemptModel,
      thinkingHint,
      source: "config-attempt",
      configPath,
    };
  }

  const roleModel = pickHarnessOverride(config?.roles?.[role], harness);
  if (roleModel) {
    return {
      ...builtin,
      harness,
      slug: roleModel,
      thinkingHint,
      source: "config-role",
      configPath,
    };
  }

  const tierModel = pickHarnessOverride(config?.tiers?.[input.tier], harness);
  if (tierModel) {
    return {
      ...builtin,
      harness,
      slug: tierModel,
      thinkingHint,
      source: "config-tier",
      configPath,
    };
  }

  return {
    ...builtin,
    harness,
    thinkingHint,
    source: "builtin",
    configPath,
  };
}
