import json
from pathlib import Path
import sys
from typing import Any

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = Path(__file__).parent.parent
WORDS_PATH = DATA_DIR / "dictionary" / "hiragana_words.json"
MATRIX_PATH = DATA_DIR / "scoring" / "compatibility.json"

def katakana_to_hiragana(s: str) -> str:
    """カタカナをひらがなに変換する"""
    result = []
    for c in s:
        code = ord(c)
        if 0x30A1 <= code <= 0x30F6:  # カタカナ範囲
            c = chr(code - 0x60)
        result.append(c)
    return "".join(result)

def hiragana_to_katakana(s: str) -> str:
    """ひらがなをカタカナに変換する"""
    result = []
    for c in s:
        code = ord(c)
        if 0x3041 <= code <= 0x3096:  # ひらがな範囲
            c = chr(code + 0x60)
        result.append(c)
    return "".join(result)

class AmbigramFinder:
    def __init__(self, words_path: Path = WORDS_PATH, matrix_path: Path = MATRIX_PATH):
        print("探索エンジン初期化中...")
        with open(words_path, "r", encoding="utf-8") as f:
            self.words: list[dict[str, Any]] = json.load(f)
            
        with open(matrix_path, "r", encoding="utf-8") as f:
            self.matrix: dict[str, dict[str, float]] = json.load(f)
            
        # 漢字表記およびカタカナ表記からの高速インデックス作成
        self.kanji_to_word: dict[str, dict[str, Any]] = {}
        self.katakana_to_word: dict[str, dict[str, Any]] = {}
        for w in self.words:
            for k in w.get("kanji", []):
                if k not in self.kanji_to_word:
                    self.kanji_to_word[k] = w
                else:
                    curr = self.kanji_to_word[k]
                    # 代表漢字の近さ (index) と常用度、完全一致 display で優先度判定
                    curr_rank = (1 if curr.get("display") == k else 0, 1 if curr.get("common") else 0, -curr.get("kanji", []).index(k) if k in curr.get("kanji", []) else -99)
                    new_rank = (1 if w.get("display") == k else 0, 1 if w.get("common") else 0, -w.get("kanji", []).index(k) if k in w.get("kanji", []) else -99)
                    if new_rank > curr_rank:
                        self.kanji_to_word[k] = w

            for kat in w.get("katakana", []):
                if kat not in self.katakana_to_word or (w.get("common") and not self.katakana_to_word[kat].get("common")):
                    self.katakana_to_word[kat] = w
                    
        print(f"探索エンジン準備完了: 単語数 {len(self.words):,}")

    def get_char_compatibility(self, c1: str, c2: str) -> float:
        """2文字の180度回転相性スコアを取得（マトリクスにない場合は0.1）"""
        return self.matrix.get(c1, {}).get(c2, 0.1)

    def evaluate_word(
        self,
        word: str,
        is_common: bool = False,
        kanji: list[str] = None,
        katakana: list[str] = None,
        display: str = ""
    ) -> dict[str, Any]:
        """
        指定された単語の自己対称アンビグラム適性を評価する
        漢字（例: 大人）やカタカナ（例: アイス）が渡された場合、自動的に読み（ひらがな）を解決して評価する
        """
        input_raw = word.strip()
        reading = input_raw
        resolved_display = display
        resolved_kanji = list(kanji) if kanji else []
        resolved_katakana = list(katakana) if katakana else []

        # 1. 漢字が含まれている場合、辞書インデックスから読みを自動解決
        has_kanji = any("\u4e00" <= c <= "\u9fff" for c in input_raw)
        if has_kanji:
            if input_raw in self.kanji_to_word:
                matched = self.kanji_to_word[input_raw]
                reading = matched["reading"]
                is_common = matched.get("common", is_common)
                resolved_kanji = matched.get("kanji", [input_raw])
                resolved_katakana = matched.get("katakana", [])
                resolved_display = matched.get("display", input_raw)
            else:
                # 辞書にない漢字単語の場合は部分一致またはそのまま
                for k, matched in self.kanji_to_word.items():
                    if input_raw in k:
                        reading = matched["reading"]
                        resolved_display = matched.get("display", input_raw)
                        break

        # 2. カタカナが含まれている場合、ひらがなに変換
        has_katakana = any(0x30A1 <= ord(c) <= 0x30F6 for c in reading)
        if has_katakana:
            if not resolved_katakana:
                resolved_katakana = [reading]
            if not resolved_display:
                resolved_display = reading
            reading = katakana_to_hiragana(reading)

        n = len(reading)
        if n < 1:
            return {"reading": reading, "input": input_raw, "score": 0.0, "pairs": []}

        pairs = []
        scores = []
        half_len = (n + 1) // 2

        # 井上・高橋 (2020) §6.1 の実証可読ペアセット
        verified_pairs = {
            ("あ", "ま"), ("い", "け"), ("え", "る"), ("き", "わ"), ("さ", "や"),
            ("を", "を"), ("せ", "み"), ("た", "む"), ("は", "れ"), ("も", "よ"),
            ("せ", "ぬ"), ("さ", "を"), ("つ", "む"), ("う", "ぬ"), ("あ", "そ"),
            ("し", "つ"), ("の", "の"), ("こ", "こ"), ("く", "く"), ("へ", "へ"),
            ("り", "り"), ("い", "い"), ("ー", "ー"),
        }

        for i in range(half_len):
            c1 = reading[i]
            c2 = reading[n - 1 - i]
            score = self.get_char_compatibility(c1, c2)
            scores.append(score)
            is_verified = (c1, c2) in verified_pairs or (c2, c1) in verified_pairs
            pairs.append({
                "index1": i,
                "char1": c1,
                "index2": n - 1 - i,
                "char2": c2,
                "is_center": i == (n - 1 - i),
                "score": score,
                "empirical_verified": is_verified,
            })

        # 幾何平均（全ペアが一定水準以上であることを評価）
        product = 1.0
        for s in scores:
            product *= max(0.01, s)
        geometric_mean = product ** (1.0 / len(scores))
        
        # 最小ペアルックスコア（弱点ペナルティ）
        min_score = min(scores) if scores else 0.0

        # 文脈認知補完モデル (井上・高橋 2020)
        if is_common:
            base_score = 0.82 * geometric_mean + 0.18 * min_score
            common_bias = 1.12
        else:
            base_score = 0.65 * geometric_mean + 0.35 * min_score
            common_bias = 1.0
            
        final_score = min(1.0, base_score * common_bias)

        return {
            "reading": reading,
            "input": input_raw,
            "display": resolved_display or (resolved_kanji[0] if resolved_kanji else (resolved_katakana[0] if resolved_katakana else reading)),
            "length": n,
            "common": is_common,
            "kanji": resolved_kanji,
            "katakana": resolved_katakana,
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
        """
        条件に合致する自己対称アンビグラム適性単語を探索してランキング順に返す
        ひらがな・カタカナ・漢字のどの表記で検索しても相互にヒットする
        """
        results = []
        q_clean = query.strip()
        q_h = katakana_to_hiragana(q_clean) if q_clean else ""
        q_k = hiragana_to_katakana(q_clean) if q_clean else ""

        for item in self.words:
            reading = item["reading"]
            length = item["length"]
            is_common = item["common"]
            kanji_list = item.get("kanji", [])
            katakana_list = item.get("katakana", [])
            display = item.get("display", "")

            if length < min_length or length > max_length:
                continue
            if common_only and not is_common:
                continue

            # 相互表記ゆれマッチング
            if q_clean:
                match = False
                # 1. ひらがな読みでの部分一致 (「あいす」または「アイス」で検索)
                if q_h and q_h in reading:
                    match = True
                # 2. カタカナ表記での部分一致
                elif q_k and any(q_k in kat for kat in katakana_list):
                    match = True
                # 3. 漢字表記での部分一致 (「花火」「大人」などで検索)
                elif any(q_clean in k for k in kanji_list):
                    match = True
                # 4. 代表表示名での部分一致
                elif q_clean in display or (q_k and q_k in display):
                    match = True

                if not match:
                    continue

            eval_res = self.evaluate_word(
                reading,
                is_common=is_common,
                kanji=kanji_list,
                katakana=katakana_list,
                display=display
            )

            # スコアフィルタ判定
            # キーワード検索時、完全一致または代表表記一致した単語はスコア足切りを免除して必ず候補に含める
            is_exact = False
            if q_clean:
                if display == q_clean or q_h == reading or (kanji_list and kanji_list[0] == q_clean):
                    is_exact = True
                elif any(k == q_clean for k in kanji_list) or any(kat == q_clean for kat in katakana_list):
                    is_exact = True

            effective_min_score = min(min_score, 0.2) if q_clean else min_score
            if is_exact or eval_res["score"] >= effective_min_score:
                results.append(eval_res)

        # スコア降順ソート（完全一致・代表表記一致を最優先）
        def sort_key(x: dict[str, Any]):
            exact_match = 0
            if q_clean:
                if x.get("display") == q_clean or q_h == x["reading"] or (x.get("kanji") and x["kanji"][0] == q_clean):
                    exact_match = 2
                elif any(k == q_clean for k in x.get("kanji", [])) or any(kat == q_clean for kat in x.get("katakana", [])):
                    exact_match = 1
            return (exact_match, x["score"], x["common"], -x["length"])

        results.sort(key=sort_key, reverse=True)
        return results[:limit]

if __name__ == "__main__":
    finder = AmbigramFinder()
    print("\n--- 上位の自己対称アンビグラム単語 (常用語, 2〜6文字) ---")
    top_words = finder.search(min_length=2, max_length=6, common_only=True, min_score=0.6, limit=20)
    for w in top_words:
        kanji_str = f" ({', '.join(w['kanji'])})" if w['kanji'] else ""
        print(f"[{w['score']:.3f}] {w['reading']}{kanji_str} - ペア: {[(p['char1'], p['char2'], p['score']) for p in w['pairs']]}")
