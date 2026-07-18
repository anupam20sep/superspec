# Acceptance: Codex

**Scope:** OpenAI Codex (CLI and ChatGPT Work mode / desktop Codex). Verifies packaging, skill load, MCP, hooks trust, and one forge dispatch path.

**Marketplace path:** `.agents/plugins/marketplace.json` uses `"path": "./"` (plugin = repo root). Requires Codex CLI **≥ 0.142**. Older `"../.."` paths are rejected and yield an empty plugin list.

---

## Preconditions

- Node.js on PATH (`npx @superspec-dev/core`)
- This repo checked out (plugin root = repo root)
- Codex with plugins enabled when available (`codex features` → `plugins`), or ChatGPT Work mode

---

## Checklist

### 1. Marketplace + install

```bash
codex plugin marketplace add anupam20sep/superspec
# or local:
codex plugin marketplace add /path/to/SuperSpec

codex plugin list --available -m superspec-dev
# expect: superspec@superspec-dev

codex plugin add superspec@superspec-dev
```

ChatGPT Work mode: Plugins Directory → add marketplace / local source → install **SuperSpec**.

**Path requirement:** `.agents/plugins/marketplace.json` must use `"path": "./"` (repo root). Codex rejects `"../.."` (parent traversal) and silently lists **no plugins**. Requires Codex CLI **≥ 0.142**.

If the marketplace is present but empty:

```bash
codex plugin marketplace remove superspec-dev
codex plugin marketplace add anupam20sep/superspec
codex plugin add superspec@superspec-dev
```

**Dual listing:** This repo also has `.claude-plugin/marketplace.json`. If both Claude-compat and `.agents/plugins` sources appear, install **once** from the Codex (`.agents/plugins` / `superspec-dev`) source and disable the duplicate.

Pass when: SuperSpec skills are listed (`$using-superspec` / `/skills` / `@SuperSpec`).

### 2. Skills

In a **new** session after install:

```text
$using-superspec
```

Or: "Use SuperSpec to explore a small feature."

Pass when: agent announces using-superspec (or an entry skill) before implementation.

### 3. MCP

Plugin bundles `.mcp.json` → `npx -y @superspec-dev/core@0.2.5 mcp`.

Manual fallback:

```bash
codex mcp add superspec -- npx -y @superspec-dev/core@0.2.5 mcp
```

Call one tool, e.g. lint the worked example plan:

```bash
npx -y @superspec-dev/core lint --plan examples/url-shortener/plan.md
```

Or invoke `lint-plan` / `build-matrix` via MCP in-session.

Pass when: tool returns structured output (not silent failure).

### 4. Hooks

Plugin points at `hooks/hooks-codex.json` (`SessionStart` with matcher `startup|resume`).

1. Open `/hooks` (or equivalent) after install.
2. **Approve / trust** SuperSpec plugin hooks.

Pass when: SessionStart echo appears on new/resume session, **or** docs step to approve hooks is followed and documented as required (Codex skips untrusted plugin hooks).

### 5. Forge dispatch (one task)

With a feature that has `plan.md` + `execution-map.md` (e.g. `examples/url-shortener/`):

1. Coordinator runs `sync-status` / `next-task` / `begin-task` with `--dir` / `stateDir`.
2. Spawn implementer with filled `agents/implementer.md` (see `docs/how-to/dispatch-on-codex.md`).
3. Spawn reviewer with filled `agents/task-reviewer.md`.
4. On pass: `record-result --passed true --spec …`.

Pass when: one task moves to `done` in forge state / `status.md`, or inline fallback is used explicitly with a review boundary.

---

## Non-goals (v1)

- `.codex/agents/*.toml` persona discovery in `list-personas`
- ChatGPT Chat mode (plugins unsupported)
- GitHub Copilot

---

## Related

- [Install on your runtime](../how-to/install-on-your-runtime.md)
- [Dispatch on Codex](../how-to/dispatch-on-codex.md)
- `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`
