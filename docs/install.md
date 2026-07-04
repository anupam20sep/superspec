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

## Cursor

No install steps are required. Cursor automatically discovers and loads SuperSpec when you open this repository as a workspace folder:

- `.cursor/skills/` — Cursor skills are auto-discovered
- `.cursor/rules/*.mdc` — Cursor rules are auto-discovered  
- `.cursor/mcp.json` — MCP servers are auto-configured

Simply open the SuperSpec repository folder in Cursor and the plugin will be ready to use.

A `.cursor-plugin/plugin.json` manifest is also present in the repository for Cursor's optional plugin packaging mechanism, available for use in future scenarios.

## Adding GitHub Copilot (future)

GitHub Copilot support is planned as a future release. When added, Copilot will require **no install script**, just like Cursor's file-based approach above.

Copilot's "installation" will be handled entirely through the presence of:

- `.github/prompts/*.prompt.md` — Copilot prompts
- `.vscode/mcp.json` — MCP server configuration

This matches Cursor's file-based pattern and requires no marketplace registration, build step, or additional commands — the files themselves will act as the installation mechanism.

This section documents planned behavior only. These files do not yet exist in the repository.
