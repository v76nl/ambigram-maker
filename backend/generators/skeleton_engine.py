import base64
import io
from pathlib import Path
from typing import Any
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator

FONT_PATH = Path(__file__).parent.parent / "fonts" / "ZenMaruGothic-Medium.ttf"

class SkeletonAmbigramEngine(BaseAmbigramGenerator):
    """
    手法B: 骨格中心線 (スケルトン) 平均化 Engine
    魏・山口 (2023) に着想を得た中心線アプローチ。
    正位置文字と180度反転文字の距離変換場 (Distance Transform) から平均骨格中心線を算出し、
    指定した線幅の均一な単一ストロークとして滑らかに再描画する。
    """
    def __init__(self, font_path: Path = FONT_PATH):
        self.font_path = font_path

    def render_glyph_bitmap(self, char: str, size: int = 512) -> np.ndarray:
        """指定文字を高解像度ビットマップとしてレンダリング (0: 背景, 255: 文字)"""
        img = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(str(self.font_path), int(size * 0.72))
        except Exception:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), char, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (size - w) // 2 - bbox[0]
        y = (size - h) // 2 - bbox[1]

        draw.text((x, y), char, fill=255, font=font)
        return np.array(img, dtype=np.uint8)

    def _morphological_skeleton(self, binary_img: np.ndarray) -> np.ndarray:
        """モルフォロジー演算による細線化中心線の抽出"""
        skel = np.zeros(binary_img.shape, np.uint8)
        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        temp = binary_img.copy()

        while True:
            eroded = cv2.erode(temp, element)
            opened = cv2.morphologyEx(eroded, cv2.MORPH_OPEN, element)
            subset = cv2.subtract(eroded, opened)
            skel = cv2.bitwise_or(skel, subset)
            temp = eroded.copy()
            if cv2.countNonZero(temp) == 0:
                break
        return skel

    def generate_slot(
        self,
        c1: str,
        c2: str,
        size: int = 512,
        stroke_thickness: int = 15,
        diff_blend: float = 0.35,
    ) -> np.ndarray:
        """
        1文字スロットにおける平均骨格線の抽出と単一ストローク再描画
        - c1: 正位置の文字
        - c2: 180度反転位置の文字
        - stroke_thickness: 再描画するストロークの線幅 (px)
        - diff_blend: 異文字ペア時に固有ストローク骨格を残す重み
        """
        img1 = self.render_glyph_bitmap(c1, size=size)
        img2 = self.render_glyph_bitmap(c2, size=size)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 1. 各文字のL2ユークリッド距離変換
        d1 = cv2.distanceTransform((img1 > 0).astype(np.uint8), cv2.DIST_L2, 5)
        d2 = cv2.distanceTransform((img2_rot > 0).astype(np.uint8), cv2.DIST_L2, 5)

        # 2. 調和平均距離場による中心線エネルギー場の算出
        # 両文字のストローク中心に近いほど高い値をとる
        harmonic_field = (2.0 * d1 * d2) / (d1 + d2 + 1e-5)

        if c1 == c2:
            combined_field = harmonic_field
            threshold_ratio = 0.20
        else:
            # 異文字ペアでは固有パーツの距離場をブレンドして消失を防止
            diff_field = np.maximum(d1, d2)
            combined_field = harmonic_field + float(diff_blend) * diff_field
            threshold_ratio = 0.15

        # 3. エネルギー場の正規化と二値化
        max_val = combined_field.max()
        if max_val > 0:
            field_norm = np.clip((combined_field / max_val) * 255, 0, 255).astype(np.uint8)
        else:
            field_norm = np.zeros(img1.shape, dtype=np.uint8)

        thresh_val = int(255 * threshold_ratio)
        _, field_bin = cv2.threshold(field_norm, thresh_val, 255, cv2.THRESH_BINARY)

        # 4. 平均骨格（スケルトン中心線）を抽出
        skeleton = self._morphological_skeleton(field_bin)

        # 5. 指定された均一ストローク幅 (円形ブラシ) で再描画
        radius = max(3, stroke_thickness if stroke_thickness % 2 != 0 else stroke_thickness + 1)
        brush = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (radius, radius))
        stroked = cv2.dilate(skeleton, brush)

        # 6. 端点の丸めと滑らかな輪郭化
        blurred = cv2.GaussianBlur(stroked, (7, 7), 0)
        _, result = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)

        return result

    def generate(
        self,
        word: str,
        stroke_thickness: int = 15,
        diff_blend: float = 0.35,
        slot_size: int = 512,
        **params,
    ) -> dict[str, Any]:
        """単語全体の平均骨格アンビグラム画像を生成してBase64形式で返却"""
        n = len(word)
        if n == 0:
            return {"engine": "skeleton", "type": "png", "data": "", "details": {}}

        slots = []
        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            slot_img = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                stroke_thickness=stroke_thickness,
                diff_blend=diff_blend,
            )
            slots.append(slot_img)

        # 水平方向に連結
        full_width_img = np.hstack(slots)

        # マージン (パディング) 付加
        pad_y = int(slot_size * 0.15)
        pad_x = int(slot_size * 0.15)
        padded_img = cv2.copyMakeBorder(
            full_width_img,
            pad_y,
            pad_y,
            pad_x,
            pad_x,
            cv2.BORDER_CONSTANT,
            value=0,
        )

        # 背景白、文字黒のRGBA画像に変換
        h, w = padded_img.shape
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[:, :, 0] = 17  # #111111
        rgba[:, :, 1] = 17
        rgba[:, :, 2] = 17
        rgba[:, :, 3] = padded_img

        pil_img = Image.fromarray(rgba, mode="RGBA")
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        return {
            "engine": "skeleton",
            "type": "png",
            "data": data_uri,
            "details": {
                "word": word,
                "length": n,
                "stroke_thickness": stroke_thickness,
                "diff_blend": diff_blend,
                "description": "手法B: 骨格中心線 (スケルトン) 平均化",
            },
        }
