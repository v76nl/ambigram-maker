import type { EngineResult, WordItem } from "../services/api";

export interface PinnedAmbigram {
  id: string;
  word: string;
  wordItem: WordItem;
  fontId: string;
  fontName: string;
  engine: string;
  result: EngineResult;
  score?: number | null;
  createdAt: number;
}
