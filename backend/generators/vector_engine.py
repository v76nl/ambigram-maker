from typing import Any
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

from .base import BaseAmbigramGenerator

from .font_manager import font_manager

class VectorAmbigramEngine(BaseAmbigramGenerator):
    """
    手法1: ベクター / 幾何学的合成 Engine
    フォントのベクターアウトラインを抽出し、正位置の文字と180度回転した対称文字を幾何学的に融合してSVGを生成する。
    マルチフォント自動最適化に対応。
    """
    def __init__(self):
        self._font_cache: dict[str, dict[str, Any]] = {}

    def _get_font_data(self, font_id: str) -> dict[str, Any]:
        if font_id in self._font_cache:
            return self._font_cache[font_id]
        
        font_path = font_manager.get_font_path(font_id)
        ttfont = TTFont(str(font_path))
        data = {
            "ttfont": ttfont,
            "glyph_set": ttfont.getGlyphSet(),
            "cmap": ttfont.getBestCmap(),
            "units_per_em": ttfont["head"].unitsPerEm,
        }
        self._font_cache[font_id] = data
        return data

    def get_glyph_path(self, char: str, font_id: str = "zen_maru") -> tuple[str, float]:
        """文字のSVGパス文字列とadvance widthを取得"""
        fdata = self._get_font_data(font_id)
        codepoint = ord(char)
        if codepoint not in fdata["cmap"]:
            return "", fdata["units_per_em"]
        glyph_name = fdata["cmap"][codepoint]
        glyph = fdata["glyph_set"][glyph_name]
        
        pen = SVGPathPen(fdata["glyph_set"])
        glyph.draw(pen)
        return pen.getCommands(), glyph.width

    def generate(
        self,
        word: str,
        blend_ratio: float = 0.5,
        stroke_width: float = 0.0,
        view_box_size: int = 1000,
        highlight_mode: bool = False,
        font_id: str = "auto",
        **params
    ) -> dict[str, Any]:
        """
        単語を受け取り、180度回転自己対称アンビグラムのSVGを生成する
        各文字スロットにおいて、元の文字と180度回転させたペア文字を幾何学的に配置する
        石崎ほか (2024)「ひらがな~る」に基づき、共通・固有ストロークの色分けハイライトに対応。
        マルチフォント自動最適化に対応。
        """
        n = len(word)
        if n == 0:
            return {"engine": "vector", "type": "svg", "data": "", "details": {}}

        # 全フォントの幾何スコアを評価
        font_eval = font_manager.evaluate_word_fonts(word)
        if font_id and font_id != "auto":
            selected_fid = font_id
            selected_meta = next((f for f in font_eval["font_scores"] if f["id"] == font_id), None)
            selected_name = selected_meta["name"] if selected_meta else font_id
            selected_offsets = selected_meta["offsets"] if selected_meta else [(0, 0)] * n
        else:
            selected_fid = font_eval["best_font_id"]
            selected_name = font_eval["best_font_name"]
            selected_meta = next((f for f in font_eval["font_scores"] if f["id"] == selected_fid), None)
            selected_offsets = selected_meta["offsets"] if selected_meta else [(0, 0)] * n

        custom_offsets = params.get("custom_offsets")
        if custom_offsets:
            selected_offsets = [tuple(o) for o in custom_offsets]

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

        half_len = (n + 1) // 2

        # 各文字の配置
        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            
            path1, width1 = self.get_glyph_path(c1, font_id=selected_fid)
            path2, width2 = self.get_glyph_path(c2, font_id=selected_fid)

            slot_center_x = i * char_spacing + char_spacing / 2
            slot_center_y = height / 2

            # 最適XYシフトの反映 (128px空間のオフセットをSVG座標系へスケール)
            pair_idx = i if i < half_len else (n - 1 - i)
            is_center = (i == n - 1 - i)
            dx, dy = (0, 0) if is_center else (selected_offsets[pair_idx] if pair_idx < len(selected_offsets) else (0, 0))
            if i >= half_len:
                dx, dy = -dx, -dy
            shift_svg_x = dx * 6.0
            shift_svg_y = dy * 6.0

            # 対称配分: 文字1(正位置) に -shift/2, 文字2(反転位置) に +shift/2
            scale_factor = 0.8
            offset1_x = slot_center_x - (width1 * scale_factor) / 2 - shift_svg_x / 2.0
            offset1_y = baseline - shift_svg_y / 2.0

            center2_x = slot_center_x + shift_svg_x / 2.0
            center2_y = slot_center_y + shift_svg_y / 2.0

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

            # 1. 文字1（正位置 -shift/2）
            svg_parts.append(
                f'<g class="stroke-c1" transform="translate({offset1_x}, {offset1_y}) scale({scale_factor}, -{scale_factor})">'
                f'<path d="{path1}" fill="{color1}" fill-opacity="{opacity1}" />'
                f'</g>'
            )

            # 2. 文字2（180度回転位置 +shift/2）
            svg_parts.append(
                f'<g class="stroke-c2" transform="translate({center2_x}, {center2_y}) rotate(180) '
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
                "font_id": font_id,
                "selected_font_id": selected_fid,
                "selected_font_name": selected_name,
                "selected_offsets": selected_offsets,
                "best_font_id": font_eval["best_font_id"],
                "best_font_name": font_eval["best_font_name"],
                "font_scores": font_eval["font_scores"],
            }
        }

