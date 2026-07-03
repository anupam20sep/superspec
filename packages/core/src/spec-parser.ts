import type { Spec, Requirement, SuccessCriterion } from "./types.js";

const FR_RE = /\*\*(FR-\d{3})\*\*:?\s*(.+)/;
const SC_RE = /\*\*(SC-\d{3})\*\*:?\s*(.+)/;

export function parseSpec(markdown: string): Spec {
  const requirements: Requirement[] = [];
  const criteria: SuccessCriterion[] = [];

  for (const line of markdown.split("\n")) {
    const fr = FR_RE.exec(line);
    if (fr) {
      requirements.push({ id: fr[1], text: fr[2].trim() });
      continue;
    }
    const sc = SC_RE.exec(line);
    if (sc) {
      criteria.push({ id: sc[1], text: sc[2].trim() });
    }
  }

  return { requirements, criteria };
}
