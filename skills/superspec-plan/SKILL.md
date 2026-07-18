---
name: superspec-plan
description: Use when you have a spec or requirements for a multi-step task, before touching code — writes comprehensive TDD plans with full task decomposition and FR traceability
---

<!-- Adapted from SP: skills/writing-plans/SKILL.md (MIT). See /NOTICE. -->

# superspec-plan: Writing Implementation Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the superspec-plan skill to create the implementation plan."

**Context:** If working in an isolated worktree, invoke `superspec-worktree` before plan (see `using-superspec` worktree guidance).

**Save plans to:** `specs/{{FEATURE}}/plan.md`
- (User preferences for plan location override this default)

**Plan phase outputs two files** — the plan phase is not complete until both exist:
1. `specs/{{FEATURE}}/plan.md` — tasks, dependencies, TDD steps (this skill)
2. `specs/{{FEATURE}}/execution-map.md` — parallel windows, model routing, gates (**REQUIRED SUB-SKILL:** `superspec-route`, see Route step below)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate. When drawing task boundaries: fold setup, configuration, scaffolding, and documentation steps into the task whose deliverable needs them; split only where a reviewer could meaningfully reject one task while approving its neighbor. Each task ends with an independently testable deliverable.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superspec-forge to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

## Task Structure

````markdown
### Task T001: [Component Name]

**Implements:** FR-### [SuperSpec requirement: every task MUST cite which functional requirement(s) from the spec it satisfies — use the exact FR-### identifiers from spec.md]

**Depends on:** [Task IDs that must land first, or `none`]

**Complexity:** [`mechanical` | `moderate` | `complex`]

**Complexity rationale:** [one line citing which classification test applied — required]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Complexity Classification (quality-first)

Assign `complexity` on every task before routing. **One-shot correctness beats minimum spend.** When between two labels, choose the higher one. Economy-class models are for deterministic execution of an already-decided design — not for “figure it out cheaply.”

Optional class hints (not vendor slugs; do not put model names on the task card):
- `mechanical` → economy-class (Composer / Haiku / GPT-5.4-like)
- `moderate` → standard-class (Composer 2.5 / Sonnet / GPT-5.5-like)
- `complex` → frontier-class (Opus / GPT-5.x high-thinking)

### Decision tests (apply in order)

For the task brief + files + acceptance criteria:

1. **Is the design already decided** (spec/design/plan steps spell the approach), and work is mostly typing/plumbing/tests against a clear pattern?
   - Yes → candidates: `mechanical` or `moderate`
   - No (must invent approach, trade-offs, or invariants) → at least `complex`
2. **Blast radius / ambiguity**
   - Single concern, exact files, deterministic output, low wrongness cost → `mechanical`
   - Multi-file but structured; clear AC; some coordination; wrongness recoverable by tests → `moderate`
   - Cross-cutting design, concurrency/consistency/security, API/schema contracts, ambiguous AC, novel algorithm, or “judgment call” → `complex`
3. **Reasoning depth required**
   - Follow a recipe / mirror existing code → `mechanical`
   - Understand existing module boundaries and wire correctly → `moderate`
   - Prove correctness under edge cases, design a protocol, or reason about system-wide implications → `complex`
4. **Bug fixes**
   - Root cause known, fix localized, regression test obvious → `mechanical`
   - Root cause needs investigation across a few modules but fix shape is clear once found → `moderate`
   - Heisenbug, concurrency, incorrect architecture, or unclear repro → `complex`
5. **Kind bias (after complexity chosen)**
   - `verify` / `doc-sync`: rarely `complex` unless interpreting flaky system behavior
   - `signoff`: complexity N/A for implementer model; reviewer ≥ `standard` tier at forge
   - `provision`: `moderate` default unless irreversible prod risk → `complex`

### Quick examples

