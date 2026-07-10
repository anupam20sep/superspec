# Installing SuperSpec

SuperSpec is a spec-driven + TDD-driven AI development plugin for Claude Code and Cursor.

## Claude Code

### Install from GitHub (recommended)

No clone required. The plugin ships skills, agents, hooks, and MCP from the public repo.

```bash
claude plugin marketplace add anupam20sep/superspec
claude plugin install superspec@superspec-dev
```

In Claude Code chat:

```
/plugin marketplace add anupam20sep/superspec
/plugin install superspec@superspec-dev
```

### MCP (bundled with the plugin)

Repo-root `.mcp.json` uses npm — no local build of `packages/core` required:

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

On first MCP use, `npx` downloads `@superspec-dev/core` from the [npm registry](https://www.npmjs.com/package/@superspec-dev/core).

### Local checkout (contributors)

```bash
git clone https://github.com/anupam20sep/superspec.git
cd superspec
./scripts/install.sh
```

`install.sh` registers the local marketplace, installs the plugin, and runs `claude plugin validate`.

Manual equivalent:

```bash
claude plugin marketplace add /path/to/superspec
claude plugin install superspec@superspec-dev
claude plugin validate /path/to/superspec
```

### MCP in a different project (without the full plugin)

Add the same `npx` entry to that project's own `.mcp.json` if you only want tools, not skills.

## Cursor

```
/add-plugin superspec
```

Or by URL: `/add-plugin https://github.com/anupam20sep/superspec`

Skills ship from `./skills/` per `.cursor-plugin/plugin.json`. Optional MCP: add `npx @superspec-dev/core mcp` to your project's `.cursor/mcp.json` (see main README).

## Community marketplace submission

To list in Anthropic's public `claude-community` catalog after review, submit at:

- https://platform.claude.com/plugins/submit

Run `claude plugin validate` on the repo before submitting.

## GitHub Copilot (future)

Planned: `.github/prompts/*.prompt.md` + `.vscode/mcp.json` — no install script.
