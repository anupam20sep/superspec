---
name: using-superspec
description: Use when starting any conversation - establishes how to find and use SuperSpec skills, requiring skill invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant or requested skills BEFORE any response or action** — including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.

**Before entering plan mode:** if you haven't already explored the problem space, invoke the explore skill first.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## Entry routing

Pick the lane before invoking a lifecycle skill:

| User intent | Skill | Artifacts |
|-------------|-------|-----------|
| Bootstrap repo | `superspec-init` | `constitution.md` |
| Small bug / regression | `superspec-fix` | test + patch only (no spec/plan) |
| Brownfield docs or code | `superspec-ingest` | `sources.lock`, draft FRs |
| Greenfield idea | `superspec-explore` | brainstorm design doc → then `scope` |
| Formal requirements | `superspec-scope` | `specs/<feature>/spec.md` |
| Ambiguous spec | `superspec-refine` | updated `spec.md` |
| Technical design | `superspec-architect` | `design.md` |
| Task breakdown | `superspec-plan` | `plan.md` + `execution-map.md` |
| Implementation loop | `superspec-forge` | code, `status.md` |
| Pre-release proof | `superspec-validate` | validation report |
| Merge / PR / cleanup | `superspec-ship` | integration decision |
| Multi-spec coordination | `superspec-program` / `superspec-status` | `program.md` table |

## Execution mode: Review (default) vs Autonomous

**Review mode (default):** complete the current phase's artifacts, **present them**, and **wait for explicit user approval** before invoking the next lifecycle skill. Human gates are normal — scope additions, refinement, design sign-off, plan review, forge kickoff, validate, ship.

**Autonomous mode:** when the user explicitly opts out of review stops — e.g. "don't stop for review", "run autonomously", "no checkpoints", "keep going through the lifecycle", "full pipeline without stopping" — chain skills continuously from the **current stage** until `ship` or a blocker. Still produce every artifact; skip only the **wait-for-approval** pauses.

**Autonomous from mid-pipeline:** infer stage from on-disk artifacts (same rules as `superspec-status`), fill any missing artifact for the current stage first (e.g. if `plan.md` exists but no `execution-map.md`, run `superspec-route` before forge), then continue the chain.

### Full-feature chain (after `specs/<feature>/` exists)

| Stage complete | Artifacts present | Review mode: stop and present | Autonomous: invoke next |
|----------------|-------------------|------------------------------|-------------------------|
| Explore / ingest | brainstorm or `sources.lock` | design / ingest draft | `superspec-scope` |
| Scope | `spec.md` | spec for additions | `superspec-refine` if `[NEEDS CLARIFICATION]`, else `superspec-architect` |
| Refine | updated `spec.md` | clarified spec | `superspec-architect` |
| Architect | `design.md` | design sign-off | `superspec-plan` (includes route) |
| Plan | `plan.md` + `execution-map.md` | plan + map; then forge choice | `superspec-forge` |
| Forge | code + `status.md` | implementation summary | `superspec-validate` |
| Validate | clean report | validation evidence | `superspec-ship` |

**Worktree (optional):** before `superspec-plan` or `superspec-forge` when branch isolation is wanted, invoke `superspec-worktree`. Skip for trivial edits. In autonomous mode, only create a worktree if the user asked for isolation or the skill detects an existing worktree convention.

**Fix lane:** `superspec-fix` → `superspec-ship` only; does not enter the spec chain unless the user escalates.

Every phase skill below implements the same Review / Autonomous handoff pattern.

## Skill Priority

When multiple skills apply, process skills come first — they set the approach, then implementation skills carry it out. superspec-explore is SuperSpec's most common process skill, but the rule holds for any of them.

- "Let's build X" → superspec-explore first, then implementation skills.
- "This spec is ambiguous" → superspec-refine first, then continue the lifecycle.

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Platform Adaptation

If your harness has a reference file in this skill's `references/` directory, read it for harness-specific guidance on how to invoke and work with tools.

## User Instructions

User instructions (your instructions file, agent configuration files, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.

<!-- Adapted from SP: skills/using-superpowers/SKILL.md (MIT). See /NOTICE. -->
