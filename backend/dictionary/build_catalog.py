"""
新辞書ビルダー:
1. JMdictの常用語 (約20,000語) から漢字・カタカナ・ひらがな表記をフラット化
2. 四字熟語・成句・現代複合語の追加
3. 「〇〇の〇〇」などの文学的・高品質な複合語フレーズの自動合成・フィルタリング
4. 軽量フラット辞書 (words_catalog.json) の出力 (約2〜3MB)
"""

import json
from pathlib import Path
import re
import sys

DATA_DIR = Path(__file__).parent
RAW_HIRAGANA_JSON = DATA_DIR / "hiragana_words.json"
CATALOG_JSON_PATH = DATA_DIR / "words_catalog.json"

# 有名四字熟語・熟語・現代複合語
POPULAR_COMPOUNDS = [
    # 四字熟語
    ("一期一会", "いちごいちえ", "compound"),
    ("温故知新", "おんこちしん", "compound"),
    ("電光石火", "でんこうせっか", "compound"),
    ("明鏡止水", "めいきょうしすい", "compound"),
    ("森羅万象", "しんらばんしょう", "compound"),
    ("花鳥風月", "かちょうふうげつ", "compound"),
    ("百花繚乱", "ひゃっかりょうらん", "compound"),
    ("疾風迅雷", "しっぷうじんらい", "compound"),
    ("乾坤一擲", "けんこんいってき", "compound"),
    ("波瀾万丈", "はらんばんじょう", "compound"),
    ("臨機応変", "りんきおうへん", "compound"),
    ("起死回生", "きしかいせい", "compound"),
    ("天変地異", "てんぺんちい", "compound"),
    ("不言実行", "ふげんじっこう", "compound"),
    ("臥薪嘗胆", "がしんしょうたん", "compound"),
    ("初志貫徹", "しょしかんてつ", "compound"),
    ("完全無欠", "かんぜんむけつ", "compound"),
    ("日進月歩", "にっしんげっぽ", "compound"),
    ("一心不乱", "いっしんふらん", "compound"),
    ("唯我独尊", "ゆいがどくそん", "compound"),
    ("四面楚歌", "しめんそか", "compound"),
    ("大器晩成", "たいきばんせい", "compound"),
    ("一石二鳥", "いっせきにちょう", "compound"),
    ("千載一遇", "せんざいいちぐう", "compound"),
    ("試行錯誤", "しこうさくご", "compound"),
    ("一刀両断", "いっとうりょうだん", "compound"),
    ("喜怒哀楽", "きどあいらく", "compound"),
    ("独立独歩", "どくりつどっぽ", "compound"),
    ("平穏無事", "へいおんぶじ", "compound"),
    ("一致団結", "いっちだんけつ", "compound"),
    # 現代複合語・科学・文化
    ("人工知能", "じんこうちのう", "compound"),
    ("暗黒物質", "あんこくぶっしつ", "compound"),
    ("絶対零度", "ぜったいれいど", "compound"),
    ("仮想現実", "かそうげんじつ", "compound"),
    ("拡張現実", "かくちょうげんじつ", "compound"),
    ("宇宙空間", "うちゅうくうかん", "compound"),
    ("情報社会", "じょうほうしゃかい", "compound"),
    ("高速道路", "こうそくどうろ", "compound"),
    ("四季折々", "しきおりおり", "compound"),
    ("万華鏡", "まんげきょう", "compound"),
    ("蜃気楼", "しんきろう", "compound"),
    ("羅針盤", "らしんばん", "compound"),
    ("蓄音機", "ちくおんき", "compound"),
    ("望遠鏡", "ぼうえんきょう", "compound"),
    ("幾何学", "きかがく", "compound"),
    ("万有引力", "ばんゆういんりょく", "compound"),
    ("相対性理論", "そうたいせいりろん", "compound"),
]

# 「〇〇の〇〇」を生成するシードパーツ
PHRASE_PRE_WORDS = [
    ("最古", "さいこ"),
    ("太古", "たいこ"),
    ("古代", "こだい"),
    ("未来", "みらい"),
    ("希望", "きぼう"),
    ("約束", "やくそく"),
    ("真理", "しんり"),
    ("奇跡", "きせき"),
    ("運命", "うんめい"),
    ("銀河", "ぎんが"),
    ("永遠", "えいえん"),
    ("白銀", "はくぎん"),
    ("暗黒", "あんこく"),
    ("混沌", "こんとん"),
    ("秘密", "ひみつ"),
    ("幸福", "こうふく"),
    ("深淵", "しんえん"),
    ("太陽", "たいよう"),
    ("星空", "ほしぞら"),
    ("静寂", "せいじゃく"),
    ("熱帯", "ねったい"),
    ("栄光", "えいこう"),
    ("孤独", "こどく"),
    ("創造", "そうぞう"),
    ("記憶", "きおく"),
    ("無限", "むげん"),
    ("調和", "ちょうわ"),
    ("情熱", "じょうねつ"),
    ("知性", "ちせい"),
    ("神秘", "しんぴ"),
    ("宇宙", "うちゅう"),
    ("黎明", "れいめい"),
    ("黄昏", "たそがれ"),
    ("黄金", "おうごん"),
    ("漆黒", "しっこく"),
    ("真実", "しんじつ"),
    ("自由", "じゆう"),
    ("平和", "へいわ"),
    ("純白", "じゅんぱく"),
    ("紅蓮", "ぐれん"),
    ("常夜", "とこよ"),
    ("追憶", "ついおく"),
    ("悠久", "ゆうきゅう"),
    ("刹那", "せつな"),
    ("蒼穹", "そうきゅう"),
]

