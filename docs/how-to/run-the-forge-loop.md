# Run the forge loop

> Per-task implement → review → record cycle with `@superspec-dev/core` state machine.

---

## Prerequisites

- Plugin installed (Claude Code or Cursor)
- `superspec-init` completed in your repo
- `specs/<feature>/spec.md` and `plan.md` written (`scope` → `plan`)
- Optional: `execution-map.md` from `route` for parallel windows and model routing

Set `FEATURE` and `DIR` for your spec folder:

```bash
FEATURE=my-feature
DIR=specs/$FEATURE
```

---

## Shared loop (every platform)

```text
1. route-model (MCP)     → fast vs strong for implementer AND reviewer
2. next-task --verbose   → next DAG-ready pending task
3. begin-task --task T00X --verbose
4. Dispatch implementer  → agents/implementer.md (see platform guides)
5. Dispatch task-reviewer → agents/task-reviewer.md (fresh, read-only)
6. If review fails      → resume implementer → back to step 5
7. record-result --passed true --spec $DIR/spec.md --verbose
8. sync-status --verbose
9. Repeat until forge-status reports complete: true
```

---

## CLI commands

Always pass `--dir $DIR` so persisted state loads from `$DIR/.superspec/state.json`.

```bash
npx -y @superspec-dev/core@latest next-task \
  --plan $DIR/plan.md --dir $DIR --verbose

npx -y @superspec-dev/core@latest begin-task \
  --plan $DIR/plan.md --dir $DIR --task T001 --verbose

npx -y @superspec-dev/core@latest record-result \
  --plan $DIR/plan.md --dir $DIR --task T001 --passed true \
  --spec $DIR/spec.md --verbose

npx -y @superspec-dev/core@latest sync-status \
  --spec $DIR/spec.md --plan $DIR/plan.md --dir $DIR --verbose

npx -y @superspec-dev/core@latest forge-status \
  --plan $DIR/plan.md --dir $DIR --spec $DIR/spec.md --verbose
```

On review failure (before max retries):

```bash
npx -y @superspec-dev/core@latest record-result \
  --plan $DIR/plan.md --dir $DIR --task T001 --passed false --verbose
```

After **3** failed reviews, the state machine marks the task `blocked` — escalate to a human; do not retry.

---

## MCP equivalents

| CLI | MCP | Notes |
|-----|-----|-------|
| `next-task` | `next-task` | Pass `planText`, `stateDir`; verbose by default |
| `begin-task` | `begin-task` | `taskId` + `stateDir` |
| `record-result` | `record-result` | Pass `specText` + `specDir` to refresh `status.md` |
| `sync-status` | `sync-status` | Writes `status.md` |
| `forge-status` | `forge-status` | Pass `specText` + `specDir` to also write `status.md` |
| `route-model` | `route-model` | `mechanical`/`moderate` → fast; `complex` → strong |

---

## Review gate (mandatory)

Never call `record-result --passed true` without a completed **`task-reviewer`** pass:

- **Spec compliance** — built exactly what acceptance criteria require; test-first honored
- **Code quality** — well-tested, maintainable; findings cite `file:line`

Fill `agents/task-reviewer.md` with task brief, constitution excerpt, commit range, and diff.

---

## Platform dispatch

| Platform | Guide |
|----------|-------|
| Claude Code | [Dispatch on Claude Code](dispatch-on-claude-code.md) |
| Cursor | [Dispatch on Cursor](dispatch-on-cursor.md) |

---

## Related

- [Track forge progress](track-forge-progress.md)
- [Forge state reference](../reference/forge-state.md)
