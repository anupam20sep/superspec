# Implementation Plan: URL Shortener

**Feature Branch**: `001-url-shortener`

**Input**: Design documents from `spec.md` and `design.md`

**Prerequisites**: spec.md (required), design.md (required)

## Global Constraints

- Runtime: Node >= 20
- Dependencies: no new runtime dependencies beyond Node's standard library
- Naming: files kebab-case, exported symbols camelCase
- Testing: every task's implementation step is preceded by that task's own failing-test step

## Task Format

Each task below follows this shape:

- **Implements**: the functional requirement ID(s) from spec.md this task satisfies
- **Depends on**: task IDs that must land first, or `none`
- **Complexity**: `mechanical` (pure plumbing, low risk) | `moderate` | `complex` (needs design judgment)
- **Files**: exact paths to create, modify, and test
- **Interfaces**: what the task consumes from other tasks and what it produces for them
- Five numbered steps: write a failing test, run it and confirm the failure, write the minimal implementation, run the test again and confirm it passes, then commit

## Phase 1: Foundational Tasks

### Task T001: URL Validator

**Implements:** FR-004

**Depends on:** none

**Complexity:** mechanical

**Files:**
- Create: `examples/url-shortener/src/url-validator.ts`
- Test: `examples/url-shortener/test/url-validator.test.ts`

**Interfaces:**
- Consumes: a raw string from the caller (the shortener module, Task T004)
- Produces: `isValidHttpUrl(input: string): boolean`, true only for syntactically valid `http:`/`https:` URLs

- [ ] **Step 1: Write the failing test.** Add `examples/url-shortener/test/url-validator.test.ts`:

  ```ts
  import { describe, it, expect } from "vitest";
  import { isValidHttpUrl } from "../src/url-validator.js";

  describe("isValidHttpUrl", () => {
    it("accepts a well-formed https URL", () => {
      expect(isValidHttpUrl("https://example.com/path")).toBe(true);
    });
    it("rejects a non-URL string", () => {
      expect(isValidHttpUrl("not a url")).toBe(false);
    });
    it("rejects a non-http(s) scheme", () => {
      expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    });
  });
  ```

