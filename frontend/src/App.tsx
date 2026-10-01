import React, { useEffect, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import type { WordItem, EngineResult, FontMeta } from "./services/api";
import {
  searchWords,
  evaluateWord,
  generateAmbigram,
  getAvailableFonts,
} from "./services/api";
import { WordSearch } from "./components/WordSearch";
import { AmbigramViewer } from "./components/AmbigramViewer";
import { EngineCompare } from "./components/EngineCompare";
import { ExportBar } from "./components/ExportBar";

export const App: React.FC = () => {
  // 単語探索・選択ステート
  const [words, setWords] = useState<WordItem[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minLength, setMinLength] = useState<number>(2);
  const [maxLength, setMaxLength] = useState<number>(5);
  const [commonOnly, setCommonOnly] = useState<boolean>(true);
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // フォント最適化ステート
  const [selectedFont, setSelectedFont] = useState<string>("auto");
  const [availableFonts, setAvailableFonts] = useState<FontMeta[]>([]);

  // グラフィック生成ステート
  const [activeEngine, setActiveEngine] = useState<string>("morphology"); // 手法Aをデフォルトにして二重線を解消
  const [results, setResults] = useState<{
    vector?: EngineResult;
    morphology?: EngineResult;
    skeleton?: EngineResult;
    bitmap?: EngineResult;
    gemini?: EngineResult;
  }>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // パラメータ
  const [blendRatio, setBlendRatio] = useState<number>(0.5);
  const [highlightMode, setHighlightMode] = useState<boolean>(false);
  // 手法A (論理積モルフォロジー) パラメータ
  const [dilationSize, setDilationSize] = useState<number>(11);
  // 手法B (スケルトン平均化) パラメータ
  const [strokeThickness, setStrokeThickness] = useState<number>(15);
  // 手法A/B 共通 (異文字固有パーツ保持・事前太らせ)
  const [diffBlend, setDiffBlend] = useState<number>(0.35);
  const [preBold, setPreBold] = useState<number>(4); // 近接縦棒の結合力強化 (Pre-Bold)
  // ビットマップパラメータ
  const [blendWeight, setBlendWeight] = useState<number>(0.65);
  const [smoothness, setSmoothness] = useState<number>(7);
  const [thresholdVal, setThresholdVal] = useState<number>(110);
  const [apiKey, setApiKey] = useState<string>("");
  const [stylePrompt, setStylePrompt] = useState<string>(
    "minimalist black calligraphy on pure white background, sharp vector aesthetic"
  );

  // フォント一覧の取得
  useEffect(() => {
    getAvailableFonts()
      .then(setAvailableFonts)
      .catch((err) => console.error("フォント一覧取得エラー:", err));
  }, []);

  // 単語一覧の読み込み
  const loadWords = useCallback(async () => {
    setIsLoadingWords(true);
    setLoadError(null);
    try {
      const fetched = await searchWords({
        minLength,
        maxLength,
        commonOnly: searchQuery.trim() ? false : commonOnly, // 検索時は全単語から絞り込み
        minScore: searchQuery.trim() ? 0.1 : 0.6, // 検索時は見つかりやすいよう閾値緩和
        query: searchQuery.trim() || undefined,
        limit: 50,
      });
      setWords(fetched);
      if (fetched.length > 0) {
        setSelectedWord((prev) => prev || fetched[0]);
      }
    } catch (err: any) {
      console.error("単語読み込みエラー:", err);
      setLoadError("バックエンドAPI (http://127.0.0.1:8000) への接続に失敗しました。サーバーが起動しているか確認してください。");
    } finally {
      setIsLoadingWords(false);
    }
  }, [minLength, maxLength, commonOnly, searchQuery]);

  useEffect(() => {
    // 検索クエリ入力時のデバウンス
    const timer = setTimeout(() => {
      loadWords();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadWords]);

  // アンビグラム生成
  const triggerGenerate = useCallback(
    async (
      wordToGen: WordItem | null,
      engineToGen?: string,
      overrideHighlight?: boolean,
      fontToGen?: string
    ) => {
      if (!wordToGen) return;
      setIsGenerating(true);
      try {
        const response = await generateAmbigram({
          word: wordToGen.reading,
          engine: (engineToGen || activeEngine) as any,
          font: fontToGen || selectedFont,
          blendRatio,
          strokeWidth: 0.0,
          highlightMode: overrideHighlight !== undefined ? overrideHighlight : highlightMode,
          dilationSize,
          strokeThickness,
          diffBlend,
          preBold,
          blendWeight,
          smoothness,
          thresholdVal,
          apiKey: apiKey || undefined,
          stylePrompt,
        });

        setResults((prev) => ({
          ...prev,
          ...response.results,
        }));
      } catch (err) {
        console.error("生成エラー:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      activeEngine,
      selectedFont,
      blendRatio,
      highlightMode,
      dilationSize,
      strokeThickness,
      diffBlend,
      preBold,
      blendWeight,
      smoothness,
      thresholdVal,
      apiKey,
      stylePrompt,
    ]
  );

  // 単語変更、エンジン変更、またはフォント変更時に生成
  useEffect(() => {
    if (selectedWord) {
      triggerGenerate(selectedWord);
    }
  }, [selectedWord, activeEngine, selectedFont]);

  const handleToggleHighlightMode = () => {
    const nextVal = !highlightMode;
    setHighlightMode(nextVal);
    if (selectedWord && activeEngine === "vector") {
      triggerGenerate(selectedWord, "vector", nextVal);
    }
  };

  // 単語選択ハンドラ
  const handleSelectWord = (w: WordItem) => {
    setSelectedWord(w);
  };

  // 自由入力単語ハンドラ
  const handleCustomWord = async (inputWord: string) => {
    try {
      const evaluated = await evaluateWord(inputWord);
      setSelectedWord(evaluated);
    } catch (err) {
      console.error("単語評価エラー:", err);
    }
  };

  const currentResult = results[activeEngine as keyof typeof results] || null;

  return (
    <div className="app-container">
      {/* M3 Top App Bar */}
      <header className="app-header">
        <div className="brand-title">
          <Sparkles size={24} color="var(--md-sys-color-primary)" />
          <span>ひらがなアンビグラムメーカー</span>
          <span className="brand-badge">M3 / 180° Rotational</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--md-sys-color-on-surface-variant)" }}>
            自己対称型・3手法ハイブリッド生成システム
          </div>
        </div>
      </header>

      {/* Main Layout (2カラム) */}
      <main className="main-content">
        {/* 左側: 単語探索 & フィルタ */}
        <WordSearch
          words={words}
          selectedWord={selectedWord}
          onSelectWord={handleSelectWord}
          onCustomWordSubmit={handleCustomWord}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          minLength={minLength}
          maxLength={maxLength}
          onLengthChange={(min, max) => {
            setMinLength(min);
            setMaxLength(max);
          }}
          commonOnly={commonOnly}
          onCommonOnlyChange={(val) => setCommonOnly(val)}
          isLoading={isLoadingWords}
          loadError={loadError}
          onRetry={loadWords}
        />

        {/* 右側: ビューワー ＋ 手法比較・設定 ＋ エクスポート */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 180度回転インタラクティブビューワー */}
          <AmbigramViewer
            wordItem={selectedWord}
            activeResult={currentResult}
            activeEngine={activeEngine}
            onEngineChange={(engine) => setActiveEngine(engine)}
            highlightMode={highlightMode}
            onToggleHighlightMode={handleToggleHighlightMode}
            selectedFont={selectedFont}
            onFontChange={setSelectedFont}
            availableFonts={availableFonts}
          />

          {/* 生成手法比較・パラメータ調整 */}
          <EngineCompare
            activeEngine={activeEngine}
            onEngineChange={(engine) => setActiveEngine(engine)}
            results={results}
            selectedFont={selectedFont}
            onFontChange={setSelectedFont}
            availableFonts={availableFonts}
            blendRatio={blendRatio}
            onBlendRatioChange={setBlendRatio}
            dilationSize={dilationSize}
            onDilationSizeChange={setDilationSize}
            strokeThickness={strokeThickness}
            onStrokeThicknessChange={setStrokeThickness}
            diffBlend={diffBlend}
            onDiffBlendChange={setDiffBlend}
            preBold={preBold}
            onPreBoldChange={setPreBold}
            blendWeight={blendWeight}
            onBlendWeightChange={setBlendWeight}
            smoothness={smoothness}
            onSmoothnessChange={setSmoothness}
            thresholdVal={thresholdVal}
            onThresholdValChange={setThresholdVal}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            stylePrompt={stylePrompt}
            onStylePromptChange={setStylePrompt}
            onRegenerate={() => triggerGenerate(selectedWord)}
            isGenerating={isGenerating}
          />

          {/* エクスポートバー */}
          <ExportBar
            wordItem={selectedWord}
            activeResult={currentResult}
            activeEngine={activeEngine}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
