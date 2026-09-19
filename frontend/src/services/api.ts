const API_BASE_URL = "http://127.0.0.1:8000/api";

export interface CharPair {
  index1: number;
  char1: string;
  index2: number;
  char2: string;
  is_center: boolean;
  score: number;
}

export interface WordItem {
  reading: string;
  length: number;
  common: boolean;
  kanji: string[];
  score: number;
  geometric_mean: number;
  min_pair_score: number;
  pairs: CharPair[];
}

export interface SearchWordsParams {
  minLength?: number;
  maxLength?: number;
  commonOnly?: boolean;
  minScore?: number;
  limit?: number;
  query?: string;
}

export interface GenerateParams {
  word: string;
  engine?: "vector" | "bitmap" | "gemini" | "all";
  blendRatio?: number;
  strokeWidth?: number;
  blendWeight?: number;
  smoothness?: number;
  thresholdVal?: number;
  apiKey?: string;
  stylePrompt?: string;
}

export interface EngineResult {
  engine: string;
  type: "svg" | "png" | "error";
  data: string;
  status?: string;
  message?: string;
  details?: Record<string, any>;
}

export interface GenerateResponse {
  word: string;
  results: {
    vector?: EngineResult;
    bitmap?: EngineResult;
    gemini?: EngineResult;
  };
}

export async function searchWords(params: SearchWordsParams = {}): Promise<WordItem[]> {
  const queryParams = new URLSearchParams();
  if (params.minLength !== undefined) queryParams.set("min_length", params.minLength.toString());
  if (params.maxLength !== undefined) queryParams.set("max_length", params.maxLength.toString());
  if (params.commonOnly !== undefined) queryParams.set("common_only", params.commonOnly.toString());
  if (params.minScore !== undefined) queryParams.set("min_score", params.minScore.toString());
  if (params.limit !== undefined) queryParams.set("limit", params.limit.toString());
  if (params.query) queryParams.set("query", params.query);

  const res = await fetch(`${API_BASE_URL}/words/search?${queryParams.toString()}`);
  if (!res.ok) {
    throw new Error(`単語検索に失敗しました: ${res.statusText}`);
  }
  const data = await res.json();
  return data.words;
}

export async function evaluateWord(word: string): Promise<WordItem> {
  const res = await fetch(`${API_BASE_URL}/words/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });
  if (!res.ok) {
    throw new Error(`単語評価に失敗しました: ${res.statusText}`);
  }
  return await res.json();
}

export async function generateAmbigram(params: GenerateParams): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      word: params.word,
      engine: params.engine || "all",
      blend_ratio: params.blendRatio,
      stroke_width: params.strokeWidth,
      blend_weight: params.blendWeight,
      smoothness: params.smoothness,
      threshold_val: params.thresholdVal,
      api_key: params.apiKey,
      style_prompt: params.stylePrompt,
    }),
  });
  if (!res.ok) {
    throw new Error(`アンビグラム生成に失敗しました: ${res.statusText}`);
  }
  return await res.json();
}
