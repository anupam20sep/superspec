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
