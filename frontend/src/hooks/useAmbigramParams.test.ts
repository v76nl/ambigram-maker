import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAmbigramParams } from "./useAmbigramParams";
import type { ParsedAmbigramConfig } from "../utils/configParser";

const config = (parameters: ParsedAmbigramConfig["parameters"]): ParsedAmbigramConfig => ({
  word: "長寿",
  engine: "skeleton",
  font: "zen_maru",
  offsets: null,
  parameters,
});

describe("useAmbigramParams warp method", () => {
  it("uses TPS for new work", () => {
    const { result } = renderHook(() => useAmbigramParams());
    expect(result.current.params.warpMethod).toBe("tps");
  });

  it("restores old configs without a warp method with the previous method", () => {
    const { result } = renderHook(() => useAmbigramParams());
    act(() => result.current.applyImportedConfig(config({ snapStrength: 0.75 })));
    expect(result.current.params.warpMethod).toBe("gaussian");
  });

  it("restores the saved warp method", () => {
    const { result } = renderHook(() => useAmbigramParams());
    act(() => result.current.applyImportedConfig(config({ warpMethod: "gaussian" })));
    act(() => result.current.applyImportedConfig(config({ warpMethod: "tps" })));
    expect(result.current.params.warpMethod).toBe("tps");
  });
});
