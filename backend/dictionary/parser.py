import gzip
import json
import xml.etree.ElementTree as ET
from pathlib import Path
import httpx
from tqdm import tqdm

JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict.gz"
DATA_DIR = Path(__file__).parent
JMDICT_GZ_PATH = DATA_DIR / "JMdict.gz"
JMDICT_XML_PATH = DATA_DIR / "JMdict.xml"
OUTPUT_JSON_PATH = DATA_DIR / "hiragana_words.json"

# 頻出度フラグ（日常語判定に使用）
# 優先度タグ定義
CORE_COMMON_TAGS = {"news1", "ichi1", "spec1", "gai1"}

def get_tag_priority_score(tags: list[str]) -> int:
    """JMdictの優先度タグから出現頻度・日常語スコアを算出"""
    score = 0
    for t in tags:
        if t == "ichi1": score += 100
        elif t == "news1": score += 90
        elif t == "spec1": score += 80
        elif t == "gai1": score += 80
        elif t.startswith("nf"):
            try:
                rank = int(t[2:])
                if rank <= 10:
                    score += (11 - rank) * 10  # 100〜10点
                elif rank <= 20:
                    score += (21 - rank) * 4   # 40〜4点
            except ValueError:
                pass
        elif t == "news2": score += 20
        elif t == "ichi2": score += 20
        elif t == "spec2": score += 15
        elif t == "gai2": score += 15
    return score

def is_core_common(tags: set[str]) -> bool:
    """
    真の日常語かどうかの判定。
    news1(上位1.2万語), ichi1(一万語選定), spec1, gai1、または nf01〜nf20(上位1万語以内) を要求。
    ※ news2(1.2万〜2.4万語のお役所・行政記事用語) 単独は日常語から除外。
    """
    if CORE_COMMON_TAGS.intersection(tags):
        return True
    for t in tags:
        if t.startswith("nf"):
            try:
                rank = int(t[2:])
                if rank <= 20:  # 上位1万語以内
                    return True
            except ValueError:
                pass
    return False

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

def is_valid_hiragana_word(word: str) -> bool:
    """ひらがな（清音・濁音・半濁音・小文字・長音符）のみで構成されているか判定"""
    if not word:
        return False
    return all(
        "\u3041" <= c <= "\u3096" or c == "ー"
        for c in word
    )

def download_jmdict(url: str = JMDICT_URL, target_gz: Path = JMDICT_GZ_PATH) -> Path:
    """JMdict.gzをダウンロードする"""
    if target_gz.exists() and target_gz.stat().st_size > 1_000_000:
        print(f"JMdict.gz は既に存在します: {target_gz}")
        return target_gz
    
    print(f"JMdict.gz をダウンロード中: {url}")
    with httpx.Client(verify=False) as client:
        with client.stream("GET", url, follow_redirects=True, timeout=120.0) as response:
            response.raise_for_status()
            total = int(response.headers.get("content-length", 0))
            with open(target_gz, "wb") as f, tqdm(
                desc="Downloading",
                total=total,
                unit="iB",
                unit_scale=True,
                unit_divisor=1024,
            ) as bar:
                for chunk in response.iter_bytes(chunk_size=65536):
                    size = f.write(chunk)
                    bar.update(size)
    print("ダウンロード完了")
    return target_gz

