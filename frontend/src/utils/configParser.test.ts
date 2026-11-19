import { describe, it, expect } from "vitest";
import { parseAmbigramConfig } from "./configParser";

const exported = (parameters: Record<string, unknown>) => ({
  reproducibility: {
    target: { word: "長寿" },
    engine: { id: "skeleton" },
    font: { id: "zen_maru" },
    alignment: { offsets: [[-1, 0]] },
    parameters,
  },
});

describe("parseAmbigramConfig", () => {
  it("reads the warp method from an exported config", () => {
    const config = parseAmbigramConfig(exported({ snap_strength: 0.75, warp_method: "tps" }));
    expect(config.parameters.warpMethod).toBe("tps");
  });

  it("leaves the warp method empty for configs saved before it existed", () => {
    const config = parseAmbigramConfig(exported({ snap_strength: 0.75 }));
    expect(config.parameters.warpMethod).toBeUndefined();
  });

  it("ignores unknown warp methods", () => {
    const config = parseAmbigramConfig(exported({ warp_method: "unknown" }));
    expect(config.parameters.warpMethod).toBeUndefined();
  });
});
