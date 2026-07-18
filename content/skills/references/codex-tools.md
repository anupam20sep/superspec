# Codex Tool Reference

This reference maps generic SuperSpec actions to OpenAI Codex's actual tools and mechanisms (Codex CLI and ChatGPT Work mode / Codex desktop).

## Action → Tool Mapping

| Action | Codex Mechanism | Configuration | Notes |
|--------|-----------------|---------------|-------|
| **Dispatch a subagent for an isolated task** | Multi-agent spawn / custom agents | `~/.codex/agents/*.toml` or `.codex/agents/*.toml`; feature `multi_agent` | Spawn a fresh agent with a filled prompt. Prefer isolated spawn over continuing the parent thread. When spawn is unavailable, use the inline fallback in `superspec-forge`. |
| **Call an MCP tool** (e.g., build-matrix, lint-plan, scaffold, forge-status from @superspec-dev/core) | MCP via plugin or config | Plugin `.mcp.json` (bundled) or `~/.codex/config.toml` / `.codex/config.toml` | Plugin install wires `npx -y @superspec-dev/core mcp`. Manual: `codex mcp add superspec -- npx -y @superspec-dev/core mcp`. |
| **Invoke a skill or command** | Skills (`SKILL.md`) | Plugin `skills/`, `.agents/skills/`, `~/.agents/skills/` | Explicit: `$skill-name` or `/skills`. Implicit: description match. Progressive disclosure — metadata until selected. |
| **Track task or todo state** | Session notes / plan skill / file checklist | N/A | Prefer committed `specs/<feature>/status.md` for cross-session progress. Use an in-session checklist when available. |
| **Read a file** | Built-in file tools | N/A | Read before edit. |
| **Write or create a file** | Built-in file tools / `apply_patch` | N/A | Prefer patch-style edits for existing files. |
| **Edit a file in place** | `apply_patch` / edit tools | N/A | Keep diffs focused per task. |
| **Run shell commands** | Shell tool | Sandbox + approval policy in Codex settings | Honor sandbox. Long commands may need elevated approval. |
| **Web fetch or search** | Optional web tools | `--search` / config | Enable only when the task needs external docs. |

## Patterns for Common Superspec Tasks

### Running forge loop subagents (implementer + task-reviewer)

Fill plugin agent bodies `agents/implementer.md` and `agents/task-reviewer.md`, then spawn isolated agents:

```text
# Implementer — fresh context, zero prior forge history
spawn({
  prompt: """
  You are the implementer. Follow agents/implementer.md discipline.

  [Paste filled implementer.md: TASK_NAME, FR, acceptance criteria, constitution]

  Red-green-refactor. Run tests. Commit. Report BASE_SHA and HEAD_SHA.
  """,
  model: "<routed implementer model>"
})

# Reviewer — fresh context, read-only intent
spawn({
  prompt: """
  You are task-reviewer. Follow agents/task-reviewer.md exactly.
  Read-only — do not modify files.

  [Paste filled task-reviewer.md: acceptance criteria, constitution, diff, commit range]

  Return spec compliance AND code quality verdicts.
  """,
  model: "<routed reviewer model>"
})
```

Resume the **same** implementer with review findings; re-spawn the reviewer fresh after each fix. See `superspec-forge` → "Per-Task Dispatch Playbook" → Codex.

If your Codex build exposes named custom agents (`.codex/agents/*.toml`), you may map implementer/reviewer roles there — still paste the filled SuperSpec agent body into `developer_instructions` / the spawn prompt.

### Calling MCP tools (e.g., `forge-status`)

After the SuperSpec plugin is enabled (or MCP is added manually), call tools directly:

```text
forge-status / next-task / begin-task / record-result / sync-status / lint-plan / build-matrix
```

Always pass `stateDir` / `--dir specs/<feature>` for forge state. Without it, progress resets to `0/N`.

### Skill invocation

```text
$using-superspec
$superspec-forge
```

Or ask in natural language; Codex loads matching skills by description.

### File operations in task loops

1. **Read** current files.
2. **Patch** / write changes.
3. **Shell** for tests and `git commit`.

## Personas on Codex

`list-personas` scans project + home `.claude/agents`, `.cursor/agents`, and `.codex/agents` (markdown + TOML). Prefer:

```text
list-personas({ projectRoot: "<absolute repo root>" })
```

On Codex you can still use `@fallback` roles from `superspec-route`, or paste a discovered persona description into the implementer prompt.

## Limitations and Fallbacks

- **Plugin CLI may be gated:** Some Codex CLI builds list `plugins` as under development. Packaging still works for ChatGPT Work mode / desktop Codex; for CLI, enable plugins when available or install skills under `.agents/skills/` and MCP via `codex mcp add`.
- **Hooks require trust:** Plugin SessionStart hooks are skipped until approved in `/hooks`.
- **Subagent isolation:** Prefer spawn; if unavailable, use the inline fallback in `superspec-forge` (implement → explicit review boundary → `record-result`).
- **Dual marketplace:** This repo also ships `.claude-plugin/marketplace.json`. If both appear, install SuperSpec **once** from the Codex (`.agents/plugins`) source and disable the duplicate.
- **Empty plugin list after marketplace add:** `.agents/plugins/marketplace.json` must use `"path": "./"` (repo root). `"../.."` is rejected; remove and re-add the marketplace after upgrading to Codex ≥ 0.142 / pulling the fix.

---

<!-- Reference file for SuperSpec Codex harness. Adapted from SP: skills/using-superpowers/references/codex-tools.md (MIT). See /NOTICE. -->
