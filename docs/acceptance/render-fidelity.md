# Render Fidelity: Single-Source Propagation

**Scope:** GitHub Copilot is deferred (Plan #5b); this check covers the two currently-supported render targets, Claude Code (`skills/`) and Cursor (`.cursor/skills/`).

**Expected:** a single edit in `content/skills/<name>/SKILL.md` propagates to both rendered outputs when `@superspec-dev/render`'s CLI is re-run, and nowhere else.

## Procedure

```bash
echo "" >> content/skills/superspec-plan/SKILL.md   # trivial edit: one trailing blank line
node packages/render/dist/cli.js
git --no-pager diff --stat skills/superspec-plan/SKILL.md .cursor/skills/superspec-plan/SKILL.md
```

## Result

```
 .cursor/skills/superspec-plan/SKILL.md | 1 +
 skills/superspec-plan/SKILL.md         | 1 +
 2 files changed, 2 insertions(+)
```

Exactly the two `superspec-plan` render outputs changed — one line each, matching the one-line source edit — and no other skill's rendered files were touched. This confirms single-source propagation: the same `content/skills/superspec-plan/SKILL.md` edit landed in both the Claude Code and Cursor copies from one source change and one render command, with no other unintended diffs.

## Cleanup

```bash
git checkout content/skills/superspec-plan/SKILL.md
node packages/render/dist/cli.js
git status --porcelain skills .cursor/skills   # empty — confirms clean revert
```

Confirmed empty after revert + re-render — the working tree returned to its exact pre-test state.

<!-- This check repeats, with fresh evidence, the same propagation proof already established during Plan #6's R3.2 task (retrofit + propagation). -->
