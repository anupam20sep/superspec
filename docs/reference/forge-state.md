# Forge state and status

---

## state.json

Path: `specs/<feature>/.superspec/state.json` (gitignored)

```json
{
  "tasks": {
    "T001": { "status": "done", "reviewFailures": 0 },
    "T002": { "status": "in_progress", "reviewFailures": 0 }
  }
}
```

### Task status values

| Status | Meaning |
|--------|---------|
| `pending` | Not started or failed review with retries left |
| `in_progress` | `begin-task` called |
| `done` | `record-result --passed true` |
| `blocked` | 3 review failures — escalate; no further `record-result` |

---

## status.md

Path: `specs/<feature>/status.md` (commit this file)

Human-readable FR + task table. Updated by `sync-status` or `record-result --spec`.

---

## forge-status fields

```json
{
  "total": 4,
  "done": 1,
  "blocked": 0,
  "pending": 3,
  "inProgress": 0,
  "complete": false
}
```

`complete: true` only when `done === total`.

---

## Related

- [Track forge progress](../how-to/track-forge-progress.md)
- [Run the forge loop](../how-to/run-the-forge-loop.md)
