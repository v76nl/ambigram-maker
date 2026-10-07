import React from "react";
import { Layers } from "lucide-react";
import type { WordItem } from "../services/api";

interface SymmetryCardProps {
  wordItem: WordItem | null;
}

export const SymmetryCard: React.FC<SymmetryCardProps> = ({ wordItem }) => {
  if (!wordItem) return null;

  return (
    <div className="swiss-card" style={{ gap: "0.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
        <Layers size={14} />
        <span>対称ペア解析 ({wordItem.target_text || wordItem.primary_display || wordItem.reading})</span>
      </div>
      <div className="pairs-grid">
        {wordItem.pairs.map((p, idx) => (
          <div key={idx} className="pair-badge">
            <span>
              {p.char1} {p.is_center ? "(自己反転)" : `↔ ${p.char2}`}
            </span>
            <span className="pair-score">
              {p.score.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
