import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LintFinding } from "./plan-lint.js";

const DECISION_HEADING_RE = /^###\s+Decision:/;
const CONSUMED_SECTION_RE = /^###\s+Consumed From Other Specs/i;
const PRODUCED_SECTION_RE = /^###\s+Produced For Other Specs/i;
const TABLE_ROW_RE = /^\|([^|]+)\|([^|]+)\|/;

export interface DesignLintOptions {
  /** Repo or specs root for cross-spec contract resolution (e.g. repo root containing specs/) */
  specsRoot?: string;
}

interface ContractRef {
  specPath: string;
  contract: string;
  line: number;
}

function parseContractTableRows(lines: string[], startIdx: number): ContractRef[] {
  const refs: ContractRef[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (/^###\s+/.test(line) || /^##\s+/.test(line)) break;
    if (!line.trim().startsWith("|") || line.includes("---") || /Source spec|Target spec/i.test(line)) {
      continue;
    }
    const m = TABLE_ROW_RE.exec(line);
    if (!m) continue;
    const col1 = m[1].trim().replace(/`/g, "");
    const col2 = m[2].trim().replace(/`/g, "");
    if (!col1 || !col2 || PLACEHOLDER.test(col1) || PLACEHOLDER.test(col2)) continue;
    if (col1.includes("specs/")) {
      refs.push({ specPath: col1, contract: col2, line: i + 1 });
    }
  }
  return refs;
}

const PLACEHOLDER = /\[e\.g\.|NEEDS CLARIFICATION|TBD|TODO/i;

function extractProducedContracts(markdown: string): Set<string> {
  const lines = markdown.split("\n");
  const contracts = new Set<string>();
  let inProduced = false;
  for (const line of lines) {
    if (PRODUCED_SECTION_RE.test(line)) {
      inProduced = true;
      continue;
    }
    if (inProduced && (/^###\s+/.test(line) || /^##\s+/.test(line))) break;
    if (!inProduced || !line.trim().startsWith("|") || line.includes("---")) continue;
    const m = TABLE_ROW_RE.exec(line);
    if (!m) continue;
    const contract = m[2].trim().replace(/`/g, "");
    if (contract && !PLACEHOLDER.test(contract)) contracts.add(contract.toLowerCase());
  }
  return contracts;
}

export async function lintDesign(
  markdown: string,
  options: DesignLintOptions = {},
): Promise<LintFinding[]> {
  const findings: LintFinding[] = [];
  const lines = markdown.split("\n");
  let inDecision = false;
  let decisionStart = 0;
  let decisionBody = "";
  let consumedStart = -1;

  const flushDecision = () => {
    if (!inDecision) return;
    const hasRationale = /\*\*Rationale\*\*:/i.test(decisionBody);
    const hasAlternatives = /\*\*Alternatives considered\*\*:/i.test(decisionBody);
    const isPlaceholder =
      /\[Explain why|\[Explain the decision|Option A\]: \[Reason rejected\]/i.test(decisionBody);
    if (!hasRationale || !hasAlternatives || isPlaceholder) {
      findings.push({
        line: decisionStart,
        rule: "incomplete-decision",
        message: "Decision block must have filled Rationale and Alternatives (no template placeholders).",
      });
    }
    inDecision = false;
    decisionBody = "";
  };

  lines.forEach((line, i) => {
    const lineNo = i + 1;

    if (DECISION_HEADING_RE.test(line)) {
      flushDecision();
      inDecision = true;
      decisionStart = lineNo;
      return;
    }
    if (inDecision) {
      if (/^##\s+/.test(line) || /^###\s+/.test(line)) {
        flushDecision();
      } else {
        decisionBody += line + "\n";
      }
    }

    if (CONSUMED_SECTION_RE.test(line)) {
      consumedStart = i + 1;
    }

    if (/\bNEEDS CLARIFICATION:/i.test(line)) {
      findings.push({
        line: lineNo,
        rule: "needs-clarification",
        message: "Technical or design field still marked NEEDS CLARIFICATION.",
      });
    }
  });

  flushDecision();

  if (consumedStart >= 0) {
    const consumed = parseContractTableRows(lines, consumedStart);
    for (const ref of consumed) {
      if (!ref.specPath.includes("specs/")) {
        findings.push({
          line: ref.line,
          rule: "malformed-consumed",
          message: "Consumed entry source must be a specs/ path.",
        });
        continue;
      }

      if (options.specsRoot) {
        const rel = ref.specPath.replace(/^specs\//, "");
        const designPath = join(options.specsRoot, "specs", rel, "design.md");
        try {
          const upstream = await readFile(designPath, "utf8");
          const produced = extractProducedContracts(upstream);
          if (!produced.has(ref.contract.toLowerCase())) {
            findings.push({
              line: ref.line,
              rule: "unresolved-consumed",
              message: `Contract "${ref.contract}" not found in Produced table of ${ref.specPath}/design.md`,
            });
          }
        } catch {
          findings.push({
            line: ref.line,
            rule: "missing-upstream-design",
            message: `Cannot resolve consumed contract — missing ${ref.specPath}/design.md`,
          });
        }
      }
    }
  }

  return findings;
}

/** Sync lint without cross-spec file reads — for MCP inline text only */
export function lintDesignText(markdown: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const lines = markdown.split("\n");
  let inDecision = false;
  let decisionStart = 0;
  let decisionBody = "";

  const flushDecision = () => {
    if (!inDecision) return;
    const hasRationale = /\*\*Rationale\*\*:/i.test(decisionBody);
    const hasAlternatives = /\*\*Alternatives considered\*\*:/i.test(decisionBody);
    const isPlaceholder =
      /\[Explain why|\[Explain the decision|Option A\]: \[Reason rejected\]/i.test(decisionBody);
    if (!hasRationale || !hasAlternatives || isPlaceholder) {
      findings.push({
        line: decisionStart,
        rule: "incomplete-decision",
        message: "Decision block must have filled Rationale and Alternatives (no template placeholders).",
      });
    }
    inDecision = false;
    decisionBody = "";
  };

  lines.forEach((line, i) => {
    if (DECISION_HEADING_RE.test(line)) {
      flushDecision();
      inDecision = true;
      decisionStart = i + 1;
      return;
    }
    if (inDecision) {
      if (/^##\s+/.test(line) || /^###\s+/.test(line)) flushDecision();
      else decisionBody += line + "\n";
    }
    if (/\bNEEDS CLARIFICATION:/i.test(line)) {
      findings.push({
        line: i + 1,
        rule: "needs-clarification",
        message: "Technical or design field still marked NEEDS CLARIFICATION.",
      });
    }
  });

  flushDecision();

  let consumedStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (CONSUMED_SECTION_RE.test(lines[i])) consumedStart = i + 1;
  }
  if (consumedStart >= 0) {
    for (const ref of parseContractTableRows(lines, consumedStart)) {
      if (!ref.specPath.includes("specs/") || PLACEHOLDER.test(ref.contract)) {
        findings.push({
          line: ref.line,
          rule: "malformed-consumed",
          message: "Consumed row must name a specs/ path and a concrete contract.",
        });
      }
    }
  }

  return findings;
}
