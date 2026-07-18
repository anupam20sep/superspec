import type { ModelTier } from "./model-router.js";

export type HarnessId = "cursor" | "claude" | "codex";

export type ThinkingHint = "minimal" | "medium" | "high";

export interface HarnessModelRecommendation {
  harness: HarnessId;
  tier: ModelTier;
  /** Closest illustrative slug/class for this harness — pick nearest available at dispatch. */
  slug: string;
  thinkingHint: ThinkingHint;
  /** Human-readable examples (not prescriptions). */
  examples: string[];
}

/**
 * Illustrative harness mapping (examples, not prescriptions).
 * Agents must pass `slug` (or the closest available equivalent) to Task({ model }) —
 * never invent vendor names from docs alone, and never copy these into execution-map.md.
 *
 * economy ≈ Composer / Haiku / GPT-5.4-class
 * standard ≈ Composer 2.5 / Sonnet 4.6–5 / GPT-5.5 medium
 * frontier ≈ strongest + high thinking / Opus 4.7–4.8 / GPT-5.5–5.6 high
 */
const HARNESS_MAP: Record<
  HarnessId,
  Record<ModelTier, Omit<HarnessModelRecommendation, "harness" | "tier">>
> = {
  cursor: {
    economy: {
      slug: "composer-economy",
      thinkingHint: "minimal",
      examples: ["Composer", "other fast/economy Cursor agents"],
    },
    standard: {
      slug: "composer-2.5",
      thinkingHint: "medium",
      examples: ["Composer 2.5", "Sonnet-class in Cursor"],
    },
    frontier: {
      slug: "frontier-high",
      thinkingHint: "high",
      examples: ["strongest available Cursor model + high thinking"],
    },
  },
  claude: {
    economy: {
      slug: "haiku",
      thinkingHint: "minimal",
      examples: ["Haiku-class"],
    },
    standard: {
      slug: "sonnet",
      thinkingHint: "medium",
      examples: ["Sonnet 4.6", "Sonnet 5"],
    },
    frontier: {
      slug: "opus",
      thinkingHint: "high",
      examples: ["Opus 4.7", "Opus 4.8 high thinking"],
    },
  },
  codex: {
    economy: {
      slug: "gpt-5.4",
      thinkingHint: "minimal",
      examples: ["GPT-5.4-class"],
    },
    standard: {
      slug: "gpt-5.5",
      thinkingHint: "medium",
      examples: ["GPT-5.5 medium"],
    },
    frontier: {
      slug: "gpt-5.5-high",
      thinkingHint: "high",
      examples: ["GPT-5.5 / 5.6 high thinking"],
    },
  },
};

export function mapHarnessModel(
  tier: ModelTier,
  harness: HarnessId = "cursor",
): HarnessModelRecommendation {
  const entry = HARNESS_MAP[harness][tier];
  return { harness, tier, ...entry };
}

export function listHarnessModels(harness: HarnessId = "cursor"): HarnessModelRecommendation[] {
  return (["economy", "standard", "frontier"] as ModelTier[]).map((tier) =>
    mapHarnessModel(tier, harness),
  );
}
