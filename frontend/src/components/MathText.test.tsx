import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MathText } from "./MathText";

describe("MathText Component", () => {
  it("renders plain text without math correctly", () => {
    render(<MathText text="これは通常のテキストです" />);
    expect(screen.getByText("これは通常のテキストです")).toBeDefined();
  });

  it("renders inline math correctly with KaTeX", () => {
    const { container } = render(<MathText text="距離 $d_1$ と $d_2$ の関係" />);
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.textContent).toContain("距離");
    expect(container.textContent).toContain("の関係");
  });

  it("renders block math correctly with KaTeX", () => {
    const { container } = render(
      <MathText text="調和平均 $$H = \frac{2 \cdot d_1 \cdot d_2}{d_1 + d_2}$$ です" />
    );
    expect(container.querySelector(".math-block")).not.toBeNull();
    expect(container.querySelector(".katex-display")).not.toBeNull();
  });
});
