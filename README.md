# SuperSpec

**Spec-driven + TDD-driven development for AI coding agents.**

SuperSpec fuses [GitHub Spec Kit](https://github.com/github/spec-kit)'s traceable specs (`FR-###`, user stories, `SC-###`) with [Superpowers](https://github.com/obra/superpowers)' mandatory TDD execution (red-green-refactor tasks, subagent dispatch, verification gates). One plugin, one shared engine — identical skills and tools in Claude Code and Cursor.

---

## Table of contents

- [Why SuperSpec](#why-superspec)
- [Quick start](#quick-start)
- [Usage guide](#usage-guide)
- [Lifecycle](#lifecycle)
- [Verification tools](#verification-tools)
- [Install](#install)
- [What's in the repo](#whats-in-the-repo)
- [Developing SuperSpec](#developing-superspec)
- [Philosophy](#philosophy)
- [Provenance & license](#provenance--license)

---

## Why SuperSpec

### The problem

AI agents are good at writing code quickly. They are bad at knowing **what** to build, **when** they are done, and **whether** every requirement actually shipped with a test behind it.

Two open-source projects each solve half of that:

| | [Spec Kit](https://github.com/github/spec-kit) | [Superpowers](https://github.com/obra/superpowers) |
|---|-----|------------|
| **Strength** | Spec-driven development (SDD) | Test-driven development (TDD) + agent execution |
| **Weakness** | Tests are optional in its task template | No stable requirement IDs or coverage proof |

SuperSpec exists to fuse both halves into one plugin with a **traceability spine**: `FR-### ↔ Task ↔ Test ↔ Verification gate`.

### What spec-driven development (SDD) gives you

SDD means the spec is the contract — not a document you write once and forget.

- **Stable IDs** (`FR-###`, `SC-###`) — every requirement and success criterion is addressable in plans, PRs, and reviews
- **Prioritized user stories** — Given/When/Then acceptance scenarios define MVP scope before code
- **Standalone design artifacts** — architecture, decisions, data model, and contracts reviewed before implementation
- **Stakeholder traceability** — you can point to exactly which FR a task implements and prove it shipped

*Spec Kit brings this layer. SuperSpec keeps it.*

### What test-driven development (TDD) gives you

TDD means tests are written first and drive implementation — not added as an afterthought.

- **Red-green-refactor per task** — failing test first, minimal implementation, then refactor
- **No placeholders** — plans carry actual test code, implementation code, run commands, and commit messages
- **Agent-executable tasks** — a fresh subagent can run a task with zero ambiguity about what "done" means
- **Regression safety** — every behavior change starts with a test that captures intent

*Superpowers brings this layer. SuperSpec makes it mandatory for code tasks.*

### Why combine them

Neither SDD nor TDD alone is enough for agentic development:

```
SDD alone  →  you know WHAT to build, but execution drifts (tests optional, tasks vague)
TDD alone  →  you know HOW to build each step, but lose traceability (no FR IDs, no matrix)
Both       →  every requirement maps to a task, every task has proof, gaps are machine-checkable
```

SuperSpec's **coverage matrix** is the binding link. An `FR` with no covering task, or a task with no passing test, shows up as a gap — not a hope.

### How SuperSpec covers the full dev cycle

| Phase | What happens | Skill | Artifact | Verified by |
|-------|--------------|-------|----------|-------------|
| **Bootstrap** | Adopt SuperSpec in a repo | `init` | `constitution.md`, templates | — |
| **Discover** | Shape a greenfield idea | `explore` | Intent notes | — |
| **Intake** | Extract brownfield requirements | `ingest` | draft FRs, `sources.lock` | — |
| **Specify** | Formalize requirements | `scope` | `spec.md` | `lint-spec` |
| **Clarify** | Resolve open questions | `refine` | updated `spec.md` | `lint-spec` |
| **Design** | Technical solution | `architect` | `design.md` | `lint-design` |
| **Plan** | TDD-executable tasks | `plan` | `plan.md` | `lint-plan` |
| **Schedule** | Parallel windows + routing | `route` | `execution-map.md` | — |
| **Implement** | Autonomous task loop | `forge` | working code + tests | tests + reviewer |
| **Prove** | Evidence before "done" | `validate` | lint + matrix report | all lint gates + matrix |
| **Deliver** | Merge, PR, or discard | `ship` | merged branch / PR | clean validation |
| **Fix** (shortcut) | Small bug, no full spec | `fix` | regression test + patch | test suite |
| **Coordinate** (full mode) | Multi-spec backlog | `program` / `status` | `program.md` | `forge-status` |

One plugin. One lifecycle. Skills guide the agent through each phase; `@superspec-dev/core` tools verify the artifacts.

---

## Quick start

### 1. Install the plugin

**Cursor** — in Agent chat:

```
/add-plugin superspec
```

Or by URL: `/add-plugin https://github.com/anupam20sep/superspec`

**Claude Code:**

```bash
git clone https://github.com/anupam20sep/superspec.git
cd superspec && ./scripts/install.sh
```

### 2. Bootstrap your repo (once)

Open your project and tell the agent:

> Initialize SuperSpec in this repo.

This runs **`superspec-init`** — scaffolds templates, writes `constitution.md`, and optionally `program.md` (full mode).

### 3. Start building

| You have… | Say to the agent… |
|-----------|-------------------|
| A new idea | "Let's explore and build …" |
| Existing docs or code | "Ingest requirements from …" |
| A small bug | "Fix this bug: …" |

The **`using-superspec`** skill routes to the right lane. You don't memorize the lifecycle — the agent does.

### MCP tools — optional, but recommended

**Skills and MCP tools are two different layers:**

| Layer | What it is | Installed by `/add-plugin`? |
|-------|------------|----------------------------|
| **Skills** | Markdown instructions — *when* to explore, scope, plan, forge, validate | **Yes** |
| **MCP tools** | Node.js executables — *deterministic* lint, matrix, forge-state checks | **No** (npm via `npx`) |

**Why they're separate:** the plugin ships from **GitHub** (skills + hooks). The engine ships from **npm** (compiled TypeScript). Cursor's plugin format doesn't bundle npm packages — same pattern as [Superpowers](https://github.com/obra/superpowers), which also ships skills via git and leaves tooling to the environment.

**Why MCP is optional:** you don't need it to use SuperSpec. Skills tell the agent the full lifecycle; during `validate`, the agent can run the same checks in the terminal:

```bash
npx @superspec-dev/core lint --spec spec.md
npx @superspec-dev/core matrix --spec spec.md --plan plan.md
```

**Why you'd still add MCP:** native tool calls return structured JSON the agent can trust without parsing shell output; faster iteration during `validate` and `forge`; byte-identical behavior across Claude Code and Cursor. One-time setup in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "superspec": {
      "command": "npx",
      "args": ["-y", "@superspec-dev/core", "mcp"]
    }
  }
}
```

`npx` downloads `@superspec-dev/core` from npm on first use — no `npm install` in your project.

---

## Usage guide

### First-time setup (per repository)

1. **`superspec-init`** — choose **lite** (single spec) or **full** (multi-spec + `program.md`).
2. **MCP** (optional) — add the config above if you want tools beyond skills.
3. **Custom agents** (optional) — if you already have `.cursor/agents/` or `.claude/agents/`, `route` and `forge` discover them automatically.

### Pick your lane

```
┌─────────────────────────────────────────────────────────────┐
│  NEW FEATURE (greenfield)    explore → scope → refine → …   │
│  NEW FEATURE (brownfield)    ingest → scope → refine → …    │
│  BUG FIX                     fix → validate → ship            │
│  MULTI-SPEC COORDINATION     program / status (full mode)   │
└─────────────────────────────────────────────────────────────┘
```

**Full feature path** (after explore or ingest):

```
scope → refine → architect → plan → [worktree] → route → forge → validate → ship
```

### What gets created in your project

| Artifact | Created by | Purpose |
|----------|------------|---------|
| `constitution.md` | `init` | Governance — Test-First + traceability rules |
| `spec.md` | `scope` | Requirements (`FR-###`), Type, success criteria |
| `design.md` | `architect` | Architecture, decisions, contracts |
| `plan.md` | `plan` | Executable tasks with **Kind** tags |
| `execution-map.md` | `route` | DAG, parallel windows, model routing |
| `sources.lock` | `ingest` | Provenance for brownfield requirements |
| `program.md` | `init` (full mode) | Multi-spec backlog |
| `.superspec/state.json` | `forge` | Resumable task progress (gitignored) |

### Key concepts

**Spec Type** (`product` | `platform` | `infra` | `migration` | `spike`) — set in `spec.md`; drives done-definition.

**Task Kind** (`code` | `verify` | `provision` | `signoff` | `doc-sync`) — set per task in `plan.md`:
- **`code`** → mandatory red-green-refactor (test code + impl code + command + commit message)
- **Other kinds** → type-appropriate proof, not TDD cycles

**Coverage matrix** — every `FR-###` must map to at least one task; gaps are reported, not guessed.

### Worked example

[`examples/url-shortener/`](examples/url-shortener/) — a complete 4-requirement feature with real TDD implementation.

Validate it from the repo root:

```bash
npm run build
npm run dogfood:url-shortener
```

---

## Lifecycle

### Flow diagram

```
init (once per repo)
  │
  ├─ fix ──────────────────────────────► validate → ship
  │
  ├─ ingest (brownfield) ─┐
  └─ explore (greenfield) ┴─► scope → refine → architect → plan
                                                    │
                                            [worktree] (optional)
                                                    │
                                                  route → forge → validate → ship

program + status  ← ongoing coordination (full mode)
```

### Skills reference

| Skill | When to use |
|-------|-------------|
| `using-superspec` | Every session — routes to the right skill |
| `superspec-init` | Once per repo bootstrap |
| `superspec-ingest` | Brownfield — extract FRs from docs or code |
| `superspec-explore` | Greenfield — shape an idea through dialogue |
| `superspec-scope` | Write formal `spec.md` |
| `superspec-refine` | Resolve `[NEEDS CLARIFICATION]` markers |
| `superspec-architect` | Write `design.md` |
| `superspec-plan` | Write TDD-executable `plan.md` |
| `superspec-route` | Build `execution-map.md` |
| `superspec-worktree` | Isolate plan/forge on a feature branch |
| `superspec-forge` | Autonomous implementation loop |
| `superspec-validate` | Run verification before claiming done |
| `superspec-ship` | Merge, PR, keep, or discard |
| `superspec-fix` | Small bugs — skip full lifecycle |
| `superspec-program` | Maintain multi-spec backlog (full mode) |
| `superspec-status` | Consolidated status across specs |

### Non-negotiable principles

From [`content/templates/constitution.md`](content/templates/constitution.md):

1. **Test-First for code tasks** — every **Kind: code** task is red-green-refactor. No optional tests.
2. **Traceability spine** — every `FR-###` maps to a task and a passing test. The matrix must be complete.

Everything else (simplicity, observability, versioning) is customizable per project.

> SuperSpec **advises** — it lints, validates, and reports. It never hard-blocks a commit or CI run.

---

## Verification tools

`@superspec-dev/core` exposes the same tools as MCP and CLI.

### Lint gates

```bash
npx @superspec-dev/core lint --spec path/to/spec.md
npx @superspec-dev/core lint --design path/to/design.md --specs-root .
npx @superspec-dev/core lint --plan path/to/plan.md
```

Empty JSON array `[]` = pass.

### Coverage matrix

```bash
npx @superspec-dev/core matrix --spec spec.md --plan plan.md
```

### Forge state

Persists to `<spec-dir>/.superspec/state.json`:

```bash
npx @superspec-dev/core next-task     --plan plan.md --dir specs/001-feature
npx @superspec-dev/core record-result --plan plan.md --dir specs/001-feature --task T001 --passed true
npx @superspec-dev/core forge-status  --plan plan.md --dir specs/001-feature
```

### All tools

| MCP tool | CLI | Purpose |
|----------|-----|---------|
| `build-matrix` | `matrix` | FR-to-task coverage; reports gaps |
| `lint-spec` | `lint --spec` | Type, FR/SC completeness, placeholders |
| `lint-plan` | `lint --plan` | Placeholders; TDD rules for code tasks |
| `lint-design` | `lint --design` | Decisions, contracts, clarification markers |
| `route-model` | — | Recommend strong vs fast model |
| `scaffold` | `scaffold` | Render tier templates |
| `next-task` | `next-task` | Next DAG-ready forge task |
| `record-result` | `record-result` | Record task pass/fail |
| `forge-status` | `forge-status` | `{total, done, blocked, pending, complete}` |
| `list-personas` | — | Discover project agent personas |

Start MCP server: `npx @superspec-dev/core mcp`

---

## Install

### What `/add-plugin` installs vs npm packages

Installing from GitHub (`/add-plugin superspec` or `/add-plugin https://github.com/anupam20sep/superspec`) pulls the **plugin bundle** — not npm packages.

| Component | Installed by `/add-plugin`? | How you get it |
|-----------|----------------------------|----------------|
| **Skills** (`skills/`) | **Yes** | Bundled in the plugin from GitHub |
| **Hooks** (`hooks/hooks-cursor.json`) | **Yes** | Bundled in the plugin |
| **`@superspec-dev/core`** (MCP + CLI) | **No** | `npx` downloads from npm on first use — see MCP config below |
| **`@superspec-dev/render`** | **No** | Maintainer tool only — you never need this to use SuperSpec |

**In practice:**

1. **`/add-plugin`** → agent gets lifecycle skills immediately. No `npm install` in your project.
2. **MCP tools** (recommended) → add `.cursor/mcp.json` once per project. See [Why MCP is optional](#mcp-tools--optional-but-recommended) above.
3. **Without MCP** → skills still work. The agent runs the same `npx @superspec-dev/core …` commands in the terminal when `validate` or other skills require verification.

`@superspec-dev/render` is only for SuperSpec maintainers who edit `content/skills/` and run `npm run render`. End users and marketplace installs never need it.

```
/add-plugin superspec          skills + hooks  (from GitHub)
        │
        ├─► Agent follows superspec-* skills in any project
        │
        └─► Optional: .cursor/mcp.json
                    │
                    └─► npx @superspec-dev/core mcp   (from npm, on first MCP start)
```

### Claude Code

```bash
git clone https://github.com/anupam20sep/superspec.git
cd superspec
./scripts/install.sh
```

Manual equivalent:

```bash
claude plugin marketplace add /path/to/superspec
claude plugin install superspec@superspec-dev
```

### Cursor

```
/add-plugin superspec
```

Skills ship from `./skills/` in the plugin repo (same layout as [obra/superpowers](https://github.com/obra/superpowers)). No `.cursor/` folder needed in your project for skills.

### MCP only (no full plugin)

Add to `.cursor/mcp.json` in any project:

```json
{ "mcpServers": { "superspec": { "command": "npx", "args": ["-y", "@superspec-dev/core", "mcp"] } } }
```

See [docs/install.md](docs/install.md) for details. GitHub Copilot support is planned.

---

## What's in the repo

```
content/skills/     ← canonical skill source (edit here)
content/templates/  ← spec, plan, design, constitution templates
content/agents/     ← subagent prompt bodies (implementer, reviewers)
skills/             ← rendered output (Claude + Cursor plugin consume this)
agents/             ← Claude Code agent files (with frontmatter)
packages/core/      ← @superspec-dev/core (MCP + CLI)
packages/render/    ← @superspec-dev/render (skill renderer)
examples/           ← worked examples (url-shortener)
```

**Skill workflow:** edit `content/skills/` → `npm run render` → commit `skills/` → push.

**Publishing:**
- **Skills / Cursor marketplace** → git push (`skills/` in repo)
- **MCP/CLI tools** → `npm publish` for `@superspec-dev/core`
- **Render CLI** → `npm publish` for `@superspec-dev/render`

---

## Developing SuperSpec

```bash
npm install
npm run build              # compile packages/core + packages/render
npm run render             # content/skills → skills/
npm test                   # full test suite
npm run dogfood:url-shortener   # validation ladder on worked example
```

---

## Philosophy

- **TDD for code tasks** — enforced by `lint-plan`, not convention.
- **Proportionality** — full lifecycle for features; `fix` for bugs; `ingest` for brownfield.
- **Traceability by ID** — coverage matrix, not hope.
- **Evidence before assertions** — `validate` runs real commands before "done."
- **Advise-only** — report gaps; you decide what to do.
- **Fresh context per task** — one implementer + one reviewer per forge task.
- **One source, every tool** — skills authored once, rendered to `skills/`.

---

## Provenance & license

SuperSpec reuses MIT-licensed work from Spec Kit and Superpowers. Every module is classified COPY / ADAPT / REIMPLEMENT / NEW in [docs/SOURCES.md](docs/SOURCES.md). See [NOTICE](NOTICE).

MIT License — [LICENSE](LICENSE).
