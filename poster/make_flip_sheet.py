"""作例を A4 に並べ、印刷して手元で逆さにして見られる PDF を作る。

output/ に保存した作品画像を、ポスターの素材と同じ処理 (余白の切り詰めと輪郭を滑らかにした拡大) で描き直して並べる。
1ページを4段に分けて薄いグレーの線で区切り、語のラベルは各段の左下と、180度回した向きで右上の2か所に入れる。
どちら向きに持っても何の語か読める。

実行: uv run --project backend --with pymupdf python poster/make_flip_sheet.py
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

import pymupdf
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
from prepare_assets import INK, OUTPUT_DIR, paint, smooth_upscale, trim_mask  # noqa: E402

OUT = Path(__file__).resolve().parent / "build" / "HCD2026winter_C04_ambigram_flip_A4.pdf"
FONT = Path("C:/Windows/Fonts/BIZ-UDGothicR.ttc")

# (ラベルの語, output/ の作品画像)。字形の処理の違いで複数の版がある語は、使う版のファイルを指す
PAGES = [
    [("長寿", "ambigram_長寿_skeleton.png"), ("日曜日", "ambigram_日曜日_skeleton.png"),
     ("留置場", "ambigram_留置場_skeleton.png"), ("気の毒", "ambigram_気の毒_skeleton.png")],
    [("奥歯", "ambigram_奥歯_skeleton.png"), ("垂直", "ambigram_垂直_skeleton.png"),
     ("蜘蛛", "ambigram_蜘蛛_skeleton.png"), ("秋桜", "ambigram_秋桜_skeleton.png")],
    [("最悪", "ambigram_最悪_skeleton.png"), ("追い風", "ambigram_追い風_skeleton.png"),
     ("そなえ", "ambigram_そなえ_morphology.png"), ("最古の文書", "ambigram_最古の文書_skeleton.png")],
]

MM = 72 / 25.4
PAGE_W, PAGE_H = 210, 297
MARGIN_X, MARGIN_Y = 15, 12  # 紙の端から区切りの範囲まで (mm)
LABEL = 10  # ラベルの文字の大きさ (pt)
LABEL_IN = 4  # 段の端からラベルまで (mm)
IMG_MAX_W, IMG_PAD_Y = 170, 9  # 作例の最大幅と、段の上下に空ける余白 (mm)
PX_PER_MM = 16  # 作例を描き直す解像度。約 400 dpi
SUB = (0x5C / 255, 0x55 / 255, 0x52 / 255)
LINE = (0xD6 / 255, 0xD1 / 255, 0xCD / 255)


def work_mask(file: str) -> np.ndarray:
    """作品画像の文字の部分。背景が透過でも白でも、不透明で暗い画素を文字とみなす。"""
    rgba = np.array(Image.open(OUTPUT_DIR / file).convert("RGBA"))
    return trim_mask((rgba[..., 3] > 127) & (rgba[..., :3].mean(axis=2) < 128))


def work_png(mask: np.ndarray, width_mm: float) -> bytes:
    alpha = smooth_upscale(mask, round(width_mm * PX_PER_MM))
    buf = io.BytesIO()
    Image.fromarray(paint([(alpha, INK)], alpha.shape)).save(buf, format="PNG", optimize=True)
    return buf.getvalue()


doc = pymupdf.open()
cell_h = (PAGE_H - 2 * MARGIN_Y) / 4
for words in PAGES:
    page = doc.new_page(width=PAGE_W * MM, height=PAGE_H * MM)
    page.insert_font(fontname="biz", fontfile=str(FONT))
    for k, (word, file) in enumerate(words):
        top = MARGIN_Y + k * cell_h
        if k:
            page.draw_line((MARGIN_X * MM, top * MM), ((PAGE_W - MARGIN_X) * MM, top * MM), color=LINE, width=0.5)
        mask = work_mask(file)
        aspect = mask.shape[0] / mask.shape[1]
        w = min(IMG_MAX_W, (cell_h - 2 * IMG_PAD_Y) / aspect)
        h = w * aspect
        x, y = (PAGE_W - w) / 2, top + (cell_h - h) / 2
        page.insert_image(pymupdf.Rect(x * MM, y * MM, (x + w) * MM, (y + h) * MM), stream=work_png(mask, w))
        page.insert_text(((MARGIN_X + LABEL_IN) * MM, (top + cell_h - LABEL_IN) * MM), word,
                         fontname="biz", fontsize=LABEL, color=SUB)
        page.insert_text(((PAGE_W - MARGIN_X - LABEL_IN) * MM, (top + LABEL_IN) * MM), word,
                         fontname="biz", fontsize=LABEL, color=SUB, rotate=180)

doc.set_metadata({"title": "180度回転型アンビグラム 作例 (逆さにして見る用)"})
OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT, garbage=3, deflate=True)
print("saved", OUT)
