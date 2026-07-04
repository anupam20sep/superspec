---
name: superspec-architect
description: Use when designing the technical solution architecture, translating requirements into decisions, data models, and contracts. Follows SuperSpec's unified design template (Technical Context, Architecture, Decisions, Data Model, Contracts) and produces design.md.
---

# superspec-architect

Use this skill to design the technical solution architecture for a feature. Starting from the feature specification (`spec.md` produced by `superspec-scope` or refined by `superspec-refine`), you will gather technical context, make explicit architecture decisions, define the data model, document contracts, and generate a unified `design.md` artifact.

## When to use

- After the feature specification is complete (have a `spec.md` in `/specs/{{FEATURE}}/`).
- Before creating the implementation task breakdown (which uses `superspec-plan`).
- When designing a new feature, system component, or significant refactoring.

## Output

A unified **design artifact** (`specs/{{FEATURE}}/design.md`) that merges Spec Kit's separate plan/research/data-model/contracts into one SuperSpec tier, covering:

- **Technical Context**: Language, dependencies, storage, testing, platform, project type, performance goals, constraints, and scale.
- **Architecture**: System structure, components, responsibilities, interactions, and project structure.
- **Decisions**: Significant design decisions documented in ADR format (Problem → Rationale → Alternatives).
- **Data Model**: Entities, fields, relationships, invariants, and state transitions.
- **Contracts**: API/service interfaces, function signatures, integration points, and event schemas.

Governance gates (TDD, traceability, constitution checks) are defined in the separate `constitution.md` tier and enforced by `superspec-validate`, not inline here.

This skill does not produce a standalone quickstart/validation-scenario document; end-to-end acceptance scenarios live in `spec.md`'s Given/When/Then user stories, and runtime verification is `superspec-validate`'s responsibility.

---

## Workflow

### Step 1: Load context

1. **Locate the feature specification**: Find `specs/{{FEATURE}}/spec.md` from the previous stage (`superspec-scope` or `superspec-refine`).

2. **Create the design artifact**: In the same directory, create `design.md` using the template below or from `content/templates/design-template.md` in your SuperSpec project.

3. **Extract the summary**: From `spec.md`, identify:
   - Primary requirement (what problem does the feature solve?)
   - Technical approach (proposed direction)
   - Key constraints or dependencies

### Step 2: Fill Technical Context

In the **Technical Context** section of `design.md`, document:

- **Language/Version**: Programming language and version (e.g., Python 3.11, TypeScript 5.0). Mark as `NEEDS CLARIFICATION` if uncertain.
- **Primary Dependencies**: Major libraries, frameworks, or runtime (e.g., FastAPI, React, Node.js). Mark as `NEEDS CLARIFICATION` if uncertain.
- **Storage**: Database, cache, or storage mechanism (e.g., PostgreSQL, Redis, S3). Mark as `N/A` if not applicable.
- **Testing**: Test framework and approach (e.g., pytest, Jest, XCTest).
- **Target Platform**: Where the feature runs (e.g., Linux server, macOS app, WASM, iOS 15+).
- **Project Type**: Feature kind (library/CLI/web-service/mobile-app/compiler/desktop-app).
- **Performance Goals**: Domain-specific targets (e.g., 1000 req/s, 60 fps, <100ms p95 latency).
- **Constraints**: Domain-specific limits (e.g., <200MB memory, offline-capable, <10MB bundle).
- **Scale/Scope**: Expected scale (e.g., 10k users, 1M LOC, 50 screens).

**Example**:
```
Language/Version: Python 3.11
Primary Dependencies: FastAPI, SQLAlchemy, Pydantic
Storage: PostgreSQL 15+
Testing: pytest with hypothesis for property-based testing
Target Platform: Linux server (container-deployable)
Project Type: Web service (async API)
Performance Goals: 1000 req/s at p95 <100ms
Constraints: <500MB memory per instance, horizontal scaling
Scale/Scope: 50k daily active users, event log retention 30 days
```

### Step 3: Resolve unknowns

For any field marked `NEEDS CLARIFICATION`:

1. **Extract the question**: What specific information is missing?
2. **Research the topic**: Consult best practices, team expertise, or prior decisions in similar features.
3. **Document the decision**: Update the Technical Context field and explain your reasoning in the **Decisions** section.

Example research tasks:
- "What testing framework is standard for this language/project?"
- "What are the performance SLAs for similar features?"
- "Does this feature have strict offline requirements or can it assume connectivity?"

### Step 4: Define Architecture

In the **Architecture** section:

1. **System Structure**: Describe the high-level components (layers, services, modules) and how they interact. Include diagrams (ASCII or linked images) if helpful.

   Example:
   ```
   [Client] → [API Gateway] → [Service A] → [Database]
                                  ↓
                           [Service B]
   ```

2. **Project Structure**: Document the directory layout for this feature:
   - Docs (specs/{{FEATURE}}/spec.md, design.md, tasks.md, adr/)
   - Source code (backend src/, frontend src/, etc.)
   - Tests (unit, integration, contract)

   The template includes options for single-project, web-app (frontend+backend), and mobile+API structures. Choose one and remove the others.

### Step 5: Make explicit decisions

In the **Decisions** section, document each significant architectural choice in **ADR format**:

