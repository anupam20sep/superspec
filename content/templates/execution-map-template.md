# Execution Map: {{FEATURE}}

An execution map coordinates parallel task windows, model routing decisions, persona assignments, and verification gates for feature delivery. It bridges feature specs with task-level orchestration by making parallelizable work explicit and ensuring quality gates are applied per window.

## Dependency DAG

Tasks in this feature form the following dependency graph:

| From | To | Reason |
|------|----|---------:|
| T001: Backend schema migration | T002: Seed test data | T002 requires the new schema in place |
| T002: Seed test data | T003: Service layer tests | Tests need fixtures |
| T001: Backend schema migration | T004: API endpoints | Endpoints depend on schema |
| T004: API endpoints | T005: Integration tests | Must test the live endpoints |
| T006: Frontend setup | T007: Frontend components | Components require scaffolding and boilerplate from setup |

**Graphical representation:**
```
T001 (schema)                T006 (frontend setup)
  ├─→ T002 (seed data)         └─→ T007 (frontend components)
  │     └─→ T003 (service tests)
  └─→ T004 (API)
        └─→ T005 (integration tests)
```

Tasks T001 and T006 (frontend setup) are independent and may start immediately. Task T002 and T004 may run in parallel after T001 completes. Task T007 (frontend components) depends on T006 (setup).

## Parallel Windows

Windows define groups of tasks that can execute concurrently. No two tasks in a window may share write access to the same file or depend on sequential output from each other.

| Window | Tasks | Model Routing | Parallelization Boundary |
|--------|-------|-------|---------|
| **W1: Schema & Structure** | T001 (schema migration) | `complex` → strong | Schema migration sets the stage; cannot parallelize with dependent tasks. |
| **W2: Data Layer** | T002 (seed data), T006 (frontend setup) | `mechanical` → fast | Data seeding and frontend setup have no shared writes and no dependencies. ⚠️ Do NOT parallelize T002 with T003 (service tests); T003 needs T002's fixtures first. |
| **W3: API & Frontend** | T004 (API endpoints), T007 (frontend components) | `complex` → strong | API work has no dependency on frontend; T007 requires T006 (W2) to have completed first, so W3 cannot start before W2 finishes. Within W3, T004 and T007 are independent of each other and may run in parallel. |
| **W4: Testing & Integration** | T003 (service layer tests), T005 (integration tests) | `mechanical` → fast | Unit-level service tests and full integration tests can run together after data/API layers are ready. |
| **W5: Quality Gates** | All verification checks (coverage, lint, type safety) | `mechanical` → fast | Run after all development windows complete. |

**Parallelization Constraints:**
- ⚠️ T002 (seed data) must complete before T003 starts—they share the test database state.
- ⚠️ T004 (API endpoints) must complete before T005 starts—integration tests call the live API.
- ⚠️ Window W5 must not start until W1 through W4 are complete.

## Model Routing

Task complexity determines which model handles the work:

| Task | Complexity | Model Class | Rationale |
|------|-----------|------------|-----------|
| T001: Schema migration | `complex` | `strong` | Complex data model changes; requires reasoning about backward compatibility and performance. |
| T002: Seed test data | `mechanical` | `fast` | Deterministic; follows a script. No ambiguity about intent. |
| T003: Service layer tests | `mechanical` | `fast` | Straightforward test writing given a clear service interface. |
| T004: API endpoint implementation | `complex` | `strong` | Requires design decisions (routing, error handling, middleware order, rate limiting strategy). |
| T005: Integration tests | `mechanical` | `fast` | Once API is defined, tests are deterministic. |
| T006: Frontend setup | `mechanical` | `fast` | Scaffolding and boilerplate setup. |
| T007: Frontend components | `complex` | `strong` | Component design, state management, accessibility requirements. |

**Model Class Mapping:** `routeModel(complexity) → complexity === "complex" ? "strong" : "fast"` (mechanical and moderate both route to fast; only complex routes to strong)

## Personas

Each task or window is owned by a persona responsible for execution, code review, and sign-off:

