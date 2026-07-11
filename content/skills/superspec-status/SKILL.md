---
name: superspec-status
description: "Use to get a program-wide or repo-wide status view. Reads program.md, infers lifecycle stage per spec from artifacts, calls forge-status for in-flight specs, and renders a single consolidated status table."
---

# superspec-status

Use this skill to produce a **single consolidated status table** across all spec workstreams in a repository. It reads `program.md` (if present), infers each spec's lifecycle stage from on-disk artifacts, calls `forge-status` for specs in the forge stage, and renders one view — no per-spec hunting.

**Announce at start:** "I'm using the superspec-status skill to render the program status."

## When to Use

- You need a snapshot of where every feature stands in the SuperSpec lifecycle
- The team asks "what's the status?" across multiple parallel workstreams
- Before a standup, planning session, or program review
- Full-mode repo with `program.md`, or lite-mode repo with multiple `specs/` directories
- You want forge progress (`done` / `blocked` / `pending`) for in-flight implementations

## When NOT to Use

- You need deep validation evidence for a single feature — use `superspec-validate` instead
- You are updating the backlog — use `superspec-program` instead
- Only one spec exists and you already know its stage — read the artifacts directly

## What This Skill Does

1. **Reads `program.md`** — if it exists at repo root, use its backlog table as the primary spec list
2. **Discovers specs without program.md** — if lite mode or no program file, scan `specs/` directories
3. **Infers stage per spec** — inspect artifacts to determine lifecycle stage (see Stage Inference below)
4. **Calls `forge-status`** — for specs at `forge` stage, call the MCP `forge-status` tool with the spec's `plan.md`
5. **Renders one status table** — consolidated output with stage, forge progress, and blockers

## Stage Inference

Inspect `specs/<FEATURE>/` artifacts to infer stage. Use the **most advanced** artifact present, working backward from ship:

| Artifacts present | Inferred stage |
|-------------------|----------------|
| Merged / ship complete (check git, PR state, or program.md Stage=`done`) | `done` |
| Validation report or recent validate pass | `validate` |
| `plan.md` exists + implementation in progress | `forge` |
| `execution-map.md` exists, no forge activity | `route` |
| `plan.md` exists, no execution-map | `plan` |
| `design.md` exists, no plan | `architect` |
| `spec.md` with unresolved `[NEEDS CLARIFICATION]` | `refine` |
| `spec.md` exists | `scope` |
| `ingest-draft.md` or `sources.lock` only | `ingest` |
| `specs/<FEATURE>/` directory empty or missing | `not started` |

When `program.md` exists, prefer its **Stage** column if recently updated; cross-check against artifacts and note discrepancies.

## How to Use

### Step-by-step workflow

1. **Read program.md** — if present at repo root:
   - Parse the Backlog table for spec list, owners, priorities, recorded stages
   - Parse Open Decisions for blockers (`Status: open`)
   - Note `**Mode**: lite|full`

2. **Discover specs** — if no `program.md`, or to catch unlisted specs:
   - `Glob` for `specs/*/spec.md` and `specs/*/`
   - Merge with program backlog; deduplicate by feature slug

3. **Infer stage per spec** — for each spec directory:
   - List artifacts: `sources.lock`, `ingest-draft.md`, `spec.md`, `design.md`, `plan.md`, `execution-map.md`
   - Apply stage inference table above
   - If program.md Stage differs from inferred stage, flag `[STAGE MISMATCH: program=<X> artifacts=<Y>]`

4. **Call forge-status for in-flight specs** — for every spec at stage `forge`:
   - Read `specs/<FEATURE>/plan.md`
   - Call the `forge-status` MCP tool with the plan content
   - Record: `{ total, done, blocked, pending, complete }`
   - If `blocked > 0`, note which tasks are blocked (from plan.md or forge state)

5. **Collect blockers** — from:
   - Open Decisions with `Status: open` in program.md
   - Forge-status `blocked` count
   - `[NEEDS CLARIFICATION]` markers in spec.md
   - `[SOURCE CONFLICT]` markers from ingest
   - Stage mismatches

6. **Render status table** — single consolidated output:

   ```markdown
   ## SuperSpec Status — <repo> — <timestamp>

   **Mode**: full | lite
   **Specs tracked**: N

   | Feature | Priority | Owner | Stage | Forge (done/total) | Blockers |
   |---------|----------|-------|-------|-------------------|----------|
   | user-auth | P1 | @alice | forge | 3/8 | OD-001: OAuth provider |
   | analytics | P2 | @bob | plan | — | — |
   | legacy-import | P3 | — | ingest | — | Source conflict FR-002 |

   ### Open Decisions (blocking)
   - **OD-001**: OAuth provider choice → blocks user-auth

   ### Stage Mismatches
   - user-auth: program says `scope`, artifacts say `forge`
   ```

7. **Do not mutate files** — this skill is read-only. To update stages or backlog, hand off to `superspec-program`.

## forge-status Integration

For specs at `forge` stage, call the MCP tool **with persisted state**:

```
forge-status({
  plan: <contents of specs/<FEATURE>/plan.md>,
  stateDir: "specs/<FEATURE>",
  specText: <contents of specs/<FEATURE>/spec.md>,  // optional; refreshes status.md
  specDir: "specs/<FEATURE>"
})
```

CLI equivalent (always pass `--dir`):

```bash
npx @superspec-dev/core forge-status --plan specs/<FEATURE>/plan.md --dir specs/<FEATURE> --spec specs/<FEATURE>/spec.md --verbose
```

Record the response:

| Field | Display |
|-------|---------|
| `total` | Total tasks |
| `done` | Completed tasks |
| `blocked` | Blocked tasks (highlight if > 0) |
| `pending` | Remaining tasks |
| `complete` | `true` only when all tasks done |

Display forge column as `done/total` (e.g., `3/8`). If `complete: true`, stage inference should advance to `validate` — flag if program.md still says `forge`.

**Always pass `stateDir` / `--dir`.** Without it, forge-status uses fresh state and shows `0/N` done.

For cross-session forge progress, `.superspec/state.json` under the spec directory is the machine source of truth; `status.md` is the human-readable committed view.

## Lite vs Full Mode

| Mode | Behavior |
|------|----------|
| **Full** | Read `program.md` backlog as primary; include Open Decisions |
| **Lite** | Scan `specs/` directories; no program backlog or Open Decisions section |

Detect mode from `constitution.md` → `**Mode**: lite|full`. If absent, treat as lite.

## Handoff

| Situation | Next skill |
|-----------|------------|
| User wants to update backlog or stages | `superspec-program` |
| Blocked forge tasks need resolution | `superspec-forge` |
| Spec ready for validation | `superspec-validate` |
| Open decision needs resolution | `superspec-refine` or human review |
| New spec needed | `superspec-program` → lifecycle skill |

## Key Principles

- **One table, one answer** — the whole point is a consolidated view, not per-spec archaeology
- **Artifacts are ground truth** — infer stage from files; flag when program.md disagrees
- **forge-status for forge stage only** — don't call it for specs still in plan or design
- **Read-only** — status reports; program updates go through `superspec-program`
- **Blockers surfaced prominently** — open decisions, forge blocked counts, and conflicts appear in the table
