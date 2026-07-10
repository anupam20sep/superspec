# Cursor Tool Reference

This reference maps generic SuperSpec actions to Cursor's actual tools and mechanisms.

## Action → Tool Mapping

| Action | Cursor Mechanism | Configuration | Notes |
|--------|------------------|----------------|-------|
| **Dispatch a subagent for an isolated task** | `Task` tool | N/A — built-in | Spawns an isolated subagent with its own context. Use `subagent_type` (e.g. `generalPurpose`, `code-reviewer`, `explore`) and explicit `model`. Use `resume` to continue the same subagent after review feedback. When `Task` is unavailable, use the inline fallback in `superspec-forge`. |
| **Call an MCP tool** (e.g., build-matrix, lint-plan, scaffold, forge-status from @superspec-dev/core) | MCP tool via configured server | `.cursor/mcp.json` in project root | Cursor reads `.cursor/mcp.json` at startup (parallel to Claude Code's `.mcp.json`). Register MCP servers there; tools become available within Agent mode. |
| **Invoke a skill or command** | SKILL.md (skill format) | `.cursor/skills/`, `.agents/skills/`, `~/.cursor/skills/`, `~/.agents/skills/`, or **installed plugin `skills/`** | Cursor recognizes SKILL.md files in `.cursor/skills/` (project-local), `.agents/skills/` (monorepo-aware), global skill dirs, and **skills shipped inside an installed plugin** (`.cursor-plugin/plugin.json` → `"skills": "./skills/"`, same as obra/superpowers). Skill identity is determined by the folder containing SKILL.md. |
| **Track task or todo state** | `TodoWrite` tool | N/A — built-in | Create and update todos during forge and checklist skills. Cursor has native todo tracking — use it. |
| **Read a file** | Built-in file viewing | N/A — automatic | Cursor can read any file in the project context or via explicit file references in the prompt. |
| **Write or create a file** | Built-in file editing | N/A — automatic | Cursor can create and edit files directly within Agent mode. |
| **Edit a file in place** | Built-in editor operations | N/A — automatic | Cursor's Agent mode includes inline editing with precise change tracking. |
| **Run shell commands** | Terminal integration / Agent spawning | Settings > Agents > Approvals & Execution | Agent mode can execute shell commands as part of autonomous work. Terminal output feeds back into the Agent loop. Command execution approval is controlled via the Cursor Settings UI (Settings > Agents > Approvals & Execution) with modes including auto-review of allowlisted commands, a full allowlist mode, or run-everything mode. Check your Settings > Agents panel for the current approval mode. No explicit background task primitive — all execution is synchronous within the Agent thread. |
| **Web fetch or search** | Via prompt context or external tools | N/A | Cursor's Agent can reference external links or request web content if instructed, but has no built-in web fetch tool. Use project rules (`.cursor/rules/*.mdc`) to provide context. |

## Patterns for Common Superspec Tasks

### Dispatching implementer + task-reviewer (forge loop)

Use the `Task` tool for isolated implementer and reviewer passes (see `superspec-forge` → "Per-Task Dispatch Playbook"):

```text
Task({ subagent_type: "generalPurpose", model: "<routed>", prompt: "<filled agents/implementer.md>" })
Task({ subagent_type: "code-reviewer", model: "<routed>", readonly: true, prompt: "<filled agents/task-reviewer.md>" })
```

Resume the implementer with `resume: "<agent-id>"` when review finds issues.

### Sequential Agent-mode loop (no Task tool)

If `Task` is unavailable, run implement and review in one Agent thread with an explicit review boundary, or split across separate Agent invocations with handoff summaries. See `superspec-forge` inline fallback.

### Calling MCP tools (e.g., `forge-status` from @superspec-dev/core)
Register the MCP server in `.cursor/mcp.json`, then reference it in Agent mode or SKILL.md:
```
Agent: "Call the forge-status MCP tool to report on current task execution..."
```

### Skill invocation in Cursor
Installed SuperSpec skills live in the plugin's repo-root `skills/` folder (via `/add-plugin`). In your own project you can also place SKILL.md files under `.cursor/skills/` or `.agents/skills/`. Reference them in Agent mode:
```
Agent: "Use the superspec-forge skill to execute the next task..."
```

Cursor will load and apply the skill logic within its Agent thread.

### File operations in task loops
Cursor's Agent mode handles file reads/writes automatically within the workflow. No separate read-then-edit step required — just prompt for the edits you need, and Agent will do them.

## Fallback Patterns

When `Task` subagent dispatch is unavailable:

1. **Inline review boundary** — implement, then apply `agents/task-reviewer.md` in a separate explicit review step before `record-result`.
2. **Sequential Agent invocations** — complete implementation in one session, paste diff + brief into a fresh session for review.
3. **Parallel work** — run independent tasks serially; combine results in the coordinator.

## Limitations and Fallbacks

- **Task tool required for true isolation** — without it, use inline fallback above.
- **No background tasks:** All execution is synchronous within the Agent thread.
- **TodoWrite for in-session progress:** Use during forge (see `superspec-forge`).
- **status.md for FR progress:** Committed per spec folder; updated by `sync-status` MCP/CLI.
- **No dynamic MCP reload:** Update `.cursor/mcp.json` and restart Cursor to pick up new servers.

---

<!-- Reference file for SuperSpec task C3.2. Adapted from SP: skills/using-superpowers/references/pi-tools.md (MIT). See /NOTICE. -->
