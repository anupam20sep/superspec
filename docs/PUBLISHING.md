# Publishing runbook (maintainer-only)

This is an internal checklist for whoever actually runs the first public release of
SuperSpec — publishing `@superspec/core` and `@superspec/render` to the public npm
registry, and pushing this repository to a public GitHub remote. It is **not**
end-user install documentation (see [`docs/install.md`](./install.md) for that).

Everything in this repo has so far been prepared *locally*: no npm publish has
happened, and `git remote -v` currently shows nothing configured. The steps below
are written for whenever that changes, most likely on a different machine than the
one that prepared this branch, using the project owner's own npm and GitHub
accounts. Nothing in this doc should be run against corporate/internal infrastructure
or with credentials belonging to anyone other than the person carrying out the
release.

Work through the steps in order — several of them have a hard ordering dependency
(see step 3).

---

## 1. Confirm npm account and scope availability

Confirm you're logged in to the npm account that will own the `@superspec` scope:

```bash
npm whoami
```

If that fails, run `npm login` first.

Then check whether the `@superspec` scope/package names are actually available to
you, rather than assuming:

```bash
npm view @superspec/core
npm view @superspec/render
```

- If both return `404 Not Found` (or similar "no such package"), the names are free
  and you can publish under `@superspec/*` as this repo's `package.json` files
  already assume.
- If either command returns real package metadata (a version, description, etc.),
  someone else already owns that name/scope. In that case **stop** — you'll need to
  either claim the `@superspec` org on npmjs.com under your own account first, or
  pick a different scope/package name and update both `packages/core/package.json`
  and `packages/render/package.json` (`name` field, and the `@superspec/render`
  dependency range inside `packages/core/package.json`) before continuing. Do not
  guess at scope ownership — verify it here.

## 2. Fresh build

From the repo root:

```bash
npm install
npx tsc -b packages/core packages/render
```

This produces the `dist/` output that each package's `files: ["dist"]` field in
`package.json` will actually publish (source `.ts` files are not shipped).

## 3. Publish `@superspec/render` FIRST

Order matters here. `packages/core/package.json` declares:

```json
"dependencies": {
  "@superspec/render": "^0.1.0",
  ...
}
```

If `@superspec/core` were published before `@superspec/render` exists on the
registry, anyone running `npm install @superspec/core` in that window would get a
dependency resolution failure (npm can't find `@superspec/render@^0.1.0` anywhere).
Publishing render first eliminates that window entirely.

```bash
cd packages/render
npm publish --access public
```

`--access public` is required (or redundant-but-harmless) because `@superspec/*` is
a scoped package name and scoped packages default to private on npm; the
`publishConfig.access: "public"` already set in `package.json` should also cover
this, but pass the flag explicitly to be safe.

## 4. Publish `@superspec/core`

Only after step 3 has succeeded and you can see `@superspec/render` on the
registry (`npm view @superspec/render` should now return real data):

```bash
cd packages/core
npm publish --access public
```

## 5. Standalone smoke test (do not skip)

This is the step most likely to catch a real problem, because the monorepo's own
dev environment never exercises real npm dependency resolution — `@superspec/core`
resolves `@superspec/render` via workspace linking (a symlink), not via what actually
gets fetched from the registry when a stranger runs `npm install`. A package that
"works" in this repo's own dev loop can still be broken when published (missing
files in `dist`, an unresolvable dependency range, a bin path that's wrong, etc.).

Test this from a **completely separate scratch directory outside this repo** — no
workspace, no `node_modules` symlink safety net:

```bash
mkdir -p /tmp/superspec-smoke-test && cd /tmp/superspec-smoke-test

# 1. MCP server should start cleanly over stdio (Ctrl+C to stop; no crash/stack trace)
npx -y @superspec/core mcp

# 2. Exercise a real CLI subcommand against real files. The actual subcommands
#    (verified against packages/core/src/cli.ts) are: matrix, lint, scaffold,
#    list-personas, mcp. Example using matrix, which needs an existing spec and
#    plan file:
npx -y @superspec/core matrix --spec path/to/spec.md --plan path/to/plan.md

# A couple of cheaper sanity checks that need no fixture files:
npx -y @superspec/core list-personas
npx -y @superspec/core
# ^ no subcommand: should print
#   "Unknown command: (none). Try: matrix | lint | scaffold | list-personas | mcp"
```

If any of these fail with a module-not-found error, a missing `dist/` file, or a
dependency resolution error, do not proceed to step 6 — fix the packaging problem,
bump the version, republish, and re-run this smoke test before touching GitHub.

## 6. Create the public GitHub repository, add it as a remote, push

This repo currently has **no remotes configured** (`git remote -v` returns
nothing) — verify that's still true before proceeding, in case something changed
since this doc was written:

```bash
git remote -v
```

Then, using your own GitHub account:

1. Create a new **public** repository on GitHub (name and account are your call —
   nothing here assumes a specific username or repo name).
2. Add it as the `origin` remote and push:

```bash
git remote add origin <your-github-repo-url>
git push -u origin <your-current-branch>
```

Check your actual current branch name first with `git branch --show-current`
(at the time this doc was written, the working branch was `dev`, not `master` —
don't assume either name, use whatever `git branch --show-current` reports).

## 7. Update the placeholder `repository` fields and republish a patch

Both `packages/core/package.json` and `packages/render/package.json` currently
have a literal placeholder in their `repository.url` field:

```json
"repository": {
  "type": "git",
  "url": "TBD - set after creating the public GitHub repo"
}
```

Once the real GitHub URL exists (step 6), update both files to point at it, e.g.:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/<your-org-or-user>/<your-repo>.git"
}
```

Then cut a patch release of both packages so the registry metadata doesn't stay
stuck with the placeholder string forever:

```bash
cd packages/render && npm version patch && npm publish --access public
cd ../core && npm version patch && npm publish --access public
```

Keep the same publish order as steps 3–4 (render before core) in case the patch
also touches the dependency range between them.

## 8. Submit to the Claude Code plugin marketplace

Process and requirements for external marketplace submission can change over
time — do not treat any specific sequence of commands here as permanent. Before
doing this step, go check the **current** submission documentation at
[https://code.claude.com](https://code.claude.com) and follow whatever process is
documented there at the time you actually do this.

## 9. Submit to the Cursor marketplace

Same caveat as above: check the **current** docs at
[https://cursor.com/docs/plugins](https://cursor.com/docs/plugins) before doing
this. As of Cursor 2.5/2.6 (when this doc was written) this was a manually-reviewed
submission process, but that may well have changed by the time you're reading this
— verify against the live docs rather than assuming.

## 10. Update `.claude-plugin/marketplace.json`, if the public listing process requires it

`.claude-plugin/marketplace.json` currently has:

```json
"source": "./"
```

which is correct for the local/internal marketplace this repo has used during
development (installed via `claude plugin marketplace add <local-path>`, see
`scripts/install.sh`). If, once you've read the current marketplace submission docs
(step 8), it turns out a public marketplace listing requires a different `source`
value (for example, a git URL instead of a relative path), update it to match
whatever the current docs specify at that time. Do not guess or invent a new value
for this field now — check it against the then-current docs when you get there.
