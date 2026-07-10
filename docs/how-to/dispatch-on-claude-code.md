# Dispatch on Claude Code

> Spawn implementer and task-reviewer subagents with the `Agent` tool.

---

## Agent bodies

SuperSpec ships prompt templates in the plugin repo:

| Role | File |
|------|------|
| Implementer | `agents/implementer.md` |
| Task reviewer | `agents/task-reviewer.md` |

Copy to `.claude/agents/` in your project if you want named agent discovery via `list-personas`.

---

## Implementer dispatch

Fresh agent — **zero prior forge context**. Fill placeholders from the current task in `plan.md`.

```text
Agent({
  prompt: """
  Follow agents/implementer.md discipline.

  Task: T001 — [title]
  Implements: FR-001
  Acceptance criteria: [verbatim from plan]

  Constitution excerpt: [from constitution.md]

  Red → green → refactor. Run tests. Commit.
  Report BASE_SHA..HEAD_SHA when done.
  """,
  model: "<routed implementer model from route-model>"
})
```

If `route` assigned a discovered persona, dispatch as that `.claude/agents/<name>.md` agent when available; otherwise paste the persona description into the prompt.

---

## Reviewer dispatch

**Fresh** agent — different model than implementer. **Read-only** — no file edits.

```text
Agent({
  prompt: """
  Follow agents/task-reviewer.md exactly. Read-only.

  Task: T001 — [title]
  Acceptance criteria: [verbatim]
  Constitution: [verbatim]
  Commits: [BASE]..[HEAD]
  Diff: [paste or path]

  Return spec compliance AND code quality verdicts.
  """,
  model: "<routed reviewer model>"
})
```

---

## Fix loop

On review failure, **resume the same implementer** with findings — do not spawn a new implementer until the task passes or blocks.

Re-dispatch a fresh `task-reviewer` after each fix.

---

## Forge state

Use MCP tools (plugin `.mcp.json` → `npx @superspec-dev/core mcp`) or CLI:

```bash
npx -y @superspec-dev/core record-result --plan ... --dir ... --task T001 --passed true --spec ... --verbose
```

See [Run the forge loop](run-the-forge-loop.md).

---

## Related

- [Claude Code tool reference](../../skills/references/claude-code-tools.md)
- [Dispatch on Cursor](dispatch-on-cursor.md)
