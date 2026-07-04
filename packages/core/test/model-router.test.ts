import { describe, it, expect } from "vitest";
import { routeModel } from "../src/model-router.js";

describe("routeModel", () => {
  it("routes complex work to the strong model", () => {
    expect(routeModel({ complexity: "complex" })).toBe("strong");
  });

  it("routes mechanical work to the fast model", () => {
    expect(routeModel({ complexity: "mechanical" })).toBe("fast");
  });

  it("routes moderate work to the fast model", () => {
    expect(routeModel({ complexity: "moderate" })).toBe("fast");
  });
});
