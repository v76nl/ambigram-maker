import React from "react";
import { GitCompare } from "lucide-react";
import type { DiffStats } from "../hooks/usePixelDiff";

interface DiffInspectorProps {
  show: boolean;
  isDiffLoading: boolean;
  diffImageUrl: string | null;
  diffStats: DiffStats | null;
}

export const DiffInspector: React.FC<DiffInspectorProps> = ({
  show,
  isDiffLoading,
  diffImageUrl,
  diffStats,
}) => {
  if (!show) return null;

  return (
    <div className="diff-view-card">
      <div className="diff-header">
        <div className="diff-title">
          <GitCompare size={14} color="var(--accent)" />
          <span>点対称ピクセル差分解析 (180° Symmetry Difference)</span>
        </div>
        {diffStats && (
          <div className="diff-stats">
            <span className="diff-stat-badge diff-stat-match">
              対称一致率 {(diffStats.overlapRatio / 100).toFixed(3)}
            </span>
            <span className="diff-stat-badge diff-stat-diff">
              非対称差分 {(diffStats.diffRatio / 100).toFixed(3)}
            </span>
          </div>
        )}
      </div>

      <div className="diff-canvas-container">
        {isDiffLoading && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>差分計算中...</span>
        )}
        {!isDiffLoading && diffImageUrl && (
          <img
            src={diffImageUrl}
            alt="点対称ピクセル差分"
            style={{ maxWidth: "100%", height: "auto", display: "block" }}
          />
        )}
        {!isDiffLoading && !diffImageUrl && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>画像がロードされていません</span>
        )}
      </div>

      <div className="diff-legend">
        <span className="diff-legend-item">
          <span className="diff-legend-dot" style={{ background: "#18181b" }} />
          共通対称核 (完全一致)
        </span>
        <span className="diff-legend-item">
          <span className="diff-legend-dot" style={{ background: "#e13b19" }} />
          正位置のみ固有差分
        </span>
        <span className="diff-legend-item">
          <span className="diff-legend-dot" style={{ background: "#2563eb" }} />
          180°反転のみ固有差分
        </span>
      </div>
    </div>
  );
};
