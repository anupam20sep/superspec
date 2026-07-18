import { describe, expect, it } from "vitest";
import { routeModel } from "../src/model-router.js";

describe("routeModel", () => {
  it("routes mechanical to economy (shim fast)", () => {
    const r = routeModel({ complexity: "mechanical" });
    expect(r.tier).toBe("economy");
    expect(r.model).toBe("fast");
    expect(r.role).toBe("implementer");
    expect(r.attempt).toBe(1);
  });

  it("routes moderate to standard (shim strong)", () => {
    const r = routeModel({ complexity: "moderate" });
    expect(r.tier).toBe("standard");
    expect(r.model).toBe("strong");
  });

  it("routes complex to frontier (shim strong)", () => {
    const r = routeModel({ complexity: "complex" });
    expect(r.tier).toBe("frontier");
    expect(r.model).toBe("strong");
  });

  it("applies attempt ladder: attempt 2 floors economy to standard", () => {
    const r = routeModel({ complexity: "mechanical", attempt: 2 });
    expect(r.tier).toBe("standard");
  });

  it("applies attempt ladder: attempt 3 floors to frontier", () => {
    const r = routeModel({ complexity: "moderate", attempt: 3 });
    expect(r.tier).toBe("frontier");
  });

  it("caps verify implementer at standard even if complex", () => {
    const r = routeModel({ complexity: "complex", kind: "verify", role: "implementer" });
    expect(r.tier).toBe("standard");
  });

  it("floors signoff reviewer at standard", () => {
    const r = routeModel({ complexity: "mechanical", kind: "signoff", role: "reviewer" });
    expect(r.tier).toBe("standard");
  });

  it("reviewer matches implementer floor for complex", () => {
    const r = routeModel({ complexity: "complex", role: "reviewer" });
    expect(r.tier).toBe("frontier");
  });

  it("includes meaning and rule strings", () => {
    const r = routeModel({ complexity: "mechanical" });
    expect(r.meaning).toMatch(/not latency/i);
    expect(r.rule).toMatch(/mechanical→economy/);
  });
});
