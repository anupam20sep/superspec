# SuperSpec — Sources & Copy-Map (canonical provenance)

**Purpose:** the single reference for *what we copy vs. what we write new*, so no plan reinvents
something that already exists upstream. Every implementation plan cites this file. Both upstreams
are MIT-licensed; adapted text stays MIT and is credited in `/NOTICE`.

## The governing rule (lean-audit test)

> **Write code only for things a capable model following a prompt would do unreliably or cannot do
> at all** — deterministic math, mechanical lint, cross-session state. **Everything a model can do
> by following instructions stays a prompt** (copied/adapted from upstream), not new code.

Consequence of the rule, applied to the two sources:

- **Superpowers is a prompt library.** Reuse = **copy & adapt its markdown prose almost verbatim**
  (skills). It has almost no reusable code (just ~120-line adapter shims).
- **Spec Kit is a Python CLI.** Its markdown (templates + command prompts) we **copy & adapt
  directly**; its Python code logic we **cannot** drop into a TS plugin, so we **reverse-engineer
  the design and reimplement** (only the registry/render layer).

Copy strategies used in the tables below:
- **COPY** — take the text nearly verbatim, adjust names only.
- **ADAPT** — restructure/merge upstream text to SuperSpec's shape; still text, not new invention.
- **REIMPLEMENT** — port the *approach* to TypeScript (upstream is Python); design is copied, code is new.
- **NEW** — neither project has this; genuinely new code, justified by the lean-audit rule.

Upstream refs (both `main` branch):
- Superpowers → `https://github.com/obra/superpowers` (files under `SP:` below)
- Spec Kit → `https://github.com/github/spec-kit` (files under `SK:` below)

---

## Content layer (prompts / templates / skills) — mostly COPY/ADAPT

Authored in Plan #2 (shared content layer). **This is where the bulk of the value is copied.**

| SuperSpec artifact | Upstream source | Strategy |
|---|---|---|
| `content/skills/using-superspec/SKILL.md` (entry/bootstrap) | `SP: skills/using-superpowers/SKILL.md` | ADAPT |
| `content/skills/superspec-explore/SKILL.md` | `SP: skills/brainstorming/SKILL.md` | COPY |
| `content/skills/superspec-plan/SKILL.md` | `SP: skills/writing-plans/SKILL.md` (+ `plan-document-reviewer-prompt.md`) | COPY |
| `content/skills/superspec-forge/SKILL.md` | `SP: skills/subagent-driven-development/SKILL.md` (+ `implementer-prompt.md`, `task-reviewer-prompt.md`) and `skills/executing-plans/SKILL.md` | COPY/ADAPT |
| TDD discipline referenced by forge/plan | `SP: skills/test-driven-development/SKILL.md` (+ `testing-anti-patterns.md`) | COPY |
| `content/skills/superspec-validate/SKILL.md` | `SP: skills/verification-before-completion/SKILL.md` + `SK: templates/commands/analyze.md` | ADAPT (merge) |
| `content/skills/superspec-ship/SKILL.md` (9th/terminal stage: merge/PR/keep/discard, gated on a clean superspec-validate report) | `SP: skills/finishing-a-development-branch/SKILL.md` | ADAPT |
| Parallel dispatch guidance in forge | `SP: skills/dispatching-parallel-agents/SKILL.md` | COPY |
| Internal code-review loop prose (forge step 4) | `SP: skills/requesting-code-review/SKILL.md` (+ `code-reviewer.md`), `skills/receiving-code-review/SKILL.md` | COPY |
| `content/skills/superspec-scope/SKILL.md` | `SK: templates/commands/specify.md` + `templates/spec-template.md` | ADAPT |
| `content/skills/superspec-refine/SKILL.md` | `SK: templates/commands/clarify.md` | COPY |
| `content/skills/superspec-architect/SKILL.md` | `SK: templates/commands/plan.md` + `plan-template.md` (merge research/data-model/contracts) | ADAPT |
| `content/skills/superspec-route/SKILL.md` | `SP: skills/dispatching-parallel-agents/SKILL.md` + SuperSpec execution-map idea | ADAPT + NEW |
| `content/templates/spec-template.md` | `SK: templates/spec-template.md` | COPY |
| `content/templates/plan-template.md` | `SK: templates/tasks-template.md` structure + `SP: writing-plans` task shape | ADAPT (fuse) |
| `content/templates/design-template.md` | `SK: templates/plan-template.md` (+ its research/data-model/contracts sections) | ADAPT |
| `content/templates/execution-map-template.md` | SuperSpec (DAG + model routing) informed by `SP: dispatching-parallel-agents` | NEW + ADAPT |
| `content/templates/coverage-matrix-template.md` | **neither** | NEW |
| `content/templates/constitution.md` | `SK: templates/constitution-template.md` + `.specify/memory/constitution.md` — but with mandatory-TDD & traceability as **fixed** principles (not blank slots) | ADAPT |
| `content/agents/{spec-reviewer,implementer,task-reviewer}.md` | `SP: skills/subagent-driven-development/{implementer-prompt.md,task-reviewer-prompt.md}`, `requesting-code-review/code-reviewer.md` | COPY/ADAPT |
| `content/skills/references/{claude-code,cursor,copilot}-tools.md` | `SP: skills/using-superpowers/references/{codex,pi,antigravity}-tools.md` (pattern) | ADAPT |

