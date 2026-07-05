# MCP Parity: Claude Code vs Cursor

**Scope:** GitHub Copilot is deferred (Plan #5b, not yet built); this check covers the two currently-supported tools, Claude Code and Cursor, both of which point their own MCP config at the identical server binary (`packages/core/dist/mcp-server.js`), just via each harness's own path-variable convention (`${CLAUDE_PLUGIN_ROOT}` vs `${workspaceFolder}`).

**Expected:** calling the same `build-matrix` MCP tool with the same `specText`/`planText` inputs must yield identical output in both tools.

**Inputs:** `examples/url-shortener/spec.md` and `examples/url-shortener/plan.md` (the worked example's own tier docs).

## Environment note

The `cursor-agent` CLI used to capture this evidence runs inside VS Code on this machine, not the real Cursor.app IDE — the same environment limitation already documented in Plan #4's CU1.4 finding, where `${workspaceFolder}` is a Cursor-IDE-substituted variable this foreign host doesn't expand on its own. For this capture only, `.cursor/mcp.json` was temporarily pointed at an absolute path (the same isolated-test technique Plan #4 already validated as proving the config *mechanism* works), the tool call was captured, and the file was restored to its original `${workspaceFolder}` form immediately afterward — `git status --porcelain .cursor/mcp.json` is clean, confirming no net change shipped.

## Claude Code output

Captured via `claude --plugin-dir . --output-format stream-json --verbose --allowedTools "mcp__plugin_superspec_superspec__build-matrix,Read" -p "..."` — real tool-use trace, not narrated. The model invoked `Read` on both files, then genuinely called `mcp__plugin_superspec_superspec__build-matrix`:

```json
{
  "matrix": {
    "rows": [
      { "fr": "FR-001", "tasks": ["T002", "T004"], "covered": true },
      { "fr": "FR-002", "tasks": ["T003", "T004"], "covered": true },
      { "fr": "FR-003", "tasks": ["T003", "T004"], "covered": true },
      { "fr": "FR-004", "tasks": ["T001", "T004"], "covered": true }
    ],
    "complete": true
  },
  "gaps": []
}
```

## Cursor output

Captured via `cursor-agent --print --output-format stream-json --force --approve-mcps -p "..."` — real tool-use trace. The model invoked a `readToolCall` on both files, then a genuine `mcpToolCall` naming `superspec-build-matrix`:

```json
{
  "matrix": {
    "rows": [
      { "fr": "FR-001", "tasks": ["T002", "T004"], "covered": true },
      { "fr": "FR-002", "tasks": ["T003", "T004"], "covered": true },
      { "fr": "FR-003", "tasks": ["T003", "T004"], "covered": true },
      { "fr": "FR-004", "tasks": ["T001", "T004"], "covered": true }
    ],
    "complete": true
  },
  "gaps": []
}
```

## Diff

```
$ diff <(cat /tmp/mx-claude.json) <(cat /tmp/mx-cursor.json) && echo "MCP PARITY OK"
MCP PARITY OK
```

**Result: PASS.** Byte-identical output from both tools for the same inputs — confirming both harnesses are genuinely wired to the same shared core, not two independently-behaving copies. As a bonus, Cursor's `cursor-agent mcp list-tools superspec` during this session also confirmed all 6 real tools are live, including `list-personas` from Plan #7a:

```
Tools for superspec (6):
- build-matrix (specText, planText)
- forge-status (planText)
- lint-plan (planText)
- list-personas (claudeAgentsDir, cursorAgentsDir)
- route-model (complexity)
- scaffold (templatesDir, targetDir)
```
