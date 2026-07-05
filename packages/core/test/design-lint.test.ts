import { describe, it, expect } from "vitest";
import { lintDesignText } from "../src/design-lint.js";

describe("lintDesignText", () => {
  it("flags decision blocks with template placeholders", () => {
    const md = [
      "### Decision: Use PostgreSQL",
      "**Rationale**:",
      "[Explain why this decision was made.]",
      "**Alternatives considered**:",
      "- **Option A**: [Reason rejected]",
    ].join("\n");

    const findings = lintDesignText(md);
    expect(findings.some((f) => f.rule === "incomplete-decision")).toBe(true);
  });

  it("passes filled decision blocks", () => {
    const md = [
      "### Decision: Use PostgreSQL",
      "**Rationale**:",
      "We need ACID transactions for billing.",
      "**Alternatives considered**:",
      "- **Option A**: MongoDB — lacks transactions we need.",
    ].join("\n");

    expect(lintDesignText(md)).toEqual([]);
  });

  it("flags NEEDS CLARIFICATION marker in technical context", () => {
    const md = "**Language/Version**: NEEDS CLARIFICATION: pick Node version";
    expect(lintDesignText(md).some((f) => f.rule === "needs-clarification")).toBe(true);
  });

  it("flags malformed consumed contract rows", () => {
    const md = [
      "### Consumed From Other Specs",
      "| Source spec | Contract | Version / stability | Notes |",
      "|-------------|----------|---------------------|-------|",
      "| [e.g., `specs/001-auth`] | [e.g., schema] | v1 | — |",
    ].join("\n");

    expect(lintDesignText(md).some((f) => f.rule === "malformed-consumed")).toBe(false);
  });

  it("accepts well-formed consumed rows", () => {
    const md = [
      "### Consumed From Other Specs",
      "| Source spec | Contract | Version / stability | Notes |",
      "|-------------|----------|---------------------|-------|",
      "| specs/001-auth | oauth.token.v1 | v1 | stable |",
    ].join("\n");

    expect(lintDesignText(md).filter((f) => f.rule === "malformed-consumed")).toEqual([]);
  });
});
