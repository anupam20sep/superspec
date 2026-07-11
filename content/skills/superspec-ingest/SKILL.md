---
name: superspec-ingest
description: "Use when bootstrapping a spec from existing documentation or code rather than greenfield exploration. Extracts functional requirements with provenance, flags source conflicts, writes sources.lock, and hands off to superspec-scope."
---

# superspec-ingest

Use this skill to turn existing project knowledge — documentation bundles or a code-first codebase — into a structured requirement draft with traceable provenance. You are not writing a wishlist; you are capturing what the system **does today** (or what the docs **claim** it does) as the baseline for formal scoping.

**Announce at start:** "I'm using the superspec-ingest skill to extract requirements from existing sources."

## When to Use

- You have existing documentation (PRDs, READMEs, API docs, design notes) and need to formalize requirements before scoping
- You have no docs but substantial code, and need to reverse-engineer a baseline spec from implementation
- You are onboarding to a legacy or brownfield project and need provenance-backed FRs before `superspec-scope`
- You need to record which sources informed each requirement and lock them for audit

## What This Skill Does

This skill guides you through two ingestion modes and produces artifacts ready for formal scoping:

1. **Docs mode** — read a doc bundle, extract FRs with per-requirement provenance, flag conflicts between sources, write `sources.lock`
2. **Code-first mode** — when no docs exist but code does, discover code-intelligence capabilities first, then extract behavior with confidence-graded provenance
3. **Baseline discipline** — capture current behavior, not desired future state; route unintentional or ambiguous behavior to **Assumptions**
4. **Handoff** — deliver a requirement draft and locked sources to `superspec-scope`

## Mode Selection

Determine mode before extraction:

| Condition | Mode |
|-----------|------|
| One or more authoritative docs exist (PRD, spec, API reference, README with behavior) | **Docs mode** |
| No meaningful docs, but implementation exists | **Code-first mode** |
| Both docs and code exist | **Docs mode primary**, code used to resolve conflicts and fill gaps (note provenance tier) |

If neither docs nor code exist, this skill does not apply — use `superspec-explore` instead.

---

## Docs Mode

### Step-by-step workflow

1. **Identify the doc bundle** — collect all authoritative sources for the feature or system:
   - Product requirements, design docs, API contracts, README sections, runbooks
   - Note each file path and last-modified date (if available)

2. **Read the bundle completely** — do not skim. Read every source before extracting FRs.

3. **Extract functional requirements** — for each FR candidate:
   - Assign a provisional ID (`FR-001`, `FR-002`, …) — final numbering happens in `superspec-scope`
   - Write the requirement in testable form: "System MUST …" / "System SHOULD …"
   - Attach **provenance**: source file, section/heading, and quoted or paraphrased excerpt
   - Example provenance note: `[source: docs/api/auth.md § Token Refresh]`

4. **Flag conflicts** — when two sources disagree:
   - Record both positions with their provenance
   - Mark the FR with `[SOURCE CONFLICT: …]` and list the conflicting sources
   - Do **not** silently pick a winner — leave resolution for `superspec-refine` or human review

5. **Separate baseline from wishlist**:
   - **In scope for ingest:** documented current behavior, contractual obligations, explicit constraints
   - **Out of scope for ingest:** roadmap items, "we should", "future", "nice to have" — note these separately as *Deferred* (not FRs)
   - **Unintentional or unclear behavior** → document under **Assumptions**, not as MUST requirements

6. **Write `sources.lock`** — create or update `specs/<FEATURE>/sources.lock`:

   ```yaml
   # sources.lock — locked at ingest time; do not edit without re-ingest
   feature: <FEATURE>
   ingested_at: <ISO-8601 timestamp>
   mode: docs
   sources:
     - path: docs/api/auth.md
       sha_or_mtime: <hash or mtime>
       role: primary
     - path: README.md
       sha_or_mtime: <hash or mtime>
       role: supplementary
   conflicts:
     - fr: FR-003
       sources: [docs/api/auth.md, README.md]
       summary: "Token TTL differs — 15m vs 1h"
   ```

7. **Write requirement draft** — save extracted FRs, Assumptions, and conflict markers to a working draft (e.g., `specs/<FEATURE>/ingest-draft.md`) for `superspec-scope` to formalize.

---

## Code-First Mode

Use when no authoritative documentation exists but the codebase implements the behavior you need to capture.

### Step 1: Discover code-intelligence capabilities

