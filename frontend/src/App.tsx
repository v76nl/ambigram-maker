import React, { useEffect, useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import type { WordItem, EngineResult } from "./services/api";
import {
  searchWords,
  evaluateWord,
  generateAmbigram,
} from "./services/api";
import { WordSearch } from "./components/WordSearch";
import { AmbigramViewer } from "./components/AmbigramViewer";
import { EngineCompare } from "./components/EngineCompare";
import { ExportBar } from "./components/ExportBar";

export const App: React.FC = () => {
  // 単語探索・選択ステート
  const [words, setWords] = useState<WordItem[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
  const [minLength, setMinLength] = useState<number>(2);
  const [maxLength, setMaxLength] = useState<number>(5);
  const [commonOnly, setCommonOnly] = useState<boolean>(true);
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);

  // グラフィック生成ステート
  const [activeEngine, setActiveEngine] = useState<string>("vector");
  const [results, setResults] = useState<{
    vector?: EngineResult;
    bitmap?: EngineResult;
    gemini?: EngineResult;
  }>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // パラメータ
  const [blendRatio, setBlendRatio] = useState<number>(0.5);
  const [highlightMode, setHighlightMode] = useState<boolean>(false);
  const [blendWeight, setBlendWeight] = useState<number>(0.65);
  const [smoothness, setSmoothness] = useState<number>(7);
  const [thresholdVal, setThresholdVal] = useState<number>(110);
  const [apiKey, setApiKey] = useState<string>("");
  const [stylePrompt, setStylePrompt] = useState<string>(
    "minimalist black calligraphy on pure white background, sharp vector aesthetic"
  );

  // 単語一覧の読み込み
  const loadWords = useCallback(async () => {
    setIsLoadingWords(true);
    try {
      const fetched = await searchWords({
        minLength,
        maxLength,
        commonOnly,
        minScore: 0.6,
        limit: 50,
      });
      setWords(fetched);
      if (fetched.length > 0 && !selectedWord) {
        setSelectedWord(fetched[0]);
      }
    } catch (err) {
      console.error("単語読み込みエラー:", err);
    } finally {
      setIsLoadingWords(false);
    }
  }, [minLength, maxLength, commonOnly]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // アンビグラム生成
  const triggerGenerate = useCallback(
    async (wordToGen: WordItem | null, engineToGen?: string, overrideHighlight?: boolean) => {
      if (!wordToGen) return;
      setIsGenerating(true);
      try {
        const response = await generateAmbigram({
          word: wordToGen.reading,
          engine: (engineToGen || activeEngine) as any,
          blendRatio,
          strokeWidth: 0.0,
          highlightMode: overrideHighlight !== undefined ? overrideHighlight : highlightMode,
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
    [activeEngine, blendRatio, highlightMode, blendWeight, smoothness, thresholdVal, apiKey, stylePrompt]
  );

  // 単語変更時に生成
  useEffect(() => {
    if (selectedWord) {
      triggerGenerate(selectedWord);
    }
  }, [selectedWord, activeEngine]);

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
          minLength={minLength}
          maxLength={maxLength}
          onLengthChange={(min, max) => {
            setMinLength(min);
            setMaxLength(max);
          }}
          commonOnly={commonOnly}
          onCommonOnlyChange={(val) => setCommonOnly(val)}
          isLoading={isLoadingWords}
        />

        {/* 右側: ビューワー ＋ 手法比較・設定 ＋ エクスポート */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 180度回転インタラクティブビューワー */}
          <AmbigramViewer
            wordItem={selectedWord}
            activeResult={currentResult}
            activeEngine={activeEngine}
            highlightMode={highlightMode}
            onToggleHighlightMode={handleToggleHighlightMode}
          />

          {/* 3手法比較・パラメータ調整 */}
          <EngineCompare
            activeEngine={activeEngine}
            onEngineChange={(engine) => setActiveEngine(engine)}
            results={results}
            blendRatio={blendRatio}
            onBlendRatioChange={setBlendRatio}
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
