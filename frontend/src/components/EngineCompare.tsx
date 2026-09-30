import React from "react";
import { Wand2, Sparkles, Image as ImageIcon, Code, Disc, GitFork } from "lucide-react";
import type { EngineResult } from "../services/api";

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
  // 手法A (論理積モルフォロジー) パラメータ
  dilationSize: number;
  onDilationSizeChange: (val: number) => void;
  // 手法B (スケルトン平均化) パラメータ
  strokeThickness: number;
  onStrokeThicknessChange: (val: number) => void;
  // 手法A/B 共通 (異文字パーツ保持)
  diffBlend: number;
  onDiffBlendChange: (val: number) => void;
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
  dilationSize,
  onDilationSizeChange,
  strokeThickness,
  onStrokeThicknessChange,
  diffBlend,
  onDiffBlendChange,
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
      <div className="m3-tabs" style={{ flexWrap: "wrap" }}>
        <button
          className={`m3-tab ${activeEngine === "morphology" ? "active" : ""}`}
          onClick={() => onEngineChange("morphology")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Disc size={16} />
            <span>手法A: 論理積＋膨張</span>
            {results.morphology && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>

        <button
          className={`m3-tab ${activeEngine === "skeleton" ? "active" : ""}`}
          onClick={() => onEngineChange("skeleton")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <GitFork size={16} />
            <span>手法B: 骨格平均化</span>
            {results.skeleton && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>

        <button
          className={`m3-tab ${activeEngine === "vector" ? "active" : ""}`}
          onClick={() => onEngineChange("vector")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Code size={16} />
            <span>原案: ベクター合成</span>
            {results.vector && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>

        <button
          className={`m3-tab ${activeEngine === "bitmap" ? "active" : ""}`}
          onClick={() => onEngineChange("bitmap")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ImageIcon size={16} />
            <span>手法2: ビットマップ</span>
            {results.bitmap && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>

        <button
          className={`m3-tab ${activeEngine === "gemini" ? "active" : ""}`}
          onClick={() => onEngineChange("gemini")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sparkles size={16} />
            <span>手法3: Gemini AI</span>
            {results.gemini?.type === "png" && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
          </div>
        </button>
      </div>

      {/* パラメータ設定エリア */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        {/* 手法A: 論理積＋モルフォロジー膨張 */}
        {activeEngine === "morphology" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="slider-group">
              <div className="slider-header">
                <span>ストロークの太さ (モルフォロジー膨張径: dilation_size)</span>
                <span>{dilationSize} px</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="3"
                max="25"
                step="2"
                value={dilationSize}
                onChange={(e) => onDilationSizeChange(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>輪郭の滑らかさ (ガウシアン平滑化: smoothness)</span>
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
                <span>異文字パーツ保持率 (差分ブレンド: diff_blend)</span>
                <span>{(diffBlend * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="0.1"
                max="0.8"
                step="0.05"
                value={diffBlend}
                onChange={(e) => onDiffBlendChange(parseFloat(e.target.value))}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--md-sys-color-on-surface-variant)" }}>
              正位置と180度反転文字のピクセル論理積 (AND) を『共通対称核』として抽出。モルフォロジー膨張により二重線・ゴーストを解消し、丸みのある滑らかな一本のストロークを生成します。
            </p>
          </div>
        )}

        {/* 手法B: 骨格中心線平均化 */}
        {activeEngine === "skeleton" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="slider-group">
              <div className="slider-header">
                <span>単一ストローク線幅 (筆ペン径: stroke_thickness)</span>
                <span>{strokeThickness} px</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="5"
                max="31"
                step="2"
                value={strokeThickness}
                onChange={(e) => onStrokeThicknessChange(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>異文字固有骨格の重み (diff_blend)</span>
                <span>{(diffBlend * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                className="m3-slider"
                min="0.1"
                max="0.8"
                step="0.05"
                value={diffBlend}
                onChange={(e) => onDiffBlendChange(parseFloat(e.target.value))}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--md-sys-color-on-surface-variant)" }}>
              魏・山口 (2023) に着想を得た骨格アプローチ。ユークリッド距離変換の調和平均場から平均中心線（スケルトン）を抽出し、指定した線幅の均一な丸筆ストロークとして滑らかに再描画します。
            </p>
          </div>
        )}

        {/* 原案: ベクター幾何合成 */}
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
              フォントのアウトラインを直接幾何学的にマージし、180度反転した文字スロットと重ね合わせ配置したベクターSVG。拡大縮小に強い一方、上下非対称な文字では二重線が発生します。
            </p>
          </div>
        )}

        {/* 手法2: ビットマップ最適化 */}
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

        {/* 手法3: Gemini AI */}
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

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
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
