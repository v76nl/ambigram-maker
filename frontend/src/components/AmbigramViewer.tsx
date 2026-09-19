import React, { useState } from "react";
import { RotateCw, Split, Layers } from "lucide-react";
import type { WordItem, EngineResult } from "../services/api";

interface AmbigramViewerProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
}

export const AmbigramViewer: React.FC<AmbigramViewerProps> = ({
  wordItem,
  activeResult,
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
        {/* 回転アニメーションラッパー */}
        <div
          className="canvas-rotating-wrapper"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {renderGraphicContent(false)}
        </div>

        {/* 下部コントロール */}
        <div className="viewer-controls" style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
