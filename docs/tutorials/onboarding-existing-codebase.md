# Onboarding an existing codebase

> Bring SuperSpec to a brownfield repo with `ingest`, then the full lifecycle.

---

## 1. Install and init

Same as [Your first feature](your-first-feature.md) steps 1–2.

Use **lite** mode for a single feature track, or **full** mode if you will run multiple specs (`program.md`).

---

## 2. Ingest requirements

Point the agent at existing sources:

> Ingest requirements from [docs/, README, API spec, codebase]. Use superspec-ingest.

Outputs draft `FR-###` rows and `sources.lock` with provenance.

---

## 3. Scope and refine

> Formalize into spec.md with superspec-scope, then refine open questions.

Resolve all `[NEEDS CLARIFICATION]` markers before architect/plan.

---

## 4. Architect and plan

Brownfield work usually needs `design.md` documenting integration points:

> Write design.md with superspec-architect, then TDD plan with superspec-plan.

---

## 5. Forge with review discipline

Do not skip the review gate on legacy code — `task-reviewer` catches scope creep and missing tests.

See [Run the forge loop](../how-to/run-the-forge-loop.md).

---

## 6. Track progress in the repo

After each task:

```bash
npx -y @superspec-dev/core sync-status \
  --spec specs/<feature>/spec.md \
  --plan specs/<feature>/plan.md \
  --dir specs/<feature> --verbose
```

Commit `status.md` so the team sees FR progress without opening the agent session.

---

## Related

- [superspec-ingest skill](../../skills/superspec-ingest/SKILL.md)
- [Track forge progress](../how-to/track-forge-progress.md)
