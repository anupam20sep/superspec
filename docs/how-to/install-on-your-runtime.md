# Install on your runtime

---

## Claude Code (recommended)

```bash
claude plugin marketplace add anupam20sep/superspec
claude plugin install superspec@superspec-dev
```

Includes skills, agents (`implementer`, `task-reviewer`), hooks, and MCP via repo `.mcp.json` → `npx @superspec-dev/core mcp`.

Restart or `/reload-plugins` after install.

---

## Cursor

```
/add-plugin superspec
```

Skills ship from plugin `skills/`. Add MCP manually — create `.cursor/mcp.json`:

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

Restart Cursor.

---

## MCP only (any editor)

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

Skills still work from the plugin; without MCP, run CLI via `npx @superspec-dev/core …` in the terminal.

---

## Bootstrap a project

```bash
npx -y @superspec-dev/core@latest init --root . --mode lite --verbose
```

| Mode | Creates |
|------|---------|
| `lite` | `constitution.md`, `specs/`, templates |
| `full` | Above + `program.md` for multi-spec coordination |

---

## Requirements

- Node.js on PATH (for `npx @superspec-dev/core`)
- Git repository (for forge commits and worktrees)

---

## Related

- [Your first feature](../tutorials/your-first-feature.md)
- [CLI and MCP tools](../reference/cli-and-mcp-tools.md)
