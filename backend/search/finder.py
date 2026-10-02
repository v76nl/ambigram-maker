from collections import defaultdict
import json
from pathlib import Path
import sys
from typing import Any, Generator

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = Path(__file__).parent.parent
WORDS_PATH = DATA_DIR / "dictionary" / "hiragana_words.json"
MATRIX_PATH = DATA_DIR / "scoring" / "compatibility.json"
SCORED_WORDS_PATH = DATA_DIR / "dictionary" / "scored_words.json"

try:
    from scoring.matrix import get_any_char_compatibility
except ImportError:
    from ..scoring.matrix import get_any_char_compatibility

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

HIRAGANA_PREFERRED = {
    "ここ", "そこ", "どこ", "これ", "それ", "あれ", "どれ", "あなた",
    "まあ", "まあまあ", "ささ", "ええ", "さあ", "わね", "えーと", "あのね",
    "なりに", "どうぞ", "どうも", "いつも", "もっと", "ずっと", "かなり",
}

# 井上・高橋 (2020) §6.1 の実証可読ペアセット (ひらがな用)
VERIFIED_HIRAGANA_PAIRS = {
    ("あ", "ま"), ("い", "け"), ("え", "る"), ("き", "わ"), ("さ", "や"),
    ("を", "を"), ("せ", "み"), ("た", "む"), ("は", "れ"), ("も", "よ"),
    ("せ", "ぬ"), ("さ", "を"), ("つ", "む"), ("う", "ぬ"), ("あ", "そ"),
    ("し", "つ"), ("の", "の"), ("こ", "こ"), ("く", "く"), ("へ", "へ"),
    ("り", "り"), ("い", "い"), ("ー", "ー"),
}

def classify_script_types(reading: str, kanji_list: list[str], katakana_list: list[str]) -> tuple[bool, bool, bool, str, str, str]:
    """
    (is_pure_hiragana, has_kanji, has_katakana, primary_display, primary_kanji, primary_katakana)
    - has_kanji: 漢字表記が存在し、かつ日常的にも漢字表記されるもの
    - has_katakana: カタカナ表記（外来語等）が存在するもの
    - is_pure_hiragana: 漢字もカタカナもない、または日常的にひらがな表記が標準的なもの（※元が漢字等のものは含まない）
    - primary_display: その単語の本質的な代表表記
    - primary_kanji: 代表漢字表記
    - primary_katakana: 代表カタカナ表記
    """
    has_katakana = bool(katakana_list and len(katakana_list) > 0 and any(len(k) > 1 for k in katakana_list))
    
    valid_kanjis = [
        k for k in (kanji_list or [])
        if not k.isdigit() and any("\u4e00" <= c <= "\u9fff" for c in k)
    ]
    has_kanji = bool(valid_kanjis and len(valid_kanjis) > 0 and reading not in HIRAGANA_PREFERRED)
    
    is_pure_hiragana = (not has_katakana and not has_kanji) or (reading in HIRAGANA_PREFERRED)

    primary_kanji = valid_kanjis[0] if (has_kanji and valid_kanjis) else ""
    primary_katakana = katakana_list[0] if (has_katakana and katakana_list) else ""

    if has_katakana and (not has_kanji or len(primary_katakana) >= len(reading)):
        primary_display = primary_katakana
    elif has_kanji:
        primary_display = primary_kanji
    elif has_katakana:
        primary_display = primary_katakana
    else:
        primary_display = reading

    return is_pure_hiragana, has_kanji, has_katakana, primary_display, primary_kanji, primary_katakana

