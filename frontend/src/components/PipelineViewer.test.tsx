import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PipelineViewer } from "./PipelineViewer";
import type { PipelineStep } from "../services/api";

describe("PipelineViewer Component", () => {
  const mockSteps: PipelineStep[] = [
    { step: 1, title: "輪郭抽出", description: "フォントのグリフ輪郭を抽出", image: "data:image/png;base64,1" },
    { step: 2, title: "中心線骨格化", description: "メディアル軸変換による細線化", image: "data:image/png;base64,2" },
    { step: 3, title: "180度対称ペア探索", description: "ハンガリアン法による最適マッチング", image: "data:image/png;base64,3" },
  ];

  it("renders pipeline steps correctly", () => {
    const handleSelectStep = vi.fn();
    render(
      <PipelineViewer
        steps={mockSteps}
        selectedStepIndex={null}
        onSelectStep={handleSelectStep}
      />
    );

    expect(screen.getByText("生成工程パイプライン (Processing Pipeline)")).toBeDefined();
    expect(screen.getByText("全 3 工程")).toBeDefined();
    expect(screen.getByText("輪郭抽出")).toBeDefined();
    expect(screen.getByText("中心線骨格化")).toBeDefined();
    expect(screen.getByText("180度対称ペア探索")).toBeDefined();
  });

  it("triggers onSelectStep when a step is clicked", () => {
    const handleSelectStep = vi.fn();
    render(
      <PipelineViewer
        steps={mockSteps}
        selectedStepIndex={null}
        onSelectStep={handleSelectStep}
      />
    );

    fireEvent.click(screen.getByText("中心線骨格化"));
    expect(handleSelectStep).toHaveBeenCalledWith(1);
  });

  it("navigates with ArrowDown and ArrowUp keys when a step is selected", () => {
    const handleSelectStep = vi.fn();
    render(
      <PipelineViewer
        steps={mockSteps}
        selectedStepIndex={1}
        onSelectStep={handleSelectStep}
      />
    );

    // ArrowDown should select next step (index 2)
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(handleSelectStep).toHaveBeenCalledWith(2);

    // ArrowUp should select previous step (index 0)
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(handleSelectStep).toHaveBeenCalledWith(0);

    // Escape should deselect step (null)
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleSelectStep).toHaveBeenCalledWith(null);
  });

  it("clamps at boundaries when navigating with arrow keys", () => {
    const handleSelectStep = vi.fn();

    // At last step (index 2), ArrowDown should remain at 2
    const { rerender } = render(
      <PipelineViewer
        steps={mockSteps}
        selectedStepIndex={2}
        onSelectStep={handleSelectStep}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(handleSelectStep).toHaveBeenCalledWith(2);

    // At first step (index 0), ArrowUp should remain at 0
    rerender(
      <PipelineViewer
        steps={mockSteps}
        selectedStepIndex={0}
        onSelectStep={handleSelectStep}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(handleSelectStep).toHaveBeenCalledWith(0);
  });
});