PHRASE_POST_WORDS = [
    ("文書", "ぶんしょ"),
    ("記憶", "きおく"),
    ("遺跡", "いせき"),
    ("夜", "よる"),
    ("道", "みち"),
    ("夢", "ゆめ"),
    ("光", "ひかり"),
    ("地", "ち"),
    ("探求", "たんきゅう"),
    ("瞬間", "しゅんかん"),
    ("糸", "いと"),
    ("旅", "たび"),
    ("愛", "あい"),
    ("世界", "せかい"),
    ("時代", "じだい"),
    ("花園", "はなぞの"),
    ("時間", "じかん"),
    ("森", "もり"),
    ("星", "ほし"),
    ("街", "まち"),
    ("狭間", "はざま"),
    ("輪", "わ"),
    ("鐘", "かね"),
    ("輝き", "かがやき"),
    ("詩", "うた"),
    ("城", "しろ"),
    ("線", "せん"),
    ("朝", "あさ"),
    ("影", "かげ"),
    ("源", "みなもと"),
    ("時", "とき"),
    ("扉", "とびら"),
    ("宇宙", "うちゅう"),
    ("美", "び"),
    ("海", "うみ"),
    ("声", "こえ"),
    ("翼", "つばさ"),
    ("門", "もん"),
    ("鏡", "かがみ"),
    ("息吹", "いぶき"),
    ("鼓動", "こどう"),
    ("雫", "しずく"),
    ("願い", "ねがい"),
    ("祈り", "いのり"),
    ("誓い", "ちかい"),
    ("響き", "ひびき"),
    ("風", "かぜ"),
    ("波", "なみ"),
    ("空", "そら"),
    ("月", "つき"),
]

def build_words_catalog():
    print("辞書構築を開始します...")
    catalog = []
    seen_words = set()

    # 1. 常用語・主要語のフラット展開
    if RAW_HIRAGANA_JSON.exists():
        print(f"生データ辞書を読み込み中: {RAW_HIRAGANA_JSON}")
        with open(RAW_HIRAGANA_JSON, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        for item in raw_data:
            # 常用語 (common: true) または極めて一般的な語彙を優先
            is_common = item.get("common", False)
            reading = item.get("reading", "")
            kanji_list = item.get("kanji", [])
            katakana_list = item.get("katakana", [])

            # 非常用語でも長さ2〜6文字の主要単語は一部許可するが、常用語を第一に展開
            if not is_common:
                continue

            # 漢字表記の展開
            for k in kanji_list:
                if 2 <= len(k) <= 6 and k not in seen_words:
                    catalog.append({
                        "word": k,
                        "reading": reading,
                        "length": len(k),
                        "type": "kanji",
                        "common": True,
                    })
                    seen_words.add(k)

            # カタカナ表記の展開
            for kat in katakana_list:
                if 2 <= len(kat) <= 6 and kat not in seen_words:
                    catalog.append({
                        "word": kat,
                        "reading": reading,
                        "length": len(kat),
                        "type": "katakana",
                        "common": True,
                    })
                    seen_words.add(kat)

            # ひらがな表記の展開 (漢字・カタカナがないもの、または日常的にひらがな優先のもの)
            if (not kanji_list and not katakana_list) or item.get("display") == reading:
                if 2 <= len(reading) <= 6 and reading not in seen_words:
                    catalog.append({
                        "word": reading,
                        "reading": reading,
                        "length": len(reading),
                        "type": "hiragana",
                        "common": True,
                    })
                    seen_words.add(reading)

        print(f"常用語フラット化完了: {len(catalog):,} 語")

    # 2. 四字熟語・有名複合語の追加
    compound_count = 0
    for w, r, t in POPULAR_COMPOUNDS:
        if w not in seen_words:
            catalog.append({
                "word": w,
                "reading": r,
                "length": len(w),
                "type": "phrase",
                "common": True,
            })
            seen_words.add(w)
            compound_count += 1
    print(f"四字熟語・複合語追加: {compound_count} 語")

    # 3. 「〇〇の〇〇」フレーズの生成・追加
    phrase_count = 0
    for pre_w, pre_r in PHRASE_PRE_WORDS:
        for post_w, post_r in PHRASE_POST_WORDS:
            # 同じ単語同士の重複はスキップ (例: 記憶の記憶)
            if pre_w == post_w:
                continue

            phrase_w = f"{pre_w}の{post_w}"
            phrase_r = f"{pre_r}の{post_r}"

            if 3 <= len(phrase_w) <= 6 and phrase_w not in seen_words:
                catalog.append({
                    "word": phrase_w,
                    "reading": phrase_r,
                    "length": len(phrase_w),
                    "type": "phrase",
                    "common": True,
                })
                seen_words.add(phrase_w)
                phrase_count += 1

    print(f"「〇〇の〇〇」フレーズ追加: {phrase_count} 語 (例: 最古の文書, 太古の記憶, 漆黒の夜)")

    # 4. ソート (長さ昇順 -> 単語順)
    catalog.sort(key=lambda x: (x["length"], x["type"] != "phrase", x["reading"]))

    # 5. コンパクトJSONとして保存
    print(f"新辞書を保存中: {CATALOG_JSON_PATH}")
    with open(CATALOG_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, separators=(",", ":"))

    file_size_mb = CATALOG_JSON_PATH.stat().st_size / (1024 * 1024)
    print(f"構築完了: 全 {len(catalog):,} 件")
    print(f"新辞書ファイルサイズ: {file_size_mb:.2f} MB (旧: 47.3 MB)")

if __name__ == "__main__":
    build_words_catalog()
