"""
常用語辞書からアンビグラム適性単語の事前スコアインデックス (scored_words.json) を生成するスクリプト
"""
import sys
import os
from pathlib import Path
import json
import time

sys.path.insert(0, os.path.abspath("."))
from search.finder import AmbigramFinder, classify_script_types

BACKEND_DIR = Path(__file__).resolve().parent.parent
OUTPUT_FILE = BACKEND_DIR / "dictionary" / "scored_words.json"

def is_valid_japanese_text(text: str) -> bool:
    for c in text:
        code = ord(c)
        if not (0x3040 <= code <= 0x309F or 0x30A0 <= code <= 0x30FF or 0x4E00 <= code <= 0x9FFF or code == 0x30FC or code == 0x3005):
            return False
    return True

def generate_index():
    f = AmbigramFinder()
    print("事前スコアインデックスを生成中...")
    t0 = time.time()
    scored_words = []
    seen = set()

    for l in range(2, 8):
        pool = f.common_words_by_len.get(l, [])
        for item in pool:
            reading = item["reading"]
            kanji_list = item.get("kanji", [])
            katakana_list = item.get("katakana", [])

            is_pure_hg, has_kj, has_kt, primary_disp, pk, pkt = classify_script_types(reading, kanji_list, katakana_list)

            targets = []
            if is_pure_hg:
                targets.append((reading, "hiragana"))
            if has_kj and pk:
                targets.append((pk, "kanji"))
            if has_kt and pkt:
                targets.append((pkt, "katakana"))

            for target_text, script_type in targets:
                if not is_valid_japanese_text(target_text):
                    continue
                if len(target_text) < 2 or len(target_text) > 6:
                    continue
                if target_text in seen:
                    continue

                res = f.evaluate_word(
                    target_text,
                    is_common=True,
                    kanji=kanji_list,
                    katakana=katakana_list,
                    display=target_text,
                    force_target_text=target_text,
                )
                score = round(res["score"], 4)

                # UIスライダーの最小値であるスコア0.50以上のみを厳選
                if score >= 0.50:
                    clean_item = {
                        "target_text": target_text,
                        "reading": reading,
                        "score": score,
                        "script_type": script_type,
                    }
                    if kanji_list:
                        clean_item["kanji"] = kanji_list
                    if katakana_list:
                        clean_item["katakana"] = katakana_list
                    display = res.get("display", target_text)
                    if display and display != target_text:
                        clean_item["display"] = display

                    scored_words.append(clean_item)
                    seen.add(target_text)

    # スコア降順に完全ソート
    scored_words.sort(key=lambda x: x["score"], reverse=True)
    t1 = time.time()

    print(f"生成完了: {len(scored_words):,} 件 (所要時間: {t1 - t0:.2f}s)")
    print(f"ファイルを保存中: {OUTPUT_FILE}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as fp:
        json.dump(scored_words, fp, ensure_ascii=False, separators=(",", ":"))

    file_size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
    print(f"保存完了: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    generate_index()
