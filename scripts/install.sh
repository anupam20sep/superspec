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
echo "No install step required today: Cursor auto-discovers .cursor/skills/, .cursor/rules/, and .cursor/mcp.json"
echo "the moment this repo is opened as a workspace folder. Just open: $REPO_ROOT"
echo "(A .cursor-plugin/plugin.json manifest is also present for Cursor's own plugin packaging, for when"
echo "that mechanism is used instead of folder auto-discovery.)"
echo
echo "== GitHub Copilot =="
echo "Deferred for now. When added: Copilot needs no install script at all, same as Cursor's file-based"
echo "half above -- its 'install' is just .github/prompts/*.prompt.md + .vscode/mcp.json being present in"
echo "the repo. Document this in docs/install.md when Plan #5 is picked back up; no new script needed."
echo
echo "Done."
