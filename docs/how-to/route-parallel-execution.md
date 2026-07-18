# Route parallel execution

---

## When

After `plan.md` exists. **superspec-plan** chains **superspec-route** automatically — you should always get `execution-map.md` in the same session as the plan. Invoke `superspec-route` manually only when re-routing after plan edits.

---

## Output

`execution-map.md` with:

- Dependency DAG
- **Parallel windows** — tasks with no shared writes that can run concurrently
- **Model routing** — mechanical → economy; moderate → standard; complex → frontier (validate complexity with plan rubric first)
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
