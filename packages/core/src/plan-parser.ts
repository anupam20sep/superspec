import type { Task, Complexity, TaskKind } from "./types.js";

const TASK_RE = /^###\s+Task\s+([\w.]+):\s*(.+)/;
const IMPL_RE = /^\*\*Implements:\*\*\s*(.+)/i;
const DEP_RE = /^\*\*Depends on:\*\*\s*(.+)/i;
const CX_RE = /^\*\*Complexity:\*\*\s*(mechanical|moderate|complex)/i;
const KIND_RE = /^\*\*Kind:\*\*\s*(code|verify|provision|signoff|doc-sync)/i;
const KIND_TAG_RE = /\[Kind:\s*(code|verify|provision|signoff|doc-sync)\s*\]/i;
/** Bare FR-### (exactly three digits). Qualifiers after the id are ignored. */
const FR_ID_RE = /\b(FR-\d{3})\b/gi;
/** Malformed FR tokens (not exactly three digits) — for optional lint/warnings. */
const FR_LOOSE_RE = /\bFR-(\d+)\b/gi;
/** T-prefixed task ids that start with a digit after T (T001, T0.1). */
const T_TASK_ID_RE = /\b(T\d[\w.]*)\b/gi;
/** Decimal task ids used as headings (0.1, 5.3). */
const DECIMAL_TASK_ID_RE = /\b(\d+\.\d+)\b/g;
/**
 * Bare integer as a Depends-on list token (start / after comma / end), not prose like "Node 18".
 * Not part of a decimal like 0.1.
 */
const BARE_INT_TOKEN_RE = /(?:^|[,;])\s*(\d+)(?!\.\d)\s*(?=[,;]|$)/g;

const KINDS = new Set<TaskKind>(["code", "verify", "provision", "signoff", "doc-sync"]);

/** Canonicalize T-prefixed ids (t002 → T002). Other ids unchanged. */
export function normalizeTaskId(id: string): string {
  return /^t\d/i.test(id) ? `T${id.slice(1)}` : id;
}

/**
 * Extract bare FR-### ids from Implements text.
 * Qualifiers like "FR-002 (config bootstrap part)" still yield "FR-002".
 */
export function extractFrRefs(text: string): string[] {
  if (/^\s*none\s*$/i.test(text)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(FR_ID_RE)) {
    const id = m[1].toUpperCase();
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** FR-\d+ tokens that are not exactly FR-### (e.g. FR-1, FR-0010). */
export function findMalformedFrRefs(text: string): string[] {
  if (/^\s*none\s*$/i.test(text)) return [];
  const bad: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(FR_LOOSE_RE)) {
    const digits = m[1];
    const full = `FR-${digits}`;
    if (digits.length === 3) continue;
    if (!seen.has(full)) {
      seen.add(full);
      bad.push(full);
    }
  }
  return bad;
}

/**
 * Extract dependency task ids from Depends-on text.
 * Forms: T\d…, decimal (0.1), and bare integers when present in knownIds.
 * Never matches prose like "The" / "TODO".
 * When `knownIds` is provided, keep only ids that exist in the plan.
 */
export function extractTaskDeps(text: string, knownIds?: ReadonlySet<string>): string[] {
  if (/^\s*none\s*$/i.test(text)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => {
    const canonical = normalizeTaskId(id);
    if (knownIds && !knownIds.has(canonical) && !knownIds.has(id)) return;
    const keep = knownIds?.has(canonical) ? canonical : knownIds?.has(id) ? id : canonical;
    if (knownIds && !knownIds.has(keep)) return;
    if (!seen.has(keep)) {
      seen.add(keep);
      ids.push(keep);
    }
  };
  for (const m of text.matchAll(T_TASK_ID_RE)) push(m[1]);
  for (const m of text.matchAll(DECIMAL_TASK_ID_RE)) push(m[1]);
  // Bare integers only as list tokens when present in knownIds (avoids "Node 18").
  if (knownIds) {
    for (const m of text.matchAll(BARE_INT_TOKEN_RE)) {
      if (knownIds.has(m[1])) push(m[1]);
    }
  }
  return ids;
}

function kindFromTitle(title: string): { kind: TaskKind | null; title: string } {
  const m = KIND_TAG_RE.exec(title);
  if (!m) return { kind: null, title };
  const kind = m[1].toLowerCase() as TaskKind;
  if (!KINDS.has(kind)) return { kind: null, title };
  const cleaned = title.replace(KIND_TAG_RE, "").replace(/\s+/g, " ").trim();
  return { kind, title: cleaned };
}

export function parsePlan(markdown: string): Task[] {
  const tasks: Task[] = [];
  let current: Task | null = null;
  /** Raw Depends-on text per task — resolved after all headings are known. */
  const pendingDeps = new Map<string, string>();

  const flush = () => {
    if (current) tasks.push(current);
  };

  for (const line of markdown.split("\n")) {
    const t = TASK_RE.exec(line);
    if (t) {
      flush();
      const id = normalizeTaskId(t[1]);
      const rawTitle = t[2].trim();
      const fromTitle = kindFromTitle(rawTitle);
      current = {
        id,
        title: fromTitle.title,
        frRefs: [],
        dependsOn: [],
        complexity: "mechanical",
        kind: fromTitle.kind ?? "code",
      };
      continue;
    }
    if (!current) continue;

    const impl = IMPL_RE.exec(line);
    if (impl) {
      current.frRefs = extractFrRefs(impl[1]);
      continue;
    }
    const dep = DEP_RE.exec(line);
    if (dep) {
      pendingDeps.set(current.id, dep[1]);
      continue;
    }
    const cx = CX_RE.exec(line);
    if (cx) {
      current.complexity = cx[1].toLowerCase() as Complexity;
      continue;
    }
    const kind = KIND_RE.exec(line);
    if (kind) {
      // Explicit **Kind:** wins over [Kind: …] in the heading.
      current.kind = kind[1].toLowerCase() as TaskKind;
    }
  }

  flush();

  const knownIds = new Set(tasks.map((t) => t.id));
  for (const task of tasks) {
    const raw = pendingDeps.get(task.id);
    if (raw) task.dependsOn = extractTaskDeps(raw, knownIds);
  }

  return tasks;
}
