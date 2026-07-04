---
name: superspec-refine
description: "Use when your specification contains open questions or [NEEDS CLARIFICATION] markers. Asks up to 5 targeted clarifying questions, collects answers, and writes them back into spec.md to resolve ambiguities before moving to architecture."
---

<!-- Adapted from SK: templates/commands/clarify.md (MIT). See /NOTICE. -->

# superspec-refine

Use this skill to resolve ambiguities and missing decision points in your feature specification before proceeding to architecture and design. The skill identifies unresolved questions marked with `[NEEDS CLARIFICATION]` in your `spec.md`, asks targeted clarification questions, and integrates answers back into the specification.

## When to Use

- Your specification contains `[NEEDS CLARIFICATION: ...]` markers left by `superspec-scope`
- You need to resolve ambiguities in functional requirements, user stories, data models, or non-functional constraints before moving to design
- Your team needs written answers to critical design questions that are blocking architecture decisions
- You're ready to commit to specific choices (e.g., security model, scale assumptions, user roles) documented in the spec

## What This Skill Does

This skill guides you through a focused clarification workflow:

1. **Scans the specification** for `[NEEDS CLARIFICATION: ...]` markers and ambient ambiguities using a structured taxonomy
2. **Generates a prioritized queue** of up to 5 clarifying questions, ranked by impact on architecture, data modeling, and test design
3. **Asks questions interactively** — one at a time, with recommended options where applicable, awaiting your answer before proceeding
4. **Integrates answers** — after each answer is accepted, writes the answer into the specification under a `## Clarifications` section and applies the clarification to the affected requirement/story/constraint
5. **Validates the updated spec** — confirms no contradictions remain and all clarifications are correctly recorded
6. **Hands off to the next stage** — once clarifications are done, you're ready for `superspec-architect` (design and architecture)

## How to Use

**Input:** A feature specification file (`spec.md`) that may contain `[NEEDS CLARIFICATION: ...]` markers or other ambiguous sections.

**Output:** An updated `spec.md` with clarifications integrated; a session-dated entry in the `## Clarifications` section.

### Step-by-step workflow

