"""
新辞書ビルダー:
1. 文化庁・常用漢字表 (2,136字) に厳格準拠
   - 常用漢字外の難読漢字・マイナー当て字 (茣蓙, 離瓣, 佛蘭西, 亜細亜など) を完全排除
   - 不自然な漢字反復 (一一, 口口, 国国, 正正, 日日など) の排除
   - 外来語はカタカナ代表表記を最優先
2. 自然な慣用句 (日の目, 気の毒, 草の根など)・有名四字熟語・現代複合語の拡充
   - 「〇〇の〇〇」などの機械的な総当たり直積生成を全廃
3. 軽量フラット辞書 (words_catalog.json) の出力
"""

import json
from pathlib import Path
import re
import sys

DATA_DIR = Path(__file__).parent
RAW_HIRAGANA_JSON = DATA_DIR / "hiragana_words.json"
CATALOG_JSON_PATH = DATA_DIR / "words_catalog.json"
JOYO_KANJI_PATH = DATA_DIR / "joyo_kanji.txt"

# 常用漢字 (2,136字) セットの読み込み
if JOYO_KANJI_PATH.exists():
    JOYO_KANJI_SET = set(JOYO_KANJI_PATH.read_text(encoding="utf-8").strip())
else:
    JOYO_KANJI_SET = set()

# ひらがな表記が標準的な語
HIRAGANA_PREFERRED = {
    "ここ", "そこ", "どこ", "これ", "それ", "あれ", "どれ", "あなた",
    "まあ", "まあまあ", "ささ", "ええ", "さあ", "わね", "えーと", "あのね",
    "なりに", "どうぞ", "どうも", "いつも", "もっと", "ずっと", "かなり",
    "たくさん", "いろいろ", "たぶん", "やはり", "やっぱり", "そろそろ",
    "すっかり", "すっきり", "さっぱり", "ゆっくり", "しっかり", "ばっちり",
    "ござ", "さらさら", "きらきら", "ぴかぴか", "うろうろ", "ふらふら",
}

# 有名四字熟語・熟語・現代複合語・自然な成句/慣用句
POPULAR_COMPOUNDS = [
    # 有名四字熟語
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
    ("自由闊達", "じゆうかったつ", "compound"),
    ("正々堂々", "せいせいどうどう", "compound"),
    ("意気投合", "いきとうごう", "compound"),
    ("奇想天外", "きそうてんがい", "compound"),
    ("切磋琢磨", "せっさたくま", "compound"),
    ("悪戦苦闘", "あくせんくとう", "compound"),
    ("空前絶後", "くうぜんぜつご", "compound"),
    ("一目瞭然", "いちもくりょうぜん", "compound"),
    ("縦横無尽", "じゅうおうむじん", "compound"),
    ("泰然自若", "たいぜんじじゃく", "compound"),
    ("猪突猛進", "ちょとつもうしん", "compound"),

    # 自然な成句・慣用句 (「〇の〇」など)
    ("日の目", "ひのめ", "phrase"),
    ("草の根", "くさのね", "phrase"),
    ("気の毒", "きのどく", "phrase"),
    ("手の平", "てのひら", "phrase"),
    ("身の回り", "みのまわり", "phrase"),
    ("後の祭り", "あとのまつり", "phrase"),
    ("大目玉", "おおめだま", "phrase"),
    ("腹の虫", "はらのむし", "phrase"),
    ("胸の内", "むねのうち", "phrase"),
    ("水の手", "みずのて", "phrase"),
    ("雲の上", "くものうえ", "phrase"),
    ("一日の長", "いちじつのちょう", "phrase"),
    ("三日坊主", "みっかぼうず", "phrase"),
    ("朝飯前", "あさめしまえ", "phrase"),
    ("虫の知らせ", "むしのしらせ", "phrase"),
    ("目の敵", "めのかたき", "phrase"),
    ("縁の下", "えんのした", "phrase"),
    ("虎の巻", "とらのまき", "phrase"),
    ("風の便り", "かぜのたより", "phrase"),
    ("井の中の蛙", "いのなかのかわず", "phrase"),
    ("鵜の目鷹の目", "うのめたかのめ", "phrase"),
    ("渡りに船", "わたりにふね", "phrase"),

    # 現代複合語・科学・文化・デザイン
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
    ("自然科学", "しぜんかがく", "compound"),
    ("現代美術", "げんだいびじゅつ", "compound"),
    ("日本庭園", "にほんていえん", "compound"),
    ("伝統工芸", "でんとうこうげい", "compound"),
    ("黄金比", "おうごんひ", "compound"),
    ("白銀比", "はくぎんひ", "compound"),
]

