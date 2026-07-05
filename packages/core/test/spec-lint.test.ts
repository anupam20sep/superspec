import { describe, it, expect } from "vitest";
import { lintSpec } from "../src/spec-lint.js";

const GOOD_SPEC = [
  "**Type**: product",
  "",
  "## Required Reading",
  "| Path | Reason |",
  "|------|--------|",
  "| docs/architecture.md | system context |",
  "",
  "## Requirements",
  "- **FR-001**: System MUST accept a URL.",
  "",
  "## Success Criteria",
  "- **SC-001**: Users complete flow in under 2 minutes.",
].join("\n");

describe("lintSpec", () => {
  it("passes a minimal valid spec", () => {
    expect(lintSpec(GOOD_SPEC)).toEqual([]);
  });

  it("flags template Type placeholder", () => {
    const md = GOOD_SPEC.replace("**Type**: product", "**Type**: [product | platform]");
    expect(lintSpec(md).some((f) => f.rule === "missing-spec-type")).toBe(true);
  });

  it("flags missing FR and SC", () => {
    const findings = lintSpec("# Feature\n**Type**: spike\n");
    expect(findings.some((f) => f.rule === "no-fr")).toBe(true);
    expect(findings.some((f) => f.rule === "no-sc")).toBe(true);
  });

  it("flags FR with TBD", () => {
    const md = GOOD_SPEC.replace(
      "System MUST accept a URL.",
      "System MUST accept a URL TBD format rules",
    );
    expect(lintSpec(md).some((f) => f.rule === "untestable-fr")).toBe(true);
  });

  it("flags missing Type field entirely", () => {
    const md = GOOD_SPEC.replace("**Type**: product\n", "");
    expect(lintSpec(md).some((f) => f.rule === "missing-spec-type")).toBe(true);
  });
});
