import React, { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import type { WordItem, EngineResult, FontMeta, ReadabilityResponse } from "./services/api";
import {
  evaluateWord,
  generateAmbigram,
  getAvailableFonts,
  evaluateOffsets,
  evaluateReadability,
} from "./services/api";
import { useWordSearch } from "./hooks/useWordSearch";
import { parseAmbigramConfig } from "./utils/configParser";
import { WordSearch } from "./components/WordSearch";
import { AmbigramViewer } from "./components/AmbigramViewer";
import { SymmetryCard } from "./components/SymmetryCard";
import { FontSelector } from "./components/FontSelector";
import { EngineCompare } from "./components/EngineCompare";
import { ExportBar } from "./components/ExportBar";
import { PinnedGallery } from "./components/PinnedGallery";
import type { PinnedAmbigram } from "./types/pinned";

export const App: React.FC = () => {
  // 単語探索カスタムフック
  const {
    words,
    totalScannedCount,
    hasMore,
    loadMoreWords,
    selectedWord,
    setSelectedWord,
    searchQuery,
    setSearchQuery,
    minLength,
    maxLength,
    setMinLength,
    setMaxLength,
    commonOnly,
    setCommonOnly,
    includeHiragana,
    includeKanji,
    includeKatakana,
    includePhrase,
    handleToggleHiragana,
    handleToggleKanji,
    handleToggleKatakana,
    handleTogglePhrase,
    minScore,
    setMinScore,
    isLoadingWords,
    loadError,
    loadWords,
    handleCustomWord,
  } = useWordSearch();

  // フォント最適化ステート
  const [selectedFont, setSelectedFont] = useState<string>("auto");
  const [availableFonts, setAvailableFonts] = useState<FontMeta[]>([]);
  // 手動XYシフトオフセット & リアルタイム再計算スコア
  const [customOffsets, setCustomOffsets] = useState<[number, number][] | null>(null);
  const [recalculatedScore, setRecalculatedScore] = useState<number | null>(null);

  // グラフィック生成ステート (デフォルト: 骨格平均化)
  const [activeEngine, setActiveEngine] = useState<string>("skeleton");
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
  const [preBold, setPreBold] = useState<number>(4);
  // 先行研究パラメータ
  const [brushStyle, setBrushStyle] = useState<"calligraphic" | "uniform">("calligraphic");
  const [strokeModulation, setStrokeModulation] = useState<boolean>(true);
  const [enableSnap, setEnableSnap] = useState<boolean>(true);
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

  // フォント一覧の取得
  useEffect(() => {
    getAvailableFonts()
      .then(setAvailableFonts)
      .catch((err) => console.error("フォント一覧取得エラー:", err));
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

  // 設定インポート (parameters.json) ハンドラ
  const handleImportConfig = useCallback(
    async (importedData: any) => {
      try {
        const config = parseAmbigramConfig(importedData);

        // 各種パラメータの適用
        if (config.parameters.dilationSize !== undefined) setDilationSize(config.parameters.dilationSize);
        if (config.parameters.strokeThickness !== undefined) setStrokeThickness(config.parameters.strokeThickness);
        if (config.parameters.diffBlend !== undefined) setDiffBlend(config.parameters.diffBlend);
        if (config.parameters.preBold !== undefined) setPreBold(config.parameters.preBold);
        if (config.parameters.brushStyle) setBrushStyle(config.parameters.brushStyle);
        if (config.parameters.strokeModulation !== undefined) setStrokeModulation(config.parameters.strokeModulation);
        if (config.parameters.enableSnap !== undefined) setEnableSnap(config.parameters.enableSnap);
        if (config.parameters.blendRatio !== undefined) setBlendRatio(config.parameters.blendRatio);
        if (config.parameters.highlightMode !== undefined) setHighlightMode(config.parameters.highlightMode);
        if (config.parameters.blendWeight !== undefined) setBlendWeight(config.parameters.blendWeight);
        if (config.parameters.smoothness !== undefined) setSmoothness(config.parameters.smoothness);
        if (config.parameters.thresholdVal !== undefined) setThresholdVal(config.parameters.thresholdVal);
        if (config.parameters.stylePrompt !== undefined) setStylePrompt(config.parameters.stylePrompt);

        setActiveEngine(config.engine);
        setSelectedFont(config.font);
        setCustomOffsets(config.offsets);
        setRecalculatedScore(null);

        // 単語アイテムの解決
        let targetWordItem = words.find(
          (w) => (w.target_text || w.primary_display || w.word || w.reading) === config.word
        );
        if (!targetWordItem) {
          targetWordItem = await evaluateWord(config.word);
        }
        setSelectedWord(targetWordItem);

        // 成功フィードバック
        setImportToast(`設定を復元しました: 「${config.word}」(${config.engine})`);
        setTimeout(() => setImportToast(null), 4000);
      } catch (err: any) {
        console.error("設定インポートエラー:", err);
        alert(`設定ファイルのインポートに失敗しました: ${err.message || err}`);
      }
    },
    [words, setSelectedWord]
  );

  const currentResult = results[activeEngine as keyof typeof results] || null;

  // 固定（ピン留め）アンビグラム一覧 (localStorage永続化)
  const [pinnedList, setPinnedList] = useState<PinnedAmbigram[]>(() => {
    try {
      const saved = localStorage.getItem("ambigram_pinned_results");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ambigram_pinned_results", JSON.stringify(pinnedList));
    } catch (e) {
      console.warn("ピン留め結果の保存に失敗しました:", e);
    }
  }, [pinnedList]);

  const currentWordText =
    selectedWord?.target_text ||
    selectedWord?.primary_display ||
    selectedWord?.word ||
    selectedWord?.reading ||
    "";

  // 現在の結果が固定されているか判定
  const isCurrentResultPinned = pinnedList.some(
    (p) =>
      p.word === currentWordText &&
      p.fontId === selectedFont &&
      p.engine === activeEngine
  );

  const handleTogglePinResult = useCallback(() => {
    if (!selectedWord || !currentResult || currentResult.type === "error") return;

    if (isCurrentResultPinned) {
      // ピン解除
      setPinnedList((prev) =>
        prev.filter(
          (p) =>
            !(
              p.word === currentWordText &&
              p.fontId === selectedFont &&
              p.engine === activeEngine
            )
        )
      );
      setImportToast(`固定を解除しました: 「${currentWordText}」`);
      setTimeout(() => setImportToast(null), 3000);
    } else {
      // ピン留め追加
      const fontMeta = availableFonts.find((f) => f.id === selectedFont);
      const fontName = fontMeta?.name || selectedFont;
      const newItem: PinnedAmbigram = {
        id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        word: currentWordText,
        wordItem: selectedWord,
        fontId: selectedFont,
        fontName,
        engine: activeEngine,
        result: currentResult,
        score: recalculatedScore ?? selectedWord.score,
        createdAt: Date.now(),
      };
      setPinnedList((prev) => [newItem, ...prev]);
      setImportToast(`結果を固定しました: 「${currentWordText}」(${fontName})`);
      setTimeout(() => setImportToast(null), 3000);
    }
  }, [
    selectedWord,
    currentResult,
    isCurrentResultPinned,
    currentWordText,
    selectedFont,
    activeEngine,
    availableFonts,
    recalculatedScore,
  ]);

  const handleRemovePinned = useCallback((id: string) => {
    setPinnedList((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleClearAllPinned = useCallback(() => {
    if (window.confirm("固定した比較結果をすべて解除しますか？")) {
      setPinnedList([]);
    }
  }, []);

  const handleApplyPinned = useCallback(
    (item: PinnedAmbigram) => {
      setSelectedWord(item.wordItem);
      setSelectedFont(item.fontId);
      setActiveEngine(item.engine);
      setResults((prev) => ({
        ...prev,
        [item.engine]: item.result,
      }));
      setImportToast(`固定結果を適用しました: 「${item.word}」(${item.fontName})`);
      setTimeout(() => setImportToast(null), 3000);
    },
    [setSelectedWord]
  );

  return (
    <div className="app-container">
      {/* Main Layout (3ペイン) */}
      <main className="main-content-3pane">
        {/* 左ペイン: 単語探索 & フィルタ */}
        <aside className="pane-left">
          <WordSearch
            words={words}
            totalScannedCount={totalScannedCount}
            hasMore={hasMore}
            onLoadMore={loadMoreWords}
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
            includePhrase={includePhrase}
            onToggleHiragana={handleToggleHiragana}
            onToggleKanji={handleToggleKanji}
            onToggleKatakana={handleToggleKatakana}
            onTogglePhrase={handleTogglePhrase}
            minScore={minScore}
            onMinScoreChange={setMinScore}
            isLoading={isLoadingWords}
            loadError={loadError}
            onRetry={loadWords}
          />
        </aside>

        {/* 中央ペイン: ビューワー・反転・比較 & 固定ギャラリー */}
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
            onPinResult={handleTogglePinResult}
            isCurrentResultPinned={isCurrentResultPinned}
          />

          {/* 複数フォント・単語の比較用 固定結果トレイ */}
          <PinnedGallery
            pinnedList={pinnedList}
            onRemovePinned={handleRemovePinned}
            onClearAll={handleClearAllPinned}
            onApplyPinned={handleApplyPinned}
          />
        </section>

        {/* 右ペイン: 評価詳細・フォント・エンジン比較・微調整 */}
        <aside className="pane-right">
          {/* 先行研究スコア詳細 */}
          <SymmetryCard wordItem={selectedWord} />

          {/* フォント最適化 & 重心位置手動オフセット */}
          <FontSelector
            selectedFont={selectedFont}
            onFontChange={handleFontChange}
            availableFonts={availableFonts}
            activeResult={currentResult}
            customOffsets={customOffsets}
            onCustomOffsetsChange={handleCustomOffsetsChange}
            onResetOffsets={handleResetOffsets}
            targetWord={
              selectedWord?.target_text ||
              selectedWord?.primary_display ||
              selectedWord?.word ||
              selectedWord?.reading
            }
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
            dilationSize={dilationSize}
            strokeThickness={strokeThickness}
            diffBlend={diffBlend}
            preBold={preBold}
            brushStyle={brushStyle}
            strokeModulation={strokeModulation}
            enableSnap={enableSnap}
            blendRatio={blendRatio}
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
