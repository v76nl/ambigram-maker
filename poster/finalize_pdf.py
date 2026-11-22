"""PowerPoint が縮小したPDF内の画像を、pptx に埋め込んだ元の解像度の画像に差し替える。

PowerPoint の PDF 書き出しは画像を約200dpiに縮小するため、印刷用には元画像へ戻す。
文字と図形は PowerPoint の書き出し結果をそのまま使う。

実行: uv run --with pymupdf --with python-pptx python poster/finalize_pdf.py <pptx> <PowerPointが書き出したpdf> <出力pdf>
"""

from __future__ import annotations

import sys

import pymupdf
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE

EMU_PER_PT = 12700
TOLERANCE_PT = 3.0


def pictures(shapes):
    for shape in shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
            yield from pictures(shape.shapes)
        elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            yield shape


def main() -> None:
    pptx_path, pdf_path, out_path = sys.argv[1:4]
    slide = Presentation(pptx_path).slides[0]
    sources = [
        (
            pymupdf.Rect(
                pic.left / EMU_PER_PT,
                pic.top / EMU_PER_PT,
                (pic.left + pic.width) / EMU_PER_PT,
                (pic.top + pic.height) / EMU_PER_PT,
            ),
            pic.image.blob,
            pic.name,
        )
        for pic in pictures(slide.shapes)
    ]

    doc = pymupdf.open(pdf_path)
    page = doc[0]
    replaced = 0
    for img in page.get_images(full=True):
        xref = img[0]
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        rect = rects[0]
        match = next(
            (s for s in sources if all(abs(a - b) <= TOLERANCE_PT for a, b in zip(s[0], rect))),
            None,
        )
        if match is None:
            raise SystemExit(f"pptx に対応する画像が見つからない: {rect}")
        page.replace_image(xref, stream=match[1])
        replaced += 1
        print(f"replaced {match[2]}")

    if replaced != len(sources):
        raise SystemExit(f"差し替え数が合わない: {replaced} / {len(sources)}")
    doc.save(out_path, garbage=3, deflate=True)
    print(f"saved {out_path} ({replaced} images)")


if __name__ == "__main__":
    main()
