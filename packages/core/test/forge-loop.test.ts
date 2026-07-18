import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  initState,
  nextTask,
  recordResult,
  forgeStatus,
  saveState,
  loadState,
} from "../src/forge-loop.js";
import type { Task } from "../src/types.js";

const tasks: Task[] = [
  { id: "T001", title: "a", frRefs: ["FR-001"], dependsOn: [], complexity: "mechanical", kind: "code" },
  { id: "T002", title: "b", frRefs: ["FR-002"], dependsOn: ["T001"], complexity: "complex", kind: "code" },
];

describe("forge loop task selection", () => {
  it("returns tasks in dependency order and null when all done", () => {
    const state = initState(tasks);
    expect(nextTask(tasks, state)?.id).toBe("T001"); // T002 blocked by dep
    recordResult(state, "T001", true, { maxReviewFailures: 3 });
    expect(nextTask(tasks, state)?.id).toBe("T002");
    recordResult(state, "T002", true, { maxReviewFailures: 3 });
    expect(nextTask(tasks, state)).toBeNull();
  });
});

describe("forge status and escalation", () => {
  it("blocks a task after too many review failures and reports status", () => {
    const state = initState(tasks);
    recordResult(state, "T001", false, { maxReviewFailures: 2 });
    recordResult(state, "T001", false, { maxReviewFailures: 2 });
    expect(state.tasks["T001"].status).toBe("blocked");

    const status = forgeStatus(state);
    expect(status.total).toBe(2);
    expect(status.done).toBe(0);
    expect(status.blocked).toBe(1);
    expect(status.pending).toBe(1);
    expect(status.inProgress).toBe(0);
    expect(status.complete).toBe(false);
    expect(status.nextStep).toBeUndefined();
  });

  it("is complete only when every task is done", () => {
    const state = initState(tasks);
    recordResult(state, "T001", true, { maxReviewFailures: 3 });
    recordResult(state, "T002", true, { maxReviewFailures: 3 });
    const status = forgeStatus(state);
    expect(status.complete).toBe(true);
    expect(status.nextStep).toMatch(/validate-ready/i);
  });

  it("throws on unknown task id", () => {
    const state = initState(tasks);
    expect(() => recordResult(state, "T999", true, { maxReviewFailures: 3 })).toThrow(/T999/);
  });

  it("does not offer a dependent task when its dependency is blocked", () => {
    const state = initState(tasks);
    recordResult(state, "T001", false, { maxReviewFailures: 2 });
    recordResult(state, "T001", false, { maxReviewFailures: 2 });
    expect(state.tasks["T001"].status).toBe("blocked");
    expect(nextTask(tasks, state)).toBeNull();
  });

  it("throws when recording a result for an already-blocked task", () => {
    const state = initState(tasks);
    recordResult(state, "T001", false, { maxReviewFailures: 2 });
    recordResult(state, "T001", false, { maxReviewFailures: 2 });
    expect(state.tasks["T001"].status).toBe("blocked");
    expect(() =>
      recordResult(state, "T001", true, { maxReviewFailures: 2 }),
    ).toThrow(/T001/);
    expect(state.tasks["T001"].status).toBe("blocked");
  });
});

describe("forge state persistence", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "superspec-forge-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("round-trips state through disk and returns null when absent", async () => {
    expect(await loadState(dir)).toBeNull();
    const state = initState(tasks);
    recordResult(state, "T001", true, { maxReviewFailures: 3 });
    await saveState(dir, state);
    expect(await loadState(dir)).toEqual(state);
  });
});
