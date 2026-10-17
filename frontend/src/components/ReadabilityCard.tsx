import React from "react";
import { Brain, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import type { ReadabilityResponse } from "../services/api";

interface ReadabilityCardProps {
  data: ReadabilityResponse | null;
  isLoading?: boolean;
}

export const ReadabilityCard: React.FC<ReadabilityCardProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          marginTop: "0.75rem",
          padding: "0.5rem",
          textAlign: "center",
          fontSize: "0.74rem",
          color: "var(--text-muted)",
        }}
      >
        AI文字認識率を解析中……
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="diff-view-card" style={{ marginTop: "1rem" }}>
      <div className="diff-header">
        <div className="diff-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Brain size={15} color="var(--accent)" />
          <span style={{ fontWeight: 600 }}>AI双方向文字認識率・客観可読性</span>
          <span
            style={{
              fontSize: "0.68rem",
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
              background: data.model_type === "onnx_cnn" ? "rgba(16, 185, 129, 0.12)" : "var(--bg-subtle, #f4f4f5)",
              color: data.model_type === "onnx_cnn" ? "#059669" : "var(--text-muted, #71717a)",
              border: `1px solid ${data.model_type === "onnx_cnn" ? "rgba(16, 185, 129, 0.25)" : "var(--border-subtle, #e4e4e7)"}`,
              fontWeight: 500,
            }}
          >
            {data.model_type === "onnx_cnn" ? "ローカルCNN (3,082字/漢字対応)" : "魏・山口 (2023) §2.2"}
          </span>
        </div>
        <div className="diff-stats" style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span
            className="diff-stat-badge"
            style={{
              background:
                data.overall_readability !== null && data.overall_readability >= 0.15
                  ? "rgba(16, 185, 129, 0.15)"
                  : data.overall_readability !== null && data.overall_readability >= 0.05
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              color:
                data.overall_readability !== null && data.overall_readability >= 0.15
                  ? "#059669"
                  : data.overall_readability !== null && data.overall_readability >= 0.05
                  ? "#d97706"
                  : "#dc2626",
              fontWeight: 600,
            }}
          >
            {data.overall_readability !== null
              ? `双方向可読調和平均: ${(data.overall_readability * 100).toFixed(1)}%`
              : "双方向可読率: 判定不可 (未収録文字)"}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "0.75rem",
          fontSize: "0.78rem",
          background: "var(--bg-canvas, #ffffff)",
          borderTop: "1px solid var(--border-subtle, #f0f0f0)",
          borderBottom: "1px solid var(--border-subtle, #f0f0f0)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${data.slots.length}, 1fr)`,
            gap: "0.5rem",
          }}
        >
          {data.slots.map((slot) => {
            const isGood = slot.status === "perfect";
            const isReadable = slot.status === "partial";
            const isUnsupported = slot.status === "unsupported";
            const statusColor = isGood
              ? "#059669"
              : isReadable
              ? "#d97706"
              : isUnsupported
              ? "#6b7280"
              : "#dc2626";

            const formatPrediction = (
              prob: number | null,
              rank: number | null | undefined,
              isSupported: boolean | undefined
            ) => {
              if (isSupported === false || prob === null) return "未収録 (N/A)";
              const rankStr = rank ? `${rank}位` : "-";
              const probStr = `${(prob * 100).toFixed(1)}%`;
              return `${rankStr} (${probStr})`;
            };

            return (
              <div
                key={slot.slot_index}
                style={{
                  border: `1px solid ${statusColor}33`,
                  borderRadius: "6px",
                  padding: "0.5rem",
                  background: `${statusColor}08`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-subtle, #e4e4e7)",
                    paddingBottom: "0.25rem",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {slot.char1} <span style={{ color: "var(--text-muted)" }}>↔</span> {slot.char2}
                  </span>
                  {isGood ? (
                    <CheckCircle2 size={13} color={statusColor} />
                  ) : (
                    <AlertTriangle size={13} color={statusColor} />
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>正: {slot.char1}</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatPrediction(slot.prob1, slot.rank1, slot.is_supported1)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>反: {slot.char2}</span>
                  <span style={{ fontWeight: 600 }}>
                    {formatPrediction(slot.prob2, slot.rank2, slot.is_supported2)}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "0.2rem",
                    paddingTop: "0.2rem",
                    borderTop: "1px dashed var(--border-subtle, #e4e4e7)",
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                  }}
                >
                  最有力予測: {slot.top1_pred || "-"} / {slot.top2_pred || "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="diff-legend"
        style={{
          justifyContent: "space-between",
          fontSize: "0.7rem",
          color: "var(--text-muted)",
        }}
      >
        <span>対象フォント: {data.font_id}</span>
        <span>対象文字列: {data.target_text}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
          <Sparkles size={11} color="var(--accent)" />
          文脈認知補完: 井上・高橋 (2020) 表5
        </span>
      </div>
    </div>
  );
};
