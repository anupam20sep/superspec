# SuperSpec

Spec-driven and TDD-driven development for your coding agent, built by fusing two proven methodologies — [GitHub Spec Kit](https://github.com/github/spec-kit)'s traceable, product-first specs and [Superpowers](https://github.com/obra/superpowers)' mandatory-TDD, agent-executable plans — into one plugin with a shared engine, so Claude Code and Cursor get identical guidance and identical callable tools.

## Why SuperSpec exists

Spec Kit and Superpowers each solve one half of the problem, and neither solves both.

**Spec Kit is strong at the spec.** Stable requirement IDs (`FR-###`), prioritized user stories with Given/When/Then acceptance scenarios, measurable success criteria (`SC-###`), and standalone design/data-model/contract artifacts. This is what "spec-driven" should mean: a product-first, stakeholder-traceable contract you can hold a build accountable to. But its own task template says outright that *"Tests are OPTIONAL — only include them if explicitly requested."* TDD is opt-in, not structural. Task lines name a file and an intent but rarely carry the actual code, so an agent still has to infer "how" — which is exactly where execution drifts.

**Superpowers is strong at the build.** Every task is a red-green-refactor cycle with inline test and implementation code, exact commands, and a commit message — a fresh subagent can execute it with zero ambiguity. Its "No Placeholders" rule forbids `TBD`, "add error handling," and "similar to Task N." Subagent-driven dispatch, parallel execution windows, and per-window verification gates make it genuinely built for autonomous agentic execution. But it has no stable requirement-ID namespace, no prioritized user-story/MVP framing, and no coverage matrix — there's no way to *prove* every requirement actually shipped with a passing test behind it.

**The missing link in both is a traceability spine.** Spec Kit has the IDs but no TDD/execution rigor. Superpowers has the execution/TDD rigor but no IDs. SuperSpec's coverage matrix (`FR-### ↔ Task ↔ Test ↔ Verification gate`) is what makes "spec-driven and TDD-driven" a verifiable claim instead of an aspirational one — an `FR` with no covering task, or a task with no passing test, shows up as a gap, not a hope.

So SuperSpec fuses both: Spec Kit's spec layer (product framing, requirement IDs, standalone design artifacts) plus Superpowers' execution layer (mandatory TDD, no-placeholder plans, subagent dispatch, DAG/verification-gate orchestration), held together by a living coverage matrix that neither upstream provides on its own. Every template, skill, and module in this repo is classified against its real source — COPY, ADAPT, REIMPLEMENT, or NEW — in [docs/SOURCES.md](docs/SOURCES.md), so this fusion reuses proven work rather than reinventing it from scratch.

## How it works

**First time in a repo:** `superspec-init` runs once — scaffolds tier templates, records **lite** or **full** mode in `constitution.md`, and (in full mode) creates `program.md` at the repo root for multi-spec coordination.

**Starting a feature** depends on what you already have:

| Situation | Start here |
|---|---|
| Greenfield idea, no requirements yet | `explore` → dialogue shapes the idea before any spec exists |
| Brownfield — docs or code already describe behavior | `ingest` → extracts FRs with provenance, writes `sources.lock`, hands off to `scope` |
| Small, reproducible bug | `fix` → regression test + minimal patch, skips full spec lifecycle |
| Multi-spec repo in full mode | `program` maintains the backlog; `status` renders a consolidated lifecycle view |

Once requirements are shaped, `scope` turns them into a numbered `spec.md` with a **Type** (`product`, `platform`, `infra`, `migration`, or `spike`), functional requirements (`FR-###`), prioritized user stories, measurable success criteria (`SC-###`), and a **Required Reading** table. Any open question gets marked `[NEEDS CLARIFICATION]` and resolved by `refine` before anyone starts designing.

`architect` translates the spec into `design.md` — architecture, ADR-style decisions, data model, and contracts, reviewable on its own before a line of code exists. `plan` turns the design into `plan.md`: bite-sized tasks, each tagged with a **Kind** (`code`, `verify`, `provision`, `signoff`, or `doc-sync`). **Kind: code** tasks are mandatory red-green-refactor cycles with the actual test code, the actual implementation code, the exact command to run, and a real commit message. Other kinds carry type-appropriate proof instead of TDD cycles. No placeholders, no "figure it out later."

`route` schedules those tasks into an `execution-map.md` — a dependency DAG, parallel execution windows, model routing (heavy/ambiguous work to a strong model, mechanical work to a fast one), and per-window verification gates. For branch isolation before plan or forge work, `worktree` creates a git worktree with safety checks; `ship` cleans it up after merge or discard.

Once the plan and execution map exist, `forge` takes over and drives the whole thing to completion without stopping to ask "should I continue?" between tasks. It dispatches a fresh implementer subagent per task with zero prior context, runs red-green-refactor for real, then dispatches a fresh reviewer subagent for an independent spec-compliance and code-quality verdict before recording the task done. Forge state persists to `.superspec/state.json` under each spec directory, so a killed or restarted session resumes exactly where it left off instead of re-deriving progress from memory. A task that fails review repeatedly gets flagged `blocked` and the loop moves on to other independent work rather than spinning forever — "nothing left to try" and "actually done" are never confused with each other.

`validate` then runs the real verification commands — coverage matrix, spec/plan/design lint, constitution compliance — and confirms the output before anyone is allowed to claim the feature is complete: evidence before assertions, always. `ship` is the terminal stage, gated on a clean validation report, presenting the same merge/PR/keep/discard options you'd expect from finishing any development branch.

**The agent checks the lifecycle before any task — this isn't optional guidance, it's the mandatory entry point every session goes through.**

## The lifecycle

```
init (once per repo)
  |
  +-- fix lane (bugs)  -----------------------> validate -> ship
  |
  +-- ingest (brownfield) --+
  +-- explore (greenfield) -+-> scope -> refine -> architect -> plan
                                                      |
                                              [worktree] (optional)
                                                      |
                                                    route -> forge -> validate -> ship

program + status (full mode, ongoing coordination across specs)
```

### Core stages

| Stage | What it does | Produces |
|---|---|---|
| `init` | One-time repo bootstrap | `constitution.md`, tier templates, optional `program.md` |
| `ingest` | Extracts requirements from existing docs or code | Requirement draft, `sources.lock`, provenance |
| `explore` | Shapes a raw idea through dialogue before any code | Intent notes, open questions |
| `scope` | Formalizes the idea into a testable spec | `spec.md` — Type, `FR-###`, `SC-###`, Required Reading, user stories |
| `refine` | Resolves ambiguity before design starts | Open `[NEEDS CLARIFICATION]` markers answered in `spec.md` |
| `architect` | Designs the technical solution | `design.md` — architecture, decisions, data model, contracts |
| `plan` | Decomposes the design into executable tasks | `plan.md` — tasks with Kind, TDD cycles for code tasks |
| `worktree` | Isolates plan/forge work on a feature branch | Git worktree under `.worktrees/` or `worktrees/` |
| `route` | Schedules tasks for parallel, model-routed execution | `execution-map.md` — DAG, parallel windows, model routing, verification gates |
| `forge` | Drives every task to done, autonomously | A working, tested implementation — resumable, escalates instead of hanging |
| `validate` | Proves the work is actually complete | Coverage-matrix status, spec/plan/design lint, constitution compliance |
| `ship` | Finishes the branch | Merge, PR, keep, or discard — cleans up worktrees |

### Coordination and shortcuts

| Stage | What it does | When |
|---|---|---|
| `program` | Maintains `program.md` backlog and Open Decisions | Full mode, multiple parallel spec workstreams |
| `status` | Renders one consolidated lifecycle table across specs | Standups, planning, program reviews |
| `fix` | Regression test + minimal patch, no spec/design/plan | Small, well-scoped bugs with clear reproduction |

Two principles are fixed and cannot be configured away, because they're what makes a project "SuperSpec-compliant" at all (see [`content/templates/constitution.md`](content/templates/constitution.md)):

- **Test-First for code tasks (NON-NEGOTIABLE).** Every **Kind: code** task is a red-green-refactor cycle. Tests are never optional, never deferred, never added retroactively for code tasks. Tasks with other kinds (`verify`, `provision`, `signoff`, `doc-sync`) produce type-appropriate proof instead. This is the direct reversal of Spec Kit's "tests OPTIONAL" default.
- **Traceability Spine (NON-NEGOTIABLE).** Every `FR-###` maps to at least one task and at least one passing test. The coverage matrix must stay complete — no requirement without a covering task, no task complete without a passing test.

Everything else in the constitution (simplicity/YAGNI, observability, versioning) is a customizable placeholder each adopting project fills in for itself.

**Enforcement is advise-only throughout.** SuperSpec generates, validates, and reports — it never hard-blocks a commit or a CI run. If a gate fails, you see why; you decide what to do about it.

## Install

Give your agent SuperSpec:

- [Claude Code](#claude-code)
- [Cursor](#cursor)

### Claude Code

```bash
git clone https://github.com/anupam20sep/superspec.git
cd superspec
./scripts/install.sh
```

`install.sh` registers a local marketplace and installs the plugin — idempotent, safe to re-run. It wraps two commands directly, if you'd rather run them yourself:

```bash
claude plugin marketplace add /path/to/superspec
claude plugin install superspec@superspec-dev
```

### Cursor

In Cursor's Agent chat:

```
/add-plugin superspec
```

That installs the full lifecycle — skills, rules, hooks — from the `.cursor-plugin/plugin.json` manifest this repo ships. If it isn't showing up yet in Cursor's own marketplace search, add it directly by URL instead (Team Marketplace import, or `/add-plugin https://github.com/anupam20sep/superspec`).

For SuperSpec's MCP tools specifically — `build-matrix`, `lint-spec`, `lint-plan`, `lint-design`, `route-model`, `scaffold`, `next-task`, `record-result`, `forge-status`, `list-personas` — without installing the full plugin, add this to any project's `.cursor/mcp.json`:

```json
{ "mcpServers": { "superspec": { "command": "npx", "args": ["-y", "@superspec-dev/core", "mcp"] } } }
```

`npx` resolves `@superspec-dev/core` from the npm registry, so this works from any project regardless of whether SuperSpec is checked out there. See [docs/install.md](docs/install.md) for more detail, including the GitHub Copilot install pattern (planned, not yet built).

## What's inside

### Lifecycle skills (`content/skills/`)

One skill per stage, plus entry-point and coordination skills every session can route through:

| Skill | Role |
|---|---|
| **`using-superspec`** | Entry point — establishes the lifecycle before any response, including clarifying questions |
| **`superspec-init`** | One-time repo bootstrap — scaffolds templates, records lite/full mode, optional `program.md` |
| **`superspec-ingest`** | Brownfield intake — extracts FRs from docs or code with provenance, writes `sources.lock` |
| **`superspec-explore`** | Greenfield shaping — dialogue before any spec exists |
| **`superspec-scope`** | Formalizes a shaped idea into `spec.md` (Type, `FR-###`, `SC-###`, Required Reading) |
| **`superspec-refine`** | Resolves `[NEEDS CLARIFICATION]` markers with up to 5 targeted questions |
| **`superspec-architect`** | Designs the solution: architecture, decisions, data model, contracts |
| **`superspec-plan`** | Writes the executable plan — every task traced to an `FR-###`, Kind-tagged |
| **`superspec-route`** | Schedules the plan into parallel windows with model routing and verification gates |
| **`superspec-worktree`** | Creates isolated git worktrees before plan/forge; pairs with `ship` for cleanup |
| **`superspec-forge`** | Autonomous implementation loop — fresh implementer + reviewer per task, resumable |
| **`superspec-validate`** | Runs real verification commands before any completion claim is allowed |
| **`superspec-ship`** | Terminal stage — merge, PR, keep, or discard, gated on clean validation |
| **`superspec-fix`** | Bug-fix lane — regression test + minimal patch, skips full spec lifecycle |
| **`superspec-program`** | Full-mode coordination — maintains `program.md` backlog and Open Decisions |
| **`superspec-status`** | Program-wide status table — infers lifecycle stage per spec, calls `forge-status` |

### Templates (`content/templates/`)

Tier templates scaffolded by `init` / `scaffold`:

| Template | Key fields |
|---|---|
| `spec-template.md` | **Type** (`product` \| `platform` \| `infra` \| `migration` \| `spike`), **Required Reading** table |
| `design-template.md` | Consumed/Produced contracts, cross-spec references |
| `plan-template.md` | **Kind** per task (`code` \| `verify` \| `provision` \| `signoff` \| `doc-sync`) |
| `execution-map-template.md` | Type and Blocks gate columns per window |
| `program-template.md` | Backlog table and Open Decisions (full mode) |
| `constitution.md` | Test-First scoped to code tasks; traceability spine |

**Spec Type** drives done-definition and verification expectations. **Task Kind** drives plan lint: only `code` tasks require red-green-refactor cycles; other kinds require type-appropriate proof defined in the plan.

**`sources.lock`** — written by `ingest`, records which source files informed each extracted requirement. **`program.md`** — full-mode coordination layer at repo root. **`.superspec/state.json`** — per-spec forge progress (gitignored; recreated by `next-task` / `record-result`).

### Subagent bodies (`content/agents/`)

- **`implementer`** — the fresh, zero-context subagent `forge` dispatches per task to run red-green-refactor.
- **`spec-reviewer`** — checks a spec for completeness and testability before design starts.
- **`task-reviewer`** — the independent reviewer `forge` dispatches after each implementation, giving separate spec-compliance and code-quality verdicts.

### The shared engine (`@superspec-dev/core`)

The same deterministic tools, exposed identically as both an MCP server and a CLI, so every supported tool gets the same guidance and the same callable tools — not two independently-behaving copies:

| Tool / command | Does |
|---|---|
| `build-matrix` / `matrix` | Builds the `FR`-to-task coverage matrix from spec and plan text; reports gaps |
| `lint-spec` / `lint --spec` | Checks spec for Type, `FR`/`SC` completeness, placeholders, clarification count |
| `lint-plan` / `lint --plan` | Flags placeholder text; enforces red-green-refactor only on **Kind: code** tasks |
| `lint-design` / `lint --design` | Checks design for incomplete decisions, `NEEDS CLARIFICATION`, contract table shape |
| `route-model` | Recommends a strong or fast model for a task's complexity |
| `scaffold` | Renders tier templates into a target directory |
| `next-task` | Returns the next DAG-ready pending task from persisted forge state |
| `record-result` | Records a pass/fail review verdict for a task and persists forge state |
| `forge-status` | Reports `{total, done, blocked, pending, complete}` for a set of plan tasks |
| `list-personas` | Discovers specialized sub-agent personas already defined in a project |

`build-matrix`, `lint-spec`, `lint-plan`, and `lint-design` are what turn "spec-driven and TDD-driven" from a vibe into something you can actually check — [docs/acceptance/mcp-parity.md](docs/acceptance/mcp-parity.md) shows both Claude Code and Cursor getting byte-identical output from the same tool call.

### CLI usage

Every MCP tool is also available from the command line via `npx @superspec-dev/core` (or `node packages/core/dist/cli.js` when developing this repo):

```bash
# Lint gates (return JSON findings; empty array = pass)
npx @superspec-dev/core lint --spec specs/001-feature/spec.md
npx @superspec-dev/core lint --design specs/001-feature/design.md --specs-root .
npx @superspec-dev/core lint --plan specs/001-feature/plan.md

# Coverage matrix
npx @superspec-dev/core matrix --spec specs/001-feature/spec.md --plan specs/001-feature/plan.md

# Forge loop state (persists to <dir>/.superspec/state.json)
npx @superspec-dev/core next-task --plan specs/001-feature/plan.md --dir specs/001-feature
npx @superspec-dev/core record-result --plan specs/001-feature/plan.md --dir specs/001-feature --task T001 --passed true
npx @superspec-dev/core forge-status --plan specs/001-feature/plan.md --dir specs/001-feature

# Scaffold tier templates into a new spec directory
npx @superspec-dev/core scaffold --templates content/templates --out specs/001-feature

# Start the MCP server on stdio
npx @superspec-dev/core mcp
```

When checking out this repo locally, run `npm run build` first so `packages/core/dist/cli.js` exists.

### Persona discovery

SuperSpec can discover specialized sub-agent personas already defined in your own project — `.claude/agents/*.md` and `.cursor/agents/*.md`, the same convention both tools already use natively — and route tasks to them by real name during `route`/`forge`. If your project has a `backend-developer` or `code-reviewer` agent already defined, SuperSpec uses it; if it doesn't, `route` falls back to a fixed generic role list (`@backend`, `@frontend`, `@qa`, `@tech-lead`, `@security`, `@performance`) with zero regression either way.

### Render/sync tooling (`@superspec-dev/render`)

Skills are authored once, in `content/skills/`, in platform-neutral prose. `@superspec-dev/render` renders that single source into each tool's own file layout (`skills/` for Claude Code, `.cursor/skills/` for Cursor) — edit a skill in `content/skills/` and run `npm run render` to propagate the change everywhere. [docs/acceptance/render-fidelity.md](docs/acceptance/render-fidelity.md) shows this working end to end on a real edit.

## Using SuperSpec on your own project

Install SuperSpec once (`./scripts/install.sh` for Claude Code, `/add-plugin superspec` for Cursor — see [Install](#install) above), then open your own project — not this repo — in that tool. The installed plugin's skills, subagents, and MCP tools follow you into any project automatically.

### First-time setup

1. Run **`superspec-init`** once per repository. Choose **lite** (single-spec focus) or **full** (adds `program.md` for multi-spec coordination).
2. Add the MCP server to `.cursor/mcp.json` if you want callable tools without relying on the agent to invoke skills alone (see [Install](#install)).

### Starting work

| Goal | Path |
|---|---|
| New feature from scratch | `explore` → `scope` → … → `ship` |
| Formalize existing docs or code | `ingest` → `scope` → … → `ship` |
| Fix a small bug | `fix` → `validate` → `ship` |
| Track multiple specs (full mode) | `program` for backlog updates, `status` for consolidated view |

Once set up in either tool:

1. Say what you want to build (or fix, or ingest). The bootstrap skill routes to the right lane, then walks the lifecycle in order. State and evidence live in your project the whole way (`spec.md`, `design.md`, `plan.md`, `execution-map.md`, `sources.lock`, `program.md`, plus `.superspec/state.json` for forge progress).
2. If your project already has `.claude/agents/` or `.cursor/agents/` defined, `route`/`forge` will discover and use them automatically — no extra configuration.
3. For branch isolation during plan or forge, invoke `worktree` before starting; `ship` cleans up worktrees after merge or discard.

[`examples/url-shortener/`](examples/url-shortener/) is a small, complete worked example — a real 4-requirement feature driven through every stage, with a real TDD-built implementation. From the repo root you can run the full validation ladder against it:

```bash
npm run build
npm run dogfood:url-shortener
```

That runs `lint --spec`, `lint --design`, `lint --plan`, `matrix`, and the example test suite in one shot. See [docs/acceptance/forge-loop.md](docs/acceptance/forge-loop.md) for forge-loop acceptance criteria (drive to completion, resume after a killed session, escalate a permanently-failing task).

## Philosophy

- **TDD is mandatory for code tasks, not optional.** Every **Kind: code** task is a red-green-refactor cycle, enforced by `lint-plan`, not just a convention to remember. Other task kinds carry their own proof obligations.
- **Proportionality over ceremony.** Full lifecycle for features; `fix` lane for small bugs; `ingest` for brownfield baselines — match the process to the work.
- **Traceability by ID, not by hope.** Every requirement maps to a task and a passing test, checked by a real coverage-matrix tool, not eyeballed.
- **Evidence before assertions.** `validate` runs the actual verification commands and confirms real output before any "done" claim is allowed to stand.
- **Advise-only, always.** SuperSpec reports and recommends; it never force-blocks a commit or a pipeline. You stay in control of what happens next.
- **Fresh context per task.** Every implementer and reviewer subagent starts with zero prior conversation history — exactly what the task needs, nothing inherited, nothing polluted.
- **One source, every tool.** Skills and tools are authored once and rendered/exposed identically everywhere, so switching tools never means switching methodology.

## Build

```bash
npm install
npm run build              # tsc -b — builds packages/core and packages/render
npm run render             # sync content/skills → skills/ + .cursor/skills/
npm test                   # full test suite (89 tests)
npm run dogfood:url-shortener   # validation ladder on the worked example
```

## Provenance

SuperSpec reuses both upstream projects' permissively-licensed (MIT) work rather than reinventing it. Every template, skill, and module is classified as COPY, ADAPT, REIMPLEMENT, or NEW against its real source in [docs/SOURCES.md](docs/SOURCES.md) — the canonical copy-map for this project. See [NOTICE](NOTICE) for attribution.

## License

MIT License — see [LICENSE](LICENSE) for details.
