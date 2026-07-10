#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MARKETPLACE_NAME="superspec-dev"
PLUGIN_ID="superspec@${MARKETPLACE_NAME}"

echo "SuperSpec installer (Claude Code + Cursor)"
echo

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH. Install Claude Code first: https://claude.com/claude-code" >&2
  exit 1
fi

echo "== Claude Code (from GitHub, no clone) =="
echo "  claude plugin marketplace add anupam20sep/superspec"
echo "  claude plugin install superspec@superspec-dev"
echo "  MCP: bundled via .mcp.json → npx @superspec-dev/core mcp"
echo

echo "== Claude Code (local checkout at $REPO_ROOT) =="
if claude plugin marketplace list 2>/dev/null | grep -q "$MARKETPLACE_NAME"; then
  echo "Marketplace '$MARKETPLACE_NAME' already registered; updating in place."
  claude plugin marketplace update "$MARKETPLACE_NAME"
else
  echo "Registering local marketplace ..."
  claude plugin marketplace add "$REPO_ROOT"
fi

if claude plugin list 2>/dev/null | grep -q "^superspec"; then
  echo "Plugin '$PLUGIN_ID' already installed."
else
  echo "Installing plugin: $PLUGIN_ID ..."
  claude plugin install "$PLUGIN_ID"
fi

echo "Validating plugin manifest ..."
claude plugin validate "$REPO_ROOT"

echo
echo "== Cursor =="
echo "  /add-plugin superspec"
echo "  or /add-plugin https://github.com/anupam20sep/superspec"
echo "Skills ship from ./skills/ (same layout as obra/superpowers)."
echo
echo "Done."
