import type { Requirement, Task, Matrix, MatrixRow } from "./types.js";

export function buildMatrix(requirements: Requirement[], tasks: Task[]): Matrix {
  const rows: MatrixRow[] = requirements.map((req) => {
    const covering = tasks.filter((t) => t.frRefs.includes(req.id)).map((t) => t.id);
    return { fr: req.id, tasks: covering, covered: covering.length > 0 };
  });
  return { rows, complete: rows.every((r) => r.covered) };
}

export function matrixGaps(matrix: Matrix): string[] {
  return matrix.rows.filter((r) => !r.covered).map((r) => r.fr);
}
