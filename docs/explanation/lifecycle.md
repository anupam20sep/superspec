# Lifecycle overview

```
init (once per repo)
  │
  ├─ fix ──────────────────────────────► validate → ship
  │
  ├─ ingest (brownfield) ─┐
  └─ explore (greenfield) ┴─► scope → refine → architect → plan
                                                    │
                                            [worktree] (optional)
                                                    │
                                                  route → forge → validate → ship

program + status  ← ongoing coordination (full mode)
```

| Phase | Skill | Artifact |
|-------|-------|----------|
| Bootstrap | `init` | `constitution.md` |
| Discover | `explore` / `ingest` | intent / `sources.lock` |
| Specify | `scope` | `spec.md` |
| Clarify | `refine` | updated spec |
| Design | `architect` | `design.md` |
| Plan | `plan` | `plan.md` |
| Schedule | `route` | `execution-map.md` |
| Implement | `forge` | code + tests + `status.md` |
| Prove | `validate` | lint + matrix |
| Deliver | `ship` | PR / merge |

See root [README lifecycle table](../README.md#how-superspec-covers-the-full-dev-cycle) for verification columns.