def parse_jmdict(gz_path: Path = JMDICT_GZ_PATH, output_path: Path = OUTPUT_JSON_PATH):
    """JMdict.gzを直接ストリーミングパースしてひらがな単語辞書を生成する"""
    print(f"JMdict をパース中: {gz_path}")
    words_map: dict[str, dict] = {}

    with gzip.open(gz_path, "rb") as gz_file:
        context = ET.iterparse(gz_file, events=("end",))
        for event, elem in context:
            if elem.tag == "entry":
                # 各漢字表記とその優先度スコア
                kanji_entries: list[tuple[str, int, list[str]]] = []
                for k_ele in elem.findall("k_ele"):
                    keb = k_ele.findtext("keb")
                    if not keb:
                        continue
                    k_pri = [p.text for p in k_ele.findall("ke_pri") if p.text]
                    score = get_tag_priority_score(k_pri)
                    kanji_entries.append((keb, score, k_pri))

                # 読みと優先度
                for r_ele in elem.findall("r_ele"):
                    reb = r_ele.findtext("reb")
                    if not reb:
                        continue
                    
                    hiragana = katakana_to_hiragana(reb)
                    if not is_valid_hiragana_word(hiragana):
                        continue
                    
                    # カタカナ語（外来語表記など）の判定
                    is_katakana_orig = any(0x30A1 <= ord(c) <= 0x30F6 for c in reb)
                    
                    r_pri = [p.text for p in r_ele.findall("re_pri") if p.text]
                    all_tags = set(r_pri)
                    for _, _, k_pri in kanji_entries:
                        all_tags.update(k_pri)

                    # 厳格な日常語判定（news2単独や専門語はFalse）
                    is_common = is_core_common(all_tags)
                    
                    if hiragana not in words_map:
                        words_map[hiragana] = {
                            "reading": hiragana,
                            "length": len(hiragana),
                            "common": is_common,
                            "kanji_scores": {},  # 漢字 -> 最高スコア
                            "katakana": [reb] if is_katakana_orig else [],
                            "display": "",
                            "score_bias": 1.2 if is_common else 1.0,
                        }
                    else:
                        if is_common:
                            words_map[hiragana]["common"] = True
                            words_map[hiragana]["score_bias"] = 1.2
                        if is_katakana_orig and reb not in words_map[hiragana]["katakana"]:
                            words_map[hiragana]["katakana"].append(reb)

                    # 漢字表記をスコア付きでマージ
                    target_k_scores = words_map[hiragana]["kanji_scores"]
                    for keb, score, k_pri in kanji_entries:
                        # 読み側のタグも加味した複合スコア
                        total_k_score = score + get_tag_priority_score(r_pri)
                        if keb not in target_k_scores or total_k_score > target_k_scores[keb]:
                            target_k_scores[keb] = total_k_score

                elem.clear()

    # 代表表示名 (display) および漢字リストの優先度順ソート
    for w in words_map.values():
        k_scores = w.pop("kanji_scores", {})
        # スコア降順にソートした漢字リスト（同点なら文字の自然順）
        sorted_kanjis = [
            k for k, _ in sorted(k_scores.items(), key=lambda x: x[1], reverse=True)
        ]
        w["kanji"] = sorted_kanjis[:5]  # 上位5件まで保持
        
        katakanas = w["katakana"]
        reading = w["reading"]
        
        # 1. 外来語（カタカナが主で、漢字がないか外来語扱い）
        if katakanas and (not sorted_kanjis or w.get("common")):
            if not sorted_kanjis:
                w["display"] = katakanas[0]
            else:
                # 漢字もカタカナもある場合（例: アイス / 愛す）
                w["display"] = f"{katakanas[0]} / {sorted_kanjis[0]}"
        elif sorted_kanjis:
            # 2. 漢字表記がある日常語（最高スコアの漢字を代表表示に採用）
            w["display"] = sorted_kanjis[0]
        else:
            # 3. かなのみ
            w["display"] = reading

    word_list = sorted(words_map.values(), key=lambda w: (not w["common"], w["length"], w["reading"]))
    print(f"抽出完了: 全 {len(word_list):,} 語 (常用語: {sum(1 for w in word_list if w['common']):,} 語)")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(word_list, f, ensure_ascii=False, indent=2)
    print(f"辞書保存完了: {output_path}")

def build_dictionary():
    gz_path = download_jmdict()
    parse_jmdict(gz_path)

if __name__ == "__main__":
    build_dictionary()
