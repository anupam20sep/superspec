import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDirectRun } from "../src/cli-entry.js";

describe("isDirectRun", () => {
  it("matches when argv1 is this module path", () => {
    const modulePath = fileURLToPath(import.meta.url);
    expect(isDirectRun(import.meta.url, modulePath)).toBe(true);
  });

  it("matches resolved paths", () => {
    const modulePath = fileURLToPath(import.meta.url);
    expect(isDirectRun(import.meta.url, resolve(modulePath))).toBe(true);
  });

  it("returns false for unrelated argv1", () => {
    expect(isDirectRun(import.meta.url, "/not/a/real/entry.js")).toBe(false);
  });
});
