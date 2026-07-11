---
name: superspec-init
description: "Use once per repository to bootstrap SuperSpec. Runs the init CLI, asks lite vs full mode, and creates constitution.md, specs/, and .superspec/ at the repository root."
---

# superspec-init

Use this skill for **one-time bootstrap** of SuperSpec in a repository. It creates a fixed layout at the **repository root** — never in arbitrary `docs/` folders unless the user explicitly overrides the root.

**Announce at start:** "I'm using the superspec-init skill to bootstrap SuperSpec in this repository."

<HARD-GATE>
Do NOT re-run init if `constitution.md` already exists with a `**Mode**` field unless the user explicitly requests re-initialization. Check first; init is one-time.
</HARD-GATE>

<HARD-GATE>
Do NOT scaffold tier templates into `docs/`, a user-provided resources path, or any folder outside the repository root unless the user **explicitly** names that path as the project root. Default `--root` is `.` (the git repository root). The old `scaffold --out docs/...` pattern is wrong for init.
</HARD-GATE>

## When to Use

- A repository has never adopted SuperSpec and needs the standard layout
- The user asks to "set up SuperSpec", "initialize SuperSpec", or "bootstrap the spec workflow"

## When NOT to Use

- SuperSpec is already initialized (`constitution.md` exists with `**Mode**: lite|full`)
- You are starting a new feature — use lifecycle skills under `specs/<feature>/`

## What Init Creates (fixed layout)

| Path | Purpose |
|------|---------|
| `constitution.md` | Governance + `**Mode**: lite\|full` at **repo root** |
| `specs/` | Future feature directories (`specs/<feature>/spec.md`, …) |
| `.superspec/README.md` | Explains repo-level metadata |
| `.superspec/templates/` | Reference copies of tier templates (not live specs) |
| `program.md` | Full mode only — multi-spec backlog at repo root |

Per-feature artifacts (`spec.md`, `plan.md`, `execution-map.md`, `status.md`) are created later under `specs/<feature>/` by scope/plan/forge — **not** during init. The plan phase produces both `plan.md` and `execution-map.md`.

## Lite vs Full Mode

Present both options and get explicit user choice before proceeding:

| Aspect | Lite | Full |
|--------|------|------|
| `program.md` | Not created | Created at repo root |
| Multi-spec coordination | Manual | Via `superspec-program` |
| Best for | Single-feature repos, solo work | Multi-feature programs |

## How to Use

1. **Check existing state** — if `constitution.md` has `**Mode**`, stop unless re-init requested.

2. **Ask mode** — `lite` or `full`. Do not assume.

3. **Run init CLI** (preferred — bundled templates, correct layout):

   ```bash
   npx -y @superspec-dev/core@latest init --root . --mode lite --verbose
   ```

   Or MCP `init` with `{ "root": "<absolute-repo-root>", "mode": "lite" | "full", "verbose": true }`.

   **Verify success:** stdout must show `SuperSpec init: OK` and `filesWritten` ≥ 8. If `filesWritten` is 0 or output is empty, the CLI did not run — use `--verbose` and an absolute `--root` path.

   Templates ship inside `@superspec-dev/core`; do **not** point at plugin `content/templates/` unless init fails and you are debugging.

4. **Create TodoWrite items** for: mode chosen, init command run, files verified.

5. **Confirm** — report paths created and recommend `superspec-explore` or `superspec-ingest`.

## Handoff

| Mode | Next step |
|------|-----------|
| **Lite** | `superspec-explore` or `superspec-ingest` |
| **Full** | `superspec-program` then explore/ingest |

## Key Principles

- **One-time bootstrap** at repo root
- **Never dump templates into docs/** — `.superspec/templates/` is the reference copy
- **Use `init` command**, not raw `scaffold --out <docs-path>`
- **Explicit mode choice** recorded in `constitution.md`
