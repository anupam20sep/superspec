import { parsePlan } from "./plan-parser.js";

export interface LintFinding {
  line: number;
  rule: string;
  message: string;
}

const PLACEHOLDER_PATTERNS: { rule: string; re: RegExp }[] = [
  { rule: "no-tbd", re: /\b(TBD|TODO|FIXME)\b/ },
  { rule: "no-implement-later", re: /implement later|fill in details/i },
  { rule: "no-vague-error", re: /add appropriate error handling|add validation|handle edge cases/i },
  { rule: "no-similar-to", re: /similar to task/i },
];

const TASK_HEADING_RE = /^###\s+Task\s+([\w.]+):/;
const FAILING_TEST_RE = /failing test/i;
const PASSING_TEST_RE = /verify it passes|make sure (they|it) pass/i;
const VERIFY_CMD_RE = /Run:\s*`[^`]+`|Expected:\s*.+/i;
const PROVISION_RE = /script|checklist|provision/i;
const SIGNOFF_RE = /sign[- ]?off|owner:\s*@/i;
const DOC_SYNC_RE = /sync|update.*\.md|doc-sync/i;

interface TaskBlock {
  id: string;
  startLine: number;
  body: string;
}

function splitTaskBlocks(lines: string[]): TaskBlock[] {
  const blocks: TaskBlock[] = [];
  let current: { id: string; startLine: number; body: string[] } | null = null;
  const flush = () => {
    if (current) blocks.push({ id: current.id, startLine: current.startLine, body: current.body.join("\n") });
  };
  lines.forEach((line, i) => {
    const m = TASK_HEADING_RE.exec(line);
    if (m) {
      flush();
      current = { id: m[1], startLine: i + 1, body: [] };
      return;
    }
    if (current) current.body.push(line);
  });
  flush();
  return blocks;
}

function lintTaskByKind(block: TaskBlock, kind: string): LintFinding | null {
  switch (kind) {
    case "code": {
      const hasFailing = FAILING_TEST_RE.test(block.body);
      const hasPassing = PASSING_TEST_RE.test(block.body);
      if (!hasFailing || !hasPassing) {
        return {
          line: block.startLine,
          rule: "no-tdd-cycle",
          message: `Task ${block.id} is missing a red-green-refactor cycle (needs a failing-test step and a passing-verification step).`,
        };
      }
      return null;
    }
    case "verify":
      if (!VERIFY_CMD_RE.test(block.body)) {
        return {
          line: block.startLine,
          rule: "no-verify-proof",
          message: `Task ${block.id} (verify) needs a Run: command and Expected: output.`,
        };
      }
      return null;
    case "provision":
      if (!PROVISION_RE.test(block.body)) {
        return {
          line: block.startLine,
          rule: "no-provision-proof",
          message: `Task ${block.id} (provision) needs a script or checklist reference.`,
        };
      }
      return null;
    case "signoff":
      if (!SIGNOFF_RE.test(block.body)) {
        return {
          line: block.startLine,
          rule: "no-signoff-owner",
          message: `Task ${block.id} (signoff) needs a named owner or sign-off record.`,
        };
      }
      return null;
    case "doc-sync":
      if (!DOC_SYNC_RE.test(block.body)) {
        return {
          line: block.startLine,
          rule: "no-doc-target",
          message: `Task ${block.id} (doc-sync) needs a target doc path or sync step.`,
        };
      }
      return null;
    default:
      return null;
  }
}

export function lintPlan(markdown: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const lines = markdown.split("\n");
  const tasks = parsePlan(markdown);
  const kindById = new Map(tasks.map((t) => [t.id, t.kind]));

  lines.forEach((line, i) => {
    for (const p of PLACEHOLDER_PATTERNS) {
      if (p.re.test(line)) {
        findings.push({ line: i + 1, rule: p.rule, message: `Placeholder detected: "${line.trim()}"` });
      }
    }
  });

  for (const block of splitTaskBlocks(lines)) {
    const kind = kindById.get(block.id) ?? "code";
    const finding = lintTaskByKind(block, kind);
    if (finding) findings.push(finding);
  }

  return findings;
}
