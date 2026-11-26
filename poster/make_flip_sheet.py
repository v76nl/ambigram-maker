"""ポスターの作例を A4 に並べ、印刷して手元で逆さにして見られる PDF を作る。

先に poster/prepare_assets.py で素材を作っておく。
語のラベルは各作例の左下と、180度回した向きで右上の2か所に入れ、どちら向きに持っても読めるようにする。

実行: uv run --with pymupdf python -I poster/make_flip_sheet.py
"""

from __future__ import annotations

import json
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "build" / "assets"
OUT = ROOT / "build" / "HCD2026winter_C04_ambigram_flip_A4.pdf"
FONT = Path("C:/Windows/Fonts/BIZ-UDGothicR.ttc")

MM = 72 / 25.4
PAGE_W, PAGE_H = 210, 297
IMG_W = 160  # 作例の横幅 (mm)。漢字1字がおよそ 5〜8 cm になる
LABEL = 10  # ラベルの文字の大きさ (pt)
LABEL_GAP = 2.5  # 作例とラベルのあいだ (mm)
SUB = (0x5C / 255, 0x55 / 255, 0x52 / 255)

manifest = json.loads((ASSETS / "manifest.json").read_text(encoding="utf-8"))
items = {"長寿": manifest["hero"]["file"]} | {g["word"]: g["file"] for g in manifest["gallery"]}
PAGES = [["長寿", "日曜日", "留置場", "気の毒"], ["奥歯", "垂直", "蜘蛛"]]

doc = pymupdf.open()
for words in PAGES:
    page = doc.new_page(width=PAGE_W * MM, height=PAGE_H * MM)
    page.insert_font(fontname="biz", fontfile=str(FONT))
    sizes = []
    for word in words:
        w, h = pymupdf.Pixmap(str(ASSETS / items[word])).width, pymupdf.Pixmap(str(ASSETS / items[word])).height
        sizes.append(IMG_W * h / w)
    # 作例どうしの間隔を均等にし、ページの上下の余白もその半分ずつにする
    gap = (PAGE_H - sum(sizes)) / len(words)
    y = gap / 2
    x = (PAGE_W - IMG_W) / 2
    for word, h in zip(words, sizes):
        rect = pymupdf.Rect(x * MM, y * MM, (x + IMG_W) * MM, (y + h) * MM)
        page.insert_image(rect, filename=str(ASSETS / items[word]))
        label = f"「{word}」"
        # 左下に正立のラベル、右上に180度回したラベル
        page.insert_text(((x) * MM, (y + h + LABEL_GAP) * MM + LABEL * 0.88), label,
                         fontname="biz", fontsize=LABEL, color=SUB)
        page.insert_text(((x + IMG_W) * MM, (y - LABEL_GAP) * MM - LABEL * 0.88), label,
                         fontname="biz", fontsize=LABEL, color=SUB, rotate=180)
        y += h + gap

doc.set_metadata({"title": "180度回転型アンビグラム 作例 (逆さにして見る用)"})
OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT, garbage=3, deflate=True)
print("saved", OUT)
