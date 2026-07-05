# Installing SuperSpec

SuperSpec is a spec-driven + TDD-driven AI development plugin for Claude Code and Cursor. This document covers installation for Claude Code and Cursor today; GitHub Copilot support is planned for a future release.

## Claude Code

```bash
git clone https://github.com/anupam20sep/superspec.git
cd superspec
./scripts/install.sh
```

`install.sh` is idempotent — safe to re-run if needed. It wraps two Claude Code CLI operations, if you'd rather run them yourself:

```bash
# 1. Register the local marketplace (containing the SuperSpec plugin)
claude plugin marketplace add /path/to/superspec

# 2. Install the SuperSpec plugin from the marketplace
claude plugin install superspec@superspec-dev
```

Both commands are safe to re-run. If the marketplace or plugin is already registered/installed, they will update it in place or report that no further action is needed.

### Note on the plugin's own `.mcp.json` vs. using SuperSpec's tools in another project

The `.mcp.json` committed at the root of this repository (used by the SuperSpec plugin's own skills/MCP wiring) references `${CLAUDE_PLUGIN_ROOT}`, a variable Claude Code resolves automatically once the plugin is installed. That file is correct as-is and does not need to change.

`${CLAUDE_PLUGIN_ROOT}` only has meaning inside an actual installed plugin's own manifest, though — it can't be used to reach SuperSpec's MCP tools from some other, unrelated project's own `.mcp.json`. For that different scenario — wanting SuperSpec's tools available in a project that isn't the SuperSpec plugin itself — the mechanism is the same npx-based one described under [Cursor](#cursor) below: that other project's own `.mcp.json` can add

```json
{
  "mcpServers": {
    "superspec": { "command": "npx", "args": ["-y", "@superspec-dev/core", "mcp"] }
  }
}
```

which resolves via the npm registry rather than any path into this repository or a plugin cache.

## Cursor

In Cursor's Agent chat:

```
/add-plugin superspec
```

This installs the full lifecycle — skills, rules, hooks — from the `.cursor-plugin/plugin.json` manifest this repo ships. If it isn't showing up in Cursor's marketplace search yet, add it directly by URL instead (Team Marketplace import, or `/add-plugin https://github.com/anupam20sep/superspec`).

Developing SuperSpec itself is even simpler: no install step at all — Cursor auto-discovers `.cursor/skills/`, `.cursor/rules/*.mdc`, and `.cursor/mcp.json` the moment you open this repository as a workspace folder.

### Using SuperSpec's MCP tools in a different project (npm-only path)

Separately from the plugin install above: any project can get SuperSpec's MCP tools (`build-matrix`, `lint-plan`, `route-model`, `scaffold`, `forge-status`, `list-personas`) on their own, without installing the full plugin, by adding an entry to that project's own `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "superspec": { "command": "npx", "args": ["-y", "@superspec-dev/core", "mcp"] }
  }
}
```

This works regardless of where that project lives on disk, because `npx` resolves `@superspec-dev/core` from the npm registry (or a local npm cache) rather than requiring a filesystem path into wherever this SuperSpec repository happens to be checked out. That's the key difference from the `.cursor/mcp.json` in *this* repository (shown above), which uses `${workspaceFolder}` and therefore only makes sense when the workspace folder is this repository itself.

## Adding GitHub Copilot (future)

GitHub Copilot support is planned as a future release. When added, Copilot will require **no install script**, just like Cursor's file-based approach above.

Copilot's "installation" will be handled entirely through the presence of:

- `.github/prompts/*.prompt.md` — Copilot prompts
- `.vscode/mcp.json` — MCP server configuration

This matches Cursor's file-based pattern and requires no marketplace registration, build step, or additional commands — the files themselves will act as the installation mechanism.

This section documents planned behavior only. These files do not yet exist in the repository.
