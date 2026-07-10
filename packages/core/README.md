# @superspec-dev/core

The shared engine behind SuperSpec's spec-driven + TDD-driven lifecycle tools. It powers the `explore -> scope -> refine -> architect -> plan -> route -> forge -> validate -> ship` methodology shared by SuperSpec's Claude Code and Cursor integrations.

`@superspec-dev/core` exposes the same functionality two ways:

- **MCP server** — `npx @superspec-dev/core mcp`
- **CLI** — `npx @superspec-dev/core matrix|lint|scaffold|list-personas`

It depends on `@superspec-dev/render` (frontmatter parser used by persona discovery) and can be installed via `npx @superspec-dev/core`.

For full context on the SuperSpec methodology, installation, and usage, see the main [SuperSpec repository](https://github.com/anupam20sep/superspec)'s README and `docs/SOURCES.md`.
