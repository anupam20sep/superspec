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
