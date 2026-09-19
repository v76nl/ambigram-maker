import json
from pathlib import Path
import sys
from typing import Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = Path(__file__).parent.parent
WORDS_PATH = DATA_DIR / "dictionary" / "hiragana_words.json"
MATRIX_PATH = DATA_DIR / "scoring" / "compatibility.json"

class AmbigramFinder:
    def __init__(self, words_path: Path = WORDS_PATH, matrix_path: Path = MATRIX_PATH):
        print("探索エンジン初期化中...")
        with open(words_path, "r", encoding="utf-8") as f:
            self.words: list[dict[str, Any]] = json.load(f)
            
        with open(matrix_path, "r", encoding="utf-8") as f:
            self.matrix: dict[str, dict[str, float]] = json.load(f)
            
        print(f"探索エンジン準備完了: 単語数 {len(self.words):,}")

    def get_char_compatibility(self, c1: str, c2: str) -> float:
        """2文字の180度回転相性スコアを取得（マトリクスにない場合は0.1）"""
        return self.matrix.get(c1, {}).get(c2, 0.1)

    def evaluate_word(self, word: str, is_common: bool = False, kanji: list[str] = None) -> dict[str, Any]:
        """指定された単語の自己対称アンビグラム適性を評価する"""
        n = len(word)
        if n < 1:
            return {"reading": word, "score": 0.0, "pairs": []}

        pairs = []
        scores = []
        half_len = (n + 1) // 2

        for i in range(half_len):
            c1 = word[i]
            c2 = word[n - 1 - i]
            score = self.get_char_compatibility(c1, c2)
            scores.append(score)
            pairs.append({
                "index1": i,
                "char1": c1,
                "index2": n - 1 - i,
                "char2": c2,
                "is_center": i == (n - 1 - i),
                "score": score,
            })

        # 幾何平均（全ペアが一定水準以上であることを評価）
        # 1つでも0に近いペアがあればスコアが落ちる
        product = 1.0
        for s in scores:
            product *= max(0.01, s)
        geometric_mean = product ** (1.0 / len(scores))
        
        # 最小ペアルックスコア（弱点ペナルティ）
        min_score = min(scores) if scores else 0.0

        # ベーススコア = 幾何平均 70% + 最小スコア 30%
        base_score = 0.7 * geometric_mean + 0.3 * min_score

        # 常用語ボーナス
        common_bias = 1.15 if is_common else 1.0
        final_score = min(1.0, base_score * common_bias)

        return {
            "reading": word,
            "length": n,
            "common": is_common,
            "kanji": kanji or [],
            "score": round(final_score, 4),
            "geometric_mean": round(geometric_mean, 4),
            "min_pair_score": round(min_score, 4),
            "pairs": pairs,
        }

    def search(
        self,
        min_length: int = 2,
        max_length: int = 6,
        common_only: bool = True,
        min_score: float = 0.5,
        limit: int = 50,
        query: str = "",
    ) -> list[dict[str, Any]]:
        """条件に合致する自己対称アンビグラム適性単語を探索してランキング順に返す"""
        results = []

        for item in self.words:
            reading = item["reading"]
            length = item["length"]
            is_common = item["common"]

            if length < min_length or length > max_length:
                continue
            if common_only and not is_common:
                continue
            if query and query not in reading:
                continue

            eval_res = self.evaluate_word(reading, is_common=is_common, kanji=item.get("kanji", []))
            if eval_res["score"] >= min_score:
                results.append(eval_res)

        # スコア降順ソート
        results.sort(key=lambda x: (x["score"], x["common"], -x["length"]), reverse=True)
        return results[:limit]

if __name__ == "__main__":
    finder = AmbigramFinder()
    print("\n--- 上位の自己対称アンビグラム単語 (常用語, 2〜6文字) ---")
    top_words = finder.search(min_length=2, max_length=6, common_only=True, min_score=0.6, limit=20)
    for w in top_words:
        kanji_str = f" ({', '.join(w['kanji'])})" if w['kanji'] else ""
        print(f"[{w['score']:.3f}] {w['reading']}{kanji_str} - ペア: {[(p['char1'], p['char2'], p['score']) for p in w['pairs']]}")
