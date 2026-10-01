import React, { useState } from "react";
import {
  RotateCw,
  Columns,
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
  const [showSplitView, setShowSplitView] = useState<boolean>(true);
  const [showFontDetails, setShowFontDetails] = useState<boolean>(false);

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
          alt={`アンビグラム: ${wordItem.reading}`}
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
              className={`swiss-btn ${showSplitView ? "swiss-btn-subtle" : "swiss-btn-outline"}`}
              onClick={() => setShowSplitView(!showSplitView)}
              title="正反スプリットビュー切り替え"
            >
              <Columns size={14} />
              <span>正反比較</span>
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

      {/* 正反スプリットビュー */}
      {showSplitView && (
        <div className="split-view-container">
          <div className="split-card">
            <span className="split-label">0° 正位置</span>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {renderGraphicContent(false)}
            </div>
          </div>
          <div className="split-card">
            <span className="split-label">180° 反転位置</span>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {renderGraphicContent(true)}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
