import gzip
import json
import os
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
COMMON_PRIORITY_TAGS = {
    "news1", "news2", "ichi1", "ichi2", "spec1", "spec2", "gai1", "gai2"
}

def katakana_to_hiragana(s: str) -> str:
    """カタカナをひらがなに変換する"""
    result = []
    for c in s:
        code = ord(c)
        if 0x30A1 <= code <= 0x30F6:  # カタカナ範囲
            c = chr(code - 0x60)
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
                # 漢字表記
                kanji_list = [k.text for k in elem.findall("k_ele/keb") if k.text]
                
                # 読みと優先度
                for r_ele in elem.findall("r_ele"):
                    reb = r_ele.findtext("reb")
                    if not reb:
                        continue
                    
                    hiragana = katakana_to_hiragana(reb)
                    if not is_valid_hiragana_word(hiragana):
                        continue
                    
                    # 優先度タグのチェック
                    pri_tags = [p.text for p in r_ele.findall("re_pri") if p.text]
                    is_common = bool(COMMON_PRIORITY_TAGS.intersection(pri_tags))
                    
                    # 漢字側の優先度も考慮
                    for k_ele in elem.findall("k_ele"):
                        k_pri_tags = [p.text for p in k_ele.findall("ke_pri") if p.text]
                        if COMMON_PRIORITY_TAGS.intersection(k_pri_tags):
                            is_common = True
                            break
                    
                    if hiragana not in words_map:
                        words_map[hiragana] = {
                            "reading": hiragana,
                            "length": len(hiragana),
                            "common": is_common,
                            "kanji": kanji_list[:3],
                            "score_bias": 1.2 if is_common else 1.0,
                        }
                    else:
                        if is_common:
                            words_map[hiragana]["common"] = True
                            words_map[hiragana]["score_bias"] = 1.2
                        for k in kanji_list[:3]:
                            if k not in words_map[hiragana]["kanji"]:
                                words_map[hiragana]["kanji"].append(k)

                elem.clear()

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