| Window | Primary Persona | Secondary Persona | Responsibilities |
|--------|-----------------|------------------|----------|
| W1: Schema & Structure | **@backend** (Database) | @tech-lead | Schema review, migration safety, test data contracts. |
| W2: Data Layer | @backend (Data) | — | Seed scripts, test fixture maintenance. |
| W3: API & Frontend | @backend (API); @frontend | — | Parallel development, contract definition (OpenAPI or GraphQL schema). |
| W4: Testing & Integration | @qa; @backend; @frontend | @tech-lead | Test coverage, edge cases, cross-team integration. |
| W5: Quality Gates | @tech-lead | @security; @performance | Lint, types, coverage, security scan, load-test results. |

**Persona Definitions:**
- `@backend`: Owns database, migrations, service layer, API contract.
- `@frontend`: Owns client UI, state, build pipeline.
- `@qa`: Owns test strategy, coverage targets, integration scenarios.
- `@tech-lead`: Owns architecture decisions, cross-cutting concerns, gate approvals.
- `@security`: Reviews auth, encryption, input validation, RBAC.
- `@performance`: Reviews query plans, caching, asset optimization.

## Rollback

Each window has a rollback plan:

| Window | Rollback Strategy |
|--------|-------------------|
| W1: Schema & Structure | Revert commit range `C1..C3` (schema commits). Schema must be rolled back before seeding. If in production, use database downtime window + manual intervention to drop migration and restore backup. |
| W2: Data Layer | Delete seeded test records via rollback script `scripts/rollback-fixtures.sh`. If production seed only: use targeted `DELETE` statements scoped to test markers (e.g., `WHERE is_test_data = true`). |
| W3: API & Frontend | Revert commit range `C4..C7` (API + frontend). No database impact; safe to revert. Feature flag can disable new endpoints while code is reverted. |
| W4: Testing & Integration | Revert test files and update CI config if tests are in the main branch. No production impact. |
| W5: Quality Gates | Fix lint/type issues in place; no rollback needed. If coverage drops below threshold, flag in code review—do not merge. |

**General Rollback Process:**
1. Identify the window that must roll back.
2. Gather commits for that window (use `git log --oneline W1..W5`).
3. Create a revert commit: `git revert -n C1^..C7 && git commit -m "revert: {{FEATURE}} — [REASON]"`.
4. Test the revert in a staging environment.
5. Deploy revert with the same rigor as the original feature.

## Verification Gates

Before a window is considered "done," the following checks must pass:

| Gate | Applies To | Criteria | Owner |
|------|------------|----------|-------|
| **Schema Validation** | W1 | Schema change passes `npm run db:validate`. No breaking changes to existing API contracts. Tested on backup data. | @backend |
| **Unit Test Coverage** | W2, W3, W4 | All new code has ≥80% line coverage (≥90% for critical paths like auth, payments). Coverage diffs tracked in CI. | @qa, @backend |
| **Type Safety** | W3, W5 | `npm run typecheck` passes. No `any` types except in explicitly-allowed legacy modules. | @tech-lead |
| **Linting** | W5 | `npm run lint -- --fix` applies no changes. ESLint and Prettier agree. | @tech-lead |
| **Contract Tests** | W3 (API), W4 | API schema validated against OpenAPI spec. Frontend mock server matches live API. Cross-team contract signed off. | @backend, @frontend |
| **Integration Tests** | W4 | All integration tests pass on the staging environment. No flaky tests; 3 consecutive green runs required. | @qa |
| **Security Scan** | W5 | SAST scan (e.g., `npm audit`, Snyk) returns 0 high/critical vulns. Secrets not committed (pre-commit hook enforces). | @security |
| **Performance Baseline** | W5 | For W3 (API): new endpoints have ≤200ms p99 latency under load test (100 req/s). For W3 (frontend): Lighthouse score ≥90. | @performance |
| **Rollback Rehearsal** | W5 | Rollback procedure tested in staging. Revert commits cleanly; no orphaned references or state. | @tech-lead |

**Gate Policy:**
- Gates are checked per window; a gate failure blocks that window's merge.
- If a gate fails, the owning persona files a bug or adds a task to resolve it before re-review.
- Code review approval by the primary persona is required before a window is merged.

---

<!-- Adapted from SP: skills/dispatching-parallel-agents/SKILL.md (MIT) for the parallel-window concept; Dependency DAG/Model Routing/Personas/Rollback/Verification Gates sections are new to SuperSpec. See /NOTICE. -->
