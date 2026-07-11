# Lifecycle overview

```
init (once per repo)
  │
  ├─ fix ──────────────────────────────► validate → ship
  │
  ├─ ingest (brownfield) ─┐
  └─ explore (greenfield) ┴─► scope → refine → architect → plan (+ route)
                                                    │
                                            [worktree] (optional)
                                                    │
                                                  forge → validate → ship

program + status  ← ongoing coordination (full mode)
```

**Execution mode** (see `using-superspec`):

- **Review (default):** pause at each phase boundary for human approval.
- **Autonomous:** user opts out of review stops ("don't stop for review", "run autonomously", etc.) — chain continues from the current stage through `ship`.

| Phase | Skill | Artifact |
|-------|-------|----------|
| Bootstrap | `init` | `constitution.md` |
| Discover | `explore` / `ingest` | intent / `sources.lock` |
| Specify | `scope` | `spec.md` |
| Clarify | `refine` | updated spec |
| Design | `architect` | `design.md` |
| Plan | `plan` (+ `route`) | `plan.md`, `execution-map.md` |
| Implement | `forge` | code + tests + `status.md` |
| Prove | `validate` | lint + matrix |
| Deliver | `ship` | PR / merge |

See root [README lifecycle table](../README.md#how-superspec-covers-the-full-dev-cycle) for verification columns.
