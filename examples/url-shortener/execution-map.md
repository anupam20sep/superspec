# Execution Map: URL Shortener

An execution map coordinates parallel task windows, model routing decisions, persona assignments, and verification gates for feature delivery.

## Dependency DAG

| From | To | Reason |
|------|----|---------:|
| T001: URL Validator | T004: Shortener Service | T004 composes `isValidHttpUrl` into `shorten()` |
| T002: Code Generator | T004: Shortener Service | T004 composes `generateCode` into `shorten()` |
| T003: ShortLink Store | T004: Shortener Service | T004 composes `insertIfFree`/`resolve` into `shorten()`/`resolve()` |

**Graphical representation:**
```
T001 (url-validator)  ─┐
T002 (code-generator) ─┼─→ T004 (shortener: composes all three)
T003 (store)          ─┘
```

T001, T002, and T003 have no dependencies on each other or on anything else — they may all start immediately and run in parallel. T004 depends on all three and cannot start until they are all `done`.

## Parallel Windows

| Window | Tasks | Model class | Parallelization Boundary |
|--------|-------|-------------|---------------------------|
| W1 | T001, T002, T003 | `economy` | No shared files (three separate `src/*.ts` + `test/*.ts` pairs); no dependencies among them |
| W2 | T004 | `standard` | Must wait for all of W1 to reach `done` — T004 imports from all three W1 modules |

⚠️ W2 cannot start until every task in W1 is `done`. T004's own test imports `resetStore` from T003's module, so a partial W1 (e.g. T003 still `pending`) would leave T004's test unable to run, not merely fail it.

## Model Routing

| Task | Complexity | Model class | Rationale |
|------|-----------|-------------|-----------|
| T001 | `mechanical` | `economy` | A single pure function wrapping `URL` parsing — deterministic, no design judgment |
| T002 | `mechanical` | `economy` | A single pure function wrapping `randomBytes` — deterministic, no design judgment |
| T003 | `moderate` | `standard` | Structured multi-function module (insert/resolve/reset) but no ambiguity — the collision-safety invariant is already fully specified in design.md |
| T004 | `moderate` | `standard` | Composition of three already-tested modules; no new design decisions (`moderate→standard`) |

**Summary:** no task in this example plan is `complex` — the design decisions requiring judgment (reject-then-generate ordering, collision-check-with-regenerate) were already resolved in `design.md`'s Decisions section, so every implementation task here is mechanical-to-moderate execution of an already-settled design. This is expected for a small worked example; a larger feature would have at least one genuinely `complex` → `frontier` task (e.g. the collision-detection *decision itself*, if it hadn't already been made in design.md). Tier mapping: `mechanical→economy`; `moderate→standard`; `complex→frontier`.

## Personas

> **Note on Persona Sourcing:** this worked example was generated without a target-project `.claude/agents/`/`.cursor/agents/` directory to discover from (SuperSpec's own repo, where this example lives, has none), so `list-personas` returns `[]` here and every window below uses the fixed fallback roles — this table is a genuine fallback-path example, not a discovered-persona example.

| Window | Primary Persona | Secondary Persona | Responsibilities |
|--------|-----------------|--------------------|-------------------|
| W1 | @backend | @qa | Implement and unit-test the three independent modules |
| W2 | @backend | @qa | Compose the three modules; verify the composed acceptance scenarios from spec.md |

**Persona Definitions:**
- `@backend`: Owns the module implementations and their unit tests.
- `@qa`: Reviews test coverage against spec.md's acceptance scenarios (User Stories 1–3).

## Rollback

| Window | Rollback Strategy |
|--------|--------------------|
| W1 | Revert the three task commits independently — each is a standalone file pair with no cross-window impact |
| W2 | Revert T004's commit; W1's modules remain valid and usable by a future composition attempt |

**General rollback process:**
1. Identify window to revert
2. Gather commits for that window (`git log --oneline` filtered to the relevant task's files)
3. Create revert commit: `git revert -n <commit> && git commit -m "revert: ..."`
4. Re-run `npx vitest run examples/url-shortener` to confirm the suite is green post-revert
5. No staging/production deploy step applies to this worked example

## Verification Gates

| Gate | Applies To | Criteria | Owner |
|------|-----------|----------|-------|
| Unit Test Coverage | W1, W2 | Every task's own test file passes (`npx vitest run examples/url-shortener/test/<task>.test.ts`) | @qa |
| Coverage Matrix Complete | W2 (final gate) | `node packages/core/dist/cli.js matrix --spec examples/url-shortener/spec.md --plan examples/url-shortener/plan.md` reports `gaps: []` | @qa |
| Plan Lint Clean | W1 (pre-check, before any implementation) | `node packages/core/dist/cli.js lint --plan examples/url-shortener/plan.md` reports `[]` | @tech-lead |

Gate failures block that window's tasks from being recorded `done`; a failing gate routes back to the responsible task's implementer, not around it.

---

<!-- Adapted from SP: skills/dispatching-parallel-agents/SKILL.md (MIT) for the parallel-dispatch concept; the execution-map.md output format and model-routing rule are new to SuperSpec. See /NOTICE. -->
