import type { Spec, Requirement, SuccessCriterion, SpecType } from "./types.js";

const FR_RE = /\*\*(FR-\d{3})\*\*:?\s*(.+)/;
const SC_RE = /\*\*(SC-\d{3})\*\*:?\s*(.+)/;
const TYPE_RE = /^\*\*Type\*\*:\s*(product|platform|infra|migration|spike)\s*$/i;

export function parseSpec(markdown: string): Spec {
  const requirements: Requirement[] = [];
  const criteria: SuccessCriterion[] = [];
  let type: SpecType = "product";

  for (const line of markdown.split("\n")) {
    const typeMatch = TYPE_RE.exec(line.trim());
    if (typeMatch) {
      type = typeMatch[1].toLowerCase() as SpecType;
      continue;
    }
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

  return { type, requirements, criteria };
}
