import React, { useState } from "react";
import { Sparkles, Filter, BookOpen } from "lucide-react";
import type { WordItem } from "../services/api";

interface WordSearchProps {
  words: WordItem[];
  selectedWord: WordItem | null;
  onSelectWord: (word: WordItem) => void;
  onCustomWordSubmit: (word: string) => void;
  minLength: number;
  maxLength: number;
  onLengthChange: (min: number, max: number) => void;
  commonOnly: boolean;
  onCommonOnlyChange: (val: boolean) => void;
  isLoading: boolean;
}

export const WordSearch: React.FC<WordSearchProps> = ({
  words,
  selectedWord,
  onSelectWord,
  onCustomWordSubmit,
  minLength,
  maxLength,
  onLengthChange,
  commonOnly,
  onCommonOnlyChange,
  isLoading,
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
      {/* 自由入力欄 */}
      <form onSubmit={handleCustomSubmit} className="m3-textfield">
        <label>任意の単語を入力</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            className="m3-input"
            style={{ flex: 1 }}
            placeholder="例: しまつ, ほのお, ここ"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
          />
          <button type="submit" className="m3-btn m3-btn-primary" style={{ padding: "0.5rem 1rem" }}>
            <Sparkles size={16} />
            判定
          </button>
        </div>
      </form>

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

        <div className="word-list">
          {words.map((w) => {
            const isSelected = selectedWord?.reading === w.reading;
            const kanjiText = w.kanji && w.kanji.length > 0 ? `(${w.kanji[0]})` : "";
            return (
              <div
                key={w.reading}
                className={`word-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectWord(w)}
              >
                <div>
                  <div className="word-reading">
                    {w.reading} <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>{kanjiText}</span>
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
