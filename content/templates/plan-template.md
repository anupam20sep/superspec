<!-- Adapted from SK: templates/tasks-template.md (MIT) and SP: skills/writing-plans/SKILL.md (MIT). See /NOTICE. -->

# Implementation Plan: {{FEATURE}}

**Feature Branch**: `[###-feature-name]`

**Input**: Design documents from `spec.md` and `design.md`

**Prerequisites**: spec.md (required), design.md (required)

## Global Constraints

[Project-wide requirements — version floors, dependency limits, naming rules — one line each]

- Runtime: [e.g. Node >= 20]
- Dependencies: [e.g. no new runtime dependencies without approval]
- Naming: [e.g. files kebab-case, exported symbols PascalCase/camelCase per language convention]
- Testing: every task's implementation step must be preceded by a task's own failing-test step

## Task Format

Each task below follows this shape:

- **Implements**: the functional requirement ID(s) from spec.md this task satisfies
- **Depends on**: task IDs that must land first, or `none`
- **Complexity**: `mechanical` (pure plumbing, low risk) | `moderate` | `complex` (needs design judgment)
- **Files**: exact paths to create, modify, and test
- **Interfaces**: what the task consumes from other tasks and what it produces for them
- Five numbered steps: write a failing test, run it and confirm the failure, write the minimal implementation, run the test again and confirm it passes, then commit

## Phase 1: Foundational Tasks

### Task T001: Slug Normalizer

**Implements:** FR-001

**Depends on:** none

**Complexity:** mechanical

**Files:**
- Create: `src/slug.ts`
- Test: `test/slug.test.ts`

**Interfaces:**
- Consumes: a raw title string from the caller
- Produces: `normalizeSlug(title: string): string`, a lowercase hyphenated slug with no leading/trailing hyphens, exported for use by the routing layer (Task T002)

- [ ] **Step 1: Write the failing test.** Add `test/slug.test.ts`:

  ```ts
  import { normalizeSlug } from "../src/slug";

  test("normalizeSlug lowercases and hyphenates", () => {
    expect(normalizeSlug("  Hello, World!  ")).toBe("hello-world");
  });
  ```

- [ ] **Step 2: Run the test to verify it fails.** Run `npx jest test/slug.test.ts`. Expected failure, since `src/slug.ts` does not exist yet:

  ```
  Cannot find module '../src/slug' from 'test/slug.test.ts'
  ```

- [ ] **Step 3: Write the minimal implementation.** Create `src/slug.ts`:

  ```ts
  export function normalizeSlug(title: string): string {
    return title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  ```

- [ ] **Step 4: Run the test again to verify it passes.** Run `npx jest test/slug.test.ts`. Expected output:

  ```
  PASS test/slug.test.ts
    ✓ normalizeSlug lowercases and hyphenates
  ```

  Make sure it passes before moving to the next task — do not proceed on a red test.

- [ ] **Step 5: Commit.**

  ```bash
  git add src/slug.ts test/slug.test.ts
  git commit -m "feat: add normalizeSlug for FR-001"
  ```

## Phase 2: [Next Phase Name]

[Add further `### Task Txxx: [Name]` blocks here, following the exact shape modeled above: Implements/Depends on/Complexity/Files/Interfaces, then five steps — write the failing test with real code, run it and record the real expected failure, write the real minimal implementation, run the test again and confirm it passes, then commit with a real git command and message. Every task in this plan must be filled out this completely before implementation begins; no task may skip the red-green-refactor cycle.]

## No Empty Placeholders

This plan must ship with every task fully specified — no stand-in text left for "later," no step that just says a future engineer will figure it out, no requirement description that trails off before naming the real files and interfaces involved.

Concretely, before this plan is considered ready:

- Every `### Task` block names real file paths under **Files**, not bracketed descriptions.
- Every task shows an actual failing test with real assertions, not a comment describing what the test should someday check.
- Every task shows the real command used to confirm the test fails, and the real output that command produced.
- Every task shows real implementation code, not a comment claiming that error handling belongs there while leaving it unwritten, and not a comment claiming that some other task's code should simply be copied.
- Every task shows the real command used to confirm the test passes on the second run, and the real output that command produced.
- Every task ends with a real `git commit` command and a message describing what actually changed.

If a task cannot yet be written this completely, it does not belong in this plan yet — describe it as an open question in `spec.md` instead and return to it once the missing details are known.