```
### Decision: [Example: Use PostgreSQL for primary data store]

**Rationale**:
[Explain why this decision was made.]

Problem statement: [What question needed answering?]
Context: [Constraints, requirements, trade-offs from Technical Context]

Example rationale:
PostgreSQL provides ACID compliance, supports complex relational schemas, 
and has strong community support. Our scale (50k users) requires transactional 
consistency; a NoSQL store would complicate data integrity checks.

**Alternatives considered**:
- **Option A**: MongoDB (NoSQL document store) — Would provide schema flexibility 
  but lacks the transactional guarantees our multi-step workflows require.
- **Option B**: Redis + RocksDB (hybrid) — Could reduce latency for hot data 
  but adds operational complexity; PostgreSQL with query optimization is simpler.
```

Cover all major technical choices:
- **Storage strategy**: Database choice, schema partitioning, caching layers.
- **API design**: REST vs. gRPC, synchronous vs. event-driven, versioning strategy.
- **Deployment model**: Monolith vs. microservices, containerization, scaling strategy.
- **Testing strategy**: Unit vs. integration vs. contract test balance.
- **Security model**: Authentication, authorization, encryption at rest/transit.
- **Error handling**: Retry strategies, circuit breakers, observability.

### Step 6: Define the data model

In the **Data Model** section:

1. **Extract entities** from the feature specification:
   - What are the primary business objects (User, Order, Document, etc.)?
   - What attributes does each have?
   - What relationships exist between them (has_many, belongs_to, has_and_belongs_to_many)?

2. **Document constraints and invariants**:
   - Field types and lengths (e.g., "name: string, max 255 chars").
   - Required vs. optional fields.
   - Enums (e.g., `status: ACTIVE, ARCHIVED, PENDING`).
   - State machines (e.g., "OrderStatus transitions: PENDING → CONFIRMED → SHIPPED → DELIVERED").

**Example**:
```
### Entities

| Entity | Fields | Primary Key | Relationships | Notes |
|--------|--------|-------------|---------------|-------|
| User | id, email, name, created_at, status | id (UUID) | has_many: orders | Status: ACTIVE, INACTIVE |
| Order | id, user_id, total, created_at, status | id (UUID) | belongs_to: user; has_many: line_items | Status: PENDING, CONFIRMED, SHIPPED |
| LineItem | id, order_id, product_id, qty, price | id (UUID) | belongs_to: order, product | qty ≥ 1 |
```

Or describe inline:

**User**
- `id` (UUID): Primary key
- `email` (string, unique): User's email, max 255 chars
- `name` (string): Full name, max 255 chars
- `status` (enum: ACTIVE, INACTIVE): Account status
- `created_at` (timestamp): Account creation time
- Relationships: has_many Orders
- Invariants: email must be valid; status transitions are one-way (ACTIVE → INACTIVE only)

### Step 7: Document contracts

In the **Contracts** section, define the external interfaces this feature exposes or consumes:

1. **API/Service Interfaces**: If the feature provides an API (REST, gRPC, GraphQL, etc.):
   - Document endpoints/methods with request/response schemas.
   - Include error cases and status codes.
   - Specify authentication and rate limits.

2. **Function Signatures** (for libraries): Exported functions with docstrings, parameter types, return types, and exceptions.

3. **Integration Points**: External systems the feature calls (e.g., payment provider, email service, logging backend).
   - Protocol (REST, gRPC, SDK)
   - Authentication (OAuth2, API key, mTLS)
   - Rate limits and SLAs
   - Error handling expectations

4. **Event Schema** (if applicable): Messages published to queues or event streams.
   - Topic/channel name
   - Payload structure
   - Versioning strategy
   - Retention and ordering guarantees

**Example**:
```
### API / Service Interfaces

#### REST Endpoint: Create Order

POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer {token}

Request:
{
  "user_id": "uuid",
  "items": [
    {"product_id": "uuid", "quantity": 2}
  ]
}

Response (201 Created):
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "PENDING",
  "total": 99.99,
  "created_at": "2024-01-01T00:00:00Z"
}

Error Response (400 Bad Request):
{
  "error": "INVALID_REQUEST",
  "message": "Field 'items' cannot be empty"
}
```

---

## Quality gates

Before finalizing `design.md`:

- **Completeness**: Every field in Technical Context is filled (marked `NEEDS CLARIFICATION` only if genuinely uncertain — not a permanent state).
- **Consistency**: Architecture aligns with Technical Context (e.g., if using event-driven, contracts include event schemas).
- **Traceability**: Each decision references the constraint or requirement that motivated it.
- **Clarity**: A new engineer unfamiliar with the feature should understand the system structure, key decisions, and data model.

## Next step

Once `design.md` is complete and approved:

1. **Review for decisions**: Ensure all ADRs are clear and decisions are justified.
2. **Invoke `superspec-plan`**: Hand off to the task-breakdown stage to decompose the design into implementation tasks.

The `superspec-plan` skill will read `design.md` and create `specs/{{FEATURE}}/tasks.md`, breaking down the architecture into TDD-driven implementation tasks.

---

<!-- Adapted from SK: templates/commands/plan.md (MIT). See /NOTICE. -->
