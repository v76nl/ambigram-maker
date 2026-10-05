import React, { useState, useEffect } from "react";
import {
  RotateCw,
  GitCompare,
  Palette,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { WordItem, EngineResult, ReadabilityResponse } from "../services/api";

interface AmbigramViewerProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
  onEngineChange?: (engine: string) => void;
  highlightMode?: boolean;
  onToggleHighlightMode?: () => void;
  readabilityData?: ReadabilityResponse | null;
  isReadabilityLoading?: boolean;
}

export const AmbigramViewer: React.FC<AmbigramViewerProps> = ({
  wordItem,
  activeResult,
  activeEngine,
  onEngineChange,
  highlightMode = false,
  onToggleHighlightMode,
  readabilityData,
  isReadabilityLoading = false,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [showDiffView, setShowDiffView] = useState<boolean>(true);
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
      queueMicrotask(() => {
        setDiffImageUrl(null);
        setDiffStats(null);
      });
      return;
    }

    queueMicrotask(() => {
      setIsDiffLoading(true);
    });
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

      {/* AI客観文字認識率・双方向可読性評価 (魏・山口 2023 / 井上・高橋 2020) */}
      {readabilityData && (
        <div className="diff-view-card" style={{ marginTop: "1rem" }}>
          <div className="diff-header">
            <div className="diff-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Brain size={15} color="var(--accent)" />
              <span style={{ fontWeight: 600 }}>AI双方向文字認識率・客観可読性</span>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "4px",
                  background: "var(--bg-subtle, #f4f4f5)",
                  color: "var(--text-muted, #71717a)",
                  border: "1px solid var(--border-subtle, #e4e4e7)",
                }}
              >
                魏・山口 (2023) §2.2
              </span>
            </div>
            <div className="diff-stats" style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span
                className="diff-stat-badge"
                style={{
                  background:
                    readabilityData.overall_readability >= 0.7
                      ? "rgba(16, 185, 129, 0.15)"
                      : readabilityData.overall_readability >= 0.45
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(239, 68, 68, 0.15)",
                  color:
                    readabilityData.overall_readability >= 0.7
                      ? "#059669"
                      : readabilityData.overall_readability >= 0.45
                      ? "#d97706"
                      : "#dc2626",
                  fontWeight: 600,
                }}
              >
                総合双方向可読率 {Math.round(readabilityData.overall_readability * 100)}%
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "0.75rem",
              fontSize: "0.78rem",
              background: "var(--bg-canvas, #ffffff)",
              borderTop: "1px solid var(--border-subtle, #f0f0f0)",
              borderBottom: "1px solid var(--border-subtle, #f0f0f0)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${readabilityData.slots.length}, 1fr)`,
                gap: "0.5rem",
              }}
            >
              {readabilityData.slots.map((slot) => {
                const isGood = slot.status === "perfect";
                const isReadable = slot.status === "partial";
                const statusColor = isGood ? "#059669" : isReadable ? "#d97706" : "#dc2626";
                return (
                  <div
                    key={slot.slot_index}
                    style={{
                      border: `1px solid ${statusColor}33`,
                      borderRadius: "6px",
                      padding: "0.5rem",
                      background: `${statusColor}08`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.3rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border-subtle, #e4e4e7)",
                        paddingBottom: "0.25rem",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                        {slot.char1} <span style={{ color: "var(--text-muted)" }}>↔</span> {slot.char2}
                      </span>
                      {isGood ? (
                        <CheckCircle2 size={13} color={statusColor} />
                      ) : (
                        <AlertTriangle size={13} color={statusColor} />
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>正: {slot.char1} 認識率</span>
                      <span style={{ fontWeight: 600 }}>{Math.round(slot.prob1 * 100)}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>反: {slot.char2} 認識率</span>
                      <span style={{ fontWeight: 600 }}>{Math.round(slot.prob2 * 100)}%</span>
                    </div>

                    <div
                      style={{
                        marginTop: "0.2rem",
                        paddingTop: "0.2rem",
                        borderTop: "1px dashed var(--border-subtle, #e4e4e7)",
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      AI予測: {slot.top1_pred} / {slot.top2_pred}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="diff-legend"
            style={{
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
            }}
          >
            <span>対象フォント: {readabilityData.font_id}</span>
            <span>対象文字列: {readabilityData.target_text}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
              <Sparkles size={11} color="var(--accent)" />
              文脈認知補完: 井上・高橋 (2020) 表5
            </span>
          </div>
        </div>
      )}

      {isReadabilityLoading && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem",
            textAlign: "center",
            fontSize: "0.74rem",
            color: "var(--text-muted)",
          }}
        >
          AI文字認識率を解析中……
        </div>
      )}
    </section>
  );
};
