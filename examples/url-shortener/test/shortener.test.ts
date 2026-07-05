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
