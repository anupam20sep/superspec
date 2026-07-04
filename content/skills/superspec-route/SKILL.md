---
name: superspec-route
description: Use when transforming a task plan into a parallelizable execution schedule with model routing, windowing, and verification gates
---

# SuperSpec Route: Parallel Execution Planning

## Overview

You take a task plan (from superspec-plan) and transform it into an execution map that coordinates parallel task windows, model routing decisions, persona assignments, rollback strategies, and verification gates. This skill bridges specification and execution by making parallelizable work explicit and ensuring quality gates are applied per window.

A critical insight from parallel task dispatching is that **independent work must be identified and grouped into execution windows**. Just as parallel agents can investigate separate problems simultaneously, parallel tasks can execute concurrently—but only if they have no shared state, no sequential dependencies, and compatible resource requirements.

**Core principle:** Group independent tasks into windows; route by complexity; define gates per window; plan rollback per window.

## When to Use

Use superspec-route when:
- You have a task plan with multiple tasks and dependencies
- You need to determine which tasks can run in parallel
- You need to assign model routing (heavy complexity → strong model, mechanical complexity → fast model)
- You need to define verification gates before tasks are executed
- You need rollback strategies per execution window

Don't use when:
- The plan is a single task (no parallelization possible)
- Dependencies are unclear (resolve in superspec-plan first)
- Complexity levels haven't been assigned to tasks (resolve in superspec-plan first)

## The Pattern

### 1. Parse the Plan

Start with `plan.md` from superspec-plan. Extract:
- All tasks (T001, T002, ...)
- Task descriptions and requirements
- Dependency constraints (which tasks block which)
- Complexity classification for each task (`heavy` or `mechanical`)
- Acceptance scenarios for each task

Build a dependency graph showing:
- Direct dependencies: "T002 requires T001 to be complete"
- Implicit constraints: "T003 needs data from T002" even if not explicitly stated

### 2. Identify Parallel Windows

