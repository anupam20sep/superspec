import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { Task } from "./types.js";

export type TaskStatus = "pending" | "done" | "blocked";

export interface ForgeState {
  tasks: Record<string, { status: TaskStatus; reviewFailures: number }>;
}

export interface ForgeOptions {
  maxReviewFailures: number;
}

export interface ForgeStatus {
  total: number;
  done: number;
  blocked: number;
  pending: number;
  complete: boolean;
}

export function initState(tasks: Task[]): ForgeState {
  const state: ForgeState = { tasks: {} };
  for (const t of tasks) {
    state.tasks[t.id] = { status: "pending", reviewFailures: 0 };
  }
  return state;
}

export function nextTask(tasks: Task[], state: ForgeState): Task | null {
  for (const t of tasks) {
    const s = state.tasks[t.id];
    if (!s || s.status !== "pending") continue;
    const depsDone = t.dependsOn.every((d) => state.tasks[d]?.status === "done");
    if (depsDone) return t;
  }
  return null;
}

export function recordResult(
  state: ForgeState,
  taskId: string,
  passed: boolean,
  opts: ForgeOptions,
): ForgeState {
  const s = state.tasks[taskId];
  if (!s) throw new Error(`Unknown task id: ${taskId}`);
  if (passed) {
    s.status = "done";
  } else {
    s.reviewFailures += 1;
    if (s.reviewFailures >= opts.maxReviewFailures) s.status = "blocked";
  }
  return state;
}

export function forgeStatus(state: ForgeState): ForgeStatus {
  const values = Object.values(state.tasks);
  const done = values.filter((v) => v.status === "done").length;
  const blocked = values.filter((v) => v.status === "blocked").length;
  const pending = values.filter((v) => v.status === "pending").length;
  return {
    total: values.length,
    done,
    blocked,
    pending,
    complete: values.length > 0 && done === values.length,
  };
}

function statePath(dir: string): string {
  return join(dir, ".superspec", "state.json");
}

export async function saveState(dir: string, state: ForgeState): Promise<void> {
  const p = statePath(dir);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(state, null, 2), "utf8");
}

export async function loadState(dir: string): Promise<ForgeState | null> {
  try {
    const raw = await readFile(statePath(dir), "utf8");
    return JSON.parse(raw) as ForgeState;
  } catch {
    return null;
  }
}
