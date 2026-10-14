import React from "react";
import { RefreshCw } from "lucide-react";
import type { EngineResult, FontMeta } from "../services/api";
import { PARAM_LABELS } from "../constants/labels";

interface EngineCompareProps {
  activeEngine: string;
  onEngineChange: (engine: string) => void;
  results: {
    vector?: EngineResult;
    morphology?: EngineResult;
    skeleton?: EngineResult;
    bitmap?: EngineResult;
    gemini?: EngineResult;
  };
  selectedFont?: string;
  onFontChange?: (fontId: string) => void;
  availableFonts?: FontMeta[];
  dilationSize: number;
  onDilationSizeChange: (val: number) => void;
  strokeThickness: number;
  onStrokeThicknessChange: (val: number) => void;
  diffBlend: number;
  onDiffBlendChange: (val: number) => void;
  preBold?: number;
  onPreBoldChange?: (val: number) => void;
  brushStyle?: "calligraphic" | "uniform";
  onBrushStyleChange?: (val: "calligraphic" | "uniform") => void;
  strokeModulation?: boolean;
  onStrokeModulationChange?: (val: boolean) => void;
  enableSnap?: boolean;
  onEnableSnapChange?: (val: boolean) => void;
  blendRatio: number;
  onBlendRatioChange: (val: number) => void;
  blendWeight: number;
  onBlendWeightChange: (val: number) => void;
  smoothness: number;
  onSmoothnessChange: (val: number) => void;
  thresholdVal: number;
  onThresholdValChange: (val: number) => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  stylePrompt: string;
  onStylePromptChange: (val: string) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export const EngineCompare: React.FC<EngineCompareProps> = ({
  activeEngine,
  onEngineChange,
  dilationSize,
  onDilationSizeChange,
  strokeThickness,
  onStrokeThicknessChange,
  diffBlend,
  onDiffBlendChange,
  preBold = 4,
  onPreBoldChange,
  brushStyle = "calligraphic",
  onBrushStyleChange,
  strokeModulation = true,
  onStrokeModulationChange,
  enableSnap = true,
  onEnableSnapChange,
  blendRatio,
  onBlendRatioChange,
  blendWeight,
  onBlendWeightChange,
  smoothness,
  onSmoothnessChange,
  thresholdVal,
  onThresholdValChange,
  apiKey,
  onApiKeyChange,
  stylePrompt,
  onStylePromptChange,
  onRegenerate,
  isGenerating,
}) => {
  return (
    <section className="swiss-card">
      {/* 手法切り替えタブ */}
      <div className="engine-tabs-nav">
        <button
          className={`engine-tab-item ${activeEngine === "skeleton" ? "active" : ""}`}
          onClick={() => onEngineChange("skeleton")}
          title="骨格平均化: 距離場スケルトン抽出と単一ストローク化"
        >
          骨格平均化
        </button>

        <button
          className={`engine-tab-item ${activeEngine === "morphology" ? "active" : ""}`}
          onClick={() => onEngineChange("morphology")}
          title="論理積: 論理積 (AND) ＋ モルフォロジー膨張"
        >
          論理積
        </button>

        <button
          className={`engine-tab-item ${activeEngine === "vector" ? "active" : ""}`}
          onClick={() => onEngineChange("vector")}
          title="ベクター合成: フォントパスの直接オーバーレイ配置"
        >
          ベクター合成
        </button>

        <button
          className={`engine-tab-item ${activeEngine === "bitmap" ? "active" : ""}`}
          onClick={() => onEngineChange("bitmap")}
          title="ビットマップ: 距離場エネルギー最適化"
        >
          ビットマップ
        </button>

        <button
          className={`engine-tab-item ${activeEngine === "gemini" ? "active" : ""}`}
          onClick={() => onEngineChange("gemini")}
          title="生成AI: Gemini 2.5 Flash"
        >
          AI
        </button>
      </div>

      {/* パラメータ調整グリッド */}
      <div className="tuning-grid">
        {/* 手法A/B 共通のストローク補正コントロール (呼称・コンポーネントを一元化) */}
        {(() => {
          const renderCommonStrokeControls = () => (
            <>
              {onPreBoldChange && (
                <div className="swiss-slider-group">
                  <div className="swiss-slider-header">
                    <span>{PARAM_LABELS.preBold.title}</span>
                    <span className="swiss-slider-val">{preBold}px</span>
                  </div>
                  <input
                    type="range"
                    className="swiss-slider"
                    min="0"
                    max="10"
                    step="1"
                    value={preBold}
                    onChange={(e) => onPreBoldChange(parseInt(e.target.value, 10))}
                  />
                  <span className="swiss-slider-hint">{PARAM_LABELS.preBold.hint}</span>
                </div>
              )}

              <div className="swiss-slider-group">
                <div className="swiss-slider-header">
                  <span>{PARAM_LABELS.diffBlend.title}</span>
                  <span className="swiss-slider-val">{Math.round(diffBlend * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="swiss-slider"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={diffBlend}
                  onChange={(e) => onDiffBlendChange(parseFloat(e.target.value))}
                />
                <span className="swiss-slider-hint">{PARAM_LABELS.diffBlend.hint}</span>
              </div>

              {onEnableSnapChange && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", cursor: "pointer", marginTop: "0.2rem" }}>
                  <input
                    type="checkbox"
                    checked={enableSnap}
                    onChange={(e) => onEnableSnapChange(e.target.checked)}
                  />
                  <span>{PARAM_LABELS.enableSnap.title}</span>
                </label>
              )}
            </>
          );

          return (
            <>
              {/* 手法Aのパラメータ */}
              {activeEngine === "morphology" && (
                <>
                  <div className="swiss-slider-group">
                    <div className="swiss-slider-header">
                      <span>{PARAM_LABELS.dilationSize.title}</span>
                      <span className="swiss-slider-val">{dilationSize}px</span>
                    </div>
                    <input
                      type="range"
                      className="swiss-slider"
                      min="3"
                      max="25"
                      step="2"
                      value={dilationSize}
                      onChange={(e) => onDilationSizeChange(parseInt(e.target.value, 10))}
                    />
                    <span className="swiss-slider-hint">{PARAM_LABELS.dilationSize.hint}</span>
                  </div>

                  <div className="swiss-slider-group">
                    <div className="swiss-slider-header">
                      <span>{PARAM_LABELS.smoothness.title}</span>
                      <span className="swiss-slider-val">{smoothness}px</span>
                    </div>
                    <input
                      type="range"
                      className="swiss-slider"
                      min="0"
                      max="15"
                      step="2"
                      value={smoothness}
                      onChange={(e) => onSmoothnessChange(parseInt(e.target.value, 10))}
                    />
                    <span className="swiss-slider-hint">{PARAM_LABELS.smoothness.hint}</span>
                  </div>

                  {renderCommonStrokeControls()}
                </>
              )}

              {/* 手法Bのパラメータ */}
              {activeEngine === "skeleton" && (
                <>
                  <div className="swiss-slider-group">
                    <div className="swiss-slider-header">
                      <span>{PARAM_LABELS.strokeThickness.title}</span>
                      <span className="swiss-slider-val">{strokeThickness}px</span>
                    </div>
                    <input
                      type="range"
                      className="swiss-slider"
                      min="5"
                      max="35"
                      step="2"
                      value={strokeThickness}
                      onChange={(e) => onStrokeThicknessChange(parseInt(e.target.value, 10))}
                    />
                    <span className="swiss-slider-hint">{PARAM_LABELS.strokeThickness.hint}</span>
                  </div>

                  {/* 先行研究: 筆文字スタイル & 太さ変調 (井上・高橋 2020 §5 / 野村 2018) */}
                  {onBrushStyleChange && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.3rem" }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                        {PARAM_LABELS.brushStyle.title}
                      </span>
                      <div className="swiss-segmented" style={{ display: "flex", width: "100%" }}>
                        <button
                          className={`swiss-segmented-btn ${brushStyle === "calligraphic" ? "active" : ""}`}
                          onClick={() => onBrushStyleChange("calligraphic")}
                          style={{ flex: 1, padding: "0.3rem 0.2rem", fontSize: "0.72rem" }}
                        >
                          {PARAM_LABELS.brushStyle.calligraphic}
                        </button>
                        <button
                          className={`swiss-segmented-btn ${brushStyle === "uniform" ? "active" : ""}`}
                          onClick={() => onBrushStyleChange("uniform")}
                          style={{ flex: 1, padding: "0.3rem 0.2rem", fontSize: "0.72rem" }}
                        >
                          {PARAM_LABELS.brushStyle.uniform}
                        </button>
                      </div>
                    </div>
                  )}

                  {onStrokeModulationChange && (
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", cursor: "pointer", marginTop: "0.4rem" }}>
                      <input
                        type="checkbox"
                        checked={strokeModulation}
                        onChange={(e) => onStrokeModulationChange(e.target.checked)}
                      />
                      <span>{PARAM_LABELS.strokeModulation.title}</span>
                    </label>
                  )}

                  {renderCommonStrokeControls()}
                </>
              )}
            </>
          );
        })()}

        {/* ベクター合成パラメータ */}
        {activeEngine === "vector" && (
          <div className="swiss-slider-group">
            <div className="swiss-slider-header">
              <span>{PARAM_LABELS.blendRatio.title}</span>
              <span className="swiss-slider-val">{Math.round(blendRatio * 100)}%</span>
            </div>
            <input
              type="range"
              className="swiss-slider"
              min="0.1"
              max="0.9"
              step="0.05"
              value={blendRatio}
              onChange={(e) => onBlendRatioChange(parseFloat(e.target.value))}
            />
            <span className="swiss-slider-hint">{PARAM_LABELS.blendRatio.hint}</span>
          </div>
        )}

        {/* ビットマップパラメータ */}
        {activeEngine === "bitmap" && (
          <>
            <div className="swiss-slider-group">
              <div className="swiss-slider-header">
                <span>{PARAM_LABELS.blendWeight.title}</span>
                <span className="swiss-slider-val">{Math.round(blendWeight * 100)}%</span>
              </div>
              <input
                type="range"
                className="swiss-slider"
                min="0.1"
                max="0.9"
                step="0.05"
                value={blendWeight}
                onChange={(e) => onBlendWeightChange(parseFloat(e.target.value))}
              />
              <span className="swiss-slider-hint">{PARAM_LABELS.blendWeight.hint}</span>
            </div>

            <div className="swiss-slider-group">
              <div className="swiss-slider-header">
                <span>{PARAM_LABELS.bitmapSmoothness.title}</span>
                <span className="swiss-slider-val">{smoothness}</span>
              </div>
              <input
                type="range"
                className="swiss-slider"
                min="1"
                max="21"
                step="2"
                value={smoothness}
                onChange={(e) => onSmoothnessChange(parseInt(e.target.value, 10))}
              />
              <span className="swiss-slider-hint">{PARAM_LABELS.bitmapSmoothness.hint}</span>
            </div>

            <div className="swiss-slider-group">
              <div className="swiss-slider-header">
                <span>{PARAM_LABELS.thresholdVal.title}</span>
                <span className="swiss-slider-val">{thresholdVal}</span>
              </div>
              <input
                type="range"
                className="swiss-slider"
                min="50"
                max="200"
                step="5"
                value={thresholdVal}
                onChange={(e) => onThresholdValChange(parseInt(e.target.value, 10))}
              />
              <span className="swiss-slider-hint">{PARAM_LABELS.thresholdVal.hint}</span>
            </div>
          </>
        )}

        {/* Gemini パラメータ */}
        {activeEngine === "gemini" && (
          <>
            <div className="swiss-field">
              <label className="swiss-field-label">Gemini API Key</label>
              <input
                type="password"
                className="swiss-input"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
              />
            </div>

            <div className="swiss-field">
              <label className="swiss-field-label">スタイルプロンプト</label>
              <input
                type="text"
                className="swiss-input"
                placeholder="例: calligraphic black ink on white"
                value={stylePrompt}
                onChange={(e) => onStylePromptChange(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* アクションフッター */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.85rem", marginTop: "0.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            className="swiss-btn swiss-btn-outline"
            onClick={onRegenerate}
            disabled={isGenerating}
            title="手動で再生成を実行"
          >
            <RefreshCw size={13} className={isGenerating ? "spin" : ""} />
            <span>{isGenerating ? "反映中..." : "再生成"}</span>
          </button>
          {isGenerating && (
            <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 500 }}>
              自動反映中...
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