A **window** is a set of tasks that:
- Have no dependencies within the window (tasks don't block each other)
- Have no shared write access to the same files or resources
- Can all start after their upstream dependencies are met
- Can all complete before downstream tasks begin

Algorithm:
1. **W1 (first wave):** All tasks with no dependencies, or all dependencies satisfied
2. **For each subsequent wave:** All tasks whose dependencies were all satisfied in previous waves
3. **Group independent tasks in the same wave:** If two tasks have no dependencies on each other, they belong in the same window

Example:
- T001 and T006 have no dependencies → W1 (if no other blocking tasks)
- T002 depends on T001; T004 depends on T001 → both go to W2 (same window, can run in parallel)
- T007 depends on T006 → W3 if T006 is in W1

### 3. Route by Complexity

For each task, apply the model-routing rule:
- **`complexity: "heavy"`** → route to `strong` model
  - Examples: schema design, API architecture, component state management, backward-compatibility analysis
  - Rationale: Requires reasoning about system-wide implications, trade-offs, edge cases
- **`complexity: "mechanical"`** → route to `fast` model
  - Examples: test scaffolding, seed scripts, boilerplate setup, deterministic transformations
  - Rationale: Follows a clear pattern; minimal ambiguity about intent

**Model-routing function:** `routeModel(complexity) → { "heavy" → "strong", "mechanical" → "fast" }`

Assign model routing to each task individually, then summarize by window (all tasks in a window may use different models, but you group them because they have no dependencies).

### 4. Assign Personas

Assign ownership per task or window:
- `@backend`: Owns database, migrations, service layer, API contract
- `@frontend`: Owns client UI, state, build pipeline
- `@qa`: Owns test strategy, coverage targets, integration scenarios
- `@tech-lead`: Owns architecture decisions, cross-cutting concerns, gate approvals
- `@security`: Reviews auth, encryption, input validation, RBAC
- `@performance`: Reviews query plans, caching, asset optimization

Each window has a primary persona (executor) and optional secondary personas (reviewers).

### 5. Define Verification Gates

For each window, define gates that must pass before merge:
- **Gate type examples:**
  - Schema Validation (W1): Schema change passes validation tool; no breaking changes
  - Unit Test Coverage (W2–W4): ≥80% line coverage; ≥90% for critical paths
  - Type Safety (W3, W5): `typecheck` passes; no `any` types except legacy modules
  - Linting (W5): `lint` passes; no auto-fixable issues
  - Contract Tests (W3, W4): API matches OpenAPI spec; frontend mock matches live API
  - Integration Tests (W4): All integration tests pass in staging; 3 consecutive green runs
  - Security Scan (W5): 0 high/critical vulns; no secrets committed
  - Performance Baseline (W5): APIs ≤200ms p99 latency; Frontend Lighthouse ≥90
  - Rollback Rehearsal (W5): Rollback tested in staging

Each gate has:
- **Owner:** Persona responsible for passing it (e.g., @qa for coverage)
- **Criteria:** Specific, measurable pass/fail condition
- **Applies to:** Which windows must satisfy this gate

### 6. Plan Rollback per Window

For each window, define rollback strategy:
- **Schema/migration windows:** Revert commit range; if in production, use manual intervention
- **Data layer windows:** Delete seeded records via rollback script; use soft markers (`is_test_data = true`)
- **Code windows (API, frontend, tests):** Revert commits; safe if no DB impact; feature flags can disable during revert
- **Quality gate windows:** Fix issues in place; don't merge if gates fail

General rollback process:
1. Identify window to revert
2. Gather commits for that window (`git log --oneline W1..Wn`)
3. Create revert commit: `git revert -n C1^..Cn && git commit -m "revert: ..."`
4. Test in staging
5. Deploy with same rigor as original feature

### 7. Synthesize into execution-map.md

Write output file `execution-map.md` with these sections:

1. **Dependency DAG:**
   - Tabular list: From | To | Reason
   - Graphical ASCII tree
   - Explanation of parallelizable paths

2. **Parallel Windows:**
   - Tabular list: Window | Tasks | Model Routing | Parallelization Boundary
   - Constraints (⚠️ flags for blocking dependencies)
   - Why tasks in window don't block each other

3. **Model Routing:**
   - Tabular list: Task | Complexity | Model Class | Rationale
   - Summary line: `routeModel(complexity) → { "heavy" → "strong", "mechanical" → "fast" }`

4. **Personas:**
   - Tabular list: Window | Primary Persona | Secondary Persona | Responsibilities
   - Persona definitions (one-liner for each)

5. **Rollback:**
   - Tabular list: Window | Rollback Strategy
   - General rollback process (4–5 steps)

6. **Verification Gates:**
   - Tabular list: Gate | Applies To | Criteria | Owner
   - Gate policy (how failures block merge)

All tables must be properly markdown-formatted. All references to tasks use T### format. All model classes use backticks: `heavy`, `mechanical`, `strong`, `fast`.

## Common Mistakes

**❌ Wrong model routing:** Assigning `heavy` to deterministic scaffolding (should be `mechanical`)
**✅ Correct:** Reserve `heavy` for design/reasoning decisions; `mechanical` for deterministic execution

**❌ Overlapping windows:** Putting dependent tasks in the same window
**✅ Correct:** Dependent tasks go in sequential windows (T001 in W1, T002 in W2)

**❌ Missing verification gates:** Windows with no quality checks defined
**✅ Correct:** Every window has at least 1 gate (schema validation, test coverage, type safety, or performance baseline)

**❌ Vague rollback:** "Rollback if needed" with no specifics
**✅ Correct:** "Revert commits C1..C5; delete seeded records via rollback-fixtures.sh; test in staging"

**❌ Ignoring shared state:** Putting tasks with write conflicts in the same window
**✅ Correct:** Identify shared resource (same file, same database table) and sequence windows

## When NOT to Use

- **Single task:** No parallelization possible; use superspec-plan output directly
- **Unclear dependencies:** Clarify in superspec-plan before routing
- **Unclassified complexity:** Assign complexity levels in superspec-plan first
- **No personas defined:** Assign roles in superspec-scope or superspec-refine

## Real Example

**Input (plan.md excerpt):**
```
T001: Backend schema migration [complexity: heavy] → T002, T004
T002: Seed test data [complexity: mechanical] → T003
T003: Service layer tests [complexity: mechanical] → (none)
T004: API endpoints [complexity: heavy] → T005
T005: Integration tests [complexity: mechanical] → (none)
T006: Frontend setup [complexity: mechanical] → T007
T007: Frontend components [complexity: heavy] → (none)
```

**Output (execution-map.md):**
- **Dependency DAG:** T001→T002→T003; T001→T004→T005; T006→T007 (three independent chains)
- **Windows:**
  - W1: T001 (schema) | heavy → strong
  - W2: T002 (seed data), T006 (frontend setup) | mechanical → fast
  - W3: T003, T004, T007 | mixed (T004 heavy→strong; T003, T007 routed per complexity)
  - W4: T005 (integration tests) | mechanical → fast
  - W5: Quality gates | mechanical → fast
- **Model Routing:** T001, T004, T007 → strong; T002, T003, T005, T006 → fast
- **Personas:** @backend for W1, W3/W4; @frontend for W2, W3; @qa for W4, W5
- **Rollback:** W1 reverts schema; W2 deletes fixtures; W3 reverts code; W5 blocks on gate failures
- **Gates:** Schema validation (W1), coverage (W2–W4), type safety (W3), integration tests (W4), security (W5)

## Key Constraints

1. **No task appears in multiple windows.**
2. **Each task has exactly one model routing assignment.**
3. **Windows are strictly ordered:** W1 < W2 < W3 < ... (no backward dependencies).
4. **Every gate is owned by exactly one persona.**
5. **All blockers are explicit:** If T002 blocks T003, that's noted in the DAG and verified in window boundaries.

## Verification

Before handing off to superspec-forge:
1. **Dependency DAG is acyclic:** No circular dependencies
2. **Windows respect dependencies:** No task in W(n) depends on a task in W(n+1) or later
3. **No shared state within window:** Re-check if multiple tasks edit same file
4. **Model routing is consistent:** All `heavy` tasks → `strong`; all `mechanical` tasks → `fast`
5. **Personas are assigned:** Every window has a primary persona
6. **Gates are testable:** Every gate has measurable criteria (not "looks good")
7. **Rollback is complete:** Every window has a concrete rollback procedure

---

<!-- Adapted from SP: skills/dispatching-parallel-agents/SKILL.md (MIT) for the parallel-dispatch concept; Dependency DAG, Parallel Windows, Model Routing, Personas, Rollback, and Verification Gates sections are new to SuperSpec. See /NOTICE. -->
