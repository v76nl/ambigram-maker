import math
from pathlib import Path
from typing import Any
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from shapely.geometry import shape, MultiPolygon, Polygon
from shapely.affinity import rotate, translate, scale
import shapely.ops as ops

from .base import BaseAmbigramGenerator

FONT_PATH = Path(__file__).parent.parent / "fonts" / "ZenMaruGothic-Medium.ttf"

class VectorAmbigramEngine(BaseAmbigramGenerator):
    """
    手法1: ベクター / 幾何学的合成 Engine
    フォントのベクターアウトラインを抽出し、正位置の文字と180度回転した対称文字を幾何学的に融合してSVGを生成する
    """
    def __init__(self, font_path: Path = FONT_PATH):
        self.font_path = font_path
        self.ttfont = TTFont(str(font_path))
        self.glyph_set = self.ttfont.getGlyphSet()
        self.cmap = self.ttfont.getBestCmap()
        self.units_per_em = self.ttfont["head"].unitsPerEm

    def get_glyph_path(self, char: str) -> tuple[str, float]:
        """文字のSVGパス文字列とadvance widthを取得"""
        codepoint = ord(char)
        if codepoint not in self.cmap:
            return "", self.units_per_em
        glyph_name = self.cmap[codepoint]
        glyph = self.glyph_set[glyph_name]
        
        pen = SVGPathPen(self.glyph_set)
        glyph.draw(pen)
        return pen.getCommands(), glyph.width

    def generate(
        self,
        word: str,
        blend_ratio: float = 0.5,
        stroke_width: float = 0.0,
        view_box_size: int = 1000,
        highlight_mode: bool = False,
        **params
    ) -> dict[str, Any]:
        """
        単語を受け取り、180度回転自己対称アンビグラムのSVGを生成する
        各文字スロットにおいて、元の文字と180度回転させたペア文字を幾何学的に配置する
        石崎ほか (2024)「ひらがな~る」に基づき、共通・固有ストロークの色分けハイライトに対応。
        """
        n = len(word)
        if n == 0:
            return {"engine": "vector", "type": "svg", "data": "", "details": {}}

        char_spacing = 900
        total_width = n * char_spacing
        height = 1000
        baseline = 750

        svg_parts = []
        svg_parts.append(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_width} {height}" '
            f'width="100%" height="100%" class="ambigram-vector{" highlight-active" if highlight_mode else ""}">'
        )
        svg_parts.append('<defs>')
        svg_parts.append(
            '<style>'
            '.ambigram-vector { overflow: visible; }'
            '.char-slot { transition: all 0.3s ease; }'
            '.stroke-c1 { mix-blend-mode: multiply; }'
            '.stroke-c2 { mix-blend-mode: multiply; }'
            '</style>'
        )
        svg_parts.append('</defs>')

        # 各文字の配置
        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            
            path1, width1 = self.get_glyph_path(c1)
            path2, width2 = self.get_glyph_path(c2)

            slot_center_x = i * char_spacing + char_spacing / 2
            slot_center_y = height / 2

            scale_factor = 0.8
            offset1_x = slot_center_x - (width1 * scale_factor) / 2
            offset1_y = baseline

            # ハイライトモード時のカラー設定 (石崎ほか 2024)
            # 正位置: 青 (#2563eb), 反転位置: 橙 (#ea580c), 重なり部分は自然な混色 (濃紺/緑系)
            if highlight_mode:
                color1 = "#2563eb"
                color2 = "#ea580c"
                opacity1 = 0.72
                opacity2 = 0.72
            else:
                color1 = "currentColor"
                color2 = "currentColor"
                opacity1 = round(1.0 - blend_ratio * 0.25, 2)
                opacity2 = round(1.0 - blend_ratio * 0.25, 2)

            svg_parts.append(f'<g id="char-slot-{i}" class="char-slot" data-c1="{c1}" data-c2="{c2}">')

            # 1. 文字1（正位置）
            svg_parts.append(
                f'<g class="stroke-c1" transform="translate({offset1_x}, {offset1_y}) scale({scale_factor}, -{scale_factor})">'
                f'<path d="{path1}" fill="{color1}" fill-opacity="{opacity1}" />'
                f'</g>'
            )

            # 2. 文字2（180度回転位置）
            svg_parts.append(
                f'<g class="stroke-c2" transform="translate({slot_center_x}, {slot_center_y}) rotate(180) '
                f'translate({-(width2 * scale_factor)/2}, {baseline - slot_center_y}) scale({scale_factor}, -{scale_factor})">'
                f'<path d="{path2}" fill="{color2}" fill-opacity="{opacity2}" />'
                f'</g>'
            )

            svg_parts.append('</g>')

        svg_parts.append('</svg>')
        svg_content = "\n".join(svg_parts)

        return {
            "engine": "vector",
            "type": "svg",
            "data": svg_content,
            "details": {
                "word": word,
                "length": n,
                "blend_ratio": blend_ratio,
                "stroke_width": stroke_width,
                "highlight_mode": highlight_mode,
            }
        }
