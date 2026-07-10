# Track forge progress

---

## Three layers

| Layer | Mechanism | Survives compaction? |
|-------|-----------|----------------------|
| In-session | `TodoWrite` | No — session only |
| FR visibility | `specs/<feature>/status.md` | Yes — committed |
| Machine state | `specs/<feature>/.superspec/state.json` | Yes — gitignored |

After restart: read `status.md` + `state.json`, not conversation memory.

---

## Refresh status.md

```bash
npx -y @superspec-dev/core sync-status \
  --spec specs/<feature>/spec.md \
  --plan specs/<feature>/plan.md \
  --dir specs/<feature> --verbose
```

Or MCP `sync-status`. Call after `begin-task`, `record-result`, and at forge start.

---

## Checkpoint forge counts

```bash
npx -y @superspec-dev/core forge-status \
  --plan specs/<feature>/plan.md \
  --dir specs/<feature> \
  --spec specs/<feature>/spec.md --verbose
```

`complete: true` only when **every** task is `done` — blocked tasks do not count as finished.

---

## Always pass stateDir

Forge MCP/CLI tools must receive `--dir specs/<feature>` (or `stateDir`) to load persisted progress. Without it, you get a fresh empty state.

---

## Multi-spec (full mode)

Use `program.md` at repo root + `superspec-program` / `superspec-status` skills for cross-feature backlog.

---

## Related

- [Forge state reference](../reference/forge-state.md)
- [Run the forge loop](run-the-forge-loop.md)
