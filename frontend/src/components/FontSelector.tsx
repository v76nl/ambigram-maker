import React from "react";
import { Sparkles, Type, Crosshair, Maximize2 } from "lucide-react";
import type { FontMeta, EngineResult, FontScoreItem } from "../services/api";

interface FontSelectorProps {
  selectedFont: string;
  onFontChange: (fontId: string) => void;
  availableFonts: FontMeta[];
  activeResult: EngineResult | null;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  selectedFont,
  onFontChange,
  availableFonts,
  activeResult,
}) => {
  const details = activeResult?.details;
  const bestFontId = details?.best_font_id;
  const selectedFontName = details?.selected_font_name;
  const fontScores = details?.font_scores as FontScoreItem[] | undefined;
  const selectedOffsets = details?.selected_offsets as [number, number][] | undefined;
  const preBold = details?.pre_bold as number | undefined;

  // 各フォントのスコア辞書
  const scoreMap = new Map<string, FontScoreItem>();
  if (fontScores) {
    for (const fs of fontScores) {
      scoreMap.set(fs.id, fs);
    }
  }

  const isAuto = selectedFont === "auto";

  const getFontFamily = (fontId: string): string => {
    switch (fontId) {
      case "zen_maru":
        return "'Zen Maru Gothic', sans-serif";
      case "dela_gothic":
        return "'Dela Gothic One', sans-serif";
      case "mplus":
        return "'M PLUS 1p', sans-serif";
      case "klee":
        return "'Klee One', cursive, sans-serif";
      case "shippori":
        return "'Shippori Mincho', serif";
      default:
        return "inherit";
    }
  };

  return (
    <div className="font-selector-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
          <Type size={14} />
          <span>フォント</span>
        </div>
        {selectedFontName && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {selectedFontName}
          </span>
        )}
      </div>

      {/* 垂直フォントリスト */}
      <div className="font-list-vertical">
        {/* 最適フォント (Auto) */}
        <div
          className={`font-item-vertical ${isAuto ? "active" : ""}`}
          onClick={() => onFontChange("auto")}
          title="単語の回転対称性を判定し、最も高スコアなフォントを自動適用"
        >
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Sparkles size={12} color={isAuto ? "var(--text-inverse)" : "var(--accent)"} style={{ marginRight: "0.4rem", flexShrink: 0 }} />
            <span className="font-item-name">自動最適化</span>
            {bestFontId && (
              <span
                className="font-item-style"
                style={{
                  fontFamily: getFontFamily(bestFontId),
                  fontSize: "0.7rem",
                  marginLeft: "0.4rem",
                  opacity: 0.85,
                }}
              >
                {availableFonts.find((f) => f.id === bestFontId)?.name || bestFontId}
              </span>
            )}
          </div>
          {bestFontId && scoreMap.has(bestFontId) && (
            <div style={{ display: "inline-flex", alignItems: "center" }}>
              <span className="font-badge-best-sm">BEST</span>
              <span className="font-item-score">
                {Math.round((scoreMap.get(bestFontId)?.score || 0) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* 各フォントを縦（垂直）に並べる */}
        {availableFonts.map((font) => {
          const isSelected = selectedFont === font.id;
          const scoreItem = scoreMap.get(font.id);
          const isBest = font.id === bestFontId;
          const offsets = scoreItem?.offsets;

          return (
            <div
              key={font.id}
              className={`font-item-vertical ${isSelected ? "active" : ""}`}
              onClick={() => onFontChange(font.id)}
            >
              <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                <span
                  className={`font-item-name font-family-${font.id}`}
                  style={{ fontFamily: getFontFamily(font.id) }}
                >
                  {font.name}
                </span>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center" }}>
                {isBest && <span className="font-badge-best-sm">BEST</span>}
                {offsets && offsets.some(([dx, dy]) => dx !== 0 || dy !== 0) && (
                  <span className="font-item-offsets" title="180度回転重心微小シフト量">
                    ({offsets[0][0]},{offsets[0][1]})
                  </span>
                )}
                {scoreItem && (
                  <span className="font-item-score">
                    {Math.round(scoreItem.score * 100)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 最適化メトリクスサマリー */}
      {(selectedOffsets || (preBold !== undefined && preBold > 0)) && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem", marginTop: "0.1rem" }}>
          {selectedOffsets && selectedOffsets.some(([dx, dy]) => dx !== 0 || dy !== 0) && (
            <div className="font-metric-tag" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }} title="180度回転文字の重心を微小シフトして重なりを最大化">
              <Crosshair size={10} color="var(--accent)" />
              <span>
                微小シフト:{" "}
                <strong style={{ fontFamily: "var(--font-mono)" }}>
                  ({selectedOffsets[0][0]},{selectedOffsets[0][1]})
                </strong>
              </span>
            </div>
          )}
          {preBold !== undefined && preBold > 0 && (
            <div className="font-metric-tag" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }} title="近接ストロークを結合強化する異方性膨張">
              <Maximize2 size={10} color="var(--text-secondary)" />
              <span>
                事前太らせ: <strong style={{ fontFamily: "var(--font-mono)" }}>+{preBold}px</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
