const API_BASE_URL = "http://127.0.0.1:8000/api";

export interface CharPair {
  index1: number;
  char1: string;
  index2: number;
  char2: string;
  is_center: boolean;
  score: number;
  empirical_verified?: boolean;
}

export interface WordItem {
  word?: string;
  target_text?: string;
  reading: string;
  length: number;
  common: boolean;
  kanji: string[];
  katakana?: string[];
  display?: string;
  primary_display?: string;
  primary_kanji?: string;
  primary_katakana?: string;
  is_pure_hiragana?: boolean;
  has_kanji?: boolean;
  has_katakana?: boolean;
  input?: string;
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
  includeKanji?: boolean;
  includeKatakana?: boolean;
  includeHiragana?: boolean;
}

export interface FontMeta {
  id: string;
  name: string;
  style: string;
  description: string;
}

export interface FontScoreItem {
  id: string;
  name: string;
  style: string;
  description: string;
  score: number;
  pair_scores: number[];
  offsets?: [number, number][];
}

export interface WordFontsEval {
  word: string;
  reading: string;
  best_font_id: string;
  best_font_name: string;
  font_scores: FontScoreItem[];
}

export interface GenerateParams {
  word: string;
  engine?: "vector" | "morphology" | "skeleton" | "bitmap" | "gemini" | "all";
  font?: string; // "auto", "zen_maru", "dela_gothic", "mplus", "klee", "shippori"
  blendRatio?: number;
  strokeWidth?: number;
  highlightMode?: boolean;
  dilationSize?: number;
  strokeThickness?: number;
  diffBlend?: number;
  preBold?: number;
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
    morphology?: EngineResult;
    skeleton?: EngineResult;
    bitmap?: EngineResult;
    gemini?: EngineResult;
  };
}

export function searchWordsStream(
  params: SearchWordsParams = {},
  onWord: (word: WordItem) => void,
  onComplete: () => void,
  onError?: (err: any) => void
): () => void {
  const queryParams = new URLSearchParams();
  if (params.minLength !== undefined) queryParams.set("min_length", params.minLength.toString());
  if (params.maxLength !== undefined) queryParams.set("max_length", params.maxLength.toString());
  if (params.commonOnly !== undefined) queryParams.set("common_only", params.commonOnly.toString());
  if (params.minScore !== undefined) queryParams.set("min_score", params.minScore.toString());
  if (params.limit !== undefined) queryParams.set("limit", params.limit.toString());
  if (params.query) queryParams.set("query", params.query);
  if (params.includeKanji !== undefined) queryParams.set("include_kanji", params.includeKanji.toString());
  if (params.includeKatakana !== undefined) queryParams.set("include_katakana", params.includeKatakana.toString());
  if (params.includeHiragana !== undefined) queryParams.set("include_hiragana", params.includeHiragana.toString());

  console.log(`[Ambigram API] 📡 リアルタイム単語ストリーミング接続開始:`, params);
  const url = `${API_BASE_URL}/words/stream?${queryParams.toString()}`;
  const es = new EventSource(url);

  let isClosed = false;
  const close = () => {
    if (!isClosed) {
      isClosed = true;
      es.close();
    }
  };

  es.onmessage = (event) => {
    if (isClosed) return;
    try {
      if (event.data) {
        const item: WordItem = JSON.parse(event.data);
        onWord(item);
      }
    } catch (err) {
      console.error("[Ambigram API] ストリームデータ解析エラー:", err);
    }
  };

  es.addEventListener("done", () => {
    console.log(`[Ambigram API] 🏁 単語ストリーミング配信完了`);
    close();
    onComplete();
  });

  es.onerror = (err) => {
    if (!isClosed) {
      close();
      if (onError) onError(err);
      else onComplete();
    }
  };

  return close;
}

