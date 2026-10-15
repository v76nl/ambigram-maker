import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FontSelector } from "./FontSelector";

describe("FontSelector Component", () => {
  const mockFonts = [
    { id: "zen_maru", name: "Zen Maru Gothic", style: "丸ゴシック", description: "標準" },
    { id: "marumonica", name: "MaruMonica", style: "丸ピクセル", description: "12x16px" },
    { id: "biz_udpgothic", name: "BIZ UDPGothic", style: "UD角ゴシック", description: "UDフォント" },
  ];

  it("renders font options correctly", () => {
    const handleFontChange = vi.fn();
    render(
      <FontSelector
        availableFonts={mockFonts}
        selectedFont="auto"
        onFontChange={handleFontChange}
        activeResult={null}
      />
    );

    expect(screen.getByText("Zen Maru Gothic")).toBeDefined();
    expect(screen.getByText("MaruMonica")).toBeDefined();
    expect(screen.getByText("BIZ UDPGothic")).toBeDefined();
  });

  it("triggers onFontChange when a font item is clicked", () => {
    const handleFontChange = vi.fn();
    render(
      <FontSelector
        availableFonts={mockFonts}
        selectedFont="zen_maru"
        onFontChange={handleFontChange}
        activeResult={null}
      />
    );

    const maruBtn = screen.getByText("MaruMonica");
    fireEvent.click(maruBtn);
    expect(handleFontChange).toHaveBeenCalledWith("marumonica");
  });
});
