import React, { useState } from "react";
import { Download, FileCode, FileImage, FileJson, CheckSquare, Square, Info } from "lucide-react";
import type { WordItem, EngineResult, ReadabilityResponse } from "../services/api";

interface ExportBarProps {
  wordItem: WordItem | null;
  activeResult: EngineResult | null;
  activeEngine: string;
  selectedFont?: string;
  customOffsets?: [number, number][] | null;
  readabilityData?: ReadabilityResponse | null;
  blendRatio?: number;
  strokeWidth?: number;
  highlightMode?: boolean;
  dilationSize?: number;
  strokeThickness?: number;
  diffBlend?: number;
  preBold?: number;
  brushStyle?: "calligraphic" | "uniform";
  strokeModulation?: boolean;
  enableSnap?: boolean;
  blendWeight?: number;
  smoothness?: number;
  thresholdVal?: number;
  stylePrompt?: string;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  wordItem,
  activeResult,
  activeEngine,
  selectedFont = "auto",
  customOffsets = [],
  readabilityData = null,
  blendRatio = 0.5,
  strokeWidth = 0.0,
  highlightMode = false,
  dilationSize = 11,
  strokeThickness = 15,
  diffBlend = 0.35,
  preBold = 4,
  brushStyle = "calligraphic",
  strokeModulation = true,
  enableSnap = true,
  blendWeight = 0.65,
  smoothness = 7,
  thresholdVal = 110,
  stylePrompt = "",
}) => {
  const [includeParams, setIncludeParams] = useState<boolean>(true);

  if (!wordItem || !activeResult || activeResult.type === "error") {
    return null;
  }

  const nameBase = wordItem.target_text || wordItem.primary_display || wordItem.reading;

  const downloadBlob = (content: string | Blob, filename: string, mimeType?: string) => {
    let url: string;
    if (content instanceof Blob) {
      url = URL.createObjectURL(content);
    } else {
      const blob = new Blob([content], { type: mimeType || "application/octet-stream" });
      url = URL.createObjectURL(blob);
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const generateMetadataJson = () => {
    const engineDescriptions: Record<string, { name: string; reference: string }> = {
      skeleton: {
        name: "手法B: 骨格中心線平均化 (Skeleton Thinning & Calligraphy)",
        reference: "魏・山口 (2023) §2.2 / 井上・高橋 (2020) §5",
      },
      morphology: {
        name: "手法A: 論理積モルフォロジー (AND & Dilation)",
        reference: "魏・山口 (2023) §2.1",
      },
      vector: {
        name: "手法1: ベクター幾何学的合成 (Vector Overlay)",
        reference: "石崎ほか (2024)「ひらがな〜る」",
      },
      bitmap: {
        name: "手法2: ビットマップエネルギー最適化 (Bitmap Distance Field)",
        reference: "OpenCV Distance Transform & Gaussian Energy Blending",
      },
      gemini: {
        name: "手法3: Gemini AI 生成 (Imagen 3)",
        reference: "Google DeepMind Imagen 3",
      },
    };

    const engineMeta = engineDescriptions[activeEngine] || {
      name: activeEngine,
      reference: "",
    };

    const fontId = activeResult.details?.selected_font_id || selectedFont || "zen_maru";
    const fontName = activeResult.details?.selected_font_name || fontId;
    const offsets = activeResult.details?.selected_offsets || customOffsets || [];

    const engineParams: Record<string, any> = {};
    if (activeEngine === "skeleton") {
      engineParams.stroke_thickness = strokeThickness;
      engineParams.diff_blend = diffBlend;
      engineParams.pre_bold = preBold;
      engineParams.brush_style = brushStyle;
      engineParams.stroke_modulation = strokeModulation;
      engineParams.enable_snap = enableSnap;
    } else if (activeEngine === "morphology") {
      engineParams.dilation_size = dilationSize;
      engineParams.smoothness = smoothness;
      engineParams.diff_blend = diffBlend;
      engineParams.pre_bold = preBold;
      engineParams.enable_snap = enableSnap;
    } else if (activeEngine === "vector") {
      engineParams.blend_ratio = blendRatio;
      engineParams.stroke_width = strokeWidth;
      engineParams.highlight_mode = highlightMode;
    } else if (activeEngine === "bitmap") {
      engineParams.blend_weight = blendWeight;
      engineParams.smoothness = smoothness;
      engineParams.threshold_val = thresholdVal;
    } else if (activeEngine === "gemini") {
      engineParams.style_prompt = stylePrompt;
    }

    const apiPayload: Record<string, any> = {
      word: nameBase,
      engine: activeEngine,
      font: fontId,
      customOffsets: offsets,
      ...engineParams,
    };

    const metadata = {
      $schema: "https://json-schema.org/draft-07/schema#",
      generator: "Japanese Rotational Ambigram Generator",
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      reproducibility: {
        target: {
          word: nameBase,
          reading: wordItem.reading,
          length: wordItem.length,
          is_pure_hiragana: wordItem.is_pure_hiragana ?? true,
          has_kanji: wordItem.has_kanji ?? false,
          has_katakana: wordItem.has_katakana ?? false,
        },
        engine: {
          id: activeEngine,
          name: engineMeta.name,
          academic_reference: engineMeta.reference,
        },
        font: {
          id: fontId,
          name: fontName,
          style: activeResult.details?.selected_style || "",
        },
        alignment: {
          offsets: offsets,
          description: "各文字スロットの相対シフト [dx, dy] (中心原点を基準に対称配分)",
        },
        parameters: engineParams,
        evaluation: {
          geometric_mean_score: wordItem.geometric_mean ?? wordItem.score,
          min_pair_score: wordItem.min_pair_score ?? wordItem.score,
          overall_readability: readabilityData?.overall_readability ?? null,
          readability_slots: readabilityData?.slots ?? null,
        },
        reproduction_api_payload: apiPayload,
        reproduction_curl_command: `curl -X POST http://127.0.0.1:8000/api/generate -H 'Content-Type: application/json' -d '${JSON.stringify(apiPayload)}'`,
      },
    };

    return JSON.stringify(metadata, null, 2);
  };

  const downloadParametersJson = () => {
    const jsonStr = generateMetadataJson();
    downloadBlob(
      jsonStr,
      `ambigram_${nameBase}_${activeEngine}_parameters.json`,
      "application/json;charset=utf-8"
    );
  };

  const downloadSvg = () => {
    if (activeResult.type !== "svg") return;
    const blob = new Blob([activeResult.data], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `ambigram_${nameBase}_vector.svg`);

    // パラメータ同時出力
    if (includeParams) {
      setTimeout(downloadParametersJson, 150);
    }
  };

  const downloadPng = () => {
    const triggerParamsIfEnabled = () => {
      if (includeParams) {
        setTimeout(downloadParametersJson, 150);
      }
    };

    if (activeResult.type === "png") {
      const link = document.createElement("a");
      link.href = activeResult.data;
      link.download = `ambigram_${nameBase}_${activeEngine}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerParamsIfEnabled();
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
          link.download = `ambigram_${nameBase}_vector.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          triggerParamsIfEnabled();
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
        flexDirection: "column",
        gap: "0.75rem",
        padding: "0.85rem 1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Download size={15} color="var(--accent)" />
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            エクスポート ({nameBase})
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {activeResult.type === "svg" && (
            <button
              className="swiss-btn swiss-btn-outline"
              onClick={downloadSvg}
              title="SVG画像を出力 (パラメータJSON同時保存がONの場合はJSONも出力)"
            >
              <FileCode size={14} />
              <span>SVG 保存</span>
            </button>
          )}

          <button
            className="swiss-btn swiss-btn-primary"
            onClick={downloadPng}
            title="PNG画像を出力 (パラメータJSON同時保存がONの場合はJSONも出力)"
          >
            <FileImage size={14} />
            <span>PNG 保存</span>
          </button>

          <button
            className="swiss-btn swiss-btn-subtle"
            onClick={downloadParametersJson}
            title="フォント・最適シフト・ハイパーパラメータ等の設定JSONファイルのみを単体保存"
          >
            <FileJson size={14} />
            <span>設定 (JSON)</span>
          </button>
        </div>
      </div>

      {/* 再現可能性オプション (パラメータJSON同時出力チェックボックス) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "0.5rem",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "0.74rem",
          color: "var(--text-secondary)",
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            cursor: "pointer",
            userSelect: "none",
            fontWeight: 500,
          }}
          onClick={() => setIncludeParams(!includeParams)}
        >
          {includeParams ? (
            <CheckSquare size={14} color="var(--accent)" />
          ) : (
            <Square size={14} color="var(--text-muted)" />
          )}
          <span>画像保存時に再現パラメータ (JSON) も別ファイルで出力</span>
        </label>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
          }}
          title="生成に使用したフォント、最適シフト、各種ハイパーパラメータ、APIペイロード等を保存し、後から実験を完全再現できるようにします"
        >
          <Info size={11} />
          再現可能性 (Reproducibility)
        </span>
      </div>
    </div>
  );
};

