# Your first feature

> Install SuperSpec, bootstrap a repo, write a spec, and forge one task.

---

## 1. Install the plugin

**Cursor:** `/add-plugin superspec` or `/add-plugin https://github.com/anupam20sep/superspec`

**Claude Code:**

```bash
claude plugin marketplace add anupam20sep/superspec
claude plugin install superspec@superspec-dev
```

Restart the session after install.

---

## 2. Bootstrap the repo

Tell the agent:

> Initialize SuperSpec in this repo (lite mode).

Or run:

```bash
npx -y @superspec-dev/core@latest init --root . --mode lite --verbose
```

This creates `constitution.md`, `specs/`, and template references.

---

## 3. Scope a feature

Tell the agent:

> Let's explore and build a [small feature]. Use superspec-scope to write spec.md.

You should get `specs/<feature>/spec.md` with `FR-###` requirements.

---

## 4. Plan (includes route)

> Write a TDD plan with superspec-plan.

`superspec-plan` saves `plan.md`, then **automatically** chains `superspec-route` to produce `execution-map.md`. Both files must exist before forge.

Artifacts: `plan.md`, `execution-map.md`.

---

## 5. Forge one task

> Run superspec-forge for task T001 only.

The agent should:

1. `next-task` → `begin-task`
2. Dispatch implementer (`agents/implementer.md`)
3. Dispatch task-reviewer (`agents/task-reviewer.md`)
4. `record-result --passed true`
5. `sync-status`

See [Run the forge loop](../how-to/run-the-forge-loop.md) for CLI commands.

---

## 6. Validate

> Run superspec-validate before claiming done.

```bash
npx -y @superspec-dev/core lint --spec specs/<feature>/spec.md
npx -y @superspec-dev/core lint --plan specs/<feature>/plan.md
npx -y @superspec-dev/core matrix --spec specs/<feature>/spec.md --plan specs/<feature>/plan.md
```

---

## Next steps

- [Onboarding an existing codebase](onboarding-existing-codebase.md)
- [Dispatch on Claude Code](../how-to/dispatch-on-claude-code.md) / [Cursor](../how-to/dispatch-on-cursor.md)
- [Worked example](../../examples/url-shortener/)