class AmbigramFinder:
    def __init__(self, words_path: Path = WORDS_PATH, matrix_path: Path = MATRIX_PATH):
        print("探索エンジン初期化中...")
        with open(words_path, "r", encoding="utf-8") as f:
            self.words: list[dict[str, Any]] = json.load(f)
            
        with open(matrix_path, "r", encoding="utf-8") as f:
            self.matrix: dict[str, dict[str, float]] = json.load(f)

        # 評価結果のインメモリキャッシュ
        self.eval_cache: dict[str, dict[str, Any]] = {}
            
        # 漢字表記およびカタカナ表記からの高速インデックス作成
        self.kanji_to_word: dict[str, dict[str, Any]] = {}
        self.katakana_to_word: dict[str, dict[str, Any]] = {}

        # リアルタイム高速検索用の長さ別・常用語別インデックス
        self.words_by_len: dict[int, list[dict[str, Any]]] = defaultdict(list)
        self.common_words_by_len: dict[int, list[dict[str, Any]]] = defaultdict(list)

        for w in self.words:
            reading = w.get("reading", "")
            is_common = w.get("common", False)
            kanji_list = w.get("kanji", [])
            katakana_list = w.get("katakana", [])

            # 長さ別インデックス登録
            w_len = len(reading)
            self.words_by_len[w_len].append(w)
            if is_common:
                self.common_words_by_len[w_len].append(w)

            for k in kanji_list:
                if k not in self.kanji_to_word:
                    self.kanji_to_word[k] = w
                else:
                    curr = self.kanji_to_word[k]
                    curr_rank = (1 if curr.get("display") == k else 0, 1 if curr.get("common") else 0, -curr.get("kanji", []).index(k) if k in curr.get("kanji", []) else -99)
                    new_rank = (1 if w.get("display") == k else 0, 1 if w.get("common") else 0, -w.get("kanji", []).index(k) if k in w.get("kanji", []) else -99)
                    if new_rank > curr_rank:
                        self.kanji_to_word[k] = w

            for kat in katakana_list:
                if kat not in self.katakana_to_word or (is_common and not self.katakana_to_word[kat].get("common")):
                    self.katakana_to_word[kat] = w

        # 事前スコアインデックス（真のスコア降順ランキング用）のロード
        self.scored_words: list[dict[str, Any]] = []
        if SCORED_WORDS_PATH.exists():
            try:
                with open(SCORED_WORDS_PATH, "r", encoding="utf-8") as f:
                    self.scored_words = json.load(f)
                print(f"事前スコアインデックス読み込み完了: {len(self.scored_words):,} 単語 (スコア降順)")
            except Exception as e:
                print(f"事前スコアインデックス読み込み失敗: {e}")
                    
        print(f"探索エンジン準備完了: 単語数 {len(self.words):,}")

    def get_char_compatibility(self, c1: str, c2: str) -> float:
        """2文字の180度回転相性スコアを取得（ひらがな・カタカナ・漢字対応）"""
        return get_any_char_compatibility(c1, c2, self.matrix)

    def make_pairs_for_target(self, target_text: str) -> tuple[list[dict[str, Any]], list[float]]:
        """対象文字列の文字ペア情報とスコアリストを瞬時に生成"""
        n = len(target_text)
        pairs = []
        scores = []
        half_len = (n + 1) // 2
        for i in range(half_len):
            c1 = target_text[i]
            c2 = target_text[n - 1 - i]
            score = self.get_char_compatibility(c1, c2)
            scores.append(score)
            is_verified = (c1, c2) in VERIFIED_HIRAGANA_PAIRS or (c2, c1) in VERIFIED_HIRAGANA_PAIRS
            pairs.append({
                "index1": i,
                "char1": c1,
                "index2": n - 1 - i,
                "char2": c2,
                "is_center": i == (n - 1 - i),
                "score": round(score, 4),
                "empirical_verified": is_verified,
            })
        return pairs, scores

    def _format_word_item(self, item: dict[str, Any]) -> dict[str, Any]:
        """軽量インデックスの単語アイテムをクライアント向け完全形式 (pairs付き) に展開"""
        target_text = item.get("target_text") or item.get("word") or ""
        res = dict(item)
        res["word"] = target_text
        res["target_text"] = target_text
        res["length"] = len(target_text)
        res["display"] = item.get("display") or target_text
        res["common"] = item.get("common", True)
        if "pairs" not in res:
            pairs, _ = self.make_pairs_for_target(target_text)
            res["pairs"] = pairs
        return res

    def evaluate_word(
        self,
        word: str,
        is_common: bool = False,
        kanji: list[str] = None,
        katakana: list[str] = None,
        display: str = "",
        force_target_text: str = "",
    ) -> dict[str, Any]:
        """
        指定された単語の自己対称アンビグラム適性を評価する。
        漢字語（例: 「頼む」）なら漢字表記「頼む」そのものの文字ペア（頼-む）で評価。
        カタカナ語（例: 「アイス」）ならカタカナ表記「アイス」そのものの文字ペア（ア-ス, イ-イ）で評価。
        純粋ひらがな語（例: 「ここ」）ならひらがな表記「ここ」そのものの文字ペア（こ-こ）で評価。
        ※ ひらがなに変換してアンビグラムを判定・生成する重大ミスを解消！
        """
        input_raw = word.strip()
        reading = input_raw
        resolved_display = display
        resolved_kanji = list(kanji) if kanji else []
        resolved_katakana = list(katakana) if katakana else []

        # 1. 読み（reading）とメタデータの解決
        if input_raw in self.kanji_to_word:
            matched = self.kanji_to_word[input_raw]
            reading = matched["reading"]
            is_common = matched.get("common", is_common)
            resolved_kanji = matched.get("kanji", [input_raw])
            resolved_katakana = matched.get("katakana", [])
            resolved_display = matched.get("display", input_raw)
        elif input_raw in self.katakana_to_word:
            matched = self.katakana_to_word[input_raw]
            reading = matched["reading"]
            is_common = matched.get("common", is_common)
            resolved_kanji = matched.get("kanji", [])
            resolved_katakana = matched.get("katakana", [input_raw])
            resolved_display = matched.get("display", input_raw)
        elif any(0x30A1 <= ord(c) <= 0x30F6 for c in input_raw):
            reading = katakana_to_hiragana(input_raw)
            if not resolved_katakana:
                resolved_katakana = [input_raw]
            resolved_display = input_raw
        elif any("\u4e00" <= c <= "\u9fff" for c in input_raw):
            for k, matched in self.kanji_to_word.items():
                if input_raw in k:
                    reading = matched["reading"]
                    resolved_display = matched.get("display", input_raw)
                    break

        # 2. 文字種別と代表表記の判定
        is_pure_hg, has_kj, has_kt, primary_disp, primary_kj, primary_kt = classify_script_types(
            reading, resolved_kanji, resolved_katakana
        )

        # 3. アンビグラムの真の対象文字列 (target_text) の決定
        # ユーザーが指定した表記（force_target_text や input_raw に漢字・カタカナが含まれる場合）は最優先
        if force_target_text:
            target_text = force_target_text
        elif any("\u4e00" <= c <= "\u9fff" for c in input_raw):
            target_text = input_raw
        elif any(0x30A1 <= ord(c) <= 0x30F6 for c in input_raw):
            target_text = input_raw
        elif has_kj:
            target_text = primary_kj or input_raw
        elif has_kt:
            target_text = primary_kt or input_raw
        else:
            target_text = reading or input_raw

        n = len(target_text)
        if n < 1:
            return {
                "word": target_text,
                "target_text": target_text,
                "reading": reading,
                "display": target_text,
                "primary_display": target_text,
                "score": 0.0,
                "pairs": []
            }

        # 4. target_text の実際の文字ペアで対称性・相性スコアを評価！
        pairs, scores = self.make_pairs_for_target(target_text)

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
            "word": target_text,
            "target_text": target_text,
            "reading": reading,
            "input": input_raw,
            "display": target_text,
            "primary_display": target_text,
            "primary_kanji": primary_kj,
            "primary_katakana": primary_kt,
            "is_pure_hiragana": is_pure_hg,
            "has_kanji": has_kj,
            "has_katakana": has_kt,
            "length": n,
            "common": is_common,
            "kanji": resolved_kanji,
            "katakana": resolved_katakana,
            "score": round(final_score, 4),
            "geometric_mean": round(geometric_mean, 4),
            "min_pair_score": round(min_score, 4),
            "pairs": pairs,
        }

    def stream_search(
        self,
        min_length: int = 2,
        max_length: int = 6,
        common_only: bool = True,
        min_score: float = 0.75,
        limit: int = 100,
        query: str = "",
        include_kanji: bool = True,
        include_katakana: bool = True,
        include_hiragana: bool = True,
    ) -> Generator[dict[str, Any], None, None]:
        """
        条件に合致する自己対称アンビグラム適性単語を真のスコア降順で探索・ストリーミング配信する。
        - 常用語インデックス (scored_words.json): 全単語から算出した真のスコア降順ランキングを即座に配信
        - デフォルトスコア閾値: 0.75 (高い対称性・可読性を持つ高品質候補に厳選)
        - デフォルト取得件数: 100件 (真のトップ100件を網羅)
        """
        q_clean = query.strip()
        q_h = katakana_to_hiragana(q_clean) if q_clean else ""
        q_k = hiragana_to_katakana(q_clean) if q_clean else ""

        effective_min_score = min(min_score, 0.2) if q_clean else min_score
        seen_targets = set()
        yielded_count = 0

        # 1. 常用語かつスコアインデックスが存在する場合: 超高速・真のスコア降順配信
        if common_only and self.scored_words:
            matched_candidates = []
            for item in self.scored_words:
                target_text = item.get("target_text") or item.get("word") or ""
                reading = item.get("reading", "")
                script_type = item.get("script_type", "hiragana")
                score = item.get("score", 0.0)

                # スコア降順なので、閾値未満かつクエリなしなら走査打ち切り可能
                if not q_clean and score < effective_min_score:
                    break

                actual_len = len(target_text)
                if actual_len < min_length or actual_len > max_length:
                    continue

                # 文字種フィルター
                if script_type == "hiragana" and not include_hiragana:
                    continue
                if script_type == "kanji" and not include_kanji:
                    continue
                if script_type == "katakana" and not include_katakana:
                    continue

                # クエリマッチ判定
                if q_clean:
                    kanji_list = item.get("kanji", [])
                    katakana_list = item.get("katakana", [])
                    display = item.get("display", "")
                    
                    is_exact = (
                        target_text == q_clean or
                        display == q_clean or
                        q_h == reading or
                        any(k == q_clean for k in kanji_list) or
                        any(kat == q_clean for kat in katakana_list)
                    )
                    is_partial = (
                        q_clean in target_text or
                        (q_h and q_h in reading) or
                        (q_k and any(q_k in kat for kat in katakana_list)) or
                        any(q_clean in k for k in kanji_list) or
                        q_clean in display or
                        (q_k and q_k in display)
                    )
                    if not (is_exact or is_partial):
                        continue

                    if score < effective_min_score and not is_exact:
                        continue

                    priority = 2 if is_exact else 1
                    matched_candidates.append((priority, score, item))
                else:
                    if score >= effective_min_score and target_text not in seen_targets:
                        seen_targets.add(target_text)
                        yield self._format_word_item(item)
                        yielded_count += 1
                        if yielded_count >= limit:
                            return

            # クエリ検索時は完全一致最優先、次いでスコア降順で yield
            if q_clean and matched_candidates:
                matched_candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
                for _, _, item in matched_candidates:
                    t_text = item.get("target_text") or item.get("word") or ""
                    if t_text not in seen_targets:
                        seen_targets.add(t_text)
                        yield self._format_word_item(item)
                        yielded_count += 1
                        if yielded_count >= limit:
                            return

        # 2. 全単語検索 (common_only=False) または未登録語のフォールバック走査
        source_dict = self.common_words_by_len if common_only else self.words_by_len
        target_pool = []
        for l in range(min_length, max_length + 1):
            if l in source_dict:
                target_pool.extend(source_dict[l])

        for item in target_pool:
            reading = item["reading"]
            is_common = item["common"]
            kanji_list = item.get("kanji", [])
            katakana_list = item.get("katakana", [])
            display = item.get("display", "")

            is_pure_hg, has_kj, has_kt, primary_disp, pk, pkt = classify_script_types(reading, kanji_list, katakana_list)
            match_script = False
            if include_hiragana and is_pure_hg:
                match_script = True
            if include_kanji and has_kj:
                match_script = True
            if include_katakana and has_kt:
                match_script = True

            if not match_script:
                continue

            if has_kj and include_kanji:
                target_script_text = pk or (kanji_list[0] if kanji_list else reading)
            elif has_kt and include_katakana:
                target_script_text = pkt or (katakana_list[0] if katakana_list else reading)
            else:
                target_script_text = reading

            actual_len = len(target_script_text)
            if actual_len < min_length or actual_len > max_length:
                continue

            if target_script_text in seen_targets:
                continue

            # クエリ判定
            if q_clean:
                match = False
                if q_clean in target_script_text:
                    match = True
                elif q_h and q_h in reading:
                    match = True
                elif q_k and any(q_k in kat for kat in katakana_list):
                    match = True
                elif any(q_clean in k for k in kanji_list):
                    match = True
                elif q_clean in display or (q_k and q_k in display):
                    match = True
                if not match:
                    continue

            # 端文字による高速枝刈り (評価関数の呼び出しを激減)
            if actual_len >= 2 and not q_clean:
                c_head = target_script_text[0]
                c_tail = target_script_text[-1]
                if self.get_char_compatibility(c_head, c_tail) < effective_min_score * 0.7:
                    continue

            # 評価実行
            cache_key = (target_script_text, reading, is_common)
            if cache_key in self.eval_cache:
                eval_res = self.eval_cache[cache_key]
            else:
                eval_res = self.evaluate_word(
                    target_script_text,
                    is_common=is_common,
                    kanji=kanji_list,
                    katakana=katakana_list,
                    display=target_script_text,
                    force_target_text=target_script_text
                )
                self.eval_cache[cache_key] = eval_res

            is_exact = False
            if q_clean:
                if target_script_text == q_clean or display == q_clean or q_h == reading:
                    is_exact = True
                elif any(k == q_clean for k in kanji_list) or any(kat == q_clean for kat in katakana_list):
                    is_exact = True

            if is_exact or eval_res["score"] >= effective_min_score:
                seen_targets.add(target_script_text)
                yield eval_res
                yielded_count += 1
                if yielded_count >= limit:
                    break

    def search(
        self,
        min_length: int = 2,
        max_length: int = 6,
        common_only: bool = True,
        min_score: float = 0.75,
        limit: int = 100,
        query: str = "",
        include_kanji: bool = True,
        include_katakana: bool = True,
        include_hiragana: bool = True,
    ) -> list[dict[str, Any]]:
        """
        条件に合致する自己対称アンビグラム適性単語を探索してランキング順に返す
        """
        results = list(self.stream_search(
            min_length=min_length,
            max_length=max_length,
            common_only=common_only,
            min_score=min_score,
            limit=limit,
            query=query,
            include_kanji=include_kanji,
            include_katakana=include_katakana,
            include_hiragana=include_hiragana,
        ))

        q_clean = query.strip()
        q_h = katakana_to_hiragana(q_clean) if q_clean else ""

        # スコア降順ソート（完全一致・代表表記一致を最優先）
        def sort_key(x: dict[str, Any]):
            exact_match = 0
            if q_clean:
                if x.get("display") == q_clean or q_h == x["reading"] or (x.get("kanji") and x["kanji"][0] == q_clean):
                    exact_match = 2
                elif any(k == q_clean for k in x.get("kanji", [])) or any(kat == q_clean for kat in x.get("katakana", [])):
                    exact_match = 1
            return (exact_match, x["score"], x.get("common", False), -x["length"])

        results.sort(key=sort_key, reverse=True)
        return results[:limit]

if __name__ == "__main__":
    finder = AmbigramFinder()
    print("\n--- 上位の自己対称アンビグラム単語 (常用語, 2〜6文字) ---")
    top_words = finder.search(min_length=2, max_length=6, common_only=True, min_score=0.6, limit=20)
    for w in top_words:
        kanji_str = f" ({', '.join(w['kanji'])})" if w['kanji'] else ""
        print(f"[{w['score']:.3f}] {w['reading']}{kanji_str} - ペア: {[(p['char1'], p['char2'], p['score']) for p in w['pairs']]}")
