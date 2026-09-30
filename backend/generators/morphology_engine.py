import base64
import io
from pathlib import Path
from typing import Any
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator

FONT_PATH = Path(__file__).parent.parent / "fonts" / "ZenMaruGothic-Medium.ttf"

class MorphologyAmbigramEngine(BaseAmbigramGenerator):
    """
    手法A: 論理積 (AND) ＋ モルフォロジー膨張・平滑化 Engine
    正位置と180度回転文字のピクセル論理積 (AND) を『共通対称核』として抽出し、
    モルフォロジー膨張 (Dilation) と平滑化によって二重線を解消した滑らかな単一ストロークを生成する。
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

    def generate_slot(
        self,
        c1: str,
        c2: str,
        size: int = 512,
        dilation_size: int = 11,
        smoothness: int = 7,
        diff_blend: float = 0.35,
    ) -> np.ndarray:
        """
        1文字スロットの論理積＋モルフォロジー最適化
        - c1: 正位置の文字
        - c2: 180度反転位置の文字 (c2を180度回転して重ねる)
        - dilation_size: 膨張カーネル径 (ストロークの太さ)
        - smoothness: ガウシアン平滑化カーネル径
        - diff_blend: 異文字ペア時に文字固有パーツを残す割合 (0.0〜1.0)
        """
        img1 = self.render_glyph_bitmap(c1, size=size)
        img2 = self.render_glyph_bitmap(c2, size=size)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 1. 論理積 (AND): 二重線やゴーストのない『共通対称核』
        intersection = cv2.bitwise_and(img1, img2_rot)

        # 2. 差分抽出 (異文字ペアの固有識別ストローク)
        diff1 = cv2.subtract(img1, img2_rot)
        diff2 = cv2.subtract(img2_rot, img1)

        # 同文字ペア (こ-こ 等) では純粋なANDを重視し、異文字ペアでは固有パーツを適応ブレンド
        if c1 == c2:
            base_img = intersection
        else:
            blended = intersection.astype(np.float32) + float(diff_blend) * (
                diff1.astype(np.float32) + diff2.astype(np.float32)
            )
            base_img = np.clip(blended, 0, 255).astype(np.uint8)
            _, base_img = cv2.threshold(base_img, 60, 255, cv2.THRESH_BINARY)

        # 3. モルフォロジー膨張 (Dilation) でフォントの太さを復元
        ksize = max(3, dilation_size if dilation_size % 2 != 0 else dilation_size + 1)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ksize, ksize))
        dilated = cv2.dilate(base_img, kernel)

        # 4. ガウシアン平滑化と二値化で滑らかな輪郭を生成
        if smoothness > 0:
            smsize = smoothness if smoothness % 2 != 0 else smoothness + 1
            blurred = cv2.GaussianBlur(dilated, (smsize, smsize), 0)
        else:
            blurred = dilated

        _, binary_slot = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)

        # 微小孤立ノイズの除去
        clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        opened = cv2.morphologyEx(binary_slot, cv2.MORPH_OPEN, clean_kernel)

        return opened

    def generate(
        self,
        word: str,
        dilation_size: int = 11,
        smoothness: int = 7,
        diff_blend: float = 0.35,
        slot_size: int = 512,
        **params,
    ) -> dict[str, Any]:
        """単語全体のアンビグラム画像を生成してBase64形式で返却"""
        n = len(word)
        if n == 0:
            return {"engine": "morphology", "type": "png", "data": "", "details": {}}

        slots = []
        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            slot_img = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                dilation_size=dilation_size,
                smoothness=smoothness,
                diff_blend=diff_blend,
            )
            slots.append(slot_img)

        # 水平方向に連結
        full_width_img = np.hstack(slots)

        # 見栄えの良いマージン (パディング) を付加
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
        rgba[:, :, 0] = 17  # #111111 (ダークグレー/黒)
        rgba[:, :, 1] = 17
        rgba[:, :, 2] = 17
        rgba[:, :, 3] = padded_img  # アルファチャンネルに文字マスクを設定

        pil_img = Image.fromarray(rgba, mode="RGBA")
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        return {
            "engine": "morphology",
            "type": "png",
            "data": data_uri,
            "details": {
                "word": word,
                "length": n,
                "dilation_size": dilation_size,
                "smoothness": smoothness,
                "diff_blend": diff_blend,
                "description": "手法A: 論理積 (AND) ＋ モルフォロジー膨張・平滑化",
            },
        }
