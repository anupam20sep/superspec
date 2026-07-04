HOOK OUTPUT: SuperSpec: start with /superspec.explore -> scope -> refine -> architect -> plan -> route -> forge -> validate -> ship.
TOOL_USE: Skill -> {'skill': 'superspec:using-superspec', 'args': "Let's build a URL shortener"}
ASSISTANT TEXT: Using superspec-explore to start shaping the URL shortener idea.
TOOL_USE: Skill -> {'skill': 'superspec:superspec-explore', 'args': "Let's build a URL shortener"}
TOOL_USE: Bash -> {'command': 'ls <repo-root> && echo --- && ls <repo-root>/docs/superspec/specs 2>/dev/null && echo --- && git -C <repo-root> log --oneline -5', 'd
TOOL_USE: Bash -> {'command': 'ls <repo-root>', 'description': 'List project root'}
TOOL_USE: Bash -> {'command': 'ls <repo-root>/docs/superspec/specs 2>/dev/null', 'description': 'List existing specs if any'}
TOOL_USE: Read -> {'file_path': '<repo-root>/package.json'}
TOOL_USE: Bash -> {'command': 'ls <repo-root>/packages && echo --- && ls <repo-root>/docs', 'description': 'Inspect packages and docs directories'}
ASSISTANT TEXT: This repo is the SuperSpec framework itself (a plugin/skills system), not an app codebase — building a URL shortener here would mean starting a new project. Quick question before we dive in: do you want the URL shortener built as a new package inside this SuperSpec monorepo (e.g. `packages/url-shortener`), or as a separate standalone project/repo?
