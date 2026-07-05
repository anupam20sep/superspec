---
name: superspec-program
description: "Use when coordinating multiple spec workstreams in one repository. Maintains program.md at the repo root with a backlog table and Open Decisions, with per-row ownership for safe concurrent edits."
---

# superspec-program

Use this skill to manage a **program** of multiple feature specs running in parallel or sequence within one repository. You maintain a single `program.md` at the repo root as the coordination layer — backlog, ownership, and open decisions — while each feature still follows its own spec lifecycle under `specs/<FEATURE>/`.

**Announce at start:** "I'm using the superspec-program skill to update the program backlog."

## When to Use

- The repository has (or will have) more than one active spec workstream
- You need a single view of all features, their priority, owner, and lifecycle stage
- Multiple agents or humans may edit the program backlog concurrently
- You need to track cross-cutting **Open Decisions** that affect multiple specs
- Full-mode SuperSpec init has scaffolded `program.md` and you are maintaining it

## What This Skill Does

This skill guides you through reading, updating, and coordinating `program.md`:

1. **Maintains the backlog table** — one row per spec workstream with priority, owner, stage, and notes
2. **Tracks Open Decisions** — cross-cutting questions that block or affect multiple specs
3. **Enforces per-row ownership** — only the designated owner edits a row; others add comments or open decisions
4. **Requires fresh reads** — always read `program.md` immediately before editing to avoid stale concurrent updates

## program.md Structure

`program.md` lives at the **repository root** and follows this structure:

```markdown
# Program Backlog

**Mode**: full
**Last updated**: <ISO-8601>

## Backlog

| ID | Feature | Priority | Owner | Stage | Spec Path | Notes |
|----|---------|----------|-------|-------|-----------|-------|
| P-001 | user-auth | P1 | @alice | scope | specs/001-user-auth | Blocked on OAuth provider choice |
| P-002 | analytics-dashboard | P2 | @bob | forge | specs/002-analytics-dashboard | In flight |

## Open Decisions

| ID | Decision | Affects | Owner | Status | Resolution |
|----|----------|---------|-------|--------|------------|
| OD-001 | OAuth provider: Google vs Auth0 | P-001, P-003 | @alice | open | — |
| OD-002 | Shared event schema | P-002, P-004 | @bob | resolved | Use CloudEvents v1.0 |
```

### Column definitions

| Column | Meaning |
|--------|---------|
| **ID** | Stable program identifier (`P-001`, `P-002`, …) — never reused |
| **Feature** | Short feature slug matching `specs/<FEATURE>/` directory |
| **Priority** | P1 (critical), P2 (important), P3 (deferred) |
| **Owner** | Single accountable editor for this row (handle or name) |
| **Stage** | Current lifecycle stage (see Stage Values below) |
| **Spec Path** | Path to the spec directory under `specs/` |
| **Notes** | Freeform status, blockers, links |

### Stage Values

Use the same stage names as the SuperSpec lifecycle:

| Stage | Meaning |
|-------|---------|
| `ingest` | Requirements being extracted from docs/code |
| `scope` | spec.md being written or refined |
| `refine` | Clarifications in progress |
| `architect` | design.md in progress |
| `plan` | plan.md in progress |
| `route` | execution-map.md in progress |
| `forge` | Implementation in progress |
| `validate` | Verification gates running |
| `ship` | Integration / merge in progress |
| `done` | Feature complete and merged |
| `blocked` | Cannot proceed — see Notes or Open Decisions |
| `deferred` | Intentionally paused |

## How to Use

### Step-by-step workflow

1. **Read fresh** — always read `program.md` from disk immediately before any edit. Never edit from memory or a cached copy from an earlier turn.

2. **Identify your row** — find the backlog row you own. If you are adding a new workstream, allocate the next `P-###` ID.

3. **Edit only your row** — if you are the **Owner** of a row, you may update Priority, Stage, Spec Path, and Notes for that row. You may **not** edit another owner's row directly.

4. **Comment via Open Decisions** — if you need to flag something on someone else's row:
   - Add or update an **Open Decision** entry referencing the affected `P-###` IDs
   - Add a Note on your own row pointing to the OD entry
   - Do not mutate another owner's Stage or Priority

5. **Update stage on lifecycle transitions** — when a spec moves to a new lifecycle stage (e.g., scope → architect), update the Stage column in the same session that completes the prior stage.

6. **Resolve Open Decisions** — when a decision is made:
   - Set Status to `resolved` and fill Resolution
   - Update affected backlog rows (Notes, Stage unblocks)
   - Propagate the resolution into affected `spec.md` files via `superspec-refine` if needed

7. **Write atomically** — after editing, update the `Last updated` timestamp. Prefer minimal diffs — change only the rows and decisions you touched.

### Adding a new workstream

1. Read fresh `program.md`
2. Allocate next `P-###` ID
3. Create spec directory: `specs/<NNN-feature-slug>/`
4. Add row with Owner, Priority, Stage=`ingest` or `scope`, Spec Path
5. Hand off to the appropriate lifecycle skill (`superspec-ingest`, `superspec-explore`, or `superspec-scope`)

### Concurrent edit safety

| Rule | Rationale |
|------|-----------|
| Read fresh before every edit | Another session may have updated since your last read |
| One owner per row | Prevents conflicting stage/priority edits |
| Use Open Decisions for cross-row issues | Central coordination without row mutation |
| Never renumber or reuse P-### IDs | Stable references for automation and status |

## Relationship to Lite vs Full Mode

- **Lite mode** (`constitution.md` → `**Mode**: lite`): `program.md` is optional. Use this skill only if the team chooses to maintain a program backlog anyway.
- **Full mode** (`**Mode**: full`): `program.md` is scaffolded at init and **should** be maintained via this skill for every active workstream.

## Handoff

| Situation | Next skill |
|-----------|------------|
| New feature, no requirements yet | `superspec-ingest` or `superspec-explore` |
| Requirements ready to formalize | `superspec-scope` |
| Need program-wide status view | `superspec-status` |
| Single spec ready for next lifecycle stage | The appropriate stage skill (refine, architect, plan, route, forge, validate, ship) |

## Key Principles

- **One table, one truth** — `program.md` is the coordination layer; spec artifacts under `specs/` are the detail layer
- **Ownership prevents conflicts** — edit your row; coordinate through Open Decisions
- **Fresh reads always** — stale edits are the primary failure mode for concurrent programs
- **Stage reflects reality** — update Stage when the lifecycle actually transitions, not when you plan to transition
- **Open Decisions are first-class** — cross-cutting blockers belong in the decisions table, not buried in Notes