**Do not assume a specific tool name.** Search the environment by **capability**, not product label:

| Capability needed | What to look for |
|-------------------|------------------|
| Semantic code search | MCP servers or IDE tools that answer "where is X handled?" by meaning |
| Call-graph / dependency tracing | Tools that show callers, callees, or import graphs |
| Project index artifacts | Pre-built indexes (`.codebase/`, `tags`, LSP workspace symbols, ctags, compiled AST dumps) |
| Static analysis summaries | Existing architecture docs generated from code |

**Discovery order:**

1. Check configured MCP servers for semantic search or code-graph tools
2. Check for project-local index artifacts (`Glob` for common index patterns)
3. If neither exists, fall back to `Grep` / `Glob` / `Read` with explicit lower-confidence provenance

Record which tier you used in `sources.lock` under `discovery_tier: mcp-semantic | index-artifact | grep-fallback`.

### Step 2: Extract behavior from code

1. **Identify entry points** — routes, handlers, CLI commands, public APIs, main UI flows
2. **Trace behavior** — follow the code path for each observable capability
3. **Extract FR candidates** — describe what the code **actually does**, not what it should do
4. **Attach provenance** — file path, function/class name, line range
   - High confidence (MCP semantic / call-graph): `[source: src/auth/token.ts:refreshToken L42–89]`
   - Lower confidence (grep fallback): `[source: src/auth/token.ts:refreshToken L42–89, confidence: inferred-via-grep]`

### Step 3: Handle ambiguity and unintentional behavior

| Observation | Action |
|-------------|--------|
| Clear, intentional behavior | Extract as FR with code provenance |
| Behavior that looks like a bug or accident | **Assumptions** — "Observed: X; may be unintentional" |
| Dead code or unreachable path | Note under Assumptions or *Deferred*; do not FR |
| Conflicting implementations (two code paths, different behavior) | Flag `[SOURCE CONFLICT]` like docs mode |

### Step 4: Write artifacts

Same as docs mode:

- `specs/<FEATURE>/sources.lock` with `mode: code-first` and `discovery_tier`
- `specs/<FEATURE>/ingest-draft.md` with FRs, Assumptions, conflicts

---

## Baseline Discipline

**This skill produces a baseline spec, not a wishlist.**

- FRs describe **what exists or is contractually required today**
- Future enhancements belong in a separate *Deferred* or *Roadmap* section — not mixed into FRs
- When you cannot tell intent from accident, default to **Assumptions** with an explicit note
- Every FR must have provenance — an FR without a source is invalid at this stage

## Output Structure

After ingest completes, `specs/<FEATURE>/` contains:

| Artifact | Purpose |
|----------|---------|
| `sources.lock` | Locked list of sources, discovery tier, conflicts |
| `ingest-draft.md` | Provisional FRs, Assumptions, conflict markers, Deferred items |

## Quality Checklist

Before handoff, confirm:

- [ ] Every FR has at least one provenance citation
- [ ] Source conflicts are flagged, not silently resolved
- [ ] Wishlist/roadmap items are separated from baseline FRs
- [ ] Unintentional or ambiguous behavior is in Assumptions, not stated as MUST
- [ ] `sources.lock` is written and matches the sources actually read
- [ ] Code-first mode records `discovery_tier` honestly

## Handoff

Follow execution mode from `using-superspec` (Review vs Autonomous).

After ingest is complete:

- **Next stage: `superspec-scope`** — formalize `ingest-draft.md` into a numbered `spec.md` with SC-###, user stories, and acceptance scenarios; preserve provenance references where useful
- **If source conflicts block scoping:** resolve via human review or `superspec-refine` after scope
- **If no feature directory exists yet:** create `specs/<FEATURE>/` during ingest; scope will refine naming and numbering

**Review mode (default):** Present the ingest draft and `sources.lock`. Wait for approval before scope.

> "Ingest complete. Review the draft FRs and provenance. Reply when ready to formalize into `spec.md`."

**Autonomous mode:** invoke `superspec-scope` immediately.

## Key Principles

- **Provenance over assertion** — every requirement traces to a doc section or code location
- **Baseline over aspiration** — capture reality; defer the roadmap
- **Conflicts are visible** — never merge contradictory sources silently
- **Capability-first discovery** — find the best available code-intelligence tool; grep is a fallback, not the default
- **Assumptions for ambiguity** — when intent is unclear, document what you observed and why you're uncertain
