import React from "react";
import { Layers, Eye } from "lucide-react";
import type { PipelineStep } from "../services/api";

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
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          各ステップをクリックしてメインビューワーで拡大プレビュー
        </div>
      </div>

      <div className="pipeline-steps-grid">
        {steps.map((step, idx) => {
          const isSelected = selectedStepIndex === idx;
          return (
            <div
              key={step.step}
              className={`pipeline-step-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectStep(isSelected ? null : idx)}
              title={`クリックで STEP ${step.step} をプレビュー`}
            >
              <div className="pipeline-step-header">
                <span className={`pipeline-step-badge ${isSelected ? "active" : ""}`}>
                  STEP {step.step}
                </span>
                <span className="pipeline-step-name">{step.title}</span>
              </div>

              <div className="pipeline-step-thumb-wrap">
                <img
                  src={step.image}
                  alt={step.title}
                  className="pipeline-step-thumb"
                />
                <div className="pipeline-step-overlay-hint">
                  <Eye size={13} />
                  <span>{isSelected ? "表示中" : "プレビュー"}</span>
                </div>
              </div>

              <div className="pipeline-step-desc">
                {step.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
