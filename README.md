# SuperSpec

Spec-driven and TDD-driven development for your coding agent, built by fusing two proven methodologies — [GitHub Spec Kit](https://github.com/github/spec-kit)'s traceable, product-first specs and [Superpowers](https://github.com/obra/superpowers)' mandatory-TDD, agent-executable plans — into one plugin with a shared engine, so Claude Code and Cursor get identical guidance and identical callable tools.

## Why SuperSpec exists

Spec Kit and Superpowers each solve one half of the problem, and neither solves both.

**Spec Kit is strong at the spec.** Stable requirement IDs (`FR-###`), prioritized user stories with Given/When/Then acceptance scenarios, measurable success criteria (`SC-###`), and standalone design/data-model/contract artifacts. This is what "spec-driven" should mean: a product-first, stakeholder-traceable contract you can hold a build accountable to. But its own task template says outright that *"Tests are OPTIONAL — only include them if explicitly requested."* TDD is opt-in, not structural. Task lines name a file and an intent but rarely carry the actual code, so an agent still has to infer "how" — which is exactly where execution drifts.

**Superpowers is strong at the build.** Every task is a red-green-refactor cycle with inline test and implementation code, exact commands, and a commit message — a fresh subagent can execute it with zero ambiguity. Its "No Placeholders" rule forbids `TBD`, "add error handling," and "similar to Task N." Subagent-driven dispatch, parallel execution windows, and per-window verification gates make it genuinely built for autonomous agentic execution. But it has no stable requirement-ID namespace, no prioritized user-story/MVP framing, and no coverage matrix — there's no way to *prove* every requirement actually shipped with a passing test behind it.

**The missing link in both is a traceability spine.** Spec Kit has the IDs but no TDD/execution rigor. Superpowers has the execution/TDD rigor but no IDs. SuperSpec's coverage matrix (`FR-### ↔ Task ↔ Test ↔ Verification gate`) is what makes "spec-driven and TDD-driven" a verifiable claim instead of an aspirational one — an `FR` with no covering task, or a task with no passing test, shows up as a gap, not a hope.

So SuperSpec fuses both: Spec Kit's spec layer (product framing, requirement IDs, standalone design artifacts) plus Superpowers' execution layer (mandatory TDD, no-placeholder plans, subagent dispatch, DAG/verification-gate orchestration), held together by a living coverage matrix that neither upstream provides on its own. Every template, skill, and module in this repo is classified against its real source — COPY, ADAPT, REIMPLEMENT, or NEW — in [docs/SOURCES.md](docs/SOURCES.md), so this fusion reuses proven work rather than reinventing it from scratch.

## How it works

When you start a session, SuperSpec's bootstrap skill establishes the lifecycle before your agent writes any code. Describe what you want to build, and your agent doesn't jump straight to an implementation — it steps back into `explore`, asking clarifying questions and shaping the idea through dialogue first. Once the shape is clear, `scope` turns it into a numbered `spec.md`: functional requirements, prioritized user stories, measurable success criteria. Any open question gets marked `[NEEDS CLARIFICATION]` and resolved by `refine` before anyone starts designing.

`architect` translates the spec into `design.md` — architecture, ADR-style decisions, data model, and contracts, reviewable on its own before a line of code exists. `plan` turns the design into `plan.md`: bite-sized tasks, each one a mandatory red-green-refactor cycle with the actual test code, the actual implementation code, the exact command to run, and a real commit message. No placeholders, no "figure it out later." `route` then schedules those tasks into an `execution-map.md` — a dependency DAG, parallel execution windows, model routing (heavy/ambiguous work to a strong model, mechanical work to a fast one), and per-window verification gates.

Once the plan and execution map exist, `forge` takes over and drives the whole thing to completion without stopping to ask "should I continue?" between tasks. It dispatches a fresh implementer subagent per task with zero prior context, runs red-green-refactor for real, then dispatches a fresh reviewer subagent for an independent spec-compliance and code-quality verdict before recording the task done. State persists to disk, so a killed or restarted session resumes exactly where it left off instead of re-deriving progress from memory. A task that fails review repeatedly gets flagged `blocked` and the loop moves on to other independent work rather than spinning forever — "nothing left to try" and "actually done" are never confused with each other.

`validate` then runs the real verification commands — coverage matrix, plan lint, constitution compliance — and confirms the output before anyone is allowed to claim the feature is complete: evidence before assertions, always. `ship` is the terminal stage, gated on a clean validation report, presenting the same merge/PR/keep/discard options you'd expect from finishing any development branch.

**The agent checks the lifecycle before any task — this isn't optional guidance, it's the mandatory entry point every session goes through.**

## The lifecycle

```
explore -> scope -> refine -> architect -> plan -> route -> forge -> validate -> ship
```

| Stage | What it does | Produces |
|---|---|---|
| `explore` | Shapes a raw idea through dialogue before any code | Intent notes, open questions |
| `scope` | Formalizes the idea into a testable spec | `spec.md` — `FR-###` requirements, prioritized user stories, `SC-###` success criteria |
| `refine` | Resolves ambiguity before design starts | Open `[NEEDS CLARIFICATION]` markers answered in `spec.md` |
| `architect` | Designs the technical solution | `design.md` — architecture, decisions, data model, contracts |
| `plan` | Decomposes the design into TDD-executable tasks | `plan.md` — every task a red-green-refactor cycle, no placeholders |
| `route` | Schedules tasks for parallel, model-routed execution | `execution-map.md` — DAG, parallel windows, model routing, persona assignments, verification gates |
| `forge` | Drives every task to done, autonomously | A working, tested implementation — resumable, escalates instead of hanging |
| `validate` | Proves the work is actually complete | Coverage-matrix status, plan-lint results, constitution compliance |
| `ship` | Finishes the branch | Merge, PR, keep, or discard — the terminal stage |

Two principles are fixed and cannot be configured away, because they're what makes a project "SuperSpec-compliant" at all (see [`content/templates/constitution.md`](content/templates/constitution.md)):

- **Test-First (NON-NEGOTIABLE).** Every task is a red-green-refactor cycle. Tests are never optional, never deferred, never added retroactively. This is the direct reversal of Spec Kit's "tests OPTIONAL" default.
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

For SuperSpec's MCP tools specifically — `build-matrix`, `lint-plan`, `route-model`, `scaffold`, `forge-status`, `list-personas` — without installing the full plugin, add this to any project's `.cursor/mcp.json`:

```json
{ "mcpServers": { "superspec": { "command": "npx", "args": ["-y", "@superspec-dev/core", "mcp"] } } }
```

`npx` resolves `@superspec-dev/core` from the npm registry, so this works from any project regardless of whether SuperSpec is checked out there. See [docs/install.md](docs/install.md) for more detail, including the GitHub Copilot install pattern (planned, not yet built).

## What's inside

### Lifecycle skills (`content/skills/`)

One skill per stage, plus the entry-point bootstrap skill every session starts with:

- **`using-superspec`** — the entry point. Establishes the lifecycle before any response, including clarifying questions.
- **`superspec-explore`** — turns a raw idea into a shaped design through dialogue, before any spec exists.
- **`superspec-scope`** — formalizes a shaped idea into `spec.md` (`FR-###`, `SC-###`, prioritized user stories).
- **`superspec-refine`** — resolves `[NEEDS CLARIFICATION]` markers with up to 5 targeted questions.
- **`superspec-architect`** — designs the solution: architecture, decisions, data model, contracts.
- **`superspec-plan`** — writes the TDD-executable plan, every task traced to an `FR-###`.
- **`superspec-route`** — schedules the plan into parallel windows with model routing and verification gates.
- **`superspec-forge`** — the autonomous implementation loop: fresh implementer + reviewer subagents per task, resumable, escalates instead of hanging.
- **`superspec-validate`** — runs the real verification commands before any completion claim is allowed to stand.
- **`superspec-ship`** — the terminal stage: merge, PR, keep, or discard, gated on a clean validation report.

### Subagent bodies (`content/agents/`)

- **`implementer`** — the fresh, zero-context subagent `forge` dispatches per task to run red-green-refactor.
- **`spec-reviewer`** — checks a spec for completeness and testability before design starts.
- **`task-reviewer`** — the independent reviewer `forge` dispatches after each implementation, giving separate spec-compliance and code-quality verdicts.

### The shared engine (`@superspec-dev/core`)

The same deterministic tools, exposed identically as both an MCP server and a CLI, so every supported tool gets the same guidance and the same callable tools — not two independently-behaving copies:

| Tool | Does |
|---|---|
| `build-matrix` | Builds the `FR`-to-task coverage matrix from spec and plan text; reports gaps |
| `lint-plan` | Flags placeholder text and missing red-green-refactor cycles in a plan |
| `route-model` | Recommends a strong or fast model for a task's complexity |
| `scaffold` | Renders the four tier templates into a target directory |
| `forge-status` | Reports `{total, done, blocked, pending, complete}` for a set of plan tasks |
| `list-personas` | Discovers specialized sub-agent personas already defined in a project |

`build-matrix` and `lint-plan` are what turn "spec-driven and TDD-driven" from a vibe into something you can actually check — [docs/acceptance/mcp-parity.md](docs/acceptance/mcp-parity.md) shows both Claude Code and Cursor getting byte-identical output from the same tool call.

### Persona discovery

SuperSpec can discover specialized sub-agent personas already defined in your own project — `.claude/agents/*.md` and `.cursor/agents/*.md`, the same convention both tools already use natively — and route tasks to them by real name during `route`/`forge`. If your project has a `backend-developer` or `code-reviewer` agent already defined, SuperSpec uses it; if it doesn't, `route` falls back to a fixed generic role list (`@backend`, `@frontend`, `@qa`, `@tech-lead`, `@security`, `@performance`) with zero regression either way.

### Render/sync tooling (`@superspec-dev/render`)

Skills are authored once, in `content/skills/`, in platform-neutral prose. `@superspec-dev/render` renders that single source into each tool's own file layout (`skills/` for Claude Code, `.cursor/skills/` for Cursor) — editing one skill and re-running `node packages/render/dist/cli.js` propagates the change everywhere. [docs/acceptance/render-fidelity.md](docs/acceptance/render-fidelity.md) shows this working end to end on a real edit.

## Using SuperSpec on your own project

Install SuperSpec once (`./scripts/install.sh` for Claude Code, `/add-plugin superspec` for Cursor — see [Install](#install) above), then open your own project — not this repo — in that tool. The installed plugin's skills, subagents, and MCP tools follow you into any project automatically.

Once set up in either tool:

1. Say what you want to build. The bootstrap skill takes over from there: `explore` first, then `scope`, `refine`, `architect`, `plan`, `route`, `forge`, `validate`, `ship`, in order, with the state and evidence living in your project the whole way (`spec.md`, `design.md`, `plan.md`, `execution-map.md`, `coverage-matrix.md`, plus `.superspec/state.json` for the forge loop's resumable progress).
2. If your project already has `.claude/agents/` or `.cursor/agents/` defined, `route`/`forge` will discover and use them automatically — no extra configuration.

[`examples/url-shortener/`](examples/url-shortener/) is a small, complete worked example — a real 4-requirement feature driven through every stage, with a real TDD-built implementation and a real autonomous `forge` run (drive to completion, resume after a killed session, escalate a permanently-failing task — see [docs/acceptance/forge-loop.md](docs/acceptance/forge-loop.md)) — worth reading end to end before trying SuperSpec on something of your own.

## Philosophy

- **TDD is mandatory, not optional.** The direct reversal of Spec Kit's "tests OPTIONAL" default — every task is a red-green-refactor cycle, enforced by a linter, not just a convention to remember.
- **Traceability by ID, not by hope.** Every requirement maps to a task and a passing test, checked by a real coverage-matrix tool, not eyeballed.
- **Evidence before assertions.** `validate` runs the actual verification commands and confirms real output before any "done" claim is allowed to stand.
- **Advise-only, always.** SuperSpec reports and recommends; it never force-blocks a commit or a pipeline. You stay in control of what happens next.
- **Fresh context per task.** Every implementer and reviewer subagent starts with zero prior conversation history — exactly what the task needs, nothing inherited, nothing polluted.
- **One source, every tool.** Skills and tools are authored once and rendered/exposed identically everywhere, so switching tools never means switching methodology.

## Build

```bash
npm install
npx tsc -b packages/core packages/render
npx vitest run
```

## Provenance

SuperSpec reuses both upstream projects' permissively-licensed (MIT) work rather than reinventing it. Every template, skill, and module is classified as COPY, ADAPT, REIMPLEMENT, or NEW against its real source in [docs/SOURCES.md](docs/SOURCES.md) — the canonical copy-map for this project. See [NOTICE](NOTICE) for attribution.

## License

MIT License — see [LICENSE](LICENSE) for details.