| Task | Label | Why |
|------|-------|-----|
| Add migration from decided schema DDL | `mechanical` | Design done; execute pattern |
| Seed script / CI yaml / boilerplate | `mechanical` | Deterministic |
| Wire service to existing store + middleware | `moderate` | Understanding + multi-file; design mostly settled |
| Straightforward feature behind existing API shape | `moderate` | Structured, testable |
| New auth/tenancy model, outbox semantics, public API | `complex` | Cross-cutting judgment |
| Schema with backward-compat + dual-write | `complex` | System implications |
| Flaky race in production | `complex` | Deep diagnosis |

### Anti-patterns

- **Middle-bias:** dumping unknowns into `moderate` — if unsure between moderate/complex, pick `complex`
- **False mechanical:** labeling “implement the service” `mechanical` when design.md left choices open
- **False complex:** labeling lint/doc-sync `complex` to force frontier
- **Missing rationale:** every task must include `**Complexity rationale:**` one line citing which test applied

Deep thinking / reasoning is **not** a separate plan field — it is what `complex` means at forge (`frontier` tier + high thinking).

## Machine contracts (for matrix / lint-plan)

These keep human-readable plans machine-correct:

1. **`Implements:`** may include qualifiers — `FR-002 (config slice)` is fine; the parser extracts bare `FR-###`. Prefer listing every owned FR id.
2. **`Kind:`** use `**Kind:** code|verify|provision|signoff|doc-sync` and/or a heading tag `[Kind: provision]`. Explicit `**Kind:**` wins. Default is `code` (TDD required).
3. **Code tasks** need a red step (`failing test`) and a green step — accepted green phrases include `verify it passes`, `Run to verify pass`, `Expected: PASS`, `all … pass`.
4. **Non-code kinds** are not linted for TDD cycles (constitution F1).

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. FR traceability:** Does every task have a `**Implements:** FR-###` line? Do all FR identifiers in the plan match the spec exactly? Any spec requirements with no task claiming them?

**5. Complexity:** Does every task have `**Complexity:**` and `**Complexity rationale:**`? Re-check false mechanical / middle-bias against the classification rubric above.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Route (required — do not skip)

After `plan.md` is saved and self-review passes, **immediately** invoke **superspec-route** in the same session. Do not offer forge execution or end the plan phase until `execution-map.md` exists beside `plan.md`.

**Announce:** "Plan saved — now using superspec-route to build the execution map."

**REQUIRED SUB-SKILL:** `superspec-route` writes `specs/{{FEATURE}}/execution-map.md` with:
- Dependency DAG from plan task `**Depends on:**` lines
- Parallel windows (no shared writes within a window)
- Model routing per task complexity (`mechanical` → `economy`; `moderate` → `standard`; `complex` → `frontier`) — validate labels against the classification rubric first
- Personas via `list-personas` (or `@fallback` roles)
- Verification gates and rollback per window

Run `lint-plan` on `plan.md` before routing if MCP/CLI is available. After routing, confirm both artifacts exist on disk.

**Single-task plans:** still produce a one-window execution map (W1) — forge and validate expect `execution-map.md` even when nothing parallelizes.

## Execution Handoff

Follow execution mode from `using-superspec` (Review vs Autonomous).

After **both** `plan.md` and `execution-map.md` are saved:

**Review mode (default):** Present both artifacts and wait for plan approval before forge.

> "Plan phase complete — `specs/{{FEATURE}}/plan.md` and `execution-map.md`. Review tasks, dependencies, and parallel windows. When ready, choose forge approach: (1) Subagent-Driven or (2) Inline Execution."

Wait for user approval and forge-mode choice. Then invoke **`superspec-forge`** in the chosen mode.

**Autonomous mode:** invoke **`superspec-forge`** immediately in subagent-driven mode (no wait, no forge-mode question). If the user previously specified inline execution, honor that; otherwise default to subagent-driven.

**If Subagent-Driven:**
- **REQUIRED SUB-SKILL:** Use superspec-forge in subagent mode
- Fresh subagent per task + two-stage review

**If Inline Execution:**
- **REQUIRED SUB-SKILL:** Use superspec-forge in inline execution mode
- Batch execution with checkpoints for review
