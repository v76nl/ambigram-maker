export interface ParsedAmbigramConfig {
  word: string;
  engine: string;
  font: string;
  offsets: [number, number][] | null;
  parameters: {
    dilationSize?: number;
    strokeThickness?: number;
    diffBlend?: number;
    preBold?: number;
    brushStyle?: "calligraphic" | "uniform";
    strokeModulation?: boolean;
    enableSnap?: boolean;
    snapStrength?: number;
    blendRatio?: number;
    highlightMode?: boolean;
    blendWeight?: number;
    smoothness?: number;
    thresholdVal?: number;
    stylePrompt?: string;
  };
}

/**
 * エクスポートされた設定JSON (parameters.json) を安全に解析・正規化する純粋関数
 */
export function parseAmbigramConfig(data: any): ParsedAmbigramConfig {
  if (!data || typeof data !== "object") {
    throw new Error("無効な設定データです (オブジェクト形式である必要があります)");
  }

  // 1. 対象単語の取得
  const wordStr =
    data.reproducibility?.target?.word ||
    data.target_word ||
    data.word ||
    data.target ||
    "";
  if (!wordStr || typeof wordStr !== "string") {
    throw new Error("設定ファイル内に対象単語が見つかりません");
  }

  // 2. エンジン・フォント・オフセットの取得
  const engineStr =
    data.reproducibility?.engine?.id ||
    data.reproduction_api_payload?.engine ||
    data.engine?.id ||
    data.engine ||
    "morphology";

  const fontStr =
    data.reproducibility?.font?.id ||
    data.reproduction_api_payload?.font ||
    data.font?.id ||
    data.font ||
    "auto";

  const rawOffsets =
    data.reproducibility?.alignment?.offsets ||
    data.reproduction_api_payload?.customOffsets ||
    data.customOffsets ||
    data.offsets ||
    null;

  const offsets = Array.isArray(rawOffsets) ? (rawOffsets as [number, number][]) : null;

  // 3. パラメータの抽出
  const rawParams =
    data.reproducibility?.parameters ||
    data.reproduction_api_payload ||
    data.parameters ||
    data;

  const params: ParsedAmbigramConfig["parameters"] = {};

  if (rawParams.dilation_size !== undefined || rawParams.dilationSize !== undefined) {
    params.dilationSize = Number(rawParams.dilation_size ?? rawParams.dilationSize);
  }
  if (rawParams.stroke_thickness !== undefined || rawParams.strokeThickness !== undefined) {
    params.strokeThickness = Number(rawParams.stroke_thickness ?? rawParams.strokeThickness);
  }
  if (rawParams.diff_blend !== undefined || rawParams.diffBlend !== undefined) {
    params.diffBlend = Number(rawParams.diff_blend ?? rawParams.diffBlend);
  }
  if (rawParams.pre_bold !== undefined || rawParams.preBold !== undefined) {
    params.preBold = Number(rawParams.pre_bold ?? rawParams.preBold);
  }
  if (rawParams.brush_style || rawParams.brushStyle) {
    params.brushStyle = (rawParams.brush_style ?? rawParams.brushStyle) as "calligraphic" | "uniform";
  }
  if (rawParams.stroke_modulation !== undefined || rawParams.strokeModulation !== undefined) {
    params.strokeModulation = Boolean(rawParams.stroke_modulation ?? rawParams.strokeModulation);
  }
  if (rawParams.enable_snap !== undefined || rawParams.enableSnap !== undefined) {
    params.enableSnap = Boolean(rawParams.enable_snap ?? rawParams.enableSnap);
  }
  if (rawParams.snap_strength !== undefined || rawParams.snapStrength !== undefined) {
    params.snapStrength = Number(rawParams.snap_strength ?? rawParams.snapStrength);
  }
  if (rawParams.blend_ratio !== undefined || rawParams.blendRatio !== undefined) {
    params.blendRatio = Number(rawParams.blend_ratio ?? rawParams.blendRatio);
  }
  if (rawParams.highlight_mode !== undefined || rawParams.highlightMode !== undefined) {
    params.highlightMode = Boolean(rawParams.highlight_mode ?? rawParams.highlightMode);
  }
  if (rawParams.blend_weight !== undefined || rawParams.blendWeight !== undefined) {
    params.blendWeight = Number(rawParams.blend_weight ?? rawParams.blendWeight);
  }
  if (rawParams.smoothness !== undefined) {
    params.smoothness = Number(rawParams.smoothness);
  }
  if (rawParams.threshold_val !== undefined || rawParams.thresholdVal !== undefined) {
    params.thresholdVal = Number(rawParams.threshold_val ?? rawParams.thresholdVal);
  }
  if (rawParams.style_prompt !== undefined || rawParams.stylePrompt !== undefined) {
    params.stylePrompt = String(rawParams.style_prompt ?? rawParams.stylePrompt);
  }

  return {
    word: wordStr,
    engine: String(engineStr),
    font: String(fontStr),
    offsets,
    parameters: params,
  };
}
