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
        **params
    ) -> dict[str, Any]:
        """
        単語を受け取り、180度回転自己対称アンビグラムのSVGを生成する
        各文字スロットにおいて、元の文字と180度回転させたペア文字をブレンドして配置する
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
            f'width="100%" height="100%" class="ambigram-vector">'
        )
        svg_parts.append('<defs>')
        svg_parts.append(
            '<style>'
            '.ambigram-stroke { fill: currentColor; }'
            '.ambigram-blend { mix-blend-mode: multiply; }'
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

            # 文字1（正位置）のグループ
            # Y軸反転（フォント座標系は下向きYが負、SVGは下向きYが正）
            scale_factor = 0.8
            offset1_x = slot_center_x - (width1 * scale_factor) / 2
            offset1_y = baseline

            # 文字2（180度回転位置）のグループ
            # 180度回転して文字1の位置に重ねる
            svg_parts.append(f'<g id="char-slot-{i}" class="char-slot">')

            # 融合表現：
            # 1. 文字1（正位置）
            # 2. 文字2（中心を基準に180度回転した状態）
            # 3. 両方の重なり（共通部分）を強調、差分部分を滑らかに融合
            svg_parts.append(
                f'<g transform="translate({offset1_x}, {offset1_y}) scale({scale_factor}, -{scale_factor})">'
                f'<path d="{path1}" fill="currentColor" fill-opacity="{1.0 - blend_ratio * 0.3}" />'
                f'</g>'
            )

            # 180度回転させた文字2を同じ文字スロットの中心に配置
            svg_parts.append(
                f'<g transform="translate({slot_center_x}, {slot_center_y}) rotate(180) '
                f'translate({-(width2 * scale_factor)/2}, {baseline - slot_center_y}) scale({scale_factor}, -{scale_factor})">'
                f'<path d="{path2}" fill="currentColor" fill-opacity="{1.0 - blend_ratio * 0.3}" />'
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
            }
        }
