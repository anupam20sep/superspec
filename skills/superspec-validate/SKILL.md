---
name: superspec-validate
description: Use when about to claim a feature is complete and ready for release — runs the actual verification commands (coverage matrix, plan linting, constitution compliance, execution gates) and confirms output before allowing completion claims; evidence before assertions always.
---

<!-- Adapted from SP: skills/verification-before-completion/SKILL.md (MIT) and SK: templates/commands/analyze.md (MIT). See /NOTICE. -->

# SuperSpec Validate

## Overview

Claiming a feature is complete without verification is dishonest, not efficient.

**Core principle**: Evidence before assertions, always.

**Validating a SuperSpec feature means**: (1) running the actual tools (`build-matrix`, `lint-plan`); (2) reading the real output (not assuming); (3) checking constitution compliance (Principle 1: Test-First (NON-NEGOTIABLE), Principle 2: Traceability Spine (NON-NEGOTIABLE)) with explicit evidence; (4) verifying per-window gates from the execution map are satisfied; (5) reporting actual results, not assumptions.

**Note:** `forge-status` `complete: true` only means every task is `done`. It does **not** mean the matrix is complete or lint-plan is clean — this skill is the gate before ship.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification commands in this section and read their output, you cannot claim the feature passes.

## The Gate Function

```
BEFORE claiming feature completion or expressing satisfaction:

1. IDENTIFY: What command(s) prove this claim?
   - build-matrix: Coverage matrix is complete (all FR-### have tasks)
   - lint-plan: Plan quality (no TODOs, TDD cycles intact)
   - constitution: Principles 1 & 2 are explicitly honored
   - execution-map: Per-window verification gates are met

2. RUN: Execute the FULL command (fresh, complete, parse real output)
   - Use @superspec-dev/core's MCP tools: build-matrix, lint-plan
   - Read spec.md + plan.md (real files, not assumptions)
   - Cross-check execution-map.md for gate structure

3. READ: Full output, check for gaps, count issues
   - Matrix gaps = coverage holes (FR with no task)
   - Lint findings = plan quality issues (TODOs, missing cycles)
   - Constitution failures = missing test-first evidence or broken traceability
   - Gate failures = window not ready

4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence (cite tool output)

5. ONLY THEN: Make the claim

Skip any step = lying, not verifying.
```

## What "Complete" Means

A SuperSpec feature is "complete" when ALL of the following are true:

