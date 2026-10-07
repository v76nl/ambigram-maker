import React, { useState } from "react";
import { ArrowRight, Search, AlertCircle, BookOpen, Layers, SlidersHorizontal } from "lucide-react";
import type { WordItem } from "../services/api";

interface WordSearchProps {
  words: WordItem[];
  selectedWord: WordItem | null;
  onSelectWord: (word: WordItem) => void;
  onCustomWordSubmit: (word: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  minLength: number;
  maxLength: number;
  onLengthChange: (min: number, max: number) => void;
  commonOnly: boolean;
  onCommonOnlyChange: (val: boolean) => void;
  includeHiragana: boolean;
  includeKanji: boolean;
  includeKatakana: boolean;
  onToggleHiragana: () => void;
  onToggleKanji: () => void;
  onToggleKatakana: () => void;
  minScore: number;
  onMinScoreChange: (val: number) => void;
  limit: number;
  onLimitChange: (val: number) => void;
  isLoading: boolean;
  loadError?: string | null;
  onRetry?: () => void;
}

export const WordSearch: React.FC<WordSearchProps> = ({
  words,
  selectedWord,
  onSelectWord,
  onCustomWordSubmit,
  searchQuery,
  onSearchQueryChange,
  minLength,
  maxLength,
  onLengthChange,
  commonOnly,
  onCommonOnlyChange,
  includeHiragana,
  includeKanji,
  includeKatakana,
  onToggleHiragana,
  onToggleKanji,
  onToggleKatakana,
  minScore,
  onMinScoreChange,
  limit,
  onLimitChange,
  isLoading,
  loadError,
  onRetry,
}) => {
  const [customInput, setCustomInput] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onCustomWordSubmit(customInput.trim());
    }
  };

  return (
    <aside className="swiss-card" style={{ height: "fit-content" }}>
      {/* 自由入力欄 (Subtractive: 冗長なラベルを排しプレースホルダーに集約) */}
      <form onSubmit={handleCustomSubmit} className="swiss-field">
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <input
            type="text"
            className="swiss-input"
            style={{ flex: 1 }}
            placeholder="単語を入力 (例: ここ, ひらがな)"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
          <button type="submit" className="swiss-btn swiss-btn-primary" title="入力単語を生成">
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* 絞り込み検索 */}
      <div className="swiss-field">
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="swiss-input"
            style={{ paddingLeft: "1.9rem" }}
            placeholder="検索 (正規表現対応: 例 .+の.+)"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          <Search
            size={13}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)" }}
          />
        </div>
      </div>

      {/* フィルタセグメント & 文字種 & 文字数スライダー */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
        {/* 文字種トグル */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <span className="swiss-field-label">文字種</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
            <button
              type="button"
              className={`script-toggle-btn ${includeHiragana ? "active" : ""}`}
              onClick={onToggleHiragana}
              title="元からひらがなの語（漢字・カタカナの変換語を含まない）"
            >
              ひらがな
            </button>
            <button
              type="button"
              className={`script-toggle-btn ${includeKanji ? "active" : ""}`}
              onClick={onToggleKanji}
              title="漢字表記を含む語"
            >
              漢字
            </button>
            <button
              type="button"
              className={`script-toggle-btn ${includeKatakana ? "active" : ""}`}
              onClick={onToggleKatakana}
              title="カタカナ表記を含む語"
            >
              カタカナ
            </button>
          </div>
        </div>

        {/* 語彙範囲 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="swiss-field-label">
            <Layers size={13} />
            語彙範囲
          </span>
          <div className="swiss-segmented">
            <button
              type="button"
              className={`swiss-segmented-btn ${commonOnly ? "active" : ""}`}
              onClick={() => onCommonOnlyChange(true)}
            >
              <BookOpen size={12} />
              常用語
            </button>
            <button
              type="button"
              className={`swiss-segmented-btn ${!commonOnly ? "active" : ""}`}
              onClick={() => onCommonOnlyChange(false)}
            >
              全辞書
            </button>
          </div>
        </div>

        {/* 文字長範囲デュアルスライダー (1つのUIで最小・最大を同時指定) */}
        <div className="swiss-slider-group">
          <div className="swiss-slider-header">
            <span>文字長範囲</span>
            <span className="swiss-slider-val">
              {minLength === maxLength ? `${minLength} 字固定` : `${minLength} 〜 ${maxLength} 字`}
            </span>
          </div>
          <div className="dual-range-slider">
            <div className="dual-range-track" />
            <div
              className="dual-range-highlight"
              style={{
                left: `${((minLength - 1) / (7 - 1)) * 100}%`,
                width: `${((maxLength - minLength) / (7 - 1)) * 100}%`,
              }}
            />
            {/* 最小文字数つまみ */}
            <input
              type="range"
              className="dual-range-input"
              min="1"
              max="7"
              value={minLength}
              aria-label="最小文字数"
              style={{ zIndex: minLength >= 4 ? 4 : 3 }}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val > maxLength) {
                  onLengthChange(val, val);
                } else {
                  onLengthChange(val, maxLength);
                }
              }}
            />
            {/* 最大文字数つまみ */}
            <input
              type="range"
              className="dual-range-input"
              min="1"
              max="7"
              value={maxLength}
              aria-label="最大文字数"
              style={{ zIndex: minLength >= 4 ? 3 : 4 }}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val < minLength) {
                  onLengthChange(val, val);
                } else {
                  onLengthChange(minLength, val);
                }
              }}
            />
          </div>
          <span className="swiss-slider-hint">
            左右のつまみで検索対象の文字数範囲（1〜7字）を絞り込み
          </span>
        </div>

        {/* 最小スコア (品質基準) スライダー */}
        <div className="swiss-slider-group">
          <div className="swiss-slider-header">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <SlidersHorizontal size={11} />
              最小スコア
            </span>
            <span className="swiss-slider-val">
              {minScore.toFixed(3)}
              <span style={{ fontSize: "0.68rem", color: minScore >= 0.8 ? "var(--accent)" : "var(--text-muted)", marginLeft: "0.3rem" }}>
                {minScore >= 0.85 ? "厳選" : minScore >= 0.75 ? "高品質" : "標準"}
              </span>
            </span>
          </div>
          <input
            type="range"
            className="swiss-slider"
            min="0.50"
            max="0.90"
            step="0.05"
            value={minScore}
            onChange={(e) => onMinScoreChange(parseFloat(e.target.value))}
          />
        </div>

        {/* 表示上限件数 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="swiss-field-label">表示件数</span>
          <div className="swiss-segmented">
            {[50, 100, 200].map((num) => (
              <button
                key={num}
                type="button"
                className={`swiss-segmented-btn ${limit === num ? "active" : ""}`}
                onClick={() => onLimitChange(num)}
                style={{ padding: "0.2rem 0.5rem" }}
              >
                {num}件
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 単語リスト */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600 }}>候補 ({words.length})</span>
          {isLoading && (
            <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 600 }}>
              ● リアルタイム探索中...
            </span>
          )}
        </div>

        {loadError && (
          <div
            style={{
              padding: "0.6rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              background: "#fff5f5",
              border: "1px solid #fed7d7",
              color: "#c53030",
              fontSize: "0.75rem",
              lineHeight: 1.4,
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              <AlertCircle size={14} />
              <span>{loadError}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                className="swiss-btn swiss-btn-outline"
                style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", width: "fit-content" }}
                onClick={onRetry}
              >
                再試行
              </button>
            )}
          </div>
        )}

        <div className="word-list">
          {words.map((w) => {
            const mainText = w.target_text || w.primary_display || w.reading;
            const currentSelectedText = selectedWord?.target_text || selectedWord?.primary_display || selectedWord?.reading;
            const isSelected = currentSelectedText === mainText;
            const hasKanji = /[\u4e00-\u9faf]/.test(mainText) || Boolean(w.has_kanji);
            const hasSub = mainText !== w.reading;
            const showSub = hasSub && !hasKanji;

            return (
              <div
                key={`${mainText}_${w.reading}`}
                className={`word-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectWord(w)}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", minWidth: 0 }}>
                  <span className="word-main">{mainText}</span>
                  {showSub && <span className="word-reading-sub">{w.reading}</span>}
                </div>
                <div className="word-score">
                  {w.score.toFixed(3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
