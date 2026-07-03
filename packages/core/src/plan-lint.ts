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

interface TaskBlock {
  id: string;
  startLine: number; // 1-indexed line of the heading
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

export function lintPlan(markdown: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const lines = markdown.split("\n");

  lines.forEach((line, i) => {
    for (const p of PLACEHOLDER_PATTERNS) {
      if (p.re.test(line)) {
        findings.push({ line: i + 1, rule: p.rule, message: `Placeholder detected: "${line.trim()}"` });
      }
    }
  });

  for (const block of splitTaskBlocks(lines)) {
    const hasFailing = FAILING_TEST_RE.test(block.body);
    const hasPassing = PASSING_TEST_RE.test(block.body);
    if (!hasFailing || !hasPassing) {
      findings.push({
        line: block.startLine,
        rule: "no-tdd-cycle",
        message: `Task ${block.id} is missing a red-green-refactor cycle (needs a failing-test step and a passing-verification step).`,
      });
    }
  }

  return findings;
}
