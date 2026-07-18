import { describe, expect, it } from "vitest";
import { listHarnessModels, mapHarnessModel } from "../src/harness-model-map.js";

describe("mapHarnessModel", () => {
  it("maps economy tier for cursor with thinking hint", () => {
    const m = mapHarnessModel("economy", "cursor");
    expect(m.tier).toBe("economy");
    expect(m.slug).toBeTruthy();
    expect(m.thinkingHint).toBe("minimal");
    expect(m.examples.length).toBeGreaterThan(0);
  });

  it("maps frontier for claude to opus-class slug", () => {
    const m = mapHarnessModel("frontier", "claude");
    expect(m.slug).toBe("opus");
    expect(m.thinkingHint).toBe("high");
  });

  it("lists all three tiers for a harness", () => {
    const list = listHarnessModels("codex");
    expect(list.map((x) => x.tier)).toEqual(["economy", "standard", "frontier"]);
  });
});
