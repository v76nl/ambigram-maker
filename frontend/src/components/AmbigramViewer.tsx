import React, { useState } from "react";
import {
  RotateCw,
  GitCompare,
  Palette,
  Eye,
  Undo2,
  RefreshCw,
} from "lucide-react";
import type { WordItem, EngineResult, ReadabilityResponse, PipelineStep } from "../services/api";
import { usePixelDiff } from "../hooks/usePixelDiff";
import { DiffInspector } from "./DiffInspector";
import { PipelineViewer } from "./PipelineViewer";
import { ReadabilityCard } from "./ReadabilityCard";

interface AmbigramViewerProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
  onEngineChange?: (engine: string) => void;
  highlightMode?: boolean;
  onToggleHighlightMode?: () => void;
  readabilityData?: ReadabilityResponse | null;
  isReadabilityLoading?: boolean;
  isGenerating?: boolean;
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
  isGenerating = false,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [showDiffView, setShowDiffView] = useState<boolean>(true);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // 手法や結果が変わった場合はステッププレビュー選択を同期リセット (React公式: state adjustment during render)
  const [prevDataKey, setPrevDataKey] = useState<string>("");
  const currentDataKey = `${activeEngine}-${activeResult?.data || ""}`;
  if (prevDataKey !== currentDataKey) {
    setPrevDataKey(currentDataKey);
    setSelectedStepIndex(null);
  }

  // 点対称ピクセル差分計算フック
  const { diffImageUrl, diffStats, isDiffLoading } = usePixelDiff(activeResult);

  const pipelineSteps: PipelineStep[] = activeResult?.steps || [];
  const activeStep: PipelineStep | null =
    selectedStepIndex !== null && pipelineSteps[selectedStepIndex] ? pipelineSteps[selectedStepIndex] : null;

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
    // 中間工程ステップがプレビュー選択されている場合
    if (activeStep) {
      return (
        <img
          src={activeStep.image}
          alt={`Step ${activeStep.step}: ${activeStep.title}`}
          style={{
            maxWidth: "100%",
            height: "auto",
            transform: isFlipped ? "rotate(180deg)" : "none",
          }}
        />
      );
    }

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
        {/* 再生成中ローディングオーバーレイ */}
        {isGenerating && (
          <div className="canvas-generating-overlay">
            <div className="canvas-generating-indicator">
              <RefreshCw size={15} className="spin" />
              <span>生成中……</span>
            </div>
          </div>
        )}

        {/* 手法切り替えセグメント */}
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

        {/* 中間ステッププレビュー中バナー */}
        {activeStep && (
          <div className="pipeline-preview-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={15} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                中間工程プレビュー中: STEP {activeStep.step} - {activeStep.title}
              </span>
            </div>
            <button
              className="swiss-btn swiss-btn-subtle"
              style={{ padding: "0.2rem 0.6rem", fontSize: "0.72rem" }}
              onClick={() => setSelectedStepIndex(null)}
              title="完成アンビグラム表示に戻す"
            >
              <Undo2 size={12} />
              <span>完成結果に戻す</span>
            </button>
          </div>
        )}

        {/* 回転アニメーションキャンバス */}
        <div
          className="canvas-rotating-wrapper"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {renderGraphicContent(false)}
        </div>

        {/* コントロールバー */}
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

      {/* 生成工程パイプライン (Processing Pipeline Steps) */}
      <PipelineViewer
        steps={pipelineSteps}
        selectedStepIndex={selectedStepIndex}
        onSelectStep={setSelectedStepIndex}
      />

      {/* 点対称ピクセル差分インスペクター (180° Symmetry Difference) */}
      <DiffInspector
        show={showDiffView}
        isDiffLoading={isDiffLoading}
        diffImageUrl={diffImageUrl}
        diffStats={diffStats}
      />

      {/* AI客観文字認識率・双方向可読性評価 */}
      <ReadabilityCard
        data={readabilityData || null}
        isLoading={isReadabilityLoading}
      />
    </section>
  );
};
