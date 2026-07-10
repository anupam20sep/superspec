# Route parallel execution

---

## When

After `plan.md` exists with multiple tasks and dependencies. Use **superspec-route**.

---

## Output

`execution-map.md` with:

- Dependency DAG
- **Parallel windows** — tasks with no shared writes that can run concurrently
- **Model routing** — mechanical/moderate → fast; complex → strong
- **Personas** — from `list-personas` or `@fallback` roles
- Verification gates per window

---

## Forge coordination

The forge coordinator runs tasks in DAG order. Tasks in the same window may dispatch in parallel **only** when your platform supports concurrent subagents and tasks have no file conflicts.

Each task still gets: implementer → task-reviewer → `record-result`.

---

## Related

- [superspec-route skill](../../skills/superspec-route/SKILL.md)
- [Run the forge loop](run-the-forge-loop.md)
