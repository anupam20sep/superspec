import type { LintFinding } from "./plan-lint.js";
import { parseSpec } from "./spec-parser.js";

const TYPE_LINE_RE = /^\*\*Type\*\*:\s*(product|platform|infra|migration|spike)\s*$/i;
const TYPE_PLACEHOLDER_RE = /^\*\*Type\*\*:\s*\[/;
const FR_LINE_RE = /\*\*(FR-\d{3})\*\*/;
const CLARIFICATION_RE = /\[NEEDS CLARIFICATION:/g;
const REQUIRED_READING_ROW_RE = /^\|\s*`?([^`|]+)`?\s*\|/;
const PLACEHOLDER_PATH_RE = /\[e\.g\.|TBD|TODO|FIXME/i;

export function lintSpec(markdown: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const lines = markdown.split("\n");
  const spec = parseSpec(markdown);

  let hasValidType = false;
  let typeLine = 0;
  let inRequiredReading = false;
  let requiredReadingRows = 0;
  let clarificationCount = 0;

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    const trimmed = line.trim();

    if (TYPE_LINE_RE.test(trimmed)) {
      hasValidType = true;
    }
    if (TYPE_PLACEHOLDER_RE.test(trimmed)) {
      typeLine = lineNo;
    }

    if (/^##\s+Required Reading/i.test(line)) {
      inRequiredReading = true;
      return;
    }
    if (inRequiredReading && /^##\s+/.test(line)) {
      inRequiredReading = false;
    }

    if (inRequiredReading && REQUIRED_READING_ROW_RE.test(line) && !line.includes("---") && !line.includes("Path")) {
      const m = REQUIRED_READING_ROW_RE.exec(line);
      const path = m?.[1]?.trim() ?? "";
      if (path && !PLACEHOLDER_PATH_RE.test(path)) {
        requiredReadingRows += 1;
      } else if (path) {
        findings.push({
          line: lineNo,
          rule: "placeholder-required-reading",
          message: `Required Reading row has placeholder path: "${path}"`,
        });
      }
    }

    if (FR_LINE_RE.test(line) && /\b(TBD|TODO|FIXME)\b/.test(line)) {
      findings.push({
        line: lineNo,
        rule: "untestable-fr",
        message: "Functional requirement contains placeholder text (TBD/TODO/FIXME).",
      });
    }

    const clarMatches = line.match(CLARIFICATION_RE);
    if (clarMatches) clarificationCount += clarMatches.length;
  });

  if (typeLine > 0) {
    findings.push({
      line: typeLine,
      rule: "missing-spec-type",
      message: "Spec Type is still a template placeholder — set product | platform | infra | migration | spike.",
    });
  } else if (!hasValidType) {
    findings.push({
      line: 1,
      rule: "missing-spec-type",
      message: "Spec is missing **Type**: product | platform | infra | migration | spike.",
    });
  }

  if (spec.requirements.length === 0) {
    findings.push({
      line: 1,
      rule: "no-fr",
      message: "Spec has no FR-### functional requirements.",
    });
  }

  if (spec.criteria.length === 0) {
    findings.push({
      line: 1,
      rule: "no-sc",
      message: "Spec has no SC-### success criteria.",
    });
  }

  if (clarificationCount > 3) {
    findings.push({
      line: 1,
      rule: "too-many-clarifications",
      message: `Spec has ${clarificationCount} [NEEDS CLARIFICATION] markers (max 3 before superspec-refine).`,
    });
  }

  return findings;
}
