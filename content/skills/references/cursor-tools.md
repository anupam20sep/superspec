# Cursor Tool Reference

This reference maps generic SuperSpec actions to Cursor's actual tools and mechanisms.

## Action → Tool Mapping

| Action | Cursor Mechanism | Configuration | Notes |
|--------|------------------|----------------|-------|
| **Dispatch a subagent for an isolated task** | Agent mode (single continuous thread) | N/A — built-in | Cursor's Agent mode runs autonomously in a single thread with full codebase access. Unlike Claude Code, there is no isolated subagent-dispatch primitive. All work happens in one continuous thread. See "Fallback Pattern" below. |
| **Call an MCP tool** (e.g., build-matrix, lint-plan, scaffold, forge-status from @superspec-dev/core) | MCP tool via configured server | `.cursor/mcp.json` in project root | Cursor reads `.cursor/mcp.json` at startup (parallel to Claude Code's `.mcp.json`). Register MCP servers there; tools become available within Agent mode. |
| **Invoke a skill or command** | SKILL.md (skill format) | `.cursor/skills/`, `.agents/skills/`, `~/.cursor/skills/`, `~/.agents/skills/`, or **installed plugin `skills/`** | Cursor recognizes SKILL.md files in `.cursor/skills/` (project-local), `.agents/skills/` (monorepo-aware), global skill dirs, and **skills shipped inside an installed plugin** (`.cursor-plugin/plugin.json` → `"skills": "./skills/"`, same as obra/superpowers). Skill identity is determined by the folder containing SKILL.md. |
| **Track task or todo state** | `TodoWrite` tool | N/A — built-in | Create and update todos during forge and checklist skills. Cursor has native todo tracking — use it. |
| **Read a file** | Built-in file viewing | N/A — automatic | Cursor can read any file in the project context or via explicit file references in the prompt. |
| **Write or create a file** | Built-in file editing | N/A — automatic | Cursor can create and edit files directly within Agent mode. |
| **Edit a file in place** | Built-in editor operations | N/A — automatic | Cursor's Agent mode includes inline editing with precise change tracking. |
| **Run shell commands** | Terminal integration / Agent spawning | Settings > Agents > Approvals & Execution | Agent mode can execute shell commands as part of autonomous work. Terminal output feeds back into the Agent loop. Command execution approval is controlled via the Cursor Settings UI (Settings > Agents > Approvals & Execution) with modes including auto-review of allowlisted commands, a full allowlist mode, or run-everything mode. Check your Settings > Agents panel for the current approval mode. No explicit background task primitive — all execution is synchronous within the Agent thread. |
| **Web fetch or search** | Via prompt context or external tools | N/A | Cursor's Agent can reference external links or request web content if instructed, but has no built-in web fetch tool. Use project rules (`.cursor/rules/*.mdc`) to provide context. |

## Patterns for Common Superspec Tasks

### Dispatching a "subagent-like" workflow in Cursor
Since Cursor lacks isolated subagent dispatch, use **prompt-driven sequential loops**:

1. **Enter Agent mode** with a clear task description.
2. **Define checkpoints**: "When you finish task 1, summarize results and ask what to do next."
3. **Let Agent run to completion**, then hand off to the next task in a new Agent invocation.

Example structure:
```
[In Agent mode]
You are implementing FR-001: Build user authentication.

Acceptance criteria:
- [ ] API endpoint /auth/login returns 200 with token
- [ ] Token is valid for 1 hour

When complete, summarize what was built and ask for the next task.
```

Then, in a fresh Agent invocation:
```
[Task results from previous Agent run]

Now implement FR-002: Add password reset flow.
...
```

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

## Fallback Patterns for Subagent Tasks

**Cursor has no native subagent isolation.** Instead:

1. **Sequential single-thread loop**: Each task runs to full completion in one Agent invocation.
2. **Explicit handoff**: At task boundaries, Agent summarizes and waits for you to confirm the next task (or provides a checkpoint for prompt reuse).
3. **Parallel work limitation**: For tasks that Claude Code would dispatch in parallel, Cursor must run them serially in separate Agent invocations, combining results afterward.

If you need true isolation (e.g., preventing a reviewer Agent from seeing implementer work), you would need to:
- Complete the implementation Agent in one session.
- Copy the results into a clean context for the reviewer Agent.
- This is manual and breaks the automation flow that Claude Code's subagent dispatch provides.

## Limitations and Fallbacks

- **No subagent isolation:** All work is one continuous thread. Cannot spawn truly isolated agents.
- **No background tasks:** All execution is synchronous within the Agent thread.
- **TodoWrite for in-session progress:** Use during forge (see `superspec-forge`).
- **status.md for FR progress:** Committed per spec folder; updated by `sync-status` MCP/CLI.
- **No dynamic MCP reload:** Update `.cursor/mcp.json` and restart Cursor to pick up new servers.

---

<!-- Reference file for SuperSpec task C3.2. Adapted from SP: skills/using-superpowers/references/pi-tools.md (MIT). See /NOTICE. -->
