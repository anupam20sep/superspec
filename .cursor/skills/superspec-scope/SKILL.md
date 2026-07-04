---
name: superspec-scope
description: "Use when you have a brainstormed design and need to formalize it into a numbered, testable specification. Generates a spec.md with functional requirements (FR-###), success criteria (SC-###), and prioritized user stories with acceptance scenarios."
---

# superspec-scope

Use this skill to transform brainstormed feature ideas into a formal written specification. You have a feature description (from user input or prior exploration), and you need to produce a comprehensive `spec.md` file that captures requirements, user scenarios, and measurable success criteria in a structured, testable format.

## When to Use

- You have finished exploring and brainstorming a feature concept (from `superspec-explore`)
- You need to formalize the feature into a numbered, testable specification
- You're ready to write down functional requirements, success criteria, and acceptance scenarios
- The feature requires a structured specification before moving to design/architecture

## What This Skill Does

This skill guides you through creating a formal feature specification that serves as the contract for the next stages of development. It:

1. **Accepts a feature description** — text captured from brainstorming or user input
2. **Generates a short feature name** — a concise 2–4 word identifier (e.g., "user-auth", "analytics-dashboard")
3. **Creates a spec directory** — organized under a consistent directory structure with sequential or timestamp-based naming
4. **Fills the spec template** — using the project's standard spec template (`spec.md`) with:
   - **Functional Requirements (FR-###)** — specific, testable capabilities the system must provide
   - **Success Criteria (SC-###)** — measurable outcomes to verify feature completion (technology-agnostic)
   - **User Stories & Acceptance Scenarios** — prioritized user journeys (P1, P2, P3) with Given/When/Then acceptance tests
   - **Edge Cases** — boundary conditions and error scenarios
   - **Key Entities** — data structures or domain objects involved (if applicable)
   - **Assumptions** — documented reasonable defaults for unspecified aspects
5. **Validates the specification** — checks completeness, clarity, and testability against a quality checklist
6. **Resolves clarifications** — if critical ambiguities remain, presents options for user feedback (max 3 questions)

## How to Use

**Input:** A feature description in natural language (from your exploration or brainstorming session).

**Output:** A structured `spec.md` file ready for the next stage, along with a validation checklist.

### Step-by-step workflow

1. **Provide your feature description** to the skill. This becomes the input that shapes the entire specification.

2. **The skill processes your input** and generates:
   - A short, memorable feature name
   - A feature directory (auto-numbered or timestamped, e.g., `specs/003-user-auth`)
   - An initial `spec.md` file based on the template

3. **Fill in the specification** using the template structure:
   - Use the **User Scenarios & Testing** section to describe prioritized user journeys (P1/P2/P3)
   - Write **Functional Requirements** as `FR-001`, `FR-002`, etc. — each must be testable and concrete
   - Define **Success Criteria** as `SC-001`, `SC-002`, etc. — measurable, technology-agnostic outcomes
   - Document **Key Entities** (data models, domain objects)
   - List **Assumptions** for any unspecified details or reasonable defaults

4. **Specify user stories** with acceptance scenarios:
   - Each story should be **independently testable** — implementing just one story should yield a viable MVP
   - Prioritize as P1 (most critical), P2 (important), P3 (nice-to-have)
   - Write acceptance scenarios in **Given/When/Then format** — these become acceptance tests
   - Example:
     ```
     **Given** the user is logged in,
     **When** they click "Create Account",
     **Then** the account creation form appears with required fields validated
     ```

5. **Quality validation** — the skill runs an automated checklist:
   - No implementation details (frameworks, languages, APIs)
   - All requirements are testable and unambiguous
   - Success criteria are measurable and technology-agnostic
   - Edge cases are identified
   - [NEEDS CLARIFICATION] markers limited to 3 critical items (scope/security/UX)

6. **Resolve clarifications** (if needed) — if the specification contains ambiguities, the skill presents options and waits for your answers, then updates the spec

7. **Readiness for next stage** — once validated, the spec is ready for `superspec-refine` (clarify requirements in detail) or `superspec-architect` (design the solution)

## Output Structure

Your completed specification lives in a directory like `specs/003-user-auth/` and contains:

- **`spec.md`** — the main specification with all sections filled in
- **`checklists/requirements.md`** — validation checklist (pass/fail for each quality item)

## Specification Format Guide

Follow the structure in the project's spec template (typically `content/templates/spec-template.md`):

### Functional Requirements (FR-###)
Each requirement describes a specific capability:
- **FR-001**: System MUST [concrete action]
- Use MUST, SHOULD, or MAY to indicate priority
- Make each requirement independently testable
- Examples: "System MUST allow users to create accounts", "System MUST validate email addresses"

### Success Criteria (SC-###)
Each criterion is a measurable outcome:
- **SC-001**: [Measurable metric] (e.g., "Users can complete checkout in under 2 minutes")
- Include both quantitative metrics (time, percentage, volume) and qualitative measures (user satisfaction, task completion)
- Never mention implementation details (frameworks, databases, languages)
- Examples: "System handles 1000 concurrent users without degradation", "90% of users complete primary task on first attempt"

### User Stories (P1/P2/P3)
Each story is a user journey:
- **Priority**: P1 (critical, MVP-defining), P2 (important), P3 (nice-to-have)
- **Why this priority**: Explain value and rationale
- **Independent Test**: How to verify this story in isolation
- **Acceptance Scenarios**: 2–3 Given/When/Then scenarios that define done

### Edge Cases
- What happens when [boundary condition]?
- How does the system handle [error scenario]?

### Assumptions
- Document all defaults and design choices made when the feature description was unclear
- Examples: "Mobile support is out of scope for v1", "Existing authentication system will be reused"

## Handoff

After your specification is validated and complete:

- **Next stage: `superspec-refine`** — Deep-dive into requirements, resolve any remaining [NEEDS CLARIFICATION] markers, and lock in answers before design
- **Or next stage: `superspec-architect`** — If your spec is already clear and well-defined, jump directly to designing the solution architecture

## Key Principles

- **Focus on WHAT and WHY**, not HOW — no implementation details, technology names, or code structure
- **Written for stakeholders**, not developers — use clear, plain language
- **Testable requirements** — every FR and acceptance scenario must be verifiable without knowing the implementation
- **Independent user stories** — each P1/P2/P3 story should deliver value and be testable in isolation
- **Measurable success criteria** — include specific metrics (time, percentage, count, rate)
- **Reasonable defaults** — document assumptions for any gaps; limit clarifications to the 3 most critical decisions

## Common Areas for Clarity

When your feature description is vague, make informed guesses and document assumptions:

- **Data retention**: Use industry standards for your domain
- **Performance targets**: Standard expectations unless specified (e.g., "results in under 1 second")
- **Error handling**: User-friendly messages with graceful fallbacks
- **Authentication**: Standard session-based or OAuth2 for web apps
- **Integration patterns**: Project-appropriate patterns (REST, GraphQL, function calls, CLI args)

Only mark something as `[NEEDS CLARIFICATION]` if multiple interpretations exist with significantly different implications and no reasonable default exists.

<!-- Adapted from SK: templates/commands/specify.md (MIT) and templates/spec-template.md (MIT). See /NOTICE. -->
