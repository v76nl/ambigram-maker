import React, { useState, useEffect } from "react";
import {
  RotateCw,
  GitCompare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Maximize2,
  Type,
  Palette,
} from "lucide-react";
import type { WordItem, EngineResult, FontScoreItem, FontMeta } from "../services/api";

interface AmbigramViewerProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
  onEngineChange?: (engine: string) => void;
  highlightMode?: boolean;
  onToggleHighlightMode?: () => void;
  selectedFont?: string;
  onFontChange?: (fontId: string) => void;
  availableFonts?: FontMeta[];
}

export const AmbigramViewer: React.FC<AmbigramViewerProps> = ({
  wordItem,
  activeResult,
  activeEngine,
  onEngineChange,
  highlightMode = false,
  onToggleHighlightMode,
  selectedFont = "auto",
  onFontChange,
  availableFonts = [],
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [showDiffView, setShowDiffView] = useState<boolean>(true);
  const [showFontDetails, setShowFontDetails] = useState<boolean>(false);
  const [diffImageUrl, setDiffImageUrl] = useState<string | null>(null);
  const [diffStats, setDiffStats] = useState<{
    overlapRatio: number;
    diffRatio: number;
    posDiffRatio: number;
    rotDiffRatio: number;
  } | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState<boolean>(false);

  // 点対称ピクセル差分（180度回転とのピクセル差分）のリアルタイム計算
  useEffect(() => {
    if (!activeResult || activeResult.type === "error" || !activeResult.data) {
      setDiffImageUrl(null);
      setDiffStats(null);
      return;
    }

    setIsDiffLoading(true);
    let isMounted = true;
    const img = new Image();

    const runDiffCalculation = () => {
      try {
        const w = img.naturalWidth || img.width || 600;
        const h = img.naturalHeight || img.height || 300;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);

        const srcData = ctx.getImageData(0, 0, w, h);
        const src = srcData.data;

        const outData = ctx.createImageData(w, h);
        const out = outData.data;

        // 文字ストローク判定 (白背景に対し、輝度 < 210 を文字とする)
        const isDark = (x: number, y: number) => {
          const i = (y * w + x) * 4;
          const a = src[i + 3];
          if (a < 30) return false;
          const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
          return lum < 210;
        };

        let overlapCount = 0;
        let posOnlyCount = 0;
        let rotOnlyCount = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const rx = w - 1 - x;
            const ry = h - 1 - y;

            const p0 = isDark(x, y);
            const p180 = isDark(rx, ry);

            const i = (y * w + x) * 4;

            if (p0 && p180) {
              // 共通対称核 (墨黒)
              out[i] = 24;
              out[i + 1] = 24;
              out[i + 2] = 27;
              out[i + 3] = 255;
              overlapCount++;
            } else if (p0 && !p180) {
              // 正位置のみ固有差分 (朱赤)
              out[i] = 225;
              out[i + 1] = 59;
              out[i + 2] = 25;
              out[i + 3] = 255;
              posOnlyCount++;
            } else if (!p0 && p180) {
              // 180°反転位置のみ固有差分 (コバルトブルー)
              out[i] = 37;
              out[i + 1] = 99;
              out[i + 2] = 235;
              out[i + 3] = 255;
              rotOnlyCount++;
            } else {
              // 背景 (白)
              out[i] = 255;
              out[i + 1] = 255;
              out[i + 2] = 255;
              out[i + 3] = 255;
            }
          }
        }

        ctx.putImageData(outData, 0, 0);
        const totalUnion = overlapCount + posOnlyCount + rotOnlyCount;
        const overlapRatio = totalUnion > 0 ? (overlapCount / totalUnion) * 100 : 0;
        const diffRatio = totalUnion > 0 ? ((posOnlyCount + rotOnlyCount) / totalUnion) * 100 : 0;

        if (isMounted) {
          setDiffStats({
            overlapRatio: Math.round(overlapRatio * 10) / 10,
            diffRatio: Math.round(diffRatio * 10) / 10,
            posDiffRatio: totalUnion > 0 ? Math.round((posOnlyCount / totalUnion) * 1000) / 10 : 0,
            rotDiffRatio: totalUnion > 0 ? Math.round((rotOnlyCount / totalUnion) * 1000) / 10 : 0,
          });
          setDiffImageUrl(canvas.toDataURL("image/png"));
          setIsDiffLoading(false);
        }
      } catch (err) {
        console.error("ピクセル差分計算エラー:", err);
        if (isMounted) setIsDiffLoading(false);
      }
    };

    img.onload = runDiffCalculation;
    img.onerror = () => {
      if (isMounted) setIsDiffLoading(false);
    };

    if (activeResult.type === "png") {
      img.src = activeResult.data;
    } else if (activeResult.type === "svg") {
      const blob = new Blob([activeResult.data], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      img.src = url;
    }

    return () => {
      isMounted = false;
    };
  }, [activeResult]);

  if (!wordItem) {
    return (
      <div className="swiss-card" style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 1rem" }}>
        単語を選択するか、直接入力して生成してください。
      </div>
    );
  }

  const toggleRotation = () => {
    setRotation((prev) => (prev === 0 ? 180 : 0));
  };

  const details = activeResult?.details;
  const selectedFontName = details?.selected_font_name;
  const selectedStyle = details?.selected_style;
  const selectedOffsets = details?.selected_offsets as [number, number][] | undefined;
  const preBold = details?.pre_bold as number | undefined;
  const bestFontId = details?.best_font_id;
  const fontScores = details?.font_scores as FontScoreItem[] | undefined;
  const bestScoreObj = fontScores?.find((s) => s.id === bestFontId);
  const bestScorePercent = bestScoreObj ? Math.round(bestScoreObj.score * 100) : null;

  const renderGraphicContent = (isFlipped: boolean = false) => {
    if (!activeResult) {
      return <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>生成中...</div>;
    }

    if (activeResult.type === "svg") {
      let svgData = activeResult.data;
      if (isFlipped) {
        svgData = svgData.replace("<svg", '<svg style="transform: rotate(180deg);"');
      }
      return (
        <div
          dangerouslySetInnerHTML={{ __html: svgData }}
          style={{
            maxWidth: "100%",
            height: "auto",
            display: "flex",
            justifyContent: "center",
          }}
        />
      );
    }

    if (activeResult.type === "png") {
      return (
        <img
          src={activeResult.data}
          alt={`アンビグラム: ${wordItem.target_text || wordItem.primary_display || wordItem.reading}`}
          style={{
            maxWidth: "100%",
            height: "auto",
            transform: isFlipped ? "rotate(180deg)" : "none",
          }}
        />
      );
    }

    if (activeResult.type === "error") {
      return (
        <div style={{ color: "var(--accent)", textAlign: "center", padding: "1rem", fontSize: "0.85rem" }}>
          {activeResult.message || "生成に失敗しました"}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="viewer-container">
      {/* メインビューワーカード */}
      <div className="canvas-card">
        {/* 手法切り替えセグメント (Subtractive: 余計な注釈を排し、端正に配置) */}
        {onEngineChange && (
          <div className="engine-bar">
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginRight: "0.25rem" }}>
              手法:
            </span>
            <button
              className={`engine-tab-btn ${activeEngine === "morphology" ? "active" : ""}`}
              onClick={() => onEngineChange("morphology")}
              title="論理積 (AND) とモルフォロジー膨張による二重線解消"
            >
              <span className="badge-pill">A</span>
              <span>論理積＋膨張</span>
            </button>

            <button
              className={`engine-tab-btn ${activeEngine === "skeleton" ? "active" : ""}`}
              onClick={() => onEngineChange("skeleton")}
              title="調和平均距離場による中心骨格線の抽出と単一ストローク化"
            >
              <span className="badge-pill">B</span>
              <span>骨格平均化</span>
            </button>

            <button
              className={`engine-tab-btn ${activeEngine === "vector" ? "active" : ""}`}
              onClick={() => onEngineChange("vector")}
              title="フォントパスの直接オーバーレイ配置"
            >
              <span className="badge-pill">原案</span>
              <span>ベクター合成</span>
            </button>

            <button
              className={`engine-tab-btn ${activeEngine === "bitmap" ? "active" : ""}`}
              onClick={() => onEngineChange("bitmap")}
              title="距離場エネルギー最適化"
            >
              <span className="badge-pill">手法2</span>
              <span>ビットマップ</span>
            </button>
          </div>
        )}

        {/* フォント最適化コントロール */}
        {onFontChange && (
          <div className="font-opt-box">
            <div className="font-opt-row">
              <span className="font-opt-label">
                <Type size={13} />
                フォント:
              </span>

              {/* 自動最適化 (AUTO) ボタン */}
              <button
                className={`font-btn ${selectedFont === "auto" ? "active-auto" : ""}`}
                onClick={() => onFontChange("auto")}
                title="IoU幾何スコア最大のフォントを自動適用"
              >
                <Sparkles size={12} />
                <span>自動最適化</span>
                {bestScorePercent !== null && (
                  <span className="font-score-text">({bestScorePercent}%)</span>
                )}
              </button>

              {/* フォント手動切り替えボタン群 */}
              {availableFonts.map((f) => {
                const scoreObj = fontScores?.find((s) => s.id === f.id);
                const isSelected = selectedFont === f.id;
                return (
                  <button
                    key={f.id}
                    className={`font-btn ${isSelected ? "active-manual" : ""}`}
                    onClick={() => onFontChange(f.id)}
                    title={`${f.name} (${f.style})`}
                  >
                    <span>{f.name}</span>
                    {scoreObj && (
                      <span className="font-score-text">
                        {Math.round(scoreObj.score * 100)}%
                      </span>
                    )}
                  </button>
                );
              })}

              {/* 詳細比較トグル */}
              {fontScores && fontScores.length > 0 && (
                <button
                  className="font-toggle-details-btn"
                  onClick={() => setShowFontDetails(!showFontDetails)}
                  title="全フォントの幾何スコアと最適シフトを表示"
                >
                  <span>比較</span>
                  {showFontDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>

            {/* 最適化情報バナー (Subtractive & Anti-vibe-coded) */}
            {selectedFontName && (
              <div className="font-status-banner">
                <div className="font-status-header">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontWeight: 600 }}>{selectedFontName}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      ({selectedStyle || "標準"})
                    </span>
                  </div>
                  {bestScorePercent !== null && (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent)" }}>
                      {bestScorePercent}% 一致
                    </span>
                  )}
                </div>

                <div className="font-status-specs">
                  <span className="spec-item">
                    <Crosshair size={12} />
                    <span>座標補正:</span>
                    <span className="spec-val">
                      {selectedOffsets && selectedOffsets.length > 0
                        ? selectedOffsets.map((off, idx) => `P${idx + 1}(${off[0] > 0 ? "+" : ""}${off[0]}, ${off[1] > 0 ? "+" : ""}${off[1]})`).join(" ")
                        : "(0, 0)"}
                    </span>
                  </span>
                  <span className="spec-item">
                    <Maximize2 size={12} />
                    <span>事前太らせ:</span>
                    <span className="spec-val">
                      {preBold !== undefined ? `+${preBold}px` : "0px"}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* フォントスコア比較一覧 (展開時) */}
            {showFontDetails && fontScores && (
              <div className="font-comp-panel">
                {fontScores.map((s, idx) => {
                  const isWinner = s.id === bestFontId;
                  const isCurrent = (selectedFont === "auto" && isWinner) || selectedFont === s.id;
                  const pct = Math.round(s.score * 100);
                  const offsets = (s as any).offsets as [number, number][] | undefined;
                  const offsetLabel = offsets && offsets.length > 0
                    ? offsets.map((off, i) => `P${i + 1}(${off[0] > 0 ? "+" : ""}${off[0]}, ${off[1] > 0 ? "+" : ""}${off[1]})`).join(" ")
                    : "(0, 0)";

                  return (
                    <div
                      key={s.id}
                      className={`font-comp-item ${isCurrent ? "current-item" : ""}`}
                      onClick={() => onFontChange(s.id)}
                    >
                      <span className="font-comp-name">
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginRight: "0.3rem" }}>
                          {idx + 1}.
                        </span>
                        {s.name}
                      </span>
                      <span className="font-comp-tag">
                        {offsetLabel}
                      </span>
                      <div className="font-comp-bar-wrapper">
                        <div
                          className={`font-comp-bar-fill ${isWinner ? "bar-winner" : ""}`}
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                      <span className="font-comp-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ベクターハイライト凡例 (アクティブ時のみ) */}
        {highlightMode && activeEngine === "vector" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              padding: "0.4rem 0.75rem",
              background: "var(--bg-subtle)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "0.75rem",
              fontSize: "0.75rem",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#1d4ed8" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1d4ed8" }} />
              正位置
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#c2410c" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c2410c" }} />
              180°反転
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#047857" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#047857" }} />
              共通・融合
            </span>
          </div>
        )}

        {/* 回転アニメーションキャンバス */}
        <div
          className="canvas-rotating-wrapper"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {renderGraphicContent(false)}
        </div>

        {/* コントロールバー (Fittsの法則: 直下に機能を集約) */}
        <div className="viewer-controls">
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="swiss-btn swiss-btn-primary"
              onClick={toggleRotation}
              title="180度回転"
            >
              <RotateCw size={14} />
              <span>反転 (180°)</span>
            </button>

            <button
              className={`swiss-btn ${showDiffView ? "swiss-btn-subtle" : "swiss-btn-outline"}`}
              onClick={() => setShowDiffView(!showDiffView)}
              title="点対称（180°反転）ピクセル差分解析の表示切り替え"
            >
              <GitCompare size={14} />
              <span>点対称差分</span>
            </button>

            {activeEngine === "vector" && onToggleHighlightMode && (
              <button
                className={`swiss-btn ${highlightMode ? "swiss-btn-accent" : "swiss-btn-outline"}`}
                onClick={onToggleHighlightMode}
                title="ストロークパーツの色分け表示"
              >
                <Palette size={14} />
                <span>色分け</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
              {rotation}°
            </span>
            <input
              type="range"
              className="swiss-slider"
              min="0"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              style={{ width: "90px" }}
            />
          </div>
        </div>
      </div>

      {/* 点対称ピクセル差分インスペクター (180° Symmetry Difference) */}
      {showDiffView && (
        <div className="diff-view-card">
          <div className="diff-header">
            <div className="diff-title">
              <GitCompare size={14} color="var(--accent)" />
              <span>点対称ピクセル差分解析 (180° Symmetry Difference)</span>
            </div>
            {diffStats && (
              <div className="diff-stats">
                <span className="diff-stat-badge diff-stat-match">
                  対称一致率 {diffStats.overlapRatio}%
                </span>
                <span className="diff-stat-badge diff-stat-diff">
                  非対称差分 {diffStats.diffRatio}%
                </span>
              </div>
            )}
          </div>

          <div className="diff-canvas-container">
            {isDiffLoading && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>差分計算中...</span>}
            {!isDiffLoading && diffImageUrl && (
              <img
                src={diffImageUrl}
                alt="点対称ピクセル差分"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
              />
            )}
            {!isDiffLoading && !diffImageUrl && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>画像がロードされていません</span>
            )}
          </div>

          <div className="diff-legend">
            <span className="diff-legend-item">
              <span className="diff-legend-dot" style={{ background: "#18181b" }} />
              共通対称核 (完全一致)
            </span>
            <span className="diff-legend-item">
              <span className="diff-legend-dot" style={{ background: "#e13b19" }} />
              正位置のみ固有差分
            </span>
            <span className="diff-legend-item">
              <span className="diff-legend-dot" style={{ background: "#2563eb" }} />
              180°反転のみ固有差分
            </span>
          </div>
        </div>
      )}

    </section>
  );
};