1. **Prepare your specification**. Before invoking this skill, ensure you have a working `spec.md` file with:
   - Functional Requirements (FR-###)
   - Success Criteria (SC-###)
   - User Stories with acceptance scenarios
   - Any sections marked with `[NEEDS CLARIFICATION: ...]` from the `superspec-scope` stage

2. **Invoke the skill** with optional context about the feature or development priorities (e.g., "We're building a real-time dashboard; performance is non-negotiable").

3. **The skill performs an ambiguity audit**. It scans the specification against a taxonomy covering:
   - **Functional Scope & Behavior** — core goals, out-of-scope boundaries, user roles
   - **Domain & Data Model** — entities, attributes, relationships, identity/lifecycle rules
   - **Interaction & UX Flow** — critical journeys, error states, accessibility needs
   - **Non-Functional Quality Attributes** — performance targets, scalability limits, reliability expectations, security posture, compliance constraints
   - **Integration & External Dependencies** — external services, API contracts, failure modes
   - **Edge Cases & Failure Handling** — negative scenarios, rate limiting, conflict resolution
   - **Constraints & Tradeoffs** — technical constraints, rejected alternatives, explicit tradeoffs
   - **Terminology & Consistency** — canonical glossary, deprecated terms
   - **Completion Signals** — testable acceptance criteria, Definition of Done indicators

4. **Answer clarifying questions**. The skill presents up to 5 questions interactively:
   - Each question is answerable with either a **multiple-choice selection** (2–5 distinct options) or a **short answer** (≤5 words)
   - For multiple-choice questions, a recommended option is highlighted with reasoning; you may accept it by saying "yes" or "recommended", or select a different option
   - For short-answer questions, a suggested answer is provided; you may accept it by saying "yes" or "suggested", or provide your own short answer
   - Answer one question at a time; the skill will not reveal future questions in advance

5. **Clarifications are integrated into the spec** as each answer is accepted:
   - A `## Clarifications` section is created (if not present) with a `### Session YYYY-MM-DD` subsection
   - Each clarification is recorded as `- Q: <question> → A: <answer>` under the session heading
   - The answer is applied to the affected section (Functional Requirements, User Stories, Data Model, Edge Cases, or Constraints)
   - Spec quality checklist (if present) is re-validated against the updated spec
   - The spec file is saved after each integration to minimize context loss

6. **Validation ensures correctness**:
   - No lingering placeholders remain for questions that have been answered
   - Each clarification appears exactly once in the session record (no duplicates)
   - Total asked questions ≤ 5
   - Terminology is consistent across the updated spec
   - Markdown structure remains valid

7. **Ready for next stage** — once clarifications are complete, your spec is ready for `superspec-architect` (create design.md with architecture, data models, and technical contracts)

## Specification Format Guide

### [NEEDS CLARIFICATION] Marker Convention

When `superspec-scope` encounters a critical ambiguity, it marks the spot inline:

```markdown
## Functional Requirements

- FR-002: System MUST support user authentication
  [NEEDS CLARIFICATION: What authentication methods (password, OAuth, SAML, multi-factor)?]
```

This skill resolves these markers by asking the question, recording your answer in a `## Clarifications` section, and applying it to the corresponding requirement or section.

### Clarifications Section Example

After clarifying questions, your spec contains a new section:

```markdown
## Clarifications

### Session 2026-07-04
- Q: What authentication methods (password, OAuth, SAML, multi-factor)? → A: Password + OAuth2 (GitHub and Google)
- Q: Maximum concurrent users expected in year 1? → A: 50,000
- Q: Is audit logging required for compliance? → A: Yes, finance team needs 2-year retention for SOX
```

Then these answers are applied to the affected sections:

```markdown
## Functional Requirements

- FR-002: System MUST support user authentication via password or OAuth2 (GitHub, Google)
- FR-003: System MUST support up to 50,000 concurrent users
- FR-004: System MUST retain audit logs for 2 years (SOX compliance)
```

## Quality Attributes & Coverage

Questions are prioritized by impact on:
- **Architecture** — choices that shape system design (monolith vs. distributed, caching strategy, authentication model)
- **Data Modeling** — schema decisions (entity relationships, constraints, scaling implications)
- **Test Design** — acceptance criteria that depend on the answer (e.g., performance targets make test SLAs testable)
- **Operational Readiness** — compliance, monitoring, and incident response

Questions are skipped if:
- The answer is already clear from the specification
- The question is better deferred to the planning stage (lower architectural impact)
- The question would only affect implementation details (framework choice, API versioning)

## Common Question Patterns

### Multiple-Choice (Recommended Approach)

**Q: Should the system support offline-first sync?**

Recommended: Option B - Recommend based on your use case...

| Option | Description |
|--------|-------------|
| A | No offline sync; always-online requirement. Simpler architecture, requires connectivity. |
| B | Optional offline-first; eventual consistency. Higher complexity but enables mobile/unreliable networks. |
| C | Mandatory offline-first; sync is the core feature. Significant architectural lift; suitable for travel/field apps. |

Reply with "A", "B", "C", or "recommended".

### Short Answer

**Q: What is the target time-to-interactive for the dashboard landing page?**

Suggested: Under 2 seconds on 4G mobile — aligns with WCAG guidelines and typical user expectations.

Format: Short answer (≤5 words). Reply "yes" or "suggested", or provide your own answer.

## Next Steps

Once clarifications are complete:
1. Review the updated spec and `## Clarifications` section
2. Commit the clarified spec: `git add specs/<feature>/spec.md && git commit -m "clarify: <feature> specification"`
3. Proceed to `superspec-architect` to create the design document (`design.md`) with architecture, data models, API contracts, and technical decisions

## Tips for Effective Clarification

- **Be specific** in your answers — vague responses like "depends" or "TBD" require a follow-up
- **Reference constraints** — if an answer is driven by external constraints (compliance, partner agreements, user research), mention it so the design stage understands the rationale
- **Expect tradeoffs** — clarification often uncovers that different stakeholders want different things; the answer here should reflect a decision, not a compromise that defers the tradeoff
- **Don't over-clarify** — this stage is about resolving blocking ambiguities, not finalizing every detail; "good enough to start design" is the bar

## When to Skip or Defer

If the specification is already clear and contains no `[NEEDS CLARIFICATION]` markers:
- The skill will report "No critical ambiguities detected" and suggest proceeding directly to `superspec-architect`

If you reach the 5-question limit with unresolved high-impact categories:
- The skill will flag these as "Deferred" and recommend whether to proceed to architecture (and accept future design rework) or run another clarification round after planning
