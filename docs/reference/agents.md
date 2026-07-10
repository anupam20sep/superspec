# Agent prompt bodies

Shipped in plugin `agents/` (Claude Code) and `content/agents/` (source).

| Agent | When | Verdicts |
|-------|------|----------|
| `implementer.md` | Forge implement step | TDD, commit, report SHAs |
| `task-reviewer.md` | After each task | Spec compliance + code quality |
| `spec-reviewer.md` | Before plan (optional) | Spec quality, testable FRs |

Copy to `.claude/agents/` or `.cursor/agents/` for discovery via `list-personas`.

Fill bracket placeholders (`[TASK_NAME]`, `[ACCEPTANCE_CRITERIA]`, etc.) before dispatch.

See [Dispatch on Claude Code](../how-to/dispatch-on-claude-code.md) and [Dispatch on Cursor](../how-to/dispatch-on-cursor.md).
