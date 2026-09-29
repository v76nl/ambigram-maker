import React, { useState } from "react";
import { RotateCw, Split, Layers, Palette, Award } from "lucide-react";
import type { WordItem, EngineResult } from "../services/api";

interface AmbigramViewerProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
  highlightMode?: boolean;
  onToggleHighlightMode?: () => void;
}

export const AmbigramViewer: React.FC<AmbigramViewerProps> = ({
  wordItem,
  activeResult,
  activeEngine,
  highlightMode = false,
  onToggleHighlightMode,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [showSplitView, setShowSplitView] = useState<boolean>(true);

  if (!wordItem) {
    return (
      <div className="m3-card canvas-card" style={{ color: "#888" }}>
        左側のリストから単語を選択するか、上部の入力欄から単語を入力してください。
      </div>
    );
  }

  const toggleRotation = () => {
    setRotation((prev) => (prev === 0 ? 180 : 0));
  };

  const renderGraphicContent = (isFlipped: boolean = false) => {
    if (!activeResult) {
      return <div>生成中...</div>;
    }

    if (activeResult.type === "svg") {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: activeResult.data }}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            color: "#111111",
            transform: isFlipped ? "rotate(180deg)" : "none",
          }}
        />
      );
    }

    if (activeResult.type === "png") {
      return (
        <img
          src={activeResult.data}
          alt={wordItem.reading}
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
        <div style={{ color: "#b00020", textAlign: "center", padding: "1rem" }}>
          {activeResult.message || "画像の生成に失敗しました"}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="viewer-container">
      {/* メインプレビューキャンバス */}
      <div className="canvas-card">
        {/* ハイライトモード時の凡例表示 (石崎ほか 2024「ひらがな~る」着想) */}
        {highlightMode && activeEngine === "vector" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "0.5rem 1rem",
              background: "var(--md-sys-color-surface-container-high)",
              borderRadius: "var(--md-sys-shape-corner-m)",
              marginBottom: "1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#2563eb" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb" }} />
              正位置固有ストローク
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#ea580c" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ea580c" }} />
              180°反転固有ストローク
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#065f46" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#065f46" }} />
              共通・融合ストローク
            </span>
          </div>
        )}

        {/* 回転アニメーションラッパー */}
        <div
          className="canvas-rotating-wrapper"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {renderGraphicContent(false)}
        </div>

        {/* 下部コントロール */}
        <div className="viewer-controls" style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="m3-btn m3-btn-primary"
              onClick={toggleRotation}
              title="180度反転"
            >
              <RotateCw size={18} />
              180° 回転 ({rotation}°)
            </button>

            <button
              className={`m3-btn ${showSplitView ? "m3-btn-tonal" : "m3-btn-outlined"}`}
              onClick={() => setShowSplitView(!showSplitView)}
              title="正位置・反転の同時比較表示"
            >
              <Split size={18} />
              正反スプリット表示
            </button>

            {/* 先行研究着想: パーツ対応ハイライトトグル */}
            {activeEngine === "vector" && onToggleHighlightMode && (
              <button
                className={`color-highlight-btn ${highlightMode ? "active" : "inactive"}`}
                onClick={onToggleHighlightMode}
                title="共通・固有ストロークの色分け表示 (青:正位置 / 橙:反転 / 緑:共通融合) [石崎ほか 2024]"
                id="stroke-color-toggle-btn"
              >
                <Palette size={18} />
                <span>{highlightMode ? "ストローク色分け [ON]" : "ストローク色分け"}</span>
                <span style={{ display: "inline-flex", gap: "4px", alignItems: "center", marginLeft: "2px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} title="正位置固有" />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ea580c", display: "inline-block" }} title="反転固有" />
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} title="共通・融合" />
                </span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#555", fontWeight: 700 }}>
              微調整: {rotation}°
            </span>
            <input
              type="range"
              min="0"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value, 10))}
              style={{ width: "120px" }}
            />
          </div>
        </div>
      </div>

      {/* 正反スプリットビュー */}
      {showSplitView && (
        <div className="split-view-container">
          <div className="split-card">
            <span className="split-label">正位置 (0°)</span>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {renderGraphicContent(false)}
            </div>
          </div>
          <div className="split-card">
            <span className="split-label">180° 回転反転位置 (上下逆)</span>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              {renderGraphicContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* 文字ペアの相性スコアカード */}
      <div className="m3-card" style={{ gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--md-sys-color-on-surface-variant)" }}>
          <Layers size={16} />
          <span>文字ペア対称性・スコア詳細 ({wordItem.reading})</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.25rem" }}>
          {wordItem.pairs.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--md-sys-color-surface-container-high)",
                padding: "0.5rem 0.85rem",
                borderRadius: "var(--md-sys-shape-corner-m)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "1px solid var(--md-sys-color-outline-variant)",
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {p.char1} {p.is_center ? "(自己反転)" : `↔ ${p.char2}`}
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--md-sys-color-primary)",
                  background: "var(--md-sys-color-surface-container-lowest)",
                  padding: "0.15rem 0.4rem",
                  borderRadius: "var(--md-sys-shape-corner-xs)",
                }}
              >
                {(p.score * 100).toFixed(0)}%
              </span>
              {/* 井上・高橋 (2020) 査読実証ペアのバッジ */}
              {p.empirical_verified && (
                <span
                  title="井上・高橋 (2020) 被験者実験で可読率100%が実証されたペア"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#059669",
                    background: "#ecfdf5",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "var(--md-sys-shape-corner-xs)",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <Award size={12} />
                  実証ペア
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
