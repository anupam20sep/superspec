# SuperSpec documentation

Documentation is organised into four quadrants: **tutorials** help you learn by doing, **how-to guides** solve specific tasks, **reference** states authoritative facts, and **explanation** explores concepts and design decisions.

---

## Tutorials

- [Your first feature](tutorials/your-first-feature.md) — install the plugin, init a repo, scope a spec, and forge one task end-to-end
- [Onboarding an existing codebase](tutorials/onboarding-existing-codebase.md) — brownfield intake with `ingest`, then the full lifecycle

---

## How-to guides

- [Install on your runtime](how-to/install-on-your-runtime.md) — Claude Code, Cursor, Codex, and MCP-only setup
- [Run the forge loop](how-to/run-the-forge-loop.md) — per-task implement → review → record cycle with persisted state
- [Dispatch on Claude Code](how-to/dispatch-on-claude-code.md) — `Agent` tool, `implementer` + `task-reviewer` agents
- [Dispatch on Cursor](how-to/dispatch-on-cursor.md) — `Task` tool, `implementer` + `task-reviewer` agents
- [Dispatch on Codex](how-to/dispatch-on-codex.md) — multi-agent spawn, `implementer` + `task-reviewer` prompts
- [Track forge progress](how-to/track-forge-progress.md) — `status.md`, `state.json`, TodoWrite, and resume after compaction
- [Route parallel execution](how-to/route-parallel-execution.md) — execution windows, model routing, personas
- [Validate before ship](how-to/validate-before-ship.md) — lint gates, coverage matrix, evidence commands

---

## Reference

- [CLI and MCP tools](reference/cli-and-mcp-tools.md) — every `@superspec-dev/core` command and MCP tool
- [Forge state and status](reference/forge-state.md) — `state.json`, `status.md`, task lifecycle fields
- [Agent prompt bodies](reference/agents.md) — `implementer`, `task-reviewer`, `spec-reviewer`
- [Skills index](reference/skills.md) — lifecycle skills and when to invoke each

---

## Explanation

- [Dispatch and context](explanation/dispatch-and-context.md) — why fresh subagents, thin orchestrator, filesystem memory
- [Traceability spine](explanation/traceability-spine.md) — `FR-### ↔ Task ↔ Test ↔ Verification gate`
- [Lifecycle overview](explanation/lifecycle.md) — explore → scope → … → ship

---

## Related

- [Root README](../README.md) — landing page, quickstart, and documentation overview
- [NOTICE](../NOTICE) — provenance and license
