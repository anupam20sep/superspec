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