**Platform-neutral prose rules** to apply while copying: `SP: docs/superpowers/specs/2026-05-05-platform-neutral-prose-design.md` and `.../2026-05-05-platform-neutral-config-refs-design.md`.

---

## Adapters (Plans #3–#5) — COPY manifests/patterns

| SuperSpec artifact | Upstream source | Strategy |
|---|---|---|
| `.claude-plugin/plugin.json` | `SP: .claude-plugin/plugin.json` | COPY (rename) |
| `.cursor-plugin/plugin.json` | `SP: .cursor-plugin/plugin.json` | COPY (rename) |
| `hooks/hooks.json` (Claude SessionStart bootstrap) | `SP: hooks/hooks.json` | ADAPT |
| `hooks/hooks-cursor.json` | `SP: hooks/hooks-cursor.json` (+ `hooks/run-hook.cmd`, `hooks/session-start`) | ADAPT |
| Bootstrap-injection method (all adapters) | `SP: docs/porting-to-a-new-harness.md`; shims `.opencode/plugins/superpowers.js`, `.pi/extensions/superpowers.ts` | REIMPLEMENT (pattern) |
| Copilot: `.github/prompts/*.prompt.md`, `.github/agents/*.agent.md` layout | `SK: src/specify_cli/integrations/` Copilot target (confirmed output shape) | REIMPLEMENT (pattern) |
| `AGENTS.md` (generic fallback) | `SP: AGENTS.md` | ADAPT |
| Copilot acceptance test (fresh session auto-triggers a stage) | `SP: docs/porting-to-a-new-harness.md` "definition of done" | COPY (method) |

---

## Render / sync tooling (Plan #6) — REIMPLEMENT the Spec Kit registry

| SuperSpec artifact | Upstream source | Strategy |
|---|---|---|
| `packages/render/src/targets.ts` (`INTEGRATION_REGISTRY`, `claudeTarget`/`cursorTarget`; scoped to Claude+Cursor, `copilotTarget` deferred) | `SK: src/specify_cli/integrations/_commands.py`, `_scaffold_commands.py`, `_install_commands.py` (declarative per-target `{dir, format, args-token, extension}`) | REIMPLEMENT (Python→TS) |
| `packages/render/src/skill-reader.ts` (SKILL.md → `{name, frontmatter, body}`) + `packages/render/src/render.ts` (walk `content/skills/`, apply target, write) + `packages/render/src/cli.ts` (`superspec-render` entrypoint) | `SK: IntegrationBase.process_template()` + format base classes (`MarkdownIntegration`/`TomlIntegration`/`SkillsIntegration`) | REIMPLEMENT |
| Installed-file manifest (safe re-render) | `SK: src/specify_cli/.../manifest.py` (SHA-256 tracking) | REIMPLEMENT (optional, not built — retrofit no-op-diff check serves the same safety purpose today) |

---

## Install mechanism (Plan #6b) — local marketplace + install script

| SuperSpec artifact | Upstream source | Strategy |
|---|---|---|
| `.claude-plugin/marketplace.json` (local/internal marketplace manifest) | `SP: .claude-plugin/marketplace.json` (real schema: `name`, `description`, `owner`, `plugins[]`) | ADAPT |
| `scripts/install.sh` (idempotent Claude Code marketplace registration + install; documents Cursor's no-install auto-discovery and Copilot's future file-based install) | none — Superpowers relies on manual `/plugin install` against a public marketplace; SuperSpec's local/private marketplace needs one extra one-time registration step a script can automate | NEW |
| `docs/install.md` (human-readable install instructions per tool) | none | NEW |

