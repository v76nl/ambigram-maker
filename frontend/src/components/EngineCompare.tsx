import React from "react";
import { Wand2, Sparkles, Image as ImageIcon, Code } from "lucide-react";
import type { EngineResult } from "../services/api";

interface EngineCompareProps {
  activeEngine: string;
  onEngineChange: (engine: string) => void;
  results: {
    vector?: EngineResult;
    bitmap?: EngineResult;
    gemini?: EngineResult;
  };
  // ベクター用パラメータ
  blendRatio: number;
  onBlendRatioChange: (val: number) => void;
  // ビットマップ用パラメータ
  blendWeight: number;
  onBlendWeightChange: (val: number) => void;
  smoothness: number;
  onSmoothnessChange: (val: number) => void;
  thresholdVal: number;
  onThresholdValChange: (val: number) => void;
  // Gemini API用パラメータ
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  stylePrompt: string;
  onStylePromptChange: (val: string) => void;
  // 生成トリガー
  onRegenerate: () => void;
  isGenerating: boolean;
}

export const EngineCompare: React.FC<EngineCompareProps> = ({
  activeEngine,
  onEngineChange,
  results,
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
    <section className="m3-card">
      {/* タブヘッダー */}
      <div className="m3-tabs">
        <button
          className={`m3-tab ${activeEngine === "vector" ? "active" : ""}`}
          onClick={() => onEngineChange("vector")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Code size={16} />
            <span>1. ベクター / 幾何合成</span>
            {results.vector && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>
        <button
          className={`m3-tab ${activeEngine === "bitmap" ? "active" : ""}`}
          onClick={() => onEngineChange("bitmap")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ImageIcon size={16} />
            <span>2. ビットマップ最適化</span>
            {results.bitmap && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>
        <button
          className={`m3-tab ${activeEngine === "gemini" ? "active" : ""}`}
          onClick={() => onEngineChange("gemini")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sparkles size={16} />
            <span>3. Gemini API 生成</span>
            {results.gemini?.type === "png" && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>
      </div>

      {/* パラメータ設定エリア */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
        {activeEngine === "vector" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="slider-group">
              <div className="slider-header">
                <span>幾何ブレンド率 (共通骨格 vs 差分ストローク)</span>
                <span>{(blendRatio * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="0"
                max="1"
                step="0.05"
                value={blendRatio}
                onChange={(e) => onBlendRatioChange(parseFloat(e.target.value))}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--md-sys-color-on-surface-variant)" }}>
              フォントのアウトラインを直接幾何学的にマージし、180度反転した文字スロットと融合させたベクターSVGを生成します。拡大縮小しても劣化しません。
            </p>
          </div>
        )}

        {activeEngine === "bitmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="slider-group">
              <div className="slider-header">
                <span>差分ストローク重み (blend_weight)</span>
                <span>{(blendWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="0.1"
                max="1.0"
                step="0.05"
                value={blendWeight}
                onChange={(e) => onBlendWeightChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>輪郭の滑らかさ (smoothness)</span>
                <span>{smoothness} px</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="1"
                max="15"
                step="2"
                value={smoothness}
                onChange={(e) => onSmoothnessChange(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>2値化閾値 (threshold)</span>
                <span>{thresholdVal}</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="50"
                max="200"
                step="5"
                value={thresholdVal}
                onChange={(e) => onThresholdValChange(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        )}

        {activeEngine === "gemini" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="m3-textfield">
              <label>Gemini API キー (未入力時は環境変数 GEMINI_API_KEY を参照)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="password"
                  className="m3-input"
                  style={{ flex: 1 }}
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                />
              </div>
            </div>

            <div className="m3-textfield">
              <label>デザインスタイル プロンプト</label>
              <input
                type="text"
                className="m3-input"
                placeholder="例: minimalist black calligraphy on pure white background, sharp vector aesthetic"
                value={stylePrompt}
                onChange={(e) => onStylePromptChange(e.target.value)}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--md-sys-color-on-surface-variant)" }}>
              Gemini API (Imagen 3) の画像生成モデルを用いて、180度回転自己対称アンビグラムアートを生成します。
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="m3-btn m3-btn-primary"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <Wand2 size={16} />
            {isGenerating ? "生成中..." : "パラメータを適用して再生成"}
          </button>
        </div>
      </div>
    </section>
  );
};