export async function searchWords(params: SearchWordsParams = {}): Promise<WordItem[]> {
  const queryParams = new URLSearchParams();
  if (params.minLength !== undefined) queryParams.set("min_length", params.minLength.toString());
  if (params.maxLength !== undefined) queryParams.set("max_length", params.maxLength.toString());
  if (params.commonOnly !== undefined) queryParams.set("common_only", params.commonOnly.toString());
  if (params.minScore !== undefined) queryParams.set("min_score", params.minScore.toString());
  if (params.limit !== undefined) queryParams.set("limit", params.limit.toString());
  if (params.query) queryParams.set("query", params.query);
  if (params.includeKanji !== undefined) queryParams.set("include_kanji", params.includeKanji.toString());
  if (params.includeKatakana !== undefined) queryParams.set("include_katakana", params.includeKatakana.toString());
  if (params.includeHiragana !== undefined) queryParams.set("include_hiragana", params.includeHiragana.toString());

  console.log(`[Ambigram API] 🔍 単語検索リクエスト送信:`, params);
  const t0 = performance.now();
  const res = await fetch(`${API_BASE_URL}/words/search?${queryParams.toString()}`);
  if (!res.ok) {
    console.error(`[Ambigram API] ❌ 単語検索エラー: ${res.statusText}`);
    throw new Error(`単語検索に失敗しました: ${res.statusText}`);
  }
  const data = await res.json();
  const elapsed = Math.round(performance.now() - t0);
  console.log(`[Ambigram API] ✅ 単語検索完了: ${data.words.length}件取得 (${elapsed}ms)`);
  return data.words;
}

export async function evaluateWord(word: string): Promise<WordItem> {
  console.log(`[Ambigram API] 📐 単語適性評価リクエスト: '${word}'`);
  const t0 = performance.now();
  const res = await fetch(`${API_BASE_URL}/words/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });
  if (!res.ok) {
    console.error(`[Ambigram API] ❌ 単語評価エラー: ${res.statusText}`);
    throw new Error(`単語評価に失敗しました: ${res.statusText}`);
  }
  const data = await res.json();
  const elapsed = Math.round(performance.now() - t0);
  console.log(`[Ambigram API] ✅ 単語評価完了: '${word}' (スコア: ${Math.round(data.score * 100)}%, ${elapsed}ms)`);
  return data;
}

export async function generateAmbigram(params: GenerateParams): Promise<GenerateResponse> {
  console.log(
    `[Ambigram API] 🎨 アンビグラム生成開始: 単語='${params.word}', 手法='${params.engine || "all"}', フォント='${params.font || "auto"}'`,
    params
  );
  const t0 = performance.now();
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      word: params.word,
      engine: params.engine || "all",
      font: params.font || "auto",
      blend_ratio: params.blendRatio,
      stroke_width: params.strokeWidth,
      highlight_mode: params.highlightMode,
      dilation_size: params.dilationSize,
      stroke_thickness: params.strokeThickness,
      diff_blend: params.diffBlend,
      pre_bold: params.preBold,
      blend_weight: params.blendWeight,
      smoothness: params.smoothness,
      threshold_val: params.thresholdVal,
      api_key: params.apiKey,
      style_prompt: params.stylePrompt,
    }),
  });
  if (!res.ok) {
    console.error(`[Ambigram API] ❌ アンビグラム生成エラー: ${res.statusText}`);
    throw new Error(`アンビグラム生成に失敗しました: ${res.statusText}`);
  }
  const data = await res.json();
  const elapsed = Math.round(performance.now() - t0);
  console.log(
    `[Ambigram API] 🎉 アンビグラム生成完了: 単語='${params.word}', 手法数=${Object.keys(data.results || {}).length} (${elapsed}ms)`,
    data
  );
  return data;
}

export async function getAvailableFonts(): Promise<FontMeta[]> {
  console.log(`[Ambigram API] 🔤 フォント一覧取得リクエスト`);
  const res = await fetch(`${API_BASE_URL}/fonts`);
  if (!res.ok) {
    console.error(`[Ambigram API] ❌ フォント一覧取得エラー: ${res.statusText}`);
    throw new Error(`フォント一覧取得に失敗しました: ${res.statusText}`);
  }
  const data = await res.json();
  console.log(`[Ambigram API] ✅ フォント一覧取得完了: ${data.fonts.length}件`, data.fonts);
  return data.fonts;
}

export async function evaluateWordFonts(word: string): Promise<WordFontsEval> {
  console.log(`[Ambigram API] 📏 単語フォント幾何評価リクエスト: '${word}'`);
  const t0 = performance.now();
  const res = await fetch(`${API_BASE_URL}/words/fonts-eval?word=${encodeURIComponent(word)}`);
  if (!res.ok) {
    console.error(`[Ambigram API] ❌ フォント評価エラー: ${res.statusText}`);
    throw new Error(`フォント評価に失敗しました: ${res.statusText}`);
  }
  const data = await res.json();
  const elapsed = Math.round(performance.now() - t0);
  console.log(`[Ambigram API] ✅ フォント評価完了: 最適='${data.best_font_name}' (${elapsed}ms)`, data);
  return data;
}
