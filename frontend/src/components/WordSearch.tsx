import React, { useState } from "react";
import { ArrowRight, Search, AlertCircle, BookOpen, Layers } from "lucide-react";
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
            placeholder="リスト内を検索..."
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

      {/* フィルタセグメント & 文字数スライダー */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
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

        {/* 単語長スライダー */}
        <div className="swiss-slider-group">
          <div className="swiss-slider-header">
            <span>文字長</span>
            <span className="swiss-slider-val">{minLength} 〜 {maxLength} 字</span>
          </div>
          <input
            type="range"
            className="swiss-slider"
            min="2"
            max="6"
            value={maxLength}
            onChange={(e) => onLengthChange(2, parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      {/* 単語リスト */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <span style={{ fontWeight: 600 }}>候補 ({words.length})</span>
          {isLoading && <span>更新中...</span>}
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
            const isSelected = selectedWord?.reading === w.reading;
            const hasVerified = w.pairs.some((p) => p.empirical_verified);
            const mainReading = w.reading;

            let meaningHint = "";
            if (w.katakana && w.katakana.length > 0) {
              meaningHint = w.katakana[0];
            } else if (w.kanji && w.kanji.length > 0) {
              const firstKanji = w.kanji[0];
              if (!["此処", "其処", "何処", "此れ", "其れ", "彼処", "貴方"].includes(firstKanji)) {
                meaningHint = firstKanji;
              }
            }

            return (
              <div
                key={w.reading}
                className={`word-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectWord(w)}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="word-main">{mainReading}</span>
                  {meaningHint && <span className="word-hint">({meaningHint})</span>}
                  {hasVerified && (
                    <span className="word-badge-verified" title="実験実証済みペア">
                      実証
                    </span>
                  )}
                </div>
                <div className="word-score">
                  {Math.round(w.score * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
