import React, { useEffect, useState, useCallback } from "react";
import type { WordItem, EngineResult, FontMeta } from "./services/api";
import {
  searchWords,
  evaluateWord,
  generateAmbigram,
  getAvailableFonts,
} from "./services/api";
import { WordSearch } from "./components/WordSearch";
import { AmbigramViewer } from "./components/AmbigramViewer";
import { SymmetryCard } from "./components/SymmetryCard";
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
  const [includeHiragana, setIncludeHiragana] = useState<boolean>(true);
  const [includeKanji, setIncludeKanji] = useState<boolean>(true);
  const [includeKatakana, setIncludeKatakana] = useState<boolean>(true);
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

  // トグル制御 (すべてOFFになるのを防ぐ)
  const handleToggleHiragana = useCallback(() => {
    setIncludeHiragana((prev) => {
      if (prev && !includeKanji && !includeKatakana) return prev; // 最後の1つはOFFにしない
      return !prev;
    });
  }, [includeKanji, includeKatakana]);

  const handleToggleKanji = useCallback(() => {
    setIncludeKanji((prev) => {
      if (prev && !includeHiragana && !includeKatakana) return prev;
      return !prev;
    });
  }, [includeHiragana, includeKatakana]);

  const handleToggleKatakana = useCallback(() => {
    setIncludeKatakana((prev) => {
      if (prev && !includeHiragana && !includeKanji) return prev;
      return !prev;
    });
  }, [includeHiragana, includeKanji]);

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
        includeKanji,
        includeKatakana,
        includeHiragana,
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
  }, [minLength, maxLength, commonOnly, searchQuery, includeKanji, includeKatakana, includeHiragana]);

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
        const targetText = wordToGen.target_text || wordToGen.primary_display || wordToGen.word || wordToGen.reading;
        const response = await generateAmbigram({
          word: targetText,
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

  // 単語変更、エンジン変更、フォント変更、またはスライダー等のパラメータ変更時に自動反映 (デバウンス付き)
  useEffect(() => {
    if (!selectedWord) return;

    const timer = setTimeout(() => {
      triggerGenerate(selectedWord);
    }, 150);

    return () => clearTimeout(timer);
  }, [
    selectedWord,
    activeEngine,
    selectedFont,
    dilationSize,
    strokeThickness,
    preBold,
    diffBlend,
    blendRatio,
    blendWeight,
    smoothness,
    thresholdVal,
    stylePrompt,
    triggerGenerate,
  ]);

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
      {/* Minimal Utility Bar (Subtractive: Top heading eliminated per design guidelines) */}
      <header className="app-header">
        <div className="brand-title">
          <span className="brand-tag">180°</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text-secondary)" }}>
            ROTATIONAL AMBIGRAM
          </span>
        </div>
        <div className="header-meta">
          {selectedWord && (
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent)" }}>
              {selectedWord.primary_display || selectedWord.reading}
              {selectedWord.primary_display && selectedWord.primary_display !== selectedWord.reading
                ? ` (${selectedWord.reading})`
                : ""}{" "}
              ({Math.round(selectedWord.score * 100)}%)
            </span>
          )}
          <span style={{ color: "var(--border-medium)" }}>|</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
            {words.length > 0 ? `${words.length} CANDIDATES` : "LOADING"}
          </span>
        </div>
      </header>

      {/* Main Layout (3ペイン) */}
      <main className="main-content-3pane">
        {/* 左ペイン: 単語探索 & フィルタ */}
        <aside className="pane-left">
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
            includeHiragana={includeHiragana}
            includeKanji={includeKanji}
            includeKatakana={includeKatakana}
            onToggleHiragana={handleToggleHiragana}
            onToggleKanji={handleToggleKanji}
            onToggleKatakana={handleToggleKatakana}
            isLoading={isLoadingWords}
            loadError={loadError}
            onRetry={loadWords}
          />
        </aside>

        {/* 中央ペイン: ビューワー・反転・比較 */}
        <section className="pane-center">
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
        </section>

        {/* 右ペイン: 対称ペア解析 ＋ パラメータ調整 ＋ エクスポート */}
        <aside className="pane-right">
          {/* 対称文字ペア解析 */}
          <SymmetryCard wordItem={selectedWord} />

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
        </aside>
      </main>
    </div>
  );
};

export default App;