| Aspect | Verification | Evidence |
|--------|---|---|
| **Coverage Matrix** | Every functional requirement (FR-###) maps to at least one task in plan.md | `build-matrix` output shows 0 gaps; no orphaned FR-###s |
| **Plan Quality** | All tasks follow TDD red-green-refactor discipline; no TODOs or placeholder text | `lint-plan` output shows 0 critical findings |
| **Principle 1: Test-First (NON-NEGOTIABLE)** | Every task in plan.md has a failing test written first, passing test after implementation | Read plan.md line-by-line; search for explicit "Test: [describe-failure]" → "Impl:" → "Test passes" cycle per task |
| **Principle 2: Traceability Spine (NON-NEGOTIABLE)** | Every FR-### has a covering task AND a passing test; the matrix is never broken | `build-matrix` output; test-suite pass report (0 failing tests covering these tasks) |
| **Constitution Compliance** | Principles 1 & 2 (the non-negotiable ones) are honored in fact, not just in documentation | Evidence lines from execution: (1) TDD cycles in plan.md, (2) passing tests, (3) 0 uncovered FRs |
| **Per-Window Gates** | Each execution-map.md window has passed its defined verification gates (schema validation, test coverage, type safety, linting, security, performance, rollback rehearsal) | Read execution-map.md "Verification Gates" table; confirm each gate owner has signed off or provide gate-pass evidence |

## Common Completion Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Feature is complete | All five verifications above: matrix + lint + TDD evidence + tests passing + gates met | "Plan looks good" |
| Matrix is complete | `build-matrix` output: 0 gaps | Counting FR-###s manually |
| Tests are passing | Full test run, 0 failing tests | Previous run, "should pass" |
| Plan follows TDD | Every task shows Test-Fail → Impl → Test-Pass cycle | "I wrote tests" (without showing the cycle) |
| Constitution honored | Explicit evidence of Test-First and Traceability in execution | "We follow TDD" (assertion without per-task proof) |
| Gates are met | Per-window gate owner sign-off or test result | Assuming tests pass because linter passed |

## Red Flags - STOP

- Using "should", "probably", "seems to" about verification results
- Expressing satisfaction before running the ACTUAL commands ("Great!", "Perfect!", "Done!")
- About to merge/release without fresh verification output
- Trusting agent success reports over actual command output
- Relying on partial verification (e.g., "lint passed, so gates are met")
- Thinking "just this once" — no exceptions
- Tired and wanting work over
- **ANY wording implying completion without having read REAL verification output**

## Execution: The Full Checklist

### Phase 1: Load Artifacts

1. Read `spec.md` → extract all FR-### identifiers
2. Read `plan.md` → extract all task IDs and descriptions
3. Read `constitution.md` → confirm Principle 1 (Test-First) and Principle 2 (Traceability Spine) wording
4. Read `execution-map.md` → extract per-window verification gates table

### Phase 2: Run Verification Tools

**Command: build-matrix**
```
Input: spec.md text + plan.md text
Output: { matrix: [{FR, task, test}], gaps: [{FR, reason}] }
```
- If gaps array is non-empty: STOP — document which FR-### have no task
- If gaps array is empty: continue to Phase 3

**Command: lint-plan**
```
Input: plan.md text
Output: LintFinding[] = [{ line, rule, message }, ...]
```
- If array has any findings with `rule: "no-tdd-cycle"` (missing red-green-refactor) or `rule: "no-tbd"` / `"no-implement-later"` / `"no-vague-error"` / `"no-similar-to"` (placeholder patterns): STOP — document which tasks lack TDD structure or have placeholders
- If all clear: continue to Phase 3

### Phase 3: Test-First Compliance (Principle 1)

For each task in plan.md:
1. Search for the pattern: `Test: [description of failure]` OR `Test (failing):` OR `Red:`
2. Confirm it appears BEFORE the implementation line
3. Confirm it includes an assertion or test condition (not just "write a test")
4. Search for the pattern: `Implementation:` OR `Green:` OR `Fix:` immediately following
5. Confirm minimal code, no over-engineering
6. Search for: `Test (passing):` OR `Green confirmed:` OR test-suite confirmation after

**Evidence format for report:**
```
Task: T001
Test-First cycle verified:
  ✓ Failing test written first (line 45)
  ✓ Implementation minimal (lines 47-52)
  ✓ Test now passes (confirmed in test run)
```

### Phase 4: Traceability Spine Compliance (Principle 2)

For each FR-### from spec.md:
1. Confirm it appears in the matrix output from `build-matrix` with at least one task
2. For that task, confirm a passing test exists in the test suite
3. No broken links: all FR-### → task → test, all complete

**Evidence format:**
```
FR-001: User can upload file
  ✓ Task: T002 (Upload handler implementation)
  ✓ Test: test_upload_file passes (exit 0)
```

### Phase 5: Per-Window Verification Gates

Read execution-map.md, find the "Verification Gates" section. For each window (W1–W5):

| Gate | Applies To | Criteria | Owner |
|------|------------|----------|-------|
| **Schema Validation** | W1 | Schema change passes `npm run db:validate`. No breaking changes to existing API contracts. Tested on backup data. | @backend |
| **Unit Test Coverage** | W2, W3, W4 | All new code has ≥80% line coverage (≥90% for critical paths like auth, payments). Coverage diffs tracked in CI. | @qa, @backend |
| **Type Safety** | W3, W5 | `npm run typecheck` passes. No `any` types except in explicitly-allowed legacy modules. | @tech-lead |
| **Linting** | W5 | `npm run lint -- --fix` applies no changes. ESLint and Prettier agree. | @tech-lead |
| **Contract Tests** | W3 (API), W4 | API schema validated against OpenAPI spec. Frontend mock server matches live API. Cross-team contract signed off. | @backend, @frontend |
| **Integration Tests** | W4 | All integration tests pass on the staging environment. No flaky tests; 3 consecutive green runs required. | @qa |
| **Security Scan** | W5 | SAST scan (e.g., `npm audit`, Snyk) returns 0 high/critical vulns. Secrets not committed (pre-commit hook enforces). | @security |
| **Performance Baseline** | W5 | For W3 (API): new endpoints have ≤200ms p99 latency under load test (100 req/s). For W3 (frontend): Lighthouse score ≥90. | @performance |
| **Rollback Rehearsal** | W5 | Rollback procedure tested in staging. Revert commits cleanly; no orphaned references or state. | @tech-lead |

For each gate, confirm:
- Owner has signed off OR
- Test output shows pass

If any gate is unsigned or failing: **STOP and document the gap.**

### Phase 6: Report Actual Status

**If all verifications pass:**

```
## Validation Report: COMPLETE

### Coverage Matrix
✓ build-matrix: 0 gaps
  - FR-001 → T001 → test_upload
  - FR-002 → T002 → test_delete
  - [all FR-### accounted for]

### Plan Quality
✓ lint-plan: 0 critical issues
  - TDD cycles detected: 8/8 tasks

### Principle 1: Test-First
✓ All 8 tasks show red-green-refactor discipline
  - [list tasks with cycle evidence]

### Principle 2: Traceability Spine
✓ All 8 FR-### have covering tasks and passing tests
  - [list FR → task → test mappings]

### Execution Map Gates
✓ All windows signed off or tests passing
  - W1 (Schema): @backend signed off
  - W2 (Data): Coverage 92%, gates met
  - W3 (API/Frontend): Contract tests pass, performance baseline met
  - W4 (Testing): All integration tests pass
  - W5 (Quality): Lint 0 issues, security 0 high/critical, rollback rehearsed

### Final Status
**FEATURE READY FOR RELEASE**

### Next Action
→ superspec-ship: Validation is clean. Proceed to decide how to integrate this work (merge, PR, keep, or discard).
```

**Handoff (follow execution mode from `using-superspec`):**

**Review mode (default):** Present the validation report and wait before ship.

> "Validation clean — see report above. Ready to integrate (merge / PR / keep / discard)?"

Then invoke **`superspec-ship`**.

**Autonomous mode:** invoke **`superspec-ship`** immediately when validation passes.

**If verification fails:**

```
## Validation Report: BLOCKED

### Gaps Found

1. **Coverage Gap (CRITICAL)**
   - FR-003: "User can share document" has no task
   - Action: Add task to plan.md and re-run build-matrix

2. **Plan Quality (HIGH)**
   - T005: Missing TDD cycle structure (lint-plan flagged)
   - Action: Rewrite task with explicit Test-Fail → Impl → Test-Pass

3. **Principle 1 Violation (CRITICAL)**
   - T007: Implementation written before test
   - Action: Reorder task steps; write test first

4. **Gate Failure (HIGH)**
   - W3: Integration tests 2/8 failing
   - Action: Debug failures and re-run

### Next Actions
→ superspec-forge: Fix gaps in plan.md and implementation
→ Re-run superspec-validate after changes
```

## Why This Matters

From SuperSpec's foundation:
- Test-First ensures every piece of behavior is testable and deliberate
- Traceability Spine ensures no requirement is orphaned and no code is untraced
- Constitution Principles 1 & 2 define what "SuperSpec-compliant" means
- Verification Gates ensure quality, safety, and rollback capability per deployment window
- Verification before claims = honesty, not just efficiency; it prevents shipping broken features and breaking trust

## When To Apply

**ALWAYS before:**
- Claiming a feature is "complete"
- Merging a feature branch to main
- Creating a release candidate
- Moving from forge to validate in the lifecycle
- Expressing satisfaction with execution status
- ANY success claim about a feature

**Rule applies to:**
- Exact phrases ("feature is complete")
- Paraphrases and synonyms ("ready to ship", "done", "passes", "works")
- Implications of success ("let's merge", "feature is ready")
- ANY communication suggesting feature completion without verification

## The Bottom Line

**Run the commands. Read the output. Cite the evidence. THEN make the claim.**

This is non-negotiable.

---

**See also:**
- `content/templates/constitution.md` — Principles 1 & 2 definitions
- `content/templates/execution-map-template.md` — Verification Gates structure
- `packages/core/src/mcp-server.ts` — `build-matrix` and `lint-plan` tool definitions
- `superspec-forge` — Fix gaps and rebuild if validation fails
