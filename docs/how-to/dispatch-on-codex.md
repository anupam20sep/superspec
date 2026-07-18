# Dispatch on Codex

Forge uses isolated implementer and reviewer agents. On Codex, prefer **multi-agent spawn** (see `skills/references/codex-tools.md`).

---

## Implementer

Fill `agents/implementer.md`, then spawn a fresh agent with that prompt. Use the model from `route-model` (`mechanical`/`moderate` → fast; `complex` → strong).

Require: red → green → refactor → commit → report `BASE_SHA`..`HEAD_SHA`.

---

## Reviewer

Fill `agents/task-reviewer.md` with the implementer's diff and commit range. Spawn a **separate** agent with read-only intent. Require both verdicts: spec compliance and code quality.

On failure, resume the same implementer with findings; re-spawn the reviewer after fixes.

---

## When spawn is unavailable

Use the inline fallback in `superspec-forge`: implement, then apply `task-reviewer.md` behind an explicit review boundary before `record-result`.

---

## Related

- [Run the forge loop](run-the-forge-loop.md)
- [Install on your runtime](install-on-your-runtime.md) — Codex plugin + `/hooks` trust
- [Acceptance: Codex](../acceptance/codex.md)
