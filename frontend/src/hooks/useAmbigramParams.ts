import { useState, useCallback } from "react";
import type { ParsedAmbigramConfig } from "../utils/configParser";

export interface AmbigramParams {
  // ベクター
  blendRatio: number;
  highlightMode: boolean;
  // モルフォロジー (手法A)
  dilationSize: number;
  // スケルトン (手法B)
  strokeThickness: number;
  brushStyle: "calligraphic" | "uniform";
  strokeModulation: boolean;
  // 共通 (手法A/B)
  diffBlend: number;
  preBold: number;
  snapStrength: number;
  // ビットマップ
  blendWeight: number;
  smoothness: number;
  thresholdVal: number;
  // Gemini AI
  apiKey: string;
  stylePrompt: string;
}

export function useAmbigramParams() {
  const [blendRatio, setBlendRatio] = useState<number>(0.5);
  const [highlightMode, setHighlightMode] = useState<boolean>(false);
  const [dilationSize, setDilationSize] = useState<number>(11);
  const [strokeThickness, setStrokeThickness] = useState<number>(15);
  const [brushStyle, setBrushStyle] = useState<"calligraphic" | "uniform">("calligraphic");
  const [strokeModulation, setStrokeModulation] = useState<boolean>(true);
  const [diffBlend, setDiffBlend] = useState<number>(0.35);
  const [preBold, setPreBold] = useState<number>(4);
  const [snapStrength, setSnapStrength] = useState<number>(0.75);
  const [blendWeight, setBlendWeight] = useState<number>(0.65);
  const [smoothness, setSmoothness] = useState<number>(7);
  const [thresholdVal, setThresholdVal] = useState<number>(110);
  const [apiKey, setApiKey] = useState<string>("");
  const [stylePrompt, setStylePrompt] = useState<string>(
    "minimalist black calligraphy on pure white background, sharp vector aesthetic"
  );

  const applyImportedConfig = useCallback((config: ParsedAmbigramConfig) => {
    const p = config.parameters;
    if (p.blendRatio !== undefined) setBlendRatio(p.blendRatio);
    if (p.highlightMode !== undefined) setHighlightMode(p.highlightMode);
    if (p.dilationSize !== undefined) setDilationSize(p.dilationSize);
    if (p.strokeThickness !== undefined) setStrokeThickness(p.strokeThickness);
    if (p.brushStyle) setBrushStyle(p.brushStyle);
    if (p.strokeModulation !== undefined) setStrokeModulation(p.strokeModulation);
    if (p.diffBlend !== undefined) setDiffBlend(p.diffBlend);
    if (p.preBold !== undefined) setPreBold(p.preBold);
    if (p.snapStrength !== undefined) setSnapStrength(p.snapStrength);
    else if (p.enableSnap !== undefined) setSnapStrength(p.enableSnap ? 0.75 : 0.0);
    if (p.blendWeight !== undefined) setBlendWeight(p.blendWeight);
    if (p.smoothness !== undefined) setSmoothness(p.smoothness);
    if (p.thresholdVal !== undefined) setThresholdVal(p.thresholdVal);
  }, []);

  const params: AmbigramParams = {
    blendRatio,
    highlightMode,
    dilationSize,
    strokeThickness,
    brushStyle,
    strokeModulation,
    diffBlend,
    preBold,
    snapStrength,
    blendWeight,
    smoothness,
    thresholdVal,
    apiKey,
    stylePrompt,
  };

  return {
    params,
    setBlendRatio,
    setHighlightMode,
    setDilationSize,
    setStrokeThickness,
    setBrushStyle,
    setStrokeModulation,
    setDiffBlend,
    setPreBold,
    setSnapStrength,
    setBlendWeight,
    setSmoothness,
    setThresholdVal,
    setApiKey,
    setStylePrompt,
    applyImportedConfig,
  };
}
