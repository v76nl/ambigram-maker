import React, { useState } from "react";
import { RotateCw, Split, Layers, Palette, Award, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { WordItem, EngineResult, FontMeta, FontScoreItem } from "../services/api";

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
      <div className="m3-card canvas-card" style={{ color: "#888" }}>
        左側のリストから単語を選択するか、上部の入力欄から単語を入力してください。
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
  const bestFontName = details?.best_font_name;
  const fontScores = details?.font_scores as FontScoreItem[] | undefined;
  const bestScoreObj = fontScores?.find((s) => s.id === bestFontId);
  const bestScorePercent = bestScoreObj ? Math.round(bestScoreObj.score * 100) : null;

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
        {/* 手法クイック切り替えセレクター */}
        {onEngineChange && (
          <div className="engine-quick-bar">
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#666", marginRight: "0.25rem" }}>
              生成手法:
            </span>
            <button
              className={`engine-pill-btn ${activeEngine === "morphology" ? "active" : ""}`}
              onClick={() => onEngineChange("morphology")}
              title="論理積 (AND) で重なりを抽出し、モルフォロジー膨張で二重線を解消した滑らかな単一ストローク"
            >
              <span className="pill-badge pill-badge-primary">手法A</span>
              <span>論理積＋膨張 (二重線解消)</span>
            </button>

            <button
              className={`engine-pill-btn ${activeEngine === "skeleton" ? "active" : ""}`}
              onClick={() => onEngineChange("skeleton")}
              title="魏・山口 (2023) に着想を得た、距離場による中心線抽出と均一単一ストローク再描画"
            >
              <span className="pill-badge pill-badge-secondary">手法B</span>
              <span>骨格平均化 (単一ストローク)</span>
            </button>

            <button
              className={`engine-pill-btn ${activeEngine === "vector" ? "active" : ""}`}
              onClick={() => onEngineChange("vector")}
              title="フォントパスの正位置と180度反転を幾何学的にオーバーレイ配置 (原案)"
            >
              <span className="pill-badge">原案</span>
              <span>ベクター重ね合わせ</span>
            </button>

            <button
              className={`engine-pill-btn ${activeEngine === "bitmap" ? "active" : ""}`}
              onClick={() => onEngineChange("bitmap")}
              title="ビットマップ距離変換とエネルギー合成による輪郭最適化"
            >
              <span className="pill-badge">手法2</span>
              <span>ビットマップ最適化</span>
            </button>
          </div>
        )}

        {/* フォント最適化バー (Multi-Font Auto-Optimizer) */}
        {onFontChange && (
          <div className="font-opt-container">
            <div className="font-opt-header">
              <span className="font-opt-label">
                <Sparkles size={15} color="var(--md-sys-color-primary)" />
                フォント選定:
              </span>

              {/* 自動最適化 (AUTO) ボタン */}
              <button
                className={`font-pill-btn ${selectedFont === "auto" ? "active-auto" : ""}`}
                onClick={() => onFontChange("auto")}
                title="全フォントから重ね合わせ面積・IoUが最も高いフォントを自動選定"
              >
                <Sparkles size={13} />
                <span>自動最適化 (AUTO)</span>
                {bestFontName && <span className="auto-winner-pill">👑 {bestFontName}</span>}
              </button>

              {/* 手動フォント切り替えボタン群 */}
              {availableFonts.map((f) => {
                const scoreObj = fontScores?.find((s) => s.id === f.id);
                const isBest = f.id === bestFontId;
                const isSelected = selectedFont === f.id;
                return (
                  <button
                    key={f.id}
                    className={`font-pill-btn ${isSelected ? "active-manual" : ""}`}
                    onClick={() => onFontChange(f.id)}
                    title={`${f.name} (${f.style}): ${f.description}`}
                  >
                    <span>{f.name}</span>
                    {scoreObj && (
                      <span className={`font-score-tag ${isBest ? "best-score" : ""}`}>
                        {Math.round(scoreObj.score * 100)}%
                        {isBest && " 👑"}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* 詳細比較トグルボタン */}
              {fontScores && fontScores.length > 0 && (
                <button
                  className="font-compare-toggle-btn"
                  onClick={() => setShowFontDetails(!showFontDetails)}
                  title="5フォントの幾何スコアと適合度比較一覧を表示"
                >
                  {showFontDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showFontDetails ? "比較を閉じる" : "スコア比較"}</span>
                </button>
              )}
            </div>

            {/* フォント最適化・座標補正ステータス案内 */}
            {selectedFontName && (
              <div className="font-auto-summary">
                <Sparkles size={15} className="sparkle-anim" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span>
                      {selectedFont === "auto" ? "🏆 自動最適化適用中: " : "手動指定フォント: "}
                      <strong>『{selectedFontName}』</strong>
                      {bestScorePercent !== null && ` (${bestScorePercent}% 一致)`}
                    </span>
                    <span className="font-status-tag">
                      スタイル: <strong>{selectedStyle || "標準"}</strong>
                    </span>
                  </div>

                  {/* 座標揺らし＆フォント太らせ（ウェイト）結果の表示 */}
                  <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.75rem", opacity: 0.9, flexWrap: "wrap", marginTop: "0.15rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>📐 座標揺らし補正:</span>
                      <strong style={{ color: "var(--md-sys-color-primary)" }}>
                        {selectedOffsets && selectedOffsets.length > 0
                          ? selectedOffsets.map((off, idx) => `文字ペア${idx + 1}(ΔX:${off[0] > 0 ? "+" : ""}${off[0]}px, ΔY:${off[1] > 0 ? "+" : ""}${off[1]}px)`).join(" | ")
                          : "補正なし (0px, 0px)"}
                      </strong>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <span>⚖️ 事前太らせ (Pre-Bold):</span>
                      <strong style={{ color: "var(--md-sys-color-primary)" }}>
                        {preBold !== undefined ? `+${preBold}px 結合膨張` : "標準"}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* フォントスコア詳細展開パネル */}
            {showFontDetails && fontScores && (
              <div className="font-comparison-panel">
                <div className="font-comp-title">
                  <span>フォント別 重なり幾何スコア・座標補正 (調和平均IoU)</span>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    ※クリックで直接そのフォントに切り替え可能
                  </span>
                </div>
                <div className="font-comp-grid">
                  {fontScores.map((s, idx) => {
                    const isWinner = s.id === bestFontId;
                    const isCurrent = (selectedFont === "auto" && isWinner) || selectedFont === s.id;
                    const pct = Math.round(s.score * 100);
                    const offsets = (s as any).offsets as [number, number][] | undefined;
                    const offsetLabel = offsets && offsets.length > 0
                      ? offsets.map((off, i) => `ペア${i + 1}(${off[0] > 0 ? "+" : ""}${off[0]}, ${off[1] > 0 ? "+" : ""}${off[1]})`).join(" ")
                      : "(0, 0)";

                    return (
                      <div
                        key={s.id}
                        className={`font-comp-item ${isCurrent ? "current-item" : ""} ${isWinner ? "winner-item" : ""}`}
                        onClick={() => onFontChange(s.id)}
                      >
                        <div className="font-comp-row">
                          <span className="font-comp-name">
                            {idx === 0 && "🥇 "}
                            {idx === 1 && "🥈 "}
                            {idx === 2 && "🥉 "}
                            {s.name}
                            <span className="font-comp-style">({s.style})</span>
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="font-comp-offset-tag" title="座標揺らし探索で算出された最適オフセット">
                              📐 {offsetLabel}
                            </span>
                            <span className="font-comp-pct">
                              {pct}%
                              {isWinner && <span className="winner-badge">最高</span>}
                            </span>
                          </div>
                        </div>
                        <div className="font-comp-bar-bg">
                          <div
                            className={`font-comp-bar-fill ${isWinner ? "bar-winner" : ""}`}
                            style={{ width: `${Math.max(10, pct)}%` }}
                          />
                        </div>
                        <div className="font-comp-desc">{s.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 手法の動作概要ヒント */}
        <div style={{ fontSize: "0.78rem", color: "#666", marginBottom: "1rem", textAlign: "center" }}>
          {activeEngine === "morphology" && "★ 手法A: 正反のピクセル論理積 (AND) を『共通対称核』とし、モルフォロジー膨張で二重線を解消"}
          {activeEngine === "skeleton" && "★ 手法B: 魏・山口 (2023) 準拠。調和平均距離場から中心骨格を抽出し、均一ブラシで一本化"}
          {activeEngine === "vector" && "ベクター重ね合わせ: 2文字のアウトラインを直接重ね合わせる原案 (二重線・ゴーストが発生)"}
          {activeEngine === "bitmap" && "ビットマップ最適化: 距離場と重み付きエネルギー合成による滑らかな輪郭融合"}
        </div>

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
          <span>文字ペア対称性・スコア詳細 ({wordItem.reading}{wordItem.katakana && wordItem.katakana.length > 0 ? ` [${wordItem.katakana[0]}]` : (wordItem.kanji && wordItem.kanji.length > 0 && !["此処", "其処"].includes(wordItem.kanji[0]) ? ` [${wordItem.kanji[0]}]` : "")})</span>
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
