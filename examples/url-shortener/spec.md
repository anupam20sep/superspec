# Feature Specification: URL Shortener

**Feature Branch**: `001-url-shortener`

**Created**: 2026-07-05

**Status**: Draft

**Input**: User description: "Let's build a URL shortener"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shorten a URL (Priority: P1)

A user submits a long URL and receives a short code they can share instead.

**Why this priority**: This is the entire value proposition of the service — without it there is nothing to redirect.

**Independent Test**: Can be fully tested by POSTing a valid URL to the shorten endpoint and confirming a short code is returned, independent of redirect or validation behavior.

**Acceptance Scenarios**:

1. **Given** a valid long URL, **When** the user submits it to be shortened, **Then** the system returns a short code that has not been issued before.
2. **Given** the same long URL submitted twice, **When** the user submits it a second time, **Then** the system may return the same short code (idempotent) or a new one — either is acceptable, but both replies MUST resolve to the original URL.

---

### User Story 2 - Follow a short link (Priority: P1)

A user visits a short link and is redirected to the original long URL.

**Why this priority**: A short code with no redirect delivers no value; this is the second half of the core loop and equally critical to ship alongside User Story 1.

**Independent Test**: Can be fully tested by requesting a previously-issued short code's URL and confirming an HTTP redirect to the original long URL, independent of how the code was created.

**Acceptance Scenarios**:

1. **Given** a short code that was previously issued for a long URL, **When** a user requests that short code's URL, **Then** the system redirects them to the original long URL.
2. **Given** a short code that was never issued, **When** a user requests that short code's URL, **Then** the system returns a not-found response rather than redirecting anywhere.

---

### User Story 3 - Reject invalid input (Priority: P2)

A user submits something that is not a usable URL and receives a clear rejection instead of a broken short link.

**Why this priority**: Protects the integrity of the redirect table and the user's trust in shared links; lower priority than the two core flows since it's a guard on top of them, not a standalone value delivery.

**Independent Test**: Can be fully tested by POSTing a malformed or non-HTTP(S) string to the shorten endpoint and confirming it is rejected with no short code issued.

**Acceptance Scenarios**:

1. **Given** a string that is not a syntactically valid URL, **When** the user submits it to be shortened, **Then** the system rejects the request and issues no short code.
2. **Given** a syntactically valid URL using a non-HTTP(S) scheme (e.g. `javascript:`, `file:`), **When** the user submits it to be shortened, **Then** the system rejects the request and issues no short code.

### Edge Cases

- What happens when the long URL itself already points at this service's own shortener domain (chained shortening)? System MUST accept it as an opaque string like any other URL — no special-casing or loop detection is required for v1 (see Assumptions).
- How does the system handle an extremely long URL (multiple kilobytes)? System MUST enforce a maximum input length and reject anything beyond it via the same rejection path as User Story 3.
- What happens when two different long URLs would deterministically hash to the same short code? System MUST detect the collision and issue a different code — never redirect a code to a URL other than the one it was actually issued for.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a valid HTTP or HTTPS URL and return a unique short code for it.
- **FR-002**: System MUST return a short code that, when resolved, is distinct from every other currently-issued short code (no two different long URLs ever share one active short code).
- **FR-003**: System MUST redirect a request for an issued short code to the exact original long URL it was issued for.
- **FR-004**: System MUST reject a request to shorten a string that is not a syntactically valid HTTP or HTTPS URL, issuing no short code for it.

### Key Entities *(include if feature involves data)*

- **ShortLink**: Represents one shortening record. Attributes: short code (unique), original long URL, created-at timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can shorten a URL and receive a working short code in a single request, with no follow-up steps required.
- **SC-002**: A short code, once issued, resolves to the correct original URL on every subsequent request (100% redirect accuracy for issued codes).
- **SC-003**: 100% of syntactically invalid or non-HTTP(S) submissions are rejected with no short code issued (zero false-accepts).
- **SC-004**: An unissued or unknown short code never redirects anywhere (100% not-found accuracy for unissued codes).

## Assumptions

- Short codes do not need to be cryptographically unguessable — collision-avoidance (FR-002) is a uniqueness guarantee, not a security control.
- Chained shortening (shortening a URL that itself points back at this service) is accepted, not detected or blocked, for v1.
- No authentication or per-user ownership of short links is in scope for v1 — all shortening requests are anonymous.
- No link-expiration or deletion capability is in scope for v1.

<!-- Adapted from SK: templates/spec-template.md (MIT). See /NOTICE. -->
