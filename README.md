# SuperSpec

Spec-driven + TDD-driven AI development for Claude Code and Cursor. SuperSpec fuses [GitHub Spec Kit](https://github.com/github/spec-kit)'s spec-driven development (stable requirement IDs, prioritized user stories, a coverage matrix) with [Superpowers](https://github.com/obra/superpowers)' execution discipline (mandatory TDD, executable no-placeholder plans, fresh-subagent-per-task orchestration) into one plugin, driven by a single shared core so every supported tool gets identical guidance and identical callable tools.

GitHub Copilot support is planned for a future release (see [Adding GitHub Copilot](docs/install.md#adding-github-copilot-future) in the install guide) — this repository currently ships Claude Code and Cursor only.

## The lifecycle

SuperSpec drives one methodology through nine stages, each a skill invocable in either supported tool:

```
explore -> scope -> refine -> architect -> plan -> route -> forge -> validate -> ship
```

| Stage | Produces |
|---|---|
| `explore` | Intent notes, open questions |
| `scope` | `spec.md` — functional requirements (`FR-###`), prioritized user stories, success criteria (`SC-###`) |
| `refine` | Resolved ambiguities in the spec |
| `architect` | `design.md` — architecture, decisions, data model, contracts |
| `plan` | `plan.md` — tasks, each a mandatory red-green-refactor cycle, no placeholders |
| `route` | `execution-map.md` — parallel windows, model routing, persona assignments, verification gates |
| `forge` | Autonomous implementation: drives every task to done via fresh implementer + reviewer subagents, resumable across sessions, escalates (not hangs) on a permanently-failing task |
| `validate` | Coverage-matrix status, spec-quality review, verification-gate results |
| `ship` | Finish the branch: merge, PR, keep, or discard |

Two principles are fixed, not configurable: **TDD is mandatory** (every task is a red-green-refactor cycle; the plan linter flags any that isn't), and every task traces back to a requirement via a living coverage matrix (`FR ↔ Task ↔ Test ↔ Gate`).

SuperSpec can also discover specialized sub-agent personas already defined in your own project (`.claude/agents/*.md` / `.cursor/agents/*.md`, the same convention both tools already use natively) and route tasks to them by name during `route`/`forge`, falling back to a generic role list when none are found.

## Install

**Claude Code:**
```bash
./scripts/install.sh
```

**Cursor:** no command needed — open this repository as a workspace folder and Cursor auto-discovers `.cursor/skills/`, `.cursor/rules/`, and `.cursor/mcp.json`.

Full details, including the manual commands the install script wraps and the Copilot-later plan, are in [docs/install.md](docs/install.md).

## How it works

One shared source (`content/`) is rendered into each tool's own file layout by `@superspec/render`, so editing a skill once propagates everywhere (`node packages/render/dist/cli.js`). One shared core (`@superspec/core`) exposes the same deterministic tools — `build-matrix`, `lint-plan`, `route-model`, `scaffold`, `forge-status`, `list-personas` — as both an MCP server (wired into each tool's own MCP config) and a CLI, so the same guidance and the same callable tools are available in every supported tool. See [docs/acceptance/mcp-parity.md](docs/acceptance/mcp-parity.md) for evidence both tools get byte-identical tool output, and [docs/acceptance/render-fidelity.md](docs/acceptance/render-fidelity.md) for evidence a single-source edit propagates to both.

Enforcement is advise-only throughout: SuperSpec generates, validates, and reports — it never hard-blocks a commit or CI run.

## Build

```bash
npm install
npx tsc -b packages/core packages/render
npx vitest run
```

## Worked example

[`examples/url-shortener/`](examples/url-shortener/) is a small feature (4 functional requirements) driven through the full lifecycle — `spec.md`, `design.md`, `plan.md`, `execution-map.md`, `coverage-matrix.md` — with a real, reviewed, TDD-built implementation under `examples/url-shortener/src/` and `test/`, and a real autonomous-forge-loop run (drive to completion, resume after a killed session, escalate a permanently-failing task) documented in [docs/acceptance/forge-loop.md](docs/acceptance/forge-loop.md).

## Provenance

SuperSpec reuses both upstream projects' permissively-licensed (MIT) work rather than reinventing it. Every template, skill, and module is classified as COPY, ADAPT, REIMPLEMENT, or NEW against its source in [docs/SOURCES.md](docs/SOURCES.md) — the canonical copy-map for this project. See [NOTICE](NOTICE) for attribution.
