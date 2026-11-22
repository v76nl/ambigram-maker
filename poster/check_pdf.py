"""書き出したPDFの検査: 画像ごとの実効解像度、フォントの埋め込み、紙面サイズを確かめ、確認用の画像を出す。

実行: uv run --with pymupdf python poster/check_pdf.py poster/build/poster.pdf [プレビュー出力先]
"""

from __future__ import annotations

import sys
from pathlib import Path

import pymupdf

MIN_DPI = 300


def main() -> int:
    pdf = Path(sys.argv[1])
    preview = Path(sys.argv[2]) if len(sys.argv) > 2 else pdf.with_suffix(".preview.png")
    doc = pymupdf.open(pdf)
    page = doc[0]
    w_mm, h_mm = page.rect.width / 72 * 25.4, page.rect.height / 72 * 25.4
    print(f"page: {w_mm:.0f} x {h_mm:.0f} mm")

    failures = 0
    for img in page.get_images(full=True):
        xref, width, height = img[0], img[2], img[3]
        for rect in page.get_image_rects(xref):
            if rect.width < 1 or rect.height < 1:
                continue
            dpi = min(width / (rect.width / 72), height / (rect.height / 72))
            ok = dpi >= MIN_DPI
            failures += not ok
            print(f"{'OK ' if ok else 'LOW'} {dpi:6.0f} dpi  {width}x{height}px  "
                  f"{rect.width / 72 * 25.4:.0f}x{rect.height / 72 * 25.4:.0f} mm")

    fonts = page.get_fonts(full=True)
    for f in fonts:
        embedded = f[1] not in ("n/a", "")
        print(f"font: {f[3]} ({f[1]}) {'embedded' if embedded else 'NOT EMBEDDED'}")

    page.get_pixmap(dpi=40).save(preview)
    print(f"preview: {preview}")
    print(f"low-resolution images: {failures}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
