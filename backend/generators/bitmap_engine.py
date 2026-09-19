import base64
import io
from pathlib import Path
from typing import Any
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator

FONT_PATH = Path(__file__).parent.parent / "fonts" / "ZenMaruGothic-Medium.ttf"

class BitmapAmbigramEngine(BaseAmbigramGenerator):
    """
    手法2: ビットマップ画像最適化 Engine
    OpenCVとNumPyを用いて、正位置文字と180度回転文字の重なり・差分エネルギーを最適化し、
    滑らかな2値/グレースケールアンビグラム画像を生成する
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

    def optimize_slot(
        self,
        c1: str,
        c2: str,
        size: int = 512,
        blend_weight: float = 0.6,
        smoothness: int = 7,
        threshold_val: int = 120,
    ) -> np.ndarray:
        """1文字スロットにおける2文字の融合・エネルギー最適化"""
        img1 = self.render_glyph_bitmap(c1, size=size)
        img2 = self.render_glyph_bitmap(c2, size=size)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 共通部分（Intersection）
        intersection = cv2.bitwise_and(img1, img2_rot)
        
        # 差分部分（Difference）
        diff1 = cv2.subtract(img1, img2_rot)
        diff2 = cv2.subtract(img2_rot, img1)

        # 距離変換による骨格アライメント
        # 共通部分からの距離に応じて差分部分の重みを減衰
        dist1 = cv2.distanceTransform((img1 > 0).astype(np.uint8), cv2.DIST_L2, 5)
        dist2 = cv2.distanceTransform((img2_rot > 0).astype(np.uint8), cv2.DIST_L2, 5)
        
        # 正規化
        cv2.normalize(dist1, dist1, 0, 1.0, cv2.NORM_MINMAX)
        cv2.normalize(dist2, dist2, 0, 1.0, cv2.NORM_MINMAX)

        # 重み付きエネルギー合成
        # 共通部分は最大強度 (1.0)
        # 差分部分は blend_weight と距離変換に基づいて減衰
        f_common = (intersection.astype(np.float32) / 255.0) * 1.0
        f_diff1 = (diff1.astype(np.float32) / 255.0) * blend_weight * (0.5 + 0.5 * dist1)
        f_diff2 = (diff2.astype(np.float32) / 255.0) * blend_weight * (0.5 + 0.5 * dist2)

        energy = np.clip(f_common + f_diff1 + f_diff2, 0, 1.0) * 255.0
        energy_uint8 = energy.astype(np.uint8)

        # ガウシアン平滑化で境界を滑らかに融合
        if smoothness > 0:
            ksize = smoothness if smoothness % 2 != 0 else smoothness + 1
            blurred = cv2.GaussianBlur(energy_uint8, (ksize, ksize), 0)
        else:
            blurred = energy_uint8

        # 閾値処理で輪郭を確定
        _, thresh = cv2.threshold(blurred, threshold_val, 255, cv2.THRESH_BINARY)

        # モルフォロジー演算（微小ノイズ除去と輪郭の滑らかさ補正）
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel)

        return opened

    def generate(
        self,
        word: str,
        blend_weight: float = 0.65,
        smoothness: int = 7,
        threshold_val: int = 110,
        **params
    ) -> dict[str, Any]:
        """単語全体のビットマップアンビグラムを生成し、Base64エンコードPNGを返す"""
        n = len(word)
        if n == 0:
            return {"engine": "bitmap", "type": "png", "data": "", "details": {}}

        char_size = 512
        slot_images = []

        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            slot_img = self.optimize_slot(
                c1,
                c2,
                size=char_size,
                blend_weight=blend_weight,
                smoothness=smoothness,
                threshold_val=threshold_val,
            )
            slot_images.append(slot_img)

        # 単語全体の画像を水平に結合
        combined = np.hstack(slot_images)

        # 白背景・黒文字に反転（255: 白背景, 0: 黒文字）
        output_image = 255 - combined

        # PIL Imageに変換してPNGバイト列を作成
        pil_img = Image.fromarray(output_image)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "engine": "bitmap",
            "type": "png",
            "data": f"data:image/png;base64,{b64_str}",
            "details": {
                "word": word,
                "length": n,
                "blend_weight": blend_weight,
                "smoothness": smoothness,
                "threshold_val": threshold_val,
                "width": combined.shape[1],
                "height": combined.shape[0],
            }
        }
