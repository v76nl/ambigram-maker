import React, { useState } from "react";
import { Sparkles, Filter, BookOpen } from "lucide-react";
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
    <aside className="m3-card" style={{ height: "fit-content" }}>
      {/* 自由入力・直接判定欄 */}
      <form onSubmit={handleCustomSubmit} className="m3-textfield">
        <label>任意の単語を直接評価</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            className="m3-input"
            style={{ flex: 1 }}
            placeholder="例: アイス, 大人, 花火, ここ"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
          <button type="submit" className="m3-btn m3-btn-primary" style={{ padding: "0.5rem 1rem", whiteSpace: "nowrap" }}>
            <Sparkles size={16} />
            判定
          </button>
        </div>
      </form>

      {/* 単語絞り込み検索バー */}
      <div className="m3-textfield" style={{ marginTop: "-0.25rem" }}>
        <label>辞書内キーワード絞り込み</label>
        <input
          type="text"
          className="m3-input"
          placeholder="ひらがな・カタカナ・漢字 (例: あいす, アイス, 大人)"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>

      {/* フィルタチップ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--md-sys-color-on-surface-variant)" }}>
          <Filter size={14} />
          <span>絞り込み条件</span>
        </div>
        <div className="chip-group">
          <button
            type="button"
            className={`m3-chip ${commonOnly ? "active" : ""}`}
            onClick={() => onCommonOnlyChange(true)}
          >
            <BookOpen size={14} />
            常用語のみ
          </button>
          <button
            type="button"
            className={`m3-chip ${!commonOnly ? "active" : ""}`}
            onClick={() => onCommonOnlyChange(false)}
          >
            全単語 ({words.length > 0 ? "20万語" : "読込中"})
          </button>
        </div>
      </div>

      {/* 単語長スライダー */}
      <div className="slider-group">
        <div className="slider-header">
          <span>文字数範囲</span>
          <span>{minLength} 〜 {maxLength} 文字</span>
        </div>
        <input
          type="range"
          className="m3-slider"
          min="2"
          max="6"
          value={maxLength}
          onChange={(e) => onLengthChange(2, parseInt(e.target.value, 10))}
        />
      </div>

      {/* 単語ランキング一覧 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--md-sys-color-on-surface-variant)" }}>
          <span>適正単語候補 ({words.length} 件)</span>
          {isLoading && <span>更新中...</span>}
        </div>

        {loadError && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              background: "#fee2e2",
              border: "1px solid #f87171",
              color: "#991b1b",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div>⚠️ {loadError}</div>
            {onRetry && (
              <button
                type="button"
                className="m3-btn"
                style={{
                  background: "#b91c1c",
                  color: "#fff",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  width: "fit-content",
                }}
                onClick={onRetry}
              >
                再接続を試す
              </button>
            )}
          </div>
        )}

        <div className="word-list">
          {words.map((w) => {
            const isSelected = selectedWord?.reading === w.reading;
            const hasVerified = w.pairs.some((p) => p.empirical_verified);

            // 実際に重ね合わせる文字（ひらがな）を最優先・主役に表示
            const mainReading = w.reading;

            // 補足としての意味ヒント（カタカナ語なら「アイス」、一般的な漢字表記なら「大人」など）
            let meaningHint = "";
            if (w.katakana && w.katakana.length > 0) {
              meaningHint = w.katakana[0]; // 例: アイス
            } else if (w.kanji && w.kanji.length > 0) {
              const firstKanji = w.kanji[0];
              // 「此処」「其処」など日常的に平仮名が標準的な単語の難読漢字は非表示
              if (!["此処", "其処", "何処", "此れ", "其れ", "彼処", "貴方"].includes(firstKanji)) {
                meaningHint = firstKanji; // 例: 大人, 花火, 頼む
              }
            }

            return (
              <div
                key={w.reading}
                className={`word-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectWord(w)}
              >
                <div>
                  <div className="word-reading" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.02em" }}>
                      {mainReading}
                    </span>
                    {meaningHint && (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          opacity: 0.65,
                          color: "var(--md-sys-color-on-surface-variant)",
                          fontWeight: 500,
                        }}
                      >
                        ({meaningHint})
                      </span>
                    )}
                    {hasVerified && (
                      <span
                        title="先行研究（井上・高橋 2020）で可読率100%が実証された文字ペアを含む単語"
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#059669",
                          background: "#ecfdf5",
                          padding: "0.08rem 0.35rem",
                          borderRadius: "4px",
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        実証
                      </span>
                    )}
                  </div>
                  <div className="word-meta">
                    {w.length}文字 {w.common ? "• 常用" : ""}
                  </div>
                </div>
                <div className="word-score">
                  {(w.score * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
