# Installing SuperSpec

SuperSpec is a spec-driven + TDD-driven AI development plugin for Claude Code and Cursor. This document covers installation for Claude Code and Cursor today; GitHub Copilot support is planned for a future release.

## Claude Code

To install SuperSpec into Claude Code, run the install script from the repository root:

```bash
./scripts/install.sh
```

The script is idempotent — it is safe to re-run if needed.

### What the install script does (manual steps)

If you prefer to understand or manually run the underlying commands, the script wraps two Claude Code CLI operations:

```bash
# 1. Register the local marketplace (containing the SuperSpec plugin)
claude plugin marketplace add /path/to/this/superspec/repo

# 2. Install the SuperSpec plugin from the marketplace
claude plugin install superspec@superspec-dev
```

Both commands are safe to re-run. If the marketplace or plugin is already registered/installed, they will update it in place or report that no further action is needed.

### Note on the plugin's own `.mcp.json` vs. using SuperSpec's tools in another project

The `.mcp.json` committed at the root of this repository (used by the SuperSpec plugin's own skills/MCP wiring) references `${CLAUDE_PLUGIN_ROOT}`, a variable Claude Code resolves automatically once the plugin is installed. That file is correct as-is and does not need to change.

`${CLAUDE_PLUGIN_ROOT}` only has meaning inside an actual installed plugin's own manifest, though — it can't be used to reach SuperSpec's MCP tools from some other, unrelated project's own `.mcp.json`. For that different scenario — wanting SuperSpec's tools available in a project that isn't the SuperSpec plugin itself — the mechanism is the same npx-based one described under [Cursor](#using-superspecs-mcp-tools-in-a-different-project) below: once `@superspec/core` is published to npm (not yet), that other project's own `.mcp.json` can add

```json
{
  "mcpServers": {
    "superspec": { "command": "npx", "args": ["-y", "@superspec/core", "mcp"] }
  }
}
```

which resolves via the npm registry rather than any path into this repository or a plugin cache.

## Cursor

No install steps are required. Cursor automatically discovers and loads SuperSpec when you open this repository as a workspace folder:

- `.cursor/skills/` — Cursor skills are auto-discovered
- `.cursor/rules/*.mdc` — Cursor rules are auto-discovered  
- `.cursor/mcp.json` — MCP servers are auto-configured

Simply open the SuperSpec repository folder in Cursor and the plugin will be ready to use.

A `.cursor-plugin/plugin.json` manifest is also present in the repository for Cursor's optional plugin packaging mechanism, available for use in future scenarios.

### Using SuperSpec's MCP tools in a different project

The instructions above are for developing SuperSpec itself, or using it directly from a checkout of this repository — they remain the correct way to do that and are not changing.

**Not yet available:** `@superspec/core` has not been published to npm yet. The following describes what will work once it is published; it does not work today.

Once `@superspec/core` is published to npm, any *other* project — one that has nothing to do with this repository and doesn't have it checked out — can get SuperSpec's MCP tools (`build-matrix`, `lint-plan`, `route-model`, `scaffold`, `forge-status`, `list-personas`) by adding an entry to that project's own `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "superspec": { "command": "npx", "args": ["-y", "@superspec/core", "mcp"] }
  }
}
```

This works regardless of where that other project lives on disk, because `npx` resolves `@superspec/core` from the npm registry (or a local npm cache) rather than requiring a filesystem path into wherever this SuperSpec repository happens to be checked out. That's the key difference from the `.cursor/mcp.json` in *this* repository (shown above), which uses `${workspaceFolder}` and therefore only makes sense when the workspace folder is this repository itself.

## Adding GitHub Copilot (future)

GitHub Copilot support is planned as a future release. When added, Copilot will require **no install script**, just like Cursor's file-based approach above.

Copilot's "installation" will be handled entirely through the presence of:

- `.github/prompts/*.prompt.md` — Copilot prompts
- `.vscode/mcp.json` — MCP server configuration

This matches Cursor's file-based pattern and requires no marketplace registration, build step, or additional commands — the files themselves will act as the installation mechanism.

This section documents planned behavior only. These files do not yet exist in the repository.
