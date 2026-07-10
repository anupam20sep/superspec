# @superspec-dev/render

Renders SuperSpec's shared skill content from `content/skills/` into repo-root `skills/` — the same layout used by Claude Code and the Cursor plugin manifest (matching [obra/superpowers](https://github.com/obra/superpowers)).

Used internally by `@superspec-dev/core` (frontmatter parsing for persona discovery) and runnable standalone:

```bash
npx @superspec-dev/render
```

From the SuperSpec repo root, `npm run render` runs the local build of this CLI after `npm run build`.

For full context, see the main [SuperSpec repository](https://github.com/anupam20sep/superspec) README.
