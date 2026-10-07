import React, { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import type { WordItem, EngineResult, FontMeta, ReadabilityResponse } from "./services/api";
import {
  searchWordsStream,
  evaluateWord,
  generateAmbigram,
  getAvailableFonts,
  evaluateOffsets,
  evaluateReadability,
} from "./services/api";
import { WordSearch } from "./components/WordSearch";
import { AmbigramViewer } from "./components/AmbigramViewer";
import { SymmetryCard } from "./components/SymmetryCard";
import { FontSelector } from "./components/FontSelector";
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
  const [minScore, setMinScore] = useState<number>(0.75); // デフォルト0.75 (高品質) に引き上げ
  const [wordLimit, setWordLimit] = useState<number>(100); // デフォルト100件 (真のトップ100) に拡大
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // フォント最適化ステート
  const [selectedFont, setSelectedFont] = useState<string>("auto");
  const [availableFonts, setAvailableFonts] = useState<FontMeta[]>([]);
  // 手動XYシフトオフセット & リアルタイム再計算スコア
  const [customOffsets, setCustomOffsets] = useState<[number, number][] | null>(null);
  const [recalculatedScore, setRecalculatedScore] = useState<number | null>(null);

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
  // 井上・高橋(2020) & 魏・山口(2023) 先行研究パラメータ
  const [brushStyle, setBrushStyle] = useState<"calligraphic" | "uniform">("calligraphic");
  const [strokeModulation, setStrokeModulation] = useState<boolean>(true);
  const [enableSnap, setEnableSnap] = useState<boolean>(true); // 近接ストローク吸引 (Issue #1, #2)
  const [readabilityData, setReadabilityData] = useState<ReadabilityResponse | null>(null);
  const [isReadabilityLoading, setIsReadabilityLoading] = useState<boolean>(false);
  // ビットマップパラメータ
  const [blendWeight, setBlendWeight] = useState<number>(0.65);
  const [smoothness, setSmoothness] = useState<number>(7);
  const [thresholdVal, setThresholdVal] = useState<number>(110);
  const [apiKey, setApiKey] = useState<string>("");
  const [stylePrompt, setStylePrompt] = useState<string>(
    "minimalist black calligraphy on pure white background, sharp vector aesthetic"
  );
  const [importToast, setImportToast] = useState<string | null>(null);

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

  // 単語一覧の読み込み（リアルタイムSSEストリーミング対応）
  const streamCancelRef = useRef<(() => void) | null>(null);

  const loadWords = useCallback(() => {
    // 既存の通信があれば即座に中断
    if (streamCancelRef.current) {
      streamCancelRef.current();
      streamCancelRef.current = null;
    }

    setIsLoadingWords(true);
    setLoadError(null);
    setWords([]); // 新しい検索開始時にクリアし、届いた順に埋めていく

    const cancel = searchWordsStream(
      {
        minLength,
        maxLength,
        commonOnly: searchQuery.trim() ? false : commonOnly,
        minScore: searchQuery.trim() ? 0.2 : minScore,
        query: searchQuery.trim() || undefined,
        limit: wordLimit,
        includeKanji,
        includeKatakana,
        includeHiragana,
      },
      (newWord) => {
        // 単語が1件見つかるごとにリアルタイムに追加・スコア降順ソート
        setWords((prev) => {
          const key = newWord.target_text || newWord.reading;
          if (prev.some((w) => (w.target_text || w.reading) === key)) {
            return prev;
          }
          const next = [...prev, newWord];
          next.sort((a, b) => b.score - a.score);
          return next;
        });

        // 最初の1件が届いた時点で初期選択
        setSelectedWord((prev) => prev || newWord);
      },
      () => {
        setIsLoadingWords(false);
      },
      (err) => {
        console.error("単語読み込みエラー:", err);
        setLoadError("バックエンドAPI (http://127.0.0.1:8000) への接続に失敗しました。サーバーが起動しているか確認してください。");
        setIsLoadingWords(false);
      }
    );

    streamCancelRef.current = cancel;
  }, [minLength, maxLength, commonOnly, searchQuery, includeKanji, includeKatakana, includeHiragana, minScore, wordLimit]);

  useEffect(() => {
    // 検索クエリ入力時のデバウンス
    const timer = setTimeout(() => {
      loadWords();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadWords]);

  useEffect(() => {
    return () => {
      if (streamCancelRef.current) {
        streamCancelRef.current();
      }
    };
  }, []);

  // アンビグラム生成
  const triggerGenerate = useCallback(
    async (
      wordToGen: WordItem | null,
      engineToGen?: string,
      overrideHighlight?: boolean,
      fontToGen?: string,
      offsetsToGen?: [number, number][] | null
    ) => {
      if (!wordToGen) return;
      setIsGenerating(true);
      try {
        const targetText = wordToGen.target_text || wordToGen.primary_display || wordToGen.word || wordToGen.reading;
        const offsets = offsetsToGen !== undefined ? offsetsToGen : customOffsets;
        const response = await generateAmbigram({
          word: targetText,
          engine: (engineToGen || activeEngine) as any,
          font: fontToGen || selectedFont,
          customOffsets: offsets || undefined,
          blendRatio,
          strokeWidth: 0.0,
          highlightMode: overrideHighlight !== undefined ? overrideHighlight : highlightMode,
          dilationSize,
          strokeThickness,
          brushStyle,
          strokeModulation,
          enableSnap,
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
      customOffsets,
      blendRatio,
      highlightMode,
      dilationSize,
      strokeThickness,
      brushStyle,
      strokeModulation,
      enableSnap,
      diffBlend,
      preBold,
      blendWeight,
      smoothness,
      thresholdVal,
      apiKey,
      stylePrompt,
    ]
  );

  // 客観的文字認識・可読性評価の更新
  const updateReadability = useCallback(
    async (wordToEval: WordItem | null, fontId?: string, offsets?: [number, number][]) => {
      if (!wordToEval) return;
      const targetText = wordToEval.target_text || wordToEval.primary_display || wordToEval.word || wordToEval.reading;
      setIsReadabilityLoading(true);
      try {
        const res = await evaluateReadability(
          targetText,
          fontId || selectedFont,
          offsets || customOffsets || undefined
        );
        setReadabilityData(res);
      } catch (err) {
        console.error("可読性評価取得エラー:", err);
      } finally {
        setIsReadabilityLoading(false);
      }
    },
    [selectedFont, customOffsets]
  );

  // 手動XYシフト変更ハンドラ（即座に一致率を再計算）
  const handleCustomOffsetsChange = useCallback(
    (newOffsets: [number, number][]) => {
      setCustomOffsets(newOffsets);
      const targetText =
        selectedWord?.target_text ||
        selectedWord?.primary_display ||
        selectedWord?.word ||
        selectedWord?.reading;
      if (targetText) {
        evaluateOffsets(targetText, selectedFont, newOffsets)
          .then((res) => {
            setRecalculatedScore(res.score);
          })
          .catch((err) => console.error("オフセット評価エラー:", err));
      }
    },
    [selectedWord, selectedFont]
  );

  // 手動XYシフトのリセット
  const handleResetOffsets = useCallback(() => {
    setCustomOffsets(null);
    setRecalculatedScore(null);
    if (selectedWord) {
      triggerGenerate(selectedWord, undefined, undefined, undefined, null);
    }
  }, [selectedWord, triggerGenerate]);

  // フォント変更ハンドラ (手動シフトをリセット)
  const handleFontChange = useCallback((fontId: string) => {
    setSelectedFont(fontId);
    setCustomOffsets(null);
    setRecalculatedScore(null);
  }, []);

  // 単語変更、エンジン変更、フォント変更、パラメータ変更時に自動反映 (デバウンス付き)
  useEffect(() => {
    if (!selectedWord) return;

    const timer = setTimeout(() => {
      triggerGenerate(selectedWord);
      updateReadability(selectedWord, selectedFont, customOffsets || undefined);
    }, 150);

    return () => clearTimeout(timer);
  }, [
    selectedWord,
    activeEngine,
    selectedFont,
    customOffsets,
    dilationSize,
    strokeThickness,
    brushStyle,
    strokeModulation,
    enableSnap,
    preBold,
    diffBlend,
    blendRatio,
    blendWeight,
    smoothness,
    thresholdVal,
    stylePrompt,
    triggerGenerate,
    updateReadability,
  ]);

  const handleToggleHighlightMode = () => {
    const nextVal = !highlightMode;
    setHighlightMode(nextVal);
    if (selectedWord && activeEngine === "vector") {
      triggerGenerate(selectedWord, "vector", nextVal);
    }
  };

  // 単語選択ハンドラ (手動シフトをリセット)
  const handleSelectWord = (w: WordItem) => {
    setSelectedWord(w);
    setCustomOffsets(null);
    setRecalculatedScore(null);
  };

  // 自由入力単語ハンドラ
  const handleCustomWord = async (inputWord: string) => {
    try {
      const evaluated = await evaluateWord(inputWord);
      setSelectedWord(evaluated);
      setCustomOffsets(null);
      setRecalculatedScore(null);
    } catch (err) {
      console.error("単語評価エラー:", err);
    }
  };

  // エクスポート設定JSONのインポート復元ハンドラ
  const handleImportConfig = useCallback(
    async (importedData: any) => {
      try {
        if (!importedData || typeof importedData !== "object") {
          throw new Error("無効な設定データ形式です。");
        }

        // 1. 対象単語の取得
        const wordStr = (
          importedData.reproducibility?.target?.word ||
          importedData.reproduction_api_payload?.word ||
          importedData.target?.word ||
          importedData.word ||
          ""
        ).trim();

        if (!wordStr) {
          throw new Error("JSON内に有効な単語 (word) が見つかりませんでした。");
        }

        // 2. エンジン・フォント・オフセットの取得
        const engineStr =
          importedData.reproducibility?.engine?.id ||
          importedData.reproduction_api_payload?.engine ||
          importedData.engine?.id ||
          importedData.engine ||
          "morphology";

        const fontStr =
          importedData.reproducibility?.font?.id ||
          importedData.reproduction_api_payload?.font ||
          importedData.font?.id ||
          importedData.font ||
          "auto";

        const offsets =
          importedData.reproducibility?.alignment?.offsets ||
          importedData.reproduction_api_payload?.customOffsets ||
          importedData.customOffsets ||
          importedData.offsets ||
          null;

        const rawParams =
          importedData.reproducibility?.parameters ||
          importedData.reproduction_api_payload ||
          importedData.parameters ||
          importedData;

        // 3. 各種パラメータの復元
        if (rawParams.dilation_size !== undefined || rawParams.dilationSize !== undefined) {
          setDilationSize(Number(rawParams.dilation_size ?? rawParams.dilationSize));
        }
        if (rawParams.stroke_thickness !== undefined || rawParams.strokeThickness !== undefined) {
          setStrokeThickness(Number(rawParams.stroke_thickness ?? rawParams.strokeThickness));
        }
        if (rawParams.diff_blend !== undefined || rawParams.diffBlend !== undefined) {
          setDiffBlend(Number(rawParams.diff_blend ?? rawParams.diffBlend));
        }
        if (rawParams.pre_bold !== undefined || rawParams.preBold !== undefined) {
          setPreBold(Number(rawParams.pre_bold ?? rawParams.preBold));
        }
        if (rawParams.brush_style || rawParams.brushStyle) {
          setBrushStyle((rawParams.brush_style ?? rawParams.brushStyle) as "calligraphic" | "uniform");
        }
        if (rawParams.stroke_modulation !== undefined || rawParams.strokeModulation !== undefined) {
          setStrokeModulation(Boolean(rawParams.stroke_modulation ?? rawParams.strokeModulation));
        }
        if (rawParams.enable_snap !== undefined || rawParams.enableSnap !== undefined) {
          setEnableSnap(Boolean(rawParams.enable_snap ?? rawParams.enableSnap));
        }
        if (rawParams.blend_ratio !== undefined || rawParams.blendRatio !== undefined) {
          setBlendRatio(Number(rawParams.blend_ratio ?? rawParams.blendRatio));
        }
        if (rawParams.highlight_mode !== undefined || rawParams.highlightMode !== undefined) {
          setHighlightMode(Boolean(rawParams.highlight_mode ?? rawParams.highlightMode));
        }
        if (rawParams.blend_weight !== undefined || rawParams.blendWeight !== undefined) {
          setBlendWeight(Number(rawParams.blend_weight ?? rawParams.blendWeight));
        }
        if (rawParams.smoothness !== undefined) {
          setSmoothness(Number(rawParams.smoothness));
        }
        if (rawParams.threshold_val !== undefined || rawParams.thresholdVal !== undefined) {
          setThresholdVal(Number(rawParams.threshold_val ?? rawParams.thresholdVal));
        }
        if (rawParams.style_prompt !== undefined || rawParams.stylePrompt !== undefined) {
          setStylePrompt(String(rawParams.style_prompt ?? rawParams.stylePrompt));
        }

        setActiveEngine(engineStr);
        setSelectedFont(fontStr);
        setCustomOffsets(Array.isArray(offsets) ? offsets : null);
        setRecalculatedScore(null);

        // 4. 単語アイテムの解決
        let targetWordItem = words.find(
          (w) => (w.target_text || w.primary_display || w.word || w.reading) === wordStr
        );
        if (!targetWordItem) {
          targetWordItem = await evaluateWord(wordStr);
        }
        setSelectedWord(targetWordItem);

        // 成功フィードバック
        setImportToast(`設定を復元しました: 「${wordStr}」(${engineStr})`);
        setTimeout(() => setImportToast(null), 4000);
      } catch (err: any) {
        console.error("設定インポートエラー:", err);
        alert(`設定ファイルのインポートに失敗しました: ${err.message || err}`);
      }
    },
    [words]
  );

  const currentResult = results[activeEngine as keyof typeof results] || null;

  return (
    <div className="app-container">
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
            minScore={minScore}
            onMinScoreChange={setMinScore}
            limit={wordLimit}
            onLimitChange={setWordLimit}
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
            readabilityData={readabilityData}
            isReadabilityLoading={isReadabilityLoading}
            isGenerating={isGenerating}
          />
        </section>

        {/* 右ペイン: 対称ペア解析 ＋ フォント選定 ＋ パラメータ調整 ＋ エクスポート */}
        <aside className="pane-right">
          {/* 対称文字ペア解析 */}
          <SymmetryCard wordItem={selectedWord} />

          {/* フォント選定 (垂直リスト & XYシフト調整) */}
          <FontSelector
            selectedFont={selectedFont}
            onFontChange={handleFontChange}
            availableFonts={availableFonts}
            activeResult={currentResult}
            customOffsets={customOffsets}
            onCustomOffsetsChange={handleCustomOffsetsChange}
            onResetOffsets={handleResetOffsets}
            targetWord={selectedWord?.target_text || selectedWord?.primary_display || selectedWord?.word || selectedWord?.reading}
            recalculatedScore={recalculatedScore}
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
            brushStyle={brushStyle}
            onBrushStyleChange={setBrushStyle}
            strokeModulation={strokeModulation}
            onStrokeModulationChange={setStrokeModulation}
            enableSnap={enableSnap}
            onEnableSnapChange={setEnableSnap}
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

          {/* エクスポートバー & 設定インポート */}
          <ExportBar
            wordItem={selectedWord}
            activeResult={currentResult}
            activeEngine={activeEngine}
            selectedFont={selectedFont}
            customOffsets={customOffsets}
            readabilityData={readabilityData}
            blendRatio={blendRatio}
            highlightMode={highlightMode}
            dilationSize={dilationSize}
            strokeThickness={strokeThickness}
            diffBlend={diffBlend}
            preBold={preBold}
            brushStyle={brushStyle}
            strokeModulation={strokeModulation}
            enableSnap={enableSnap}
            blendWeight={blendWeight}
            smoothness={smoothness}
            thresholdVal={thresholdVal}
            stylePrompt={stylePrompt}
            onImportConfig={handleImportConfig}
          />
        </aside>
      </main>

      {/* インポート完了通知トースト */}
      {importToast && (
        <div className="import-toast-banner">
          <CheckCircle2 size={16} color="var(--accent)" />
          <span>{importToast}</span>
        </div>
      )}
    </div>
  );
};

export default App;
