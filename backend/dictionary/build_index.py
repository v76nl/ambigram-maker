"""
常用語・複合語辞書 (words_catalog.json) からアンビグラム適性単語の事前スコアインデックス (scored_words.json) を生成するスクリプト
- 自然な単語のみを厳選
- 同一文字反復 (畳語) のスコア独占を防止
- スコア0.50以上の良質単語をスコア降順で高速配信可能に
"""
import sys
import os
from pathlib import Path
import json
import time

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
from search.finder import AmbigramFinder

CATALOG_FILE = BACKEND_DIR / "dictionary" / "words_catalog.json"
OUTPUT_FILE = BACKEND_DIR / "dictionary" / "scored_words.json"

def is_valid_japanese_text(text: str) -> bool:
    """純粋な日本語表記（漢字・ひらがな・カタカナ・長音・踊り字）のみを判定"""
    if not (2 <= len(text) <= 6):
        return False
    for c in text:
        code = ord(c)
        is_hira = 0x3041 <= code <= 0x3096
        is_kata = 0x30A1 <= code <= 0x30F6
        is_kanji = 0x4E00 <= code <= 0x9FFF
        is_chouon = code == 0x30FC
        is_odori = code == 0x3005
        if not (is_hira or is_kata or is_kanji or is_chouon or is_odori):
            return False

    # 漢字の2文字同一反復 (一一, 日日, 口口など) はスキップ
    if len(text) == 2 and text[0] == text[1] and 0x4E00 <= ord(text[0]) <= 0x9FFF:
        return False

    return True

def generate_index():
    f = AmbigramFinder()
    print("事前スコアインデックスを生成中...")
    t0 = time.time()
    scored_words = []
    seen = set()

    if CATALOG_FILE.exists():
        print(f"カタログファイルを読み込み中: {CATALOG_FILE}")
        with open(CATALOG_FILE, "r", encoding="utf-8") as fp:
            catalog = json.load(fp)

        for item in catalog:
            target_text = item.get("word", "")
            reading = item.get("reading", "")
            script_type = item.get("type", "hiragana")

            if not is_valid_japanese_text(target_text):
                continue
            if target_text in seen:
                continue

            res = f.evaluate_word(
                target_text,
                is_common=item.get("common", True),
                display=target_text,
                force_target_text=target_text,
            )
            raw_score = res["score"]

            # 全文字同一（例: あああ）または 2文字同一畳語にはペナルティ
            if len(set(target_text)) == 1 or (len(target_text) == 2 and target_text[0] == target_text[1]):
                raw_score *= 0.82

            score = round(raw_score, 4)

            # UIスライダーの最小値であるスコア0.50以上を厳選
            if score >= 0.50:
                clean_item = {
                    "target_text": target_text,
                    "reading": reading,
                    "score": score,
                    "script_type": script_type,
                }
                scored_words.append(clean_item)
                seen.add(target_text)
    else:
        print("words_catalog.json が見つかりません。")

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
