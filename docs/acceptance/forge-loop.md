# Autonomous Forge Loop: Drive, Resume, Escalate

**Expected:** forge drives a plan to completion without per-task human prompting, resumes correctly after a killed session, and escalates a permanently-failing task instead of hanging.

This check drives the *real* forge state machine (`packages/core/src/forge-loop.ts`'s `initState`/`nextTask`/`recordResult`/`forgeStatus`/`saveState`/`loadState`) against real data — the worked example's actual `examples/url-shortener/plan.md`, and real dispatched implementer/reviewer subagents for the "drive" behavior; a scratch plan fixture for the "resume" and "escalate" behaviors, since those require deliberately abnormal conditions (an interrupted session, a task engineered to always fail) that shouldn't be manufactured in the real worked example.

## 1. Drive to done

Drove `examples/url-shortener/plan.md`'s 4 real tasks (T001–T004) through the full loop: select via `nextTask`, dispatch a fresh implementer subagent per task (red-green-refactor, per the plan's exact test/implementation code), dispatch a fresh reviewer subagent per task (spec-compliance + code-quality verdicts), record the verdict via `recordResult`, repeat.

- **T001 (URL Validator, mechanical → economy):** implemented, reviewed (both verdicts PASS), recorded `done`.
- **T002 (Code Generator) and T003 (ShortLink Store)** dispatched in parallel per the execution-map's W1 (both genuinely independent, no shared files). A real git-ref-lock race occurred from the two agents committing near-simultaneously — the T003 agent detected its own commit had been mis-bundled with T002's files, `git reset` and re-split into two correctly-scoped commits (`2c69687` for T002, `1870c1f` for T003) without any files being altered. Both reviewed (both verdicts PASS), recorded `done`. This incident is itself informative evidence: `nextTask`/`recordResult`'s pure-function-plus-explicit-save design meant the underlying state machine was never at risk from the git-level race — only the git commit boundaries needed fixing, not the recorded task state.
- **T004 (Shortener Service, moderate → standard)** was correctly withheld by `nextTask` until all of T001/T002/T003 reached `done` (confirmed: calling `nextTask` before all three landed returns them, not T004; only once all three are `done` does `nextTask` return T004) — proving the DAG-aware dependency gate, not just first-in-plan-order selection. Implemented, reviewed (PASS), recorded `done`.

Final call:
```
$ node .forge-driver.mjs status
{"total":4,"done":4,"blocked":0,"pending":0,"complete":true}
```

`forge-status` reports `complete: true` only once every task is `done` — confirmed against real, reviewed, TDD-built implementation code (12/12 tests pass across all 4 files: `examples/url-shortener/test/{url-validator,code-generator,store,shortener}.test.ts`), not a simulated run.

## 2. Resume after a killed session

Using a disposable scratch fixture (same plan-parsing/state-machine code, a throwaway working directory) to isolate the "killed mid-run" condition from the real worked example:

**Session 1** (one process): `initState` → recorded T001 `pass`, T002 `pass` → process exits (`done: 2, pending: 2`). No further calls made in that process — it never touches T003/T004.

**Session 2** (a brand-new process, invoked separately, no shared memory with session 1): `loadState` reads `.superspec/state.json` from disk.
```
status on load:   {"total":4,"done":2,"blocked":0,"pending":2,"complete":false}
next task offered: T003   <- NOT T001 or T002 again
```
Session 2 completed T003 and T004 and reached `complete: true`. This proves genuine resume: the second process had zero in-memory knowledge of session 1's work, yet correctly picked up exactly where session 1 left off by reading persisted state, and `nextTask` never re-offered an already-`done` task.

## 3. Escalate a permanently-failing task, don't hang

Using a second scratch fixture: a 3-task plan (`X001`, `X002` "poisoned", `X003`), all mutually independent (no `dependsOn`).

- Recorded `X002` `fail` three times (`maxReviewFailures: 3`). After the 3rd failure, `X002` flipped from `pending` to `blocked` automatically — not manually forced.
- **No-retry guarantee:** attempting `recordResult` on the now-`blocked` X002 again threw `Error: Cannot record result for already-blocked task: X002` — the state machine itself rejects it, this isn't a convention the loop has to remember to honor.
- **Continue with other independent tasks:** `nextTask` still correctly offered `X001` (and later `X003`) despite `X002` being permanently stuck — both were completed normally.
- **Never falsely reports complete:** final status is
  ```
  {"total":3,"done":2,"blocked":1,"pending":0,"complete":false}
  ```
  `pending: 0` (nothing left to dispatch) but `complete: false` — exactly the distinction `superspec-forge`'s own "Red Flags" section calls out: a quiet session with nothing left to select is not the same as `complete: true`. The loop would correctly keep this task escalated to a human rather than either hanging forever or falsely declaring victory.

## Cleanup

All scratch fixtures (`.forge-resume-test/`, `.forge-escalate-test/`, the ad hoc `.forge-driver.mjs` used to drive the real worked-example run, and the real run's own `examples/url-shortener/.superspec/state.json`, which is gitignored) were deleted after capturing this evidence. `git status --porcelain examples/url-shortener` is clean; the only committed artifacts are the four real, reviewed, passing implementation files (`src/`+`test/` for T001–T004) already committed as part of driving this very check.
