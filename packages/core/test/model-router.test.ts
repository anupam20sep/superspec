import { describe, it, expect } from "vitest";
import { routeModel } from "../src/model-router.js";

describe("routeModel", () => {
  it("routes heavy work to the strong model", () => {
    expect(routeModel({ complexity: "heavy" })).toBe("strong");
  });

  it("routes mechanical work to the fast model", () => {
    expect(routeModel({ complexity: "mechanical" })).toBe("fast");
  });
});
