import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { WordItem } from "../services/api";
import { searchWordsStream, evaluateWord } from "../services/api";

const BACKGROUND_SCAN_LIMIT = 1000;
const INITIAL_VISIBLE_COUNT = 100;
const PAGE_SIZE = 100;

export function useWordSearch() {
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);
  const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minLength, setMinLength] = useState<number>(2);
  const [maxLength, setMaxLength] = useState<number>(5);
  const [commonOnly, setCommonOnly] = useState<boolean>(true);
  const [includeHiragana, setIncludeHiragana] = useState<boolean>(true);
  const [includeKanji, setIncludeKanji] = useState<boolean>(true);
  const [includeKatakana, setIncludeKatakana] = useState<boolean>(true);
  const [includePhrase, setIncludePhrase] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<number>(0.75);
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const streamCancelRef = useRef<(() => void) | null>(null);

  // トグル制御 (すべてOFFになるのを防ぐ)
  const handleToggleHiragana = useCallback(() => {
    setIncludeHiragana((prev) => {
      if (prev && !includeKanji && !includeKatakana && !includePhrase) return prev;
      return !prev;
    });
  }, [includeKanji, includeKatakana, includePhrase]);

  const handleToggleKanji = useCallback(() => {
    setIncludeKanji((prev) => {
      if (prev && !includeHiragana && !includeKatakana && !includePhrase) return prev;
      return !prev;
    });
  }, [includeHiragana, includeKatakana, includePhrase]);

  const handleToggleKatakana = useCallback(() => {
    setIncludeKatakana((prev) => {
      if (prev && !includeHiragana && !includeKanji && !includePhrase) return prev;
      return !prev;
    });
  }, [includeHiragana, includeKanji, includePhrase]);

  const handleTogglePhrase = useCallback(() => {
    setIncludePhrase((prev) => {
      if (prev && !includeHiragana && !includeKanji && !includeKatakana) return prev;
      return !prev;
    });
  }, [includeHiragana, includeKanji, includeKatakana]);

  // 単語一覧の読み込み (バックグラウンド最大1000件スキャン)
  const loadWords = useCallback(() => {
    if (streamCancelRef.current) {
      streamCancelRef.current();
      streamCancelRef.current = null;
    }

    setIsLoadingWords(true);
    setLoadError(null);
    setAllWords([]);
    setVisibleCount(INITIAL_VISIBLE_COUNT);

    const cancel = searchWordsStream(
      {
        minLength,
        maxLength,
        commonOnly: searchQuery.trim() ? false : commonOnly,
        minScore: searchQuery.trim() ? 0.2 : minScore,
        query: searchQuery.trim() || undefined,
        limit: BACKGROUND_SCAN_LIMIT,
        includeKanji,
        includeKatakana,
        includeHiragana,
        includePhrase,
      },
      (newWord) => {
        setAllWords((prev) => {
          const key = newWord.target_text || newWord.reading;
          if (prev.some((w) => (w.target_text || w.reading) === key)) {
            return prev;
          }
          const next = [...prev, newWord];
          next.sort((a, b) => b.score - a.score);
          return next;
        });

        setSelectedWord((prev) => prev || newWord);
      },
      () => {
        setIsLoadingWords(false);
      },
      (err) => {
        console.error("単語読み込みエラー:", err);
        setLoadError(
          "バックエンドAPI (http://127.0.0.1:8000) への接続に失敗しました。サーバーが起動しているか確認してください。"
        );
        setIsLoadingWords(false);
      }
    );

    streamCancelRef.current = cancel;
  }, [minLength, maxLength, commonOnly, searchQuery, includeKanji, includeKatakana, includeHiragana, includePhrase, minScore]);

  // デバウンス付き自動検索
  useEffect(() => {
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

  // スクロール下端でさらに100件表示
  const loadMoreWords = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= allWords.length) return prev;
      return prev + PAGE_SIZE;
    });
  }, [allWords.length]);

  // 画面に表示する単語（デフォルト100件、スクロールで順次拡大）
  const words = useMemo(() => {
    return allWords.slice(0, visibleCount);
  }, [allWords, visibleCount]);

  const hasMore = visibleCount < allWords.length;

  // 自由入力単語の評価・選択
  const handleCustomWord = useCallback(async (inputWord: string): Promise<WordItem | null> => {
    try {
      const res = await evaluateWord(inputWord);
      setSelectedWord(res);
      setAllWords((prev) => {
        const key = res.target_text || res.reading;
        if (!prev.some((w) => (w.target_text || w.reading) === key)) {
          return [res, ...prev];
        }
        return prev;
      });
      return res;
    } catch (err) {
      console.error("自由入力単語評価エラー:", err);
      return null;
    }
  }, []);

  return {
    words,
    totalScannedCount: allWords.length,
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
  };
}
