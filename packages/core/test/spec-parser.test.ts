import { describe, it, expect } from "vitest";
import { parseSpec } from "../src/spec-parser.js";

describe("parseSpec", () => {
  it("extracts FR and SC ids with their text", () => {
    const md = [
      "## Requirements",
      "- **FR-001**: The system MUST accept a URL.",
      "- **FR-002**: The system MUST return a short code.",
      "## Success Criteria",
      "- **SC-001**: 95% of redirects resolve in under 50ms.",
    ].join("\n");

    const spec = parseSpec(md);

    expect(spec.type).toBe("product");
    expect(spec.requirements).toEqual([
      { id: "FR-001", text: "The system MUST accept a URL." },
      { id: "FR-002", text: "The system MUST return a short code." },
    ]);
    expect(spec.criteria).toEqual([
      { id: "SC-001", text: "95% of redirects resolve in under 50ms." },
    ]);
  });

  it("returns empty arrays when nothing matches", () => {
    expect(parseSpec("# Title\n\nno ids here")).toEqual({
      type: "product",
      requirements: [],
      criteria: [],
    });
  });

  it("parses spec type from header", () => {
    const md = ["**Type**: migration", "- **FR-001**: Move data safely."].join("\n");
    expect(parseSpec(md).type).toBe("migration");
  });
});
