# Design: URL Shortener

**Revision**: 2026-07-05 | **Status**: APPROVED | **Owner**: SuperSpec worked example

**Input**: Feature specification from `examples/url-shortener/spec.md`

## Summary

A minimal HTTP service with two endpoints: one to shorten a URL (FR-001, FR-002, FR-004) and one to redirect a short code to its original URL (FR-003). Short codes are generated from a random identifier space large enough to make collisions rare, with an explicit collision check before an issued code is considered final (per spec's Edge Cases). Persistence is a single append-mostly table; no queueing, caching layer, or distributed coordination is needed at this scale.

## Technical Context

**Language/Version**: TypeScript, Node >= 20 (matches this repo's existing toolchain and NodeNext conventions)

**Primary Dependencies**: none beyond Node's standard library (`node:crypto` for random code generation, `node:http`/a minimal router) — no new runtime dependency needed for a service this small

**Storage**: an in-process key-value map for this worked example (`Map<string, ShortLink>`); a real deployment would swap this for a persistent store, but that swap is out of scope for this example (see Assumptions in spec.md)

**Testing**: vitest, consistent with the rest of this repo's toolchain

**Target Platform**: Node.js server process

**Project Type**: single small service (library + thin HTTP layer)

**Performance Goals**: not a stated requirement in spec.md; no explicit SC ties to throughput, so no numeric target is set here — a NEEDS CLARIFICATION marker would be inserted if a real deployment required one, but for a worked example this is intentionally out of scope

**Constraints**: short-code resolution must be O(1) average case (a hash-map lookup satisfies this trivially at this scale)

**Scale/Scope**: worked example only — 4 FRs, no auth, no expiration (per spec.md Assumptions)

## Architecture

### System Structure

Two responsibilities, cleanly separated so each maps to an independently testable unit per spec.md's per-user-story independence requirement:

1. **`shortener` module** — owns code generation, collision detection, and the URL-validity check (FR-001, FR-002, FR-004). Exposes `shorten(longUrl: string): ShortLink | RejectionReason`.
2. **`store` module** — owns the `ShortLink` records and the two lookups the service needs: insert-if-code-free (used by `shortener` to detect collisions) and resolve-by-code (used by the redirect path, FR-003).

The HTTP layer is a thin adapter: `POST /shorten` calls `shortener.shorten`, then `store` to persist it; `GET /:code` calls `store`'s resolve-by-code and issues a redirect or a not-found response.

### Project Structure

#### Documentation (this feature)

```text
examples/url-shortener/
├── spec.md
├── design.md
├── plan.md
├── execution-map.md
└── coverage-matrix.md
```

#### Source Code (repository root)

```text
examples/url-shortener/src/
├── url-validator.ts   # FR-004: syntactic + scheme validation
├── code-generator.ts  # FR-001, FR-002: random code generation
├── store.ts           # FR-002, FR-003: ShortLink persistence + lookups
└── shortener.ts        # composes the three above into shorten()/resolve()

examples/url-shortener/test/
├── url-validator.test.ts
├── code-generator.test.ts
├── store.test.ts
└── shortener.test.ts
```

**Structure Decision**: Single project (Option 1), no frontend/backend split — this is a small worked example, not a production service, so a single `src/`+`test/` pair inside the example's own directory is sufficient and keeps this example's TDD trail self-contained without touching `packages/core`'s own build.

## Decisions

### Decision: Reject-then-generate, not generate-then-validate

**Rationale**: FR-004 requires that invalid input never receives a short code at all, not merely that it later fails to resolve. Validating the URL (`url-validator.ts`) as the very first step of `shorten()`, before any code is generated or stored, is the only ordering that satisfies FR-004's "issuing no short code for it" wording directly and testably — a reviewer can assert `store` was never called at all on rejection.

**Alternatives considered**:
- **Generate the code first, validate after**: rejected — would require rolling back a partially-issued code on validation failure, adding rollback complexity FR-004 doesn't require.

### Decision: Explicit collision check with regenerate-on-collision, not a larger code space assumed to be collision-free

**Rationale**: spec.md's Edge Cases section explicitly calls out that two different long URLs must never share one active short code, and requires the system to "detect the collision and issue a different code." A code space large enough to make collisions astronomically unlikely is not the same guarantee as detecting and handling the case when it does happen — the spec asks for the latter, so `store`'s insert-if-code-free operation is atomic-checked at insert time and `shortener` retries generation on a reported collision.

**Alternatives considered**:
- **Trust a large random space and skip the check**: rejected — does not satisfy the spec's explicit collision-handling requirement, only makes the untested failure mode rarer.

## Data Model

**ShortLink**
- `code` (string): the short code; unique; primary key of the store
- `longUrl` (string): the original URL this code resolves to
- `createdAt` (ISO-8601 timestamp): when this code was issued
- Invariants: `code` is immutable once issued (never repointed to a different `longUrl` — this is the FR-002/FR-003 guarantee); `longUrl` has already passed `url-validator` before a `ShortLink` is ever constructed (FR-004 is enforced upstream, not re-checked here)

## Contracts

### API / Service Interfaces

```
POST /shorten
Content-Type: application/json

Request:
{ "url": "https://example.com/some/very/long/path" }

Response (201 Created):
{ "code": "aZ3kQ1", "url": "https://example.com/some/very/long/path" }

Error Response (400 Bad Request) — FR-004:
{ "error": "INVALID_URL", "message": "Not a syntactically valid HTTP or HTTPS URL" }
```

```
GET /:code

Response (302 Found): redirects to the ShortLink's longUrl — FR-003

Error Response (404 Not Found) — unissued or unknown code:
{ "error": "NOT_FOUND", "message": "No short link issued for this code" }
```

#### Function Signature (Library)

```ts
export function shorten(longUrl: string): { code: string; url: string } | { error: string };
export function resolve(code: string): { longUrl: string } | undefined;
```

#### Integration Points

None — this worked example is self-contained with no external service dependency (per Technical Context's Storage note, a real deployment's persistent store would be the one integration point, out of scope here).

---

<!-- Adapted from SK: templates/plan-template.md (MIT). See /NOTICE. -->
