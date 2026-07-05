---
name: superspec-worktree
description: Use when starting plan or forge work that needs isolation from the current workspace — creates isolated git worktrees with smart directory selection, safety verification, and baseline tests; pairs with superspec-ship for cleanup
---

# SuperSpec Worktree

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on a feature branch without disturbing the current checkout.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the superspec-worktree skill to set up an isolated workspace."

**When to use:** Before **superspec-plan** or **superspec-forge** when branch isolation is wanted. Skip for trivial single-file edits in the current workspace.

**Pairs with:** **superspec-ship** — Step 6 cleans up worktrees created under `.worktrees/` or `worktrees/` after merge or discard.

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no CLAUDE.md preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superspec/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## Safety Verification

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:**

1. Add appropriate line to `.gitignore`
2. Commit the change (only when the user has asked for a commit, or project rules require it)
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to the repository.

### For Global Directory (~/.config/superspec/worktrees)

No `.gitignore` verification needed — outside project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superspec/worktrees/*)
    path="~/.config/superspec/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Verify Clean Baseline

Run tests to ensure the worktree starts clean:

```bash
# Examples — use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready for superspec-plan / superspec-forge on <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check CLAUDE.md → ask user |
| Directory not ignored | Add to `.gitignore` + commit |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |
| Work complete | superspec-ship Step 6 removes worktree (Options 1 & 4) |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating a project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > CLAUDE.md > ask

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

### Manual cleanup instead of superspec-ship

- **Problem:** Orphan worktrees, branch deleted before worktree removed
- **Fix:** Let superspec-ship handle removal after merge/discard; it `cd`s to main repo root before `git worktree remove`

## Red Flags

**Never:**
- Create a project-local worktree without verifying it's ignored
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Remove worktrees manually when superspec-ship will handle provenance-based cleanup

**Always:**
- Follow directory priority: `.worktrees` > `worktrees` > CLAUDE.md > ask
- Verify directory is ignored for project-local paths
- Auto-detect and run project setup
- Verify clean test baseline before plan/forge
- Hand off cleanup to superspec-ship when implementation finishes

## Integration

**Called by:**
- **using-superspec** — before plan/forge when isolation is wanted
- **superspec-plan** / **superspec-forge** — when executing on an isolated branch

**Pairs with:**
- **superspec-ship** — cleanup after work complete (Options 1 & 4)

<!-- Adapted from SP: skills/using-git-worktrees/SKILL.md (MIT). See /NOTICE. -->
