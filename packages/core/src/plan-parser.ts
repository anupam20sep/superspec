import type { Task, Complexity } from "./types.js";

const TASK_RE = /^###\s+Task\s+([\w.]+):\s*(.+)/;
const IMPL_RE = /^\*\*Implements:\*\*\s*(.+)/;
const DEP_RE = /^\*\*Depends on:\*\*\s*(.+)/;
const CX_RE = /^\*\*Complexity:\*\*\s*(mechanical|moderate|complex)/;

function parseRefs(text: string, prefix: string): string[] {
  if (/^\s*none\s*$/i.test(text)) return [];
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith(prefix));
}

export function parsePlan(markdown: string): Task[] {
  const tasks: Task[] = [];
  let current: Task | null = null;

  const flush = () => {
    if (current) tasks.push(current);
  };

  for (const line of markdown.split("\n")) {
    const t = TASK_RE.exec(line);
    if (t) {
      flush();
      current = { id: t[1], title: t[2].trim(), frRefs: [], dependsOn: [], complexity: "mechanical" };
      continue;
    }
    if (!current) continue;

    const impl = IMPL_RE.exec(line);
    if (impl) {
      current.frRefs = parseRefs(impl[1], "FR-");
      continue;
    }
    const dep = DEP_RE.exec(line);
    if (dep) {
      current.dependsOn = parseRefs(dep[1], "T");
      continue;
    }
    const cx = CX_RE.exec(line);
    if (cx) {
      current.complexity = cx[1] as Complexity;
    }
  }

  flush();
  return tasks;
}
