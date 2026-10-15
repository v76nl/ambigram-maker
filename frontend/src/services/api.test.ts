import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchWords, evaluateWord, generateAmbigram, getAvailableFonts } from "./api";

describe("Frontend API Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("getAvailableFonts should fetch and return fonts array", async () => {
    const mockFonts = [
      { id: "zen_maru", name: "Zen Maru Gothic", style: "丸ゴシック", description: "標準" },
      { id: "marumonica", name: "MaruMonica", style: "丸ピクセル", description: "12x16px" },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fonts: mockFonts }),
    } as Response);

    const fonts = await getAvailableFonts();
    expect(fonts).toEqual(mockFonts);
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/fonts");
  });

  it("searchWords should encode query parameters correctly", async () => {
    const mockWords = [{ word: "日の目", reading: "ひのめ", score: 0.95 }];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 1, words: mockWords }),
    } as Response);

    const result = await searchWords({ query: "日", minLength: 2, maxLength: 4 });
    expect(result).toEqual(mockWords);

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("query=%E6%97%A5");
    expect(calledUrl).toContain("min_length=2");
    expect(calledUrl).toContain("max_length=4");
  });

  it("generateAmbigram should send POST with parameters", async () => {
    const mockResponse = {
      word: "日の目",
      results: {
        skeleton: { engine: "skeleton", type: "png", data: "data:image/png;base64,abc" },
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await generateAmbigram({ word: "日の目", engine: "skeleton", font: "zen_maru" });
    expect(result).toEqual(mockResponse);

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.word).toBe("日の目");
    expect(body.engine).toBe("skeleton");
    expect(body.font).toBe("zen_maru");
  });

  it("evaluateWord should send word to /words/evaluate", async () => {
    const mockWordItem = { word: "日の目", reading: "ひのめ", score: 0.95, length: 3, common: true, kanji: ["日", "目"], pairs: [] };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockWordItem,
    } as Response);

    const result = await evaluateWord("日の目");
    expect(result).toEqual(mockWordItem);
    expect(fetchSpy).toHaveBeenCalledWith("http://127.0.0.1:8000/api/words/evaluate", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ word: "日の目" }),
    }));
  });
});
