---
name: superspec-init
description: "Use once per repository to bootstrap SuperSpec. Runs the scaffold CLI, asks lite vs full mode, writes Mode in constitution.md, and scaffolds program.md in full mode."
---

# superspec-init

Use this skill for **one-time bootstrap** of SuperSpec in a repository. It scaffolds tier templates, records the chosen operating mode, and (in full mode) creates the program coordination layer. Run this once; do not re-run on every feature.

**Announce at start:** "I'm using the superspec-init skill to bootstrap SuperSpec in this repository."

<HARD-GATE>
Do NOT re-run init if `constitution.md` already exists with a `**Mode**` field unless the user explicitly requests re-initialization. Check first; init is one-time.
</HARD-GATE>

## When to Use

- A repository has never adopted SuperSpec and needs tier scaffolding
- The team is starting fresh and needs `constitution.md`, templates, and (optionally) `program.md`
- The user asks to "set up SuperSpec", "initialize SuperSpec", or "bootstrap the spec workflow"

## When NOT to Use

- SuperSpec is already initialized (`constitution.md` exists with `**Mode**: lite|full`)
- You are starting a new feature in an initialized repo — use the lifecycle skills instead
- You only need to add a spec — use `superspec-scope` or `superspec-program`

## What This Skill Does

1. **Checks for existing init** — aborts if already initialized (unless user explicitly requests re-init)
2. **Asks lite vs full mode** — presents the tradeoff and records the choice
3. **Runs scaffold CLI** — renders tier templates into the target directory
4. **Writes Mode to constitution.md** — `**Mode**: lite` or `**Mode**: full`
5. **Scaffolds program.md** — only in full mode, at repo root

## Lite vs Full Mode

Present both options and get explicit user choice before proceeding:

| Aspect | Lite | Full |
|--------|------|------|
| **Tier templates** | constitution.md, spec/design/plan templates | Same |
| **program.md** | Not created | Created at repo root |
| **Multi-spec coordination** | Manual | Via `superspec-program` |
| **Status dashboard** | Per-spec only | Program-wide via `superspec-status` |
| **Best for** | Single-feature repos, solo work, quick adoption | Multi-feature programs, team coordination |

**Default recommendation:** lite for single-feature or solo projects; full for repos expecting parallel spec workstreams.

## How to Use

### Step-by-step workflow

1. **Check existing state**

   ```bash
   # Look for constitution.md at repo root or docs/superspec/
   ```

   If `constitution.md` exists and contains `**Mode**: lite` or `**Mode**: full`, stop and report already initialized. Only continue if the user explicitly wants re-init.

2. **Ask mode choice** — present lite vs full table above. Wait for explicit answer (`lite` or `full`). Do not assume.

3. **Run scaffold CLI** — use the SuperSpec scaffold command or MCP `scaffold` tool:

   ```bash
   npx @superspec-dev/core scaffold --templates <templatesDir> --out <targetDir>
   ```

   Or call the `scaffold` MCP tool with:
   - `templatesDir`: path to tier templates (typically `content/templates/` in the SuperSpec plugin, or project-local copy)
   - `targetDir`: where to write rendered files (repo root or `docs/superspec/` per project convention)

   Record which files were written.

4. **Write Mode to constitution.md** — after scaffold renders `constitution.md`, add or update the Mode field near the top (after the title):

   ```markdown
   # SuperSpec Constitution

   **Mode**: lite
   ```

   or

   ```markdown
   # SuperSpec Constitution

   **Mode**: full
   ```

   Use exactly `lite` or `full` — lowercase, no quotes.

5. **Scaffold program.md (full mode only)**

   If mode is `full`, create `program.md` at the **repository root**:

   ```markdown
   # Program Backlog

   **Mode**: full
   **Last updated**: <ISO-8601 timestamp>

   ## Backlog

   | ID | Feature | Priority | Owner | Stage | Spec Path | Notes |
   |----|---------|----------|-------|-------|-----------|-------|
   | | | | | | | |

   ## Open Decisions

   | ID | Decision | Affects | Owner | Status | Resolution |
   |----|----------|---------|-------|--------|------------|
   | | | | | | |
   ```

   Lite mode: skip this step entirely.

6. **Create specs directory** — ensure `specs/` exists at repo root for future feature directories.

7. **Confirm init complete** — report:
   - Mode chosen
   - Files scaffolded
   - Whether `program.md` was created
   - Recommended next step

## Output Structure

After init completes, the repository contains:

| Artifact | Lite | Full |
|----------|------|------|
| `constitution.md` with `**Mode**` | ✓ | ✓ |
| Tier templates (spec, design, plan, etc.) | ✓ | ✓ |
| `specs/` directory | ✓ | ✓ |
| `program.md` at repo root | — | ✓ |

## Handoff

| Mode | Recommended next step |
|------|----------------------|
| **Lite** | `superspec-explore` (greenfield) or `superspec-ingest` (brownfield) for the first feature |
| **Full** | `superspec-program` to add the first backlog row, then `superspec-explore` or `superspec-ingest` |

## Key Principles

- **One-time bootstrap** — init runs once per repo, not per feature
- **Explicit mode choice** — never default silently; lite and full have different coordination expectations
- **Mode is recorded in constitution.md** — other skills read this field to decide whether program coordination applies
- **Scaffold, don't hand-write** — use the CLI/MCP scaffold tool for tier templates; only `program.md` and the Mode line are skill-specific additions
- **Minimal footprint in lite** — do not create `program.md` or program coordination artifacts in lite mode
