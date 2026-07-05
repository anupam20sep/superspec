export type SpecType = "product" | "platform" | "infra" | "migration" | "spike";

export type TaskKind = "code" | "verify" | "provision" | "signoff" | "doc-sync";

export interface Requirement {
  id: string; // "FR-001"
  text: string;
}

export interface SuccessCriterion {
  id: string; // "SC-001"
  text: string;
}

export interface Spec {
  type: SpecType;
  requirements: Requirement[];
  criteria: SuccessCriterion[];
}

export type Complexity = "mechanical" | "moderate" | "complex";

export interface Task {
  id: string; // "T001"
  title: string;
  frRefs: string[]; // ["FR-001", "FR-002"]
  dependsOn: string[]; // ["T000"]
  complexity: Complexity;
  kind: TaskKind;
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
