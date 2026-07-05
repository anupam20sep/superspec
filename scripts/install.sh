#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MARKETPLACE_NAME="superspec-dev"
PLUGIN_ID="superspec@${MARKETPLACE_NAME}"

echo "SuperSpec installer (Claude Code + Cursor, internal use)"
echo

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI not found on PATH. Install Claude Code first: https://claude.com/claude-code" >&2
  exit 1
fi

echo "== Claude Code =="
if claude plugin marketplace list 2>/dev/null | grep -q "$MARKETPLACE_NAME"; then
  echo "Marketplace '$MARKETPLACE_NAME' already registered; updating it in place."
  claude plugin marketplace update "$MARKETPLACE_NAME"
else
  echo "Registering local marketplace at $REPO_ROOT ..."
  claude plugin marketplace add "$REPO_ROOT"
fi

if claude plugin list 2>/dev/null | grep -q "^superspec"; then
  echo "Plugin '$PLUGIN_ID' already installed; nothing further to do."
else
  echo "Installing plugin: $PLUGIN_ID ..."
  claude plugin install "$PLUGIN_ID"
fi

echo
echo "== Cursor =="
echo "Install via /add-plugin superspec (or URL). Skills ship from ./skills/ per .cursor-plugin/plugin.json — same layout as obra/superpowers."
echo "Local dev: open this repo as a workspace; hooks load from hooks/hooks-cursor.json via the plugin manifest."
echo
echo "== GitHub Copilot =="
echo "Deferred for now. When added: Copilot needs no install script at all, same as Cursor's file-based"
echo "half above -- its 'install' is just .github/prompts/*.prompt.md + .vscode/mcp.json being present in"
echo "the repo. Document this in docs/install.md when Plan #5 is picked back up; no new script needed."
echo
echo "Done."
