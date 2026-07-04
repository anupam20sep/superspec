import type { Task } from "./types.js";

export type ModelClass = "strong" | "fast";

export function routeModel(task: Pick<Task, "complexity">): ModelClass {
  return task.complexity === "complex" ? "strong" : "fast";
}
