import React, { useEffect, useRef } from "react";
import { Layers, Eye } from "lucide-react";
import type { PipelineStep } from "../services/api";
import { MathText } from "./MathText";

interface PipelineViewerProps {
  steps: PipelineStep[];
  selectedStepIndex: number | null;
  onSelectStep: (idx: number | null) => void;
}

export const PipelineViewer: React.FC<PipelineViewerProps> = ({
  steps,
  selectedStepIndex,
  onSelectStep,
}) => {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 選択されたステップ要素が見える位置に自動スクロール
  useEffect(() => {
    if (selectedStepIndex !== null && rowRefs.current[selectedStepIndex]) {
      rowRefs.current[selectedStepIndex]?.scrollIntoView?.({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedStepIndex]);

  // ステップ選択時: 上下キーでステップ間を移動、Escapeで解除
  useEffect(() => {
    if (selectedStepIndex === null || steps.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // テキスト入力中はキー入力を妨げない
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        onSelectStep(Math.min(steps.length - 1, selectedStepIndex + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onSelectStep(Math.max(0, selectedStepIndex - 1));
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSelectStep(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedStepIndex, steps.length, onSelectStep]);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="diff-view-card" style={{ marginTop: "1rem" }}>
      <div className="diff-header">
        <div className="diff-title" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Layers size={15} color="var(--accent)" />
          <span style={{ fontWeight: 600 }}>生成工程パイプライン (Processing Pipeline)</span>
          <span
            style={{
              fontSize: "0.68rem",
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
              background: "var(--bg-subtle, #f4f4f5)",
              color: "var(--text-muted, #71717a)",
              border: "1px solid var(--border-subtle, #e4e4e7)",
            }}
          >
            全 {steps.length} 工程
          </span>
          {selectedStepIndex !== null && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                background: "var(--accent-subtle, #fff7ed)",
                color: "var(--accent, #d97706)",
                border: "1px solid var(--border-subtle, #fed7aa)",
                fontWeight: 500,
              }}
            >
              ↑ / ↓ キーで移動可
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          各ステップをクリックしてメインビューワーで拡大プレビュー（選択中は ↑ / ↓ キーで移動）
        </div>
      </div>

      <div className="pipeline-steps-list">
        {steps.map((step, idx) => {
          const isSelected = selectedStepIndex === idx;
          return (
            <div
              key={step.step}
              ref={(el) => {
                rowRefs.current[idx] = el;
              }}
              className={`pipeline-step-row ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectStep(isSelected ? null : idx)}
              title={`クリックで STEP ${step.step} をプレビュー`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectStep(isSelected ? null : idx);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const nextIdx = Math.min(steps.length - 1, idx + 1);
                  onSelectStep(nextIdx);
                  rowRefs.current[nextIdx]?.focus();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prevIdx = Math.max(0, idx - 1);
                  onSelectStep(prevIdx);
                  rowRefs.current[prevIdx]?.focus();
                }
              }}
            >
              {/* 左側: サムネイル画像 */}
              <div className="pipeline-step-thumb-wrap">
                <img
                  src={step.image}
                  alt={step.title}
                  className="pipeline-step-thumb"
                  loading="lazy"
                />
                <div className="pipeline-step-overlay-hint">
                  <Eye size={14} />
                  <span>{isSelected ? "表示中" : "プレビュー"}</span>
                </div>
              </div>

              {/* 右側: タイトル・ステップ番号・詳細説明 */}
              <div className="pipeline-step-content">
                <div className="pipeline-step-header">
                  <span className={`pipeline-step-badge ${isSelected ? "active" : ""}`}>
                    STEP {step.step}
                  </span>
                  <span className="pipeline-step-name">{step.title}</span>
                  {isSelected && (
                    <span className="pipeline-step-selected-badge">
                      表示中
                    </span>
                  )}
                </div>

                <div className="pipeline-step-desc">
                  <MathText text={step.description} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
