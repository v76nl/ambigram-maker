import React from "react";
import { Download, FileCode, FileImage } from "lucide-react";
import type { WordItem, EngineResult } from "../services/api";

interface ExportBarProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  wordItem,
  activeResult,
  activeEngine,
}) => {
  if (!wordItem || !activeResult || activeResult.type === "error") {
    return null;
  }

  const downloadSvg = () => {
    if (activeResult.type !== "svg") return;
    const blob = new Blob([activeResult.data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ambigram_${wordItem.reading}_vector.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    if (activeResult.type === "png") {
      const link = document.createElement("a");
      link.href = activeResult.data;
      link.download = `ambigram_${wordItem.reading}_${activeEngine}.png`;
      link.click();
      return;
    }

    if (activeResult.type === "svg") {
      const svgBlob = new Blob([activeResult.data], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 1200;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = pngUrl;
          link.download = `ambigram_${wordItem.reading}_vector.png`;
          link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  return (
    <div
      className="swiss-card"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.85rem 1.25rem",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
        <Download size={15} color="var(--accent)" />
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          エクスポート ({wordItem.reading})
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {activeResult.type === "svg" && (
          <button className="swiss-btn swiss-btn-outline" onClick={downloadSvg}>
            <FileCode size={14} />
            <span>SVG 保存</span>
          </button>
        )}
        <button className="swiss-btn swiss-btn-primary" onClick={downloadPng}>
          <FileImage size={14} />
          <span>PNG 保存</span>
        </button>
      </div>
    </div>
  );
};
