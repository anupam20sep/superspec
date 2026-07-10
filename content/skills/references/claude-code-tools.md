# Claude Code Tool Reference

This reference maps generic SuperSpec actions to Claude Code's actual tools and mechanisms.

## Action → Tool Mapping

| Action | Claude Code Tool | Configuration | Notes |
|--------|------------------|----------------|-------|
| **Dispatch a subagent for an isolated task** | `Agent` tool | N/A — built-in | Spawns a fresh agent with dedicated context and full tool access. Can specify `subagent_type` to select a specialized agent — the available types are session-specific, see below. Results return as a single message when complete. Use `run_in_background` to let tasks run in parallel while continuing work. |
| **Call an MCP tool** (e.g., build-matrix, lint-plan, scaffold, forge-status from @superspec-dev/core) | MCP tool via configured server | `.mcp.json` in project root | Claude Code reads `.mcp.json` at startup; register MCP servers there and their tools become available in your context. No dynamic reload — update config and restart. |
| **Invoke a skill or command** | `Skill` tool | Installed skill via `~/.claude/skills/` or project `.claude/skills/` | Loads a SKILL.md file and executes its logic. Can be invoked with `args` for parameterization. Skill content defines the behavior; Claude Code provides the dispatch mechanism. |
| **Track task or todo state** | `TodoWrite` tool | N/A — built-in | Create, read, or update tasks in an internal todo list. Survives across conversation turns within a session. |
| **Read a file** | `Read` tool | N/A — built-in | Read file contents from filesystem. Supports line offset/limit for large files, and can read images, PDFs (with page range), and Jupyter notebooks. |
| **Write or create a file** | `Write` tool | N/A — built-in | Create or overwrite a file. Must have read the file first if it already exists (for safety). |
| **Edit a file in place** | `Edit` tool | N/A — built-in | Perform exact string replacements in a file. More efficient than Write for partial changes. Must have read the file first. |
| **Run shell commands** | `Bash` tool | N/A — built-in | Execute bash/zsh commands. Supports `run_in_background` for long-running tasks (you'll be notified on completion). Timeout: default 2 minutes, max 10 minutes. |
| **Web fetch or search** | `WebFetch`, `WebSearch` (deferred) | N/A | Use `ToolSearch` to load deferred tools before calling. WebFetch retrieves full content; WebSearch queries the web. |
| **Launch a specialized agent** | `Agent` with `subagent_type` | N/A — built-in | The set of available `subagent_type` values is session- and project-specific, not a fixed global list — it always includes a general-purpose type and typically an `Explore` (code search) and `Plan` (architecture) type, but the full list must be read from the current session's system reminders before dispatching, not assumed from memory. |

## Patterns for Common Superspec Tasks

### Running forge loop subagents (implementer + task-reviewer)

Dispatch using plugin agent bodies `agents/implementer.md` and `agents/task-reviewer.md`:

```text
Agent({ prompt: "<filled implementer.md>", model: "<routed>" })
Agent({ prompt: "<filled task-reviewer.md>", model: "<routed>" })  // fresh context, read-only
```

Resume the same implementer agent with review feedback. See `superspec-forge` → "Per-Task Dispatch Playbook".

### Running subagent-driven-development
Dispatch an `implementer` subagent for task execution:
```
Agent({
  subagent_type: "claude",
  prompt: "[task details + acceptance criteria]"
})
```
The subagent runs to completion and returns results. You can dispatch multiple agents in parallel by sending all Agent tool calls in a single message.

### Calling MCP tools (e.g., `forge-status` from @superspec-dev/core)
Once registered in `.mcp.json`, MCP tools are available as direct tool calls. Example:
```
MCP tool "forge-status" (if registered)
```
Check your `.mcp.json` to see what servers are active and what tools they export.

### Skill invocation workflow
The `Skill` tool dispatches to a skill:
```
Skill({
  skill: "superspec-forge"  // matches SKILL.md filename in skills directory
})
```
If the skill defines steps or checklists, you can create todos to track them.

### File operations in task loops
Claude Code's file tools are designed for the edit-commit loop. Always:
1. **Read** the file first to see current state.
2. **Edit** or **Write** changes.
3. **Bash** (git commands) to stage and commit.

These are synchronous and must complete before the next operation.

## Limitations and Fallbacks

- **No dynamic MCP reload:** Update `.mcp.json` and restart Claude Code to pick up new servers.
- **Subagent isolation:** Each Agent spawn is a fresh context; subagents cannot inherit conversation history unless you explicitly pass it in the prompt.
- **Background tasks:** Use `run_in_background: true` on Bash or Agent for concurrent work; you'll be notified when done.

---

<!-- Reference file for SuperSpec task C3.2. Adapted from SP: skills/using-superpowers/references/codex-tools.md (MIT). See /NOTICE. -->