---

## Public npm distribution (Plan #8) — reverses the internal-only decision

Plan #6b shipped a *local/internal* marketplace; Plan #8 adds the public-distribution path the project owner decided to pursue after finding a real gap in it (Cursor has no cross-project install mechanism, and both marketplaces copy plugin files into a managed cache that a self-referencing repo path can't reliably reach).

| SuperSpec artifact | Upstream source | Strategy |
|---|---|---|
| `packages/core/src/cli.ts`'s `mcp` subcommand | ADAPT of the existing `runCli`/`runCliInner` dispatcher already in this file (Plan #1) | ADAPT |
| `npx <published-package> mcp`-style invocation pattern | REUSE — observed directly in a real, working Cursor Marketplace plugin (`shadcn`, inspected via `~/.cursor/plugins/cache/`), which invokes its bundled MCP server as `{"command": "npx", "args": ["shadcn@latest", "mcp"]}` rather than a self-referencing install path; not invented | REUSE (pattern) |
| `docs/PUBLISHING.md` (maintainer runbook for npm publish + marketplace submission) | none | NEW |

---

## Core engine (Plan #1) — mostly NEW (the deterministic verification spine)

Plan #1 is the **code half**: it builds only what the lean-audit says *must* be code. There is
little to copy here — that is expected and correct.

| `@superspec-dev/core` module | Source | Strategy | Why code, not a prompt |
|---|---|---|---|
| `spec-parser.ts`, `plan-parser.ts` | neither (SK parses in Python) | NEW (minimal regex glue) | Deterministic, repeatable inputs to the matrix; ~30 lines each |
| `matrix.ts` (FR↔Task↔Test↔Gate) | **neither project has it** | NEW | The "missing link" that makes SDD+TDD *verifiable*; a model eyeballing coverage is exactly the unreliable thing we remove |
| `plan-lint.ts` (No-Placeholder + TDD-cycle) | rule text from `SP: writing-plans` "No Placeholders" & `SP: test-driven-development` | NEW code enforcing COPIED rules | Superpowers enforces these by *prose + human reviewer*; code makes it a deterministic, always-on check |
| `model-router.ts` | neither (routing decision) | NEW (trivial) | The deterministic hook forge uses to pick strong vs. fast model |
| `forge-loop.ts` (state, selection, persist, escalate) | dispatch *approach* from `SP: subagent-driven-development` / `executing-plans` | NEW code, COPIED approach | Resumability across sessions and "don't hang on a stuck task" require persisted deterministic state — prose can't guarantee it |
| `scaffold.ts` | `SK` renders templates in code | REIMPLEMENT (trivial) | Deterministic file generation |
| `mcp-server.ts` | `@modelcontextprotocol/sdk` v1.x — `registerTool` API confirmed via Context7 (`/modelcontextprotocol/typescript-sdk` v1.x) | COPY SDK usage | Thin transport adapter, no business logic |
| `cli.ts` | Node `node:util` `parseArgs`; error-handling pattern COPY from `SK: src/specify_cli/commands/init.py` (wrap risky operation in try/except, report failure through the same success-path channel, continue — never let the CLI crash on bad input) | NEW (thin) + COPY (error pattern) | Thin transport adapter, no business logic; advise-only constraint requires every path to degrade gracefully, which is exactly Spec Kit's established CLI convention |
| `persona-discovery.ts` (Plan #7a) | discovery convention REUSE (Claude Code's/Cursor's own native `name`/`description` agent-frontmatter convention, being read not invented); frontmatter parsing REUSE `@superspec-dev/render`'s `skill-reader.ts` (`readSkill`/`frontmatterField`) via a new `@superspec-dev/render` workspace dependency | NEW (discovery/dedup logic) + REUSE (parser, convention) | Deterministic, testable discovery of user-defined personas in a target project — no code existed for this in either upstream |

**Lean-audit verdict for Plan #1:** nothing to cut — every module is the irreducible deterministic
spine. The copy-heavy work lives in Plans #2 (content) and #6 (render); this plan deliberately
contains the minimum new code the guarantees require.