- [ ] **Step 2: Run the test to verify it fails.** Run `npx vitest run examples/url-shortener/test/url-validator.test.ts`. Expected failure: module `../src/url-validator.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation.** Create `examples/url-shortener/src/url-validator.ts`:

  ```ts
  export function isValidHttpUrl(input: string): boolean {
    try {
      const parsed = new URL(input);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }
  ```

- [ ] **Step 4: Run the test again to verify it passes.** Run `npx vitest run examples/url-shortener/test/url-validator.test.ts`. Expected: 3 tests pass.

- [ ] **Step 5: Commit.**

  ```bash
  git add examples/url-shortener/src/url-validator.ts examples/url-shortener/test/url-validator.test.ts
  git commit -m "feat(url-shortener): add isValidHttpUrl for FR-004"
  ```

---

### Task T002: Code Generator

**Implements:** FR-001

**Depends on:** none

**Complexity:** mechanical

**Files:**
- Create: `examples/url-shortener/src/code-generator.ts`
- Test: `examples/url-shortener/test/code-generator.test.ts`

**Interfaces:**
- Consumes: nothing (pure generator)
- Produces: `generateCode(): string`, a 6-character alphanumeric code, exported for use by the shortener module (Task T004)

- [ ] **Step 1: Write the failing test.** Add `examples/url-shortener/test/code-generator.test.ts`:

  ```ts
  import { describe, it, expect } from "vitest";
  import { generateCode } from "../src/code-generator.js";

  describe("generateCode", () => {
    it("returns a 6-character alphanumeric code", () => {
      const code = generateCode();
      expect(code).toMatch(/^[A-Za-z0-9]{6}$/);
    });
    it("returns a different code across calls (non-constant)", () => {
      const codes = new Set(Array.from({ length: 20 }, () => generateCode()));
      expect(codes.size).toBeGreaterThan(1);
    });
  });
  ```

- [ ] **Step 2: Run the test to verify it fails.** Run `npx vitest run examples/url-shortener/test/code-generator.test.ts`. Expected failure: module `../src/code-generator.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation.** Create `examples/url-shortener/src/code-generator.ts`:

  ```ts
  import { randomBytes } from "node:crypto";

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  export function generateCode(): string {
    const bytes = randomBytes(6);
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return code;
  }
  ```

- [ ] **Step 4: Run the test again to verify it passes.** Run `npx vitest run examples/url-shortener/test/code-generator.test.ts`. Expected: 2 tests pass.

- [ ] **Step 5: Commit.**

  ```bash
  git add examples/url-shortener/src/code-generator.ts examples/url-shortener/test/code-generator.test.ts
  git commit -m "feat(url-shortener): add generateCode for FR-001"
  ```

---

### Task T003: ShortLink Store

**Implements:** FR-002, FR-003

**Depends on:** none

**Complexity:** moderate

**Files:**
- Create: `examples/url-shortener/src/store.ts`
- Test: `examples/url-shortener/test/store.test.ts`

**Interfaces:**
- Consumes: a `code`/`longUrl` pair from the caller (the shortener module, Task T004)
- Produces: `insertIfFree(code: string, longUrl: string): boolean` (false on collision, per design.md's regenerate-on-collision decision) and `resolve(code: string): string | undefined`, exported for use by Task T004

- [ ] **Step 1: Write the failing test.** Add `examples/url-shortener/test/store.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from "vitest";
  import { insertIfFree, resolve, resetStore } from "../src/store.js";

  describe("store", () => {
    beforeEach(() => resetStore());

    it("inserts a new code and resolves it back to the same URL", () => {
      expect(insertIfFree("abc123", "https://example.com/a")).toBe(true);
      expect(resolve("abc123")).toBe("https://example.com/a");
    });

    it("refuses to overwrite an existing code with a different URL", () => {
      insertIfFree("abc123", "https://example.com/a");
      expect(insertIfFree("abc123", "https://example.com/b")).toBe(false);
      expect(resolve("abc123")).toBe("https://example.com/a");
    });

    it("returns undefined for an unknown code", () => {
      expect(resolve("nope99")).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run the test to verify it fails.** Run `npx vitest run examples/url-shortener/test/store.test.ts`. Expected failure: module `../src/store.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation.** Create `examples/url-shortener/src/store.ts`:

  ```ts
  interface ShortLink {
    code: string;
    longUrl: string;
    createdAt: string;
  }

  let links = new Map<string, ShortLink>();

  export function insertIfFree(code: string, longUrl: string): boolean {
    if (links.has(code)) return false;
    links.set(code, { code, longUrl, createdAt: new Date().toISOString() });
    return true;
  }

  export function resolve(code: string): string | undefined {
    return links.get(code)?.longUrl;
  }

  export function resetStore(): void {
    links = new Map<string, ShortLink>();
  }
  ```

- [ ] **Step 4: Run the test again to verify it passes.** Run `npx vitest run examples/url-shortener/test/store.test.ts`. Expected: 3 tests pass.

- [ ] **Step 5: Commit.**

  ```bash
  git add examples/url-shortener/src/store.ts examples/url-shortener/test/store.test.ts
  git commit -m "feat(url-shortener): add ShortLink store for FR-002/FR-003"
  ```

---

## Phase 2: Composition

### Task T004: Shortener Service

**Implements:** FR-001, FR-002, FR-003, FR-004

**Depends on:** T001, T002, T003

**Complexity:** moderate

**Files:**
- Create: `examples/url-shortener/src/shortener.ts`
- Test: `examples/url-shortener/test/shortener.test.ts`

**Interfaces:**
- Consumes: `isValidHttpUrl` (Task T001), `generateCode` (Task T002), `insertIfFree`/`resolve` (Task T003)
- Produces: `shorten(longUrl: string): { code: string; url: string } | { error: string }` and `resolve(code: string): string | undefined`, the public entry points a future HTTP layer would call

- [ ] **Step 1: Write the failing test.** Add `examples/url-shortener/test/shortener.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach } from "vitest";
  import { shorten, resolve } from "../src/shortener.js";
  import { resetStore } from "../src/store.js";

  describe("shortener", () => {
    beforeEach(() => resetStore());

    it("shortens a valid URL and resolves the returned code back to it", () => {
      const result = shorten("https://example.com/some/path");
      if ("error" in result) throw new Error("expected success");
      expect(result.code).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(resolve(result.code)).toBe("https://example.com/some/path");
    });

    it("rejects an invalid URL and issues no code", () => {
      const result = shorten("not a url");
      expect("error" in result).toBe(true);
    });

    it("rejects a non-http(s) scheme and issues no code", () => {
      const result = shorten("javascript:alert(1)");
      expect("error" in result).toBe(true);
    });

    it("returns undefined when resolving an unissued code", () => {
      expect(resolve("zzzz99")).toBeUndefined();
    });
  });
  ```

- [ ] **Step 2: Run the test to verify it fails.** Run `npx vitest run examples/url-shortener/test/shortener.test.ts`. Expected failure: module `../src/shortener.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation.** Create `examples/url-shortener/src/shortener.ts`:

  ```ts
  import { isValidHttpUrl } from "./url-validator.js";
  import { generateCode } from "./code-generator.js";
  import { insertIfFree, resolve as resolveInStore } from "./store.js";

  export function shorten(longUrl: string): { code: string; url: string } | { error: string } {
    if (!isValidHttpUrl(longUrl)) {
      return { error: "INVALID_URL" };
    }
    let code = generateCode();
    while (!insertIfFree(code, longUrl)) {
      code = generateCode();
    }
    return { code, url: longUrl };
  }

  export function resolve(code: string): string | undefined {
    return resolveInStore(code);
  }
  ```

- [ ] **Step 4: Run the test again to verify it passes.** Run `npx vitest run examples/url-shortener/test/shortener.test.ts`. Expected: 4 tests pass.

- [ ] **Step 5: Commit.**

  ```bash
  git add examples/url-shortener/src/shortener.ts examples/url-shortener/test/shortener.test.ts
  git commit -m "feat(url-shortener): compose shorten()/resolve() for FR-001..FR-004"
  ```

## No Empty Placeholders

Every task above ships with its full failing test code, the real command to run it, the real expected failure/pass output, the complete minimal implementation, and the real git commands to commit it. No task defers content to a later pass.

<!-- Adapted from SK: templates/tasks-template.md (MIT) and SP: skills/writing-plans/SKILL.md (MIT). See /NOTICE. -->