def is_valid_natural_word(word: str) -> bool:
    """自然な日本語文字列かどうかを判定する (常用漢字準拠・記号英数排除・反復排除)"""
    if not (2 <= len(word) <= 6):
        return False

    for c in word:
        code = ord(c)
        is_hira = 0x3041 <= code <= 0x3096
        is_kata = 0x30A1 <= code <= 0x30F6
        is_chouon = code == 0x30FC
        is_odori = code == 0x3005  # 々
        is_kanji = 0x4E00 <= code <= 0x9FFF

        if is_hira or is_kata or is_chouon or is_odori:
            continue
        elif is_kanji:
            # 常用漢字セットが存在する場合は常用漢字のみに厳格制限
            if JOYO_KANJI_SET and c not in JOYO_KANJI_SET:
                return False
        else:
            return False

    # 漢字2文字で同一文字の反復 (一一, 口口, 国国, 正正, 日日, 幽幽, 山山, 義義など) は不自然なので除外
    if len(word) == 2 and word[0] == word[1] and 0x4E00 <= ord(word[0]) <= 0x9FFF:
        return False

    # 全文字が同一の単語 (例: あああ, 口口口など) も除外
    if len(set(word)) == 1:
        return False

    return True

def build_words_catalog():
    print(f"自然な日本語単語カタログの構築を開始します (常用漢字数: {len(JOYO_KANJI_SET):,}字)...")
    catalog = []
    seen_words = set()

    # 1. 常用語・主要語のフラット展開
    if RAW_HIRAGANA_JSON.exists():
        print(f"生データ辞書を読み込み中: {RAW_HIRAGANA_JSON}")
        with open(RAW_HIRAGANA_JSON, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        for item in raw_data:
            # 常用語 (common: true) のみ対象
            if not item.get("common", False):
                continue

            reading = item.get("reading", "")
            kanji_list = item.get("kanji", [])
            katakana_list = item.get("katakana", [])
            display = item.get("display", "")

            # display をスラッシュで分割して第一表記を分析
            display_parts = [p.strip() for p in display.split("/") if p.strip()]

            # A. ひらがな優先語 (ここ, そこ, これ, あなた など)
            if reading in HIRAGANA_PREFERRED:
                if is_valid_natural_word(reading) and reading not in seen_words:
                    catalog.append({
                        "word": reading,
                        "reading": reading,
                        "length": len(reading),
                        "type": "hiragana",
                        "common": True,
                    })
                    seen_words.add(reading)
                continue

            # B. 外来語・カタカナ優先語 (アジア, フランス, イス, アイス など)
            is_katakana_word = False
            if katakana_list and display_parts:
                first_part = display_parts[0]
                if any(0x30A1 <= ord(c) <= 0x30F6 for c in first_part):
                    is_katakana_word = True

            if is_katakana_word:
                # 代表カタカナ表記のみ採用 (無理な漢字当て字 亜細亜, 佛蘭西, 椅子 等は排除)
                for kat in katakana_list[:1]:
                    if is_valid_natural_word(kat) and kat not in seen_words:
                        catalog.append({
                            "word": kat,
                            "reading": reading,
                            "length": len(kat),
                            "type": "katakana",
                            "common": True,
                        })
                        seen_words.add(kat)
                continue

            # C. 漢字表記 (代表表記のみ採用)
            selected_kanji = ""
            if display_parts:
                for part in display_parts:
                    if any(0x4E00 <= ord(c) <= 0x9FFF for c in part):
                        selected_kanji = part
                        break

            if not selected_kanji and kanji_list:
                selected_kanji = kanji_list[0]

            if selected_kanji and is_valid_natural_word(selected_kanji) and selected_kanji not in seen_words:
                catalog.append({
                    "word": selected_kanji,
                    "reading": reading,
                    "length": len(selected_kanji),
                    "type": "kanji",
                    "common": True,
                })
                seen_words.add(selected_kanji)

            # D. カタカナ表記 (和語でも主要なカタカナ表記がある場合、第1候補のみ)
            if katakana_list:
                kat = katakana_list[0]
                if is_valid_natural_word(kat) and kat not in seen_words:
                    catalog.append({
                        "word": kat,
                        "reading": reading,
                        "length": len(kat),
                        "type": "katakana",
                        "common": True,
                    })
                    seen_words.add(kat)

            # E. ひらがな表記 (漢字・カタカナがないもの、または display == reading のもの)
            if (not kanji_list and not katakana_list) or display == reading:
                if is_valid_natural_word(reading) and reading not in seen_words:
                    catalog.append({
                        "word": reading,
                        "reading": reading,
                        "length": len(reading),
                        "type": "hiragana",
                        "common": True,
                    })
                    seen_words.add(reading)

        print(f"常用語フラット化完了: {len(catalog):,} 語")

    # 2. 四字熟語・有名複合語・自然な成句の追加
    compound_count = 0
    for w, r, t in POPULAR_COMPOUNDS:
        if is_valid_natural_word(w) and w not in seen_words:
            catalog.append({
                "word": w,
                "reading": r,
                "length": len(w),
                "type": t,
                "common": True,
            })
            seen_words.add(w)
            compound_count += 1
    print(f"四字熟語・慣用句・複合語追加: {compound_count} 語")

    # 3. ソート (長さ昇順 -> 単語順)
    catalog.sort(key=lambda x: (x["length"], x["type"] != "phrase", x["reading"]))

    # 4. コンパクトJSONとして保存
    print(f"新辞書を保存中: {CATALOG_JSON_PATH}")
    with open(CATALOG_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, separators=(",", ":"))

    file_size_mb = CATALOG_JSON_PATH.stat().st_size / (1024 * 1024)
    print(f"構築完了: 全 {len(catalog):,} 件")
    print(f"新辞書ファイルサイズ: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    build_words_catalog()
