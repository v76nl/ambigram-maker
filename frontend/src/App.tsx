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
import { useAmbigramParams } from "./hooks/useAmbigramParams";
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

  // アンビグラム生成パラメータカスタムフック
  const {
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
  } = useAmbigramParams();

  const [readabilityData, setReadabilityData] = useState<ReadabilityResponse | null>(null);
  const [isReadabilityLoading, setIsReadabilityLoading] = useState<boolean>(false);
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
          blendRatio: params.blendRatio,
          strokeWidth: 0.0,
          highlightMode: overrideHighlight !== undefined ? overrideHighlight : params.highlightMode,
          dilationSize: params.dilationSize,
          strokeThickness: params.strokeThickness,
          brushStyle: params.brushStyle,
          strokeModulation: params.strokeModulation,
          enableSnap: params.snapStrength > 0,
          snapStrength: params.snapStrength,
          diffBlend: params.diffBlend,
          preBold: params.preBold,
          blendWeight: params.blendWeight,
          smoothness: params.smoothness,
          thresholdVal: params.thresholdVal,
          apiKey: params.apiKey || undefined,
          stylePrompt: params.stylePrompt,
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
    [activeEngine, selectedFont, customOffsets, params]
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
    params,
    triggerGenerate,
    updateReadability,
  ]);

  const handleToggleHighlightMode = () => {
    const nextVal = !params.highlightMode;
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

        // 各種生成パラメータの一括適用 (カスタムフックへ委譲)
        applyImportedConfig(config);

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
    [words, setSelectedWord, applyImportedConfig]
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
            highlightMode={params.highlightMode}
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
            blendRatio={params.blendRatio}
            onBlendRatioChange={setBlendRatio}
            dilationSize={params.dilationSize}
            onDilationSizeChange={setDilationSize}
            strokeThickness={params.strokeThickness}
            onStrokeThicknessChange={setStrokeThickness}
            diffBlend={params.diffBlend}
            onDiffBlendChange={setDiffBlend}
            preBold={params.preBold}
            onPreBoldChange={setPreBold}
            brushStyle={params.brushStyle}
            onBrushStyleChange={setBrushStyle}
            strokeModulation={params.strokeModulation}
            onStrokeModulationChange={setStrokeModulation}
            enableSnap={params.snapStrength > 0}
            onEnableSnapChange={(val) => setSnapStrength(val ? 0.75 : 0.0)}
            snapStrength={params.snapStrength}
            onSnapStrengthChange={setSnapStrength}
            blendWeight={params.blendWeight}
            onBlendWeightChange={setBlendWeight}
            smoothness={params.smoothness}
            onSmoothnessChange={setSmoothness}
            thresholdVal={params.thresholdVal}
            onThresholdValChange={setThresholdVal}
            apiKey={params.apiKey}
            onApiKeyChange={setApiKey}
            stylePrompt={params.stylePrompt}
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
            dilationSize={params.dilationSize}
            strokeThickness={params.strokeThickness}
            diffBlend={params.diffBlend}
            preBold={params.preBold}
            brushStyle={params.brushStyle}
            strokeModulation={params.strokeModulation}
            enableSnap={params.snapStrength > 0}
            snapStrength={params.snapStrength}
            blendRatio={params.blendRatio}
            blendWeight={params.blendWeight}
            smoothness={params.smoothness}
            thresholdVal={params.thresholdVal}
            stylePrompt={params.stylePrompt}
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
