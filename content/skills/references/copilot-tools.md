# GitHub Copilot Tool Reference

This reference maps generic SuperSpec actions to GitHub Copilot's actual tools and mechanisms in VS Code.

## Action → Tool Mapping

| Action | Copilot Mechanism | Configuration | Notes |
|--------|-------------------|----------------|-------|
| **Dispatch a subagent for an isolated task** | Agent mode (single thread, no isolation) | N/A — built-in to Copilot Chat | Copilot Chat in VS Code has Agent mode for autonomous work, but it runs in a single continuous thread with no isolated subagent-dispatch primitive. See "Fallback Pattern" below for how to simulate parallel subagent work. |
| **Call an MCP tool** (e.g., build-matrix, lint-plan, scaffold, forge-status from @superspec-dev/core) | MCP tool via configured server | `.vscode/mcp.json` in project root | Copilot can be configured to use MCP servers defined in `.vscode/mcp.json`. Tools from registered MCP servers become available in the Agent conversation. |
| **Invoke a skill or command** | Prompt files (reference) | `.github/prompts/*.prompt.md` | Copilot Chat supports prompt files in `.github/prompts/`. Check your version's documentation for the exact invocation syntax. No native skill dispatch equivalent to Claude Code's Skill tool — use prompt files as a workaround for reusable task templates. |
| **Apply always-on instructions** | Copilot Instructions | `.github/copilot-instructions.md` | This file is automatically loaded by Copilot and applied to all conversations in the repository. Use it for project-wide conventions, architectural guidelines, and standing instructions (equivalent to a global `.claude/CLAUDE.md`). |
| **Track task or todo state** | Comments in code / GitHub Issues | `.github/ISSUE_TEMPLATE/` or markdown files in repo | Copilot does not have a native todo-tracking tool. Use GitHub Issues, code comments, or markdown files in the repository for task tracking. |
| **Read a file** | Built-in file reference via `#file` or opening in editor | N/A — automatic | Copilot can read any file you reference with `#file` or have open in VS Code. Context includes the file contents. |
| **Write or create a file** | Agent mode (autonomous with approval) | N/A — built-in to Copilot Chat | Copilot Agent mode can autonomously create and write files. When performing file operations, Copilot will create or modify files directly, and you review/approve the changes. |
| **Edit a file in place** | Inline edits via Copilot Edit | N/A — built-in | Copilot's Edit feature (in VS Code) allows inline code suggestions. Accept or reject edits directly. Not fully autonomous — requires user confirmation. |
| **Run shell commands** | Agent mode (autonomous with approval) | N/A — built-in to Copilot Chat | Copilot Agent mode can autonomously execute terminal commands, but each command execution requires your explicit approval/confirmation before it runs (a permission gate, not a suggestion-only model). This is analogous to Claude Code's Bash tool with permission prompts. |
| **Web fetch or search** | Suggest curl/fetch commands | N/A | Copilot can suggest curl or fetch code, but cannot execute web requests autonomously. You would need to run suggested commands or write code to execute them in your app. |

## Patterns for Common Superspec Tasks

### Dispatching a "subagent-like" workflow in Copilot
Since Copilot has no isolated subagent dispatch, use **prompt-driven sequential loops**:

1. **Start an Agent conversation** with a clear task description.
2. **Let Agent run to completion**, then share the results in a new chat thread.
3. **Manually sequence tasks**: Each task is a separate Agent conversation, results are manually transferred between threads.

Example structure (Thread 1 — Implementation):
```
@copilot I need to implement FR-001: Build user authentication.

Acceptance criteria:
- [ ] API endpoint /auth/login returns 200 with token
- [ ] Token is valid for 1 hour

Please implement this autonomously and summarize what you've done when finished.
```

Then (Thread 2 — Review, in a separate chat):
```
[Paste implementation results from Thread 1]

Please review the implementation against these criteria:
- Is the token generation secure?
- Does the implementation follow our architecture guidelines?
- Are there any bugs or edge cases?
```

### Calling MCP tools (e.g., `forge-status` from @superspec-dev/core)
If registered in `.vscode/mcp.json`, reference the tool in your Agent conversation:
```
@copilot Please call the forge-status MCP tool to report current task execution...
```

Copilot will use the tool if available, but you may need to manually confirm or retry if the tool call fails (check your version for automatic retry logic capabilities).

### Using prompt files as reusable task templates
Create `.github/prompts/` directory and define task prompts:

**`.github/prompts/implement-feature.prompt.md`:**
```
You are implementing a new feature in [PROJECT].

Acceptance criteria: [CRITERIA]
Architecture guidelines: [GUIDELINES]

Please implement autonomously and summarize results.
```

Then invoke in Agent mode:
```
@prompt implement-feature
FR-001: Build user authentication
```

Copilot will load and apply the template.

### Applying always-on instructions
Create `.github/copilot-instructions.md`:
```markdown
# Copilot Instructions for [PROJECT]

- Always follow the architecture defined in docs/architecture.md
- Use TypeScript strict mode
- Write tests before implementation (TDD)
- Commit messages must reference GitHub Issues
```

Copilot applies these automatically to all conversations.

### File operations in task workflows
Copilot Agent mode can autonomously write and edit files. The workflow is:

1. **Reference** files with `#file` or by having them open.
2. **Generate** and apply edits directly to files.
3. **Review changes**: Copilot will show you what files were modified and the diffs; you confirm they're correct.
4. **Run tests** or validation in the integrated terminal (with approval gate for each command).

This allows Copilot to perform autonomous file operations while keeping you in control of what gets executed.

## Fallback Patterns for Subagent Tasks

**Copilot has no native subagent isolation or parallel dispatch.** Instead:

1. **Sequential single-thread loops** (required): Each task runs to completion in one Agent conversation.
2. **Manual result transfer**: Copy results from one conversation, paste into a new thread for the next task.
3. **No parallel execution**: For tasks that Claude Code would run in parallel, Copilot must run them serially.
4. **User-driven sequencing**: You manually decide task order and handoff, rather than an automated dispatcher.

### Example: Implementing subagent-driven-development workflow
Instead of dispatching parallel implementer + reviewer agents (as in Claude Code):

**Step 1 (Thread 1):** Implement the task autonomously
```
@copilot Implement FR-001 with the given acceptance criteria.
```
When done, copy the implementation results.

**Step 2 (Thread 2):** Review the implementation (in a fresh chat)
```
@copilot Review this implementation against the spec:
[PASTE RESULTS FROM STEP 1]

Does it meet all acceptance criteria? Are there bugs?
```
When done, copy the review results.

**Step 3:** Manually decide what to do next (refine, commit, move to next task).

This is considerably slower than Claude Code's parallel subagent dispatch, but is the only available pattern in Copilot.

## Limitations and Fallbacks

- **No isolated subagent dispatch:** All work is in a single Agent thread. Cannot spawn fresh contexts for specific tasks.
- **No background task execution:** Agent must complete within the chat window; cannot run tasks in parallel.
- **Terminal execution approval gate:** Terminal commands require explicit user approval before execution (not manual copy-paste, but not silent auto-execution either).
- **No dynamic MCP reload:** Update `.vscode/mcp.json` and restart VS Code to pick up new servers.
- **Manual result transfer:** Switching between tasks requires copy-pasting conversation results between chat threads.

---

<!-- Reference file for SuperSpec task C3.2. Adapted from SP: skills/using-superpowers/references/antigravity-tools.md (MIT). See /NOTICE. -->
