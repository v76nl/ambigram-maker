import React, { useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { Sparkles, Type, RotateCcw, Maximize2 } from "lucide-react";
import type { FontMeta, EngineResult, FontScoreItem } from "../services/api";

interface FontSelectorProps {
  selectedFont: string;
  onFontChange: (fontId: string) => void;
  availableFonts: FontMeta[];
  activeResult: EngineResult | null;
  customOffsets?: [number, number][] | null;
  onCustomOffsetsChange?: (offsets: [number, number][]) => void;
  onResetOffsets?: () => void;
  targetWord?: string;
  recalculatedScore?: number | null;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  selectedFont,
  onFontChange,
  availableFonts,
  activeResult,
  customOffsets,
  onCustomOffsetsChange,
  onResetOffsets,
  targetWord,
  recalculatedScore,
}) => {
  const details = activeResult?.details;
  const bestFontId = details?.best_font_id;
  const selectedFontName = details?.selected_font_name;
  const fontScores = details?.font_scores as FontScoreItem[] | undefined;
  const selectedOffsets = details?.selected_offsets as [number, number][] | undefined;
  const preBold = details?.pre_bold as number | undefined;

  // 各フォントのスコア辞書
  const scoreMap = useMemo(() => {
    const map = new Map<string, FontScoreItem>();
    if (fontScores) {
      for (const fs of fontScores) {
        map.set(fs.id, fs);
      }
    }
    return map;
  }, [fontScores]);

  // 解析完了時にスコア降順（高い順）にソート
  const sortedFonts = useMemo(() => {
    if (!fontScores || fontScores.length === 0) {
      return availableFonts;
    }
    return [...availableFonts].sort((a, b) => {
      const scoreA = scoreMap.get(a.id)?.score ?? -1;
      const scoreB = scoreMap.get(b.id)?.score ?? -1;
      return scoreB - scoreA;
    });
  }, [availableFonts, fontScores, scoreMap]);

  // 並び替え時のスムーズなFLIPアニメーション
  const listRef = useRef<HTMLDivElement>(null);
  const prevPositionsRef = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    if (!listRef.current) return;
    const container = listRef.current;
    const items = container.querySelectorAll<HTMLElement>("[data-font-id]");

    items.forEach((item) => {
      const id = item.dataset.fontId;
      if (!id) return;
      const prevTop = prevPositionsRef.current.get(id);
      const currentTop = item.getBoundingClientRect().top;

      if (prevTop !== undefined && Math.abs(prevTop - currentTop) > 0.5) {
        const deltaY = prevTop - currentTop;
        item.style.transform = `translateY(${deltaY}px)`;
        item.style.transition = "none";

        requestAnimationFrame(() => {
          item.style.transition =
            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, border-color 0.15s ease";
          item.style.transform = "";
        });
      }
    });

    const nextPositions = new Map<string, number>();
    items.forEach((item) => {
      const id = item.dataset.fontId;
      if (id) {
        nextPositions.set(id, item.getBoundingClientRect().top);
      }
    });
    prevPositionsRef.current = nextPositions;
  }, [sortedFonts]);

  const isAuto = selectedFont === "auto";
  const currentFid = isAuto ? (bestFontId || "zen_maru") : selectedFont;

  const getFontFamily = (fontId: string): string => {
    switch (fontId) {
      case "zen_maru":
        return "'Zen Maru Gothic', sans-serif";
      case "mplus":
        return "'M PLUS 1p', sans-serif";
      case "klee":
        return "'Klee One', cursive, sans-serif";
      case "shippori":
        return "'Shippori Mincho', serif";
      case "biz_udpgothic":
        return "'BIZ UDPGothic', sans-serif";
      case "yuji_mai":
        return "'Yuji Mai', serif";
      case "kaisei_tokumin":
        return "'Kaisei Tokumin', serif";
      case "dot_gothic":
        return "'DotGothic16', monospace";
      case "marumonica":
        return "'MaruMonica', monospace";
      default:
        return "inherit";
    }
  };

  // 単語文字ペア情報とオフセット
  const wordText = targetWord || details?.word || "";
  const n = wordText.length || 2;
  const halfLen = Math.max(1, Math.floor((n + 1) / 2));

  // ペア一覧生成
  const pairsInfo = Array.from({ length: halfLen }, (_, idx) => {
    const c1 = wordText[idx] || "";
    const c2 = wordText[n - 1 - idx] || "";
    const isCenter = idx === n - 1 - idx;
    return {
      index: idx,
      c1,
      c2,
      isCenter,
      label: isCenter ? `${c1} (中央)` : `${c1} ↔ ${c2}`,
    };
  });

  const baseOffsets = selectedOffsets || Array.from({ length: halfLen }, () => [0, 0] as [number, number]);
  const currentOffsets = customOffsets || baseOffsets;
  const isCustomized = customOffsets !== null && customOffsets !== undefined;

  // 現在の一致率スコア
  const baseScore = scoreMap.get(currentFid)?.score ?? 0;
  const currentScore = recalculatedScore !== null && recalculatedScore !== undefined ? recalculatedScore : baseScore;

  const handlePairOffsetChange = useCallback(
    (pairIdx: number, axis: "x" | "y", val: number) => {
      const clamped = Math.max(-15, Math.min(15, val));
      const next: [number, number][] = [];
      for (let i = 0; i < halfLen; i++) {
        const orig = currentOffsets[i] || [0, 0];
        if (i === pairIdx) {
          next.push(axis === "x" ? [clamped, orig[1]] : [orig[0], clamped]);
        } else {
          next.push(orig);
        }
      }
      onCustomOffsetsChange?.(next);
    },
    [halfLen, currentOffsets, onCustomOffsetsChange]
  );

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

      {/* 垂直フォントリスト (解析完了時にスコア降順ソート & FLIPアニメーション) */}
      <div className="font-list-vertical" ref={listRef}>
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
                {(isAuto && isCustomized ? currentScore : (scoreMap.get(bestFontId)?.score || 0)).toFixed(3)}
              </span>
            </div>
          )}
        </div>

        {/* 各フォントをスコア高い順に並べる */}
        {sortedFonts.map((font, idx) => {
          const isSelected = selectedFont === font.id;
          const scoreItem = scoreMap.get(font.id);
          const isBest = font.id === bestFontId;
          const offsets = isSelected && isCustomized ? currentOffsets : scoreItem?.offsets;
          const fontScoreVal = isSelected && isCustomized ? currentScore : (scoreItem ? scoreItem.score : null);

          return (
            <div
              key={font.id}
              data-font-id={font.id}
              className={`font-item-vertical ${isSelected ? "active" : ""}`}
              onClick={() => onFontChange(font.id)}
            >
              <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                <span className="font-item-rank">#{idx + 1}</span>
                <span
                  className={`font-item-name font-family-${font.id}`}
                  style={{ fontFamily: getFontFamily(font.id) }}
                >
                  {font.name}
                </span>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center" }}>
                {isBest && <span className="font-badge-best-sm">BEST</span>}
                {offsets && offsets.some(([offX, offY]) => offX !== 0 || offY !== 0) && (
                  <span className="font-item-offsets" title="180度回転重心微小シフト量">
                    ({offsets[0][0]},{offsets[0][1]})
                  </span>
                )}
                {fontScoreVal !== null && (
                  <span className="font-item-score">
                    {fontScoreVal.toFixed(3)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* XY微小シフト調整コントローラー (対応文字ペアごとに並べて調整可能) */}
      <div className="shift-controller-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            文字ペア別 重心位置微調整 (XYずらし)
          </span>
          {isCustomized && (
            <button
              className="shift-reset-btn"
              onClick={onResetOffsets}
              title="自動最適化された初期オフセット値に戻す"
            >
              <RotateCcw size={9} style={{ marginRight: "0.15rem", display: "inline-block", verticalAlign: "middle" }} />
              リセット ({baseScore.toFixed(3)})
            </button>
          )}
        </div>

        <div className="shift-pairs-list">
          {pairsInfo.map((p) => {
            const pOffset = currentOffsets[p.index] || [0, 0];
            const pDx = pOffset[0];
            const pDy = pOffset[1];

            return (
              <div key={p.index} className="shift-pair-card">
                <div className="shift-pair-header">
                  <span>{p.label}</span>
                  <span className="shift-pair-summary">
                    ({pDx > 0 ? `+${pDx}` : pDx}, {pDy > 0 ? `+${pDy}` : pDy})
                  </span>
                </div>

                {/* X方向スライダー */}
                <div className="shift-control-row">
                  <span className="shift-axis-label">x</span>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={1}
                    value={pDx}
                    onChange={(e) => handlePairOffsetChange(p.index, "x", parseInt(e.target.value, 10))}
                    className="shift-slider"
                  />
                  <div className="shift-val-stepper">
                    <button className="shift-btn" onClick={() => handlePairOffsetChange(p.index, "x", pDx - 1)}>-</button>
                    <span className="shift-val-display">{pDx > 0 ? `+${pDx}` : pDx}</span>
                    <button className="shift-btn" onClick={() => handlePairOffsetChange(p.index, "x", pDx + 1)}>+</button>
                  </div>
                </div>

                {/* Y方向スライダー */}
                <div className="shift-control-row">
                  <span className="shift-axis-label">y</span>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={1}
                    value={pDy}
                    onChange={(e) => handlePairOffsetChange(p.index, "y", parseInt(e.target.value, 10))}
                    className="shift-slider"
                  />
                  <div className="shift-val-stepper">
                    <button className="shift-btn" onClick={() => handlePairOffsetChange(p.index, "y", pDy - 1)}>-</button>
                    <span className="shift-val-display">{pDy > 0 ? `+${pDy}` : pDy}</span>
                    <button className="shift-btn" onClick={() => handlePairOffsetChange(p.index, "y", pDy + 1)}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 一致率再計算リアルタイムバナー */}
        <div className="shift-recalc-banner">
          <span style={{ color: "var(--text-secondary)" }}>
            補正後一致率:
          </span>
          <span className="shift-recalc-score">
            {currentScore.toFixed(3)}
          </span>
        </div>
      </div>

      {/* 事前太らせ等のサマリータグ */}
      {preBold !== undefined && preBold > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.4rem" }}>
          <div className="font-metric-tag" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }} title="近接ストロークを結合強化する異方性膨張">
            <Maximize2 size={10} color="var(--text-secondary)" />
            <span>
              事前太らせ: <strong style={{ fontFamily: "var(--font-mono)" }}>+{preBold}px</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
