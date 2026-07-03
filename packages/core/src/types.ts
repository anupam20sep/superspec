export interface Requirement {
  id: string; // "FR-001"
  text: string;
}

export interface SuccessCriterion {
  id: string; // "SC-001"
  text: string;
}

export interface Spec {
  requirements: Requirement[];
  criteria: SuccessCriterion[];
}

export type Complexity = "mechanical" | "heavy";

export interface Task {
  id: string; // "T001"
  title: string;
  frRefs: string[]; // ["FR-001", "FR-002"]
  dependsOn: string[]; // ["T000"]
  complexity: Complexity;
}

export interface MatrixRow {
  fr: string;
  tasks: string[];
  covered: boolean;
}

export interface Matrix {
  rows: MatrixRow[];
  complete: boolean;
}
