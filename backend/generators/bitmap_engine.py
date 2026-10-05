import base64
import io
from pathlib import Path
from typing import Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator, array_to_png_data_uri, make_bicolor_overlay
from .font_manager import font_manager

class BitmapAmbigramEngine(BaseAmbigramGenerator):
    """
    手法2: ビットマップ画像最適化 Engine
    OpenCVとNumPyを用いて、正位置文字と180度回転文字の重なり・差分エネルギーを最適化し、
    滑らかな2値/グレースケールアンビグラム画像を生成する
    """
    def __init__(self, font_path: Optional[Path] = None):
        self.font_path = font_path

    def render_glyph_bitmap(self, char: str, size: int = 512, font_path: Optional[Path] = None) -> np.ndarray:
        """指定文字を高解像度ビットマップとしてレンダリング (0: 背景, 255: 文字)"""
        fpath = font_path or self.font_path or font_manager.get_font_path("zen_maru")
        img = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(str(fpath), int(size * 0.72))
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
        font_path: Optional[Path] = None,
        return_intermediates: bool = False,
    ) -> np.ndarray | tuple[np.ndarray, dict[str, np.ndarray]]:
        """1文字スロットにおける2文字の融合・エネルギー最適化"""
        img1 = self.render_glyph_bitmap(c1, size=size, font_path=font_path)
        img2 = self.render_glyph_bitmap(c2, size=size, font_path=font_path)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 中間ステップ1: 正反配置 (バイカラー)
        step1_overlay = make_bicolor_overlay(img1, img2_rot)

        # 共通部分（Intersection）
        intersection = cv2.bitwise_and(img1, img2_rot)
        
        # 差分部分（Difference）
        diff1 = cv2.subtract(img1, img2_rot)
        diff2 = cv2.subtract(img2_rot, img1)

        # 中間ステップ2: 共通核と差分分解
        step2_decomp = make_bicolor_overlay(diff1, diff2)
        # 共通部分を重ねる
        overlap_mask = intersection > 30
        step2_decomp[overlap_mask, 0] = 24
        step2_decomp[overlap_mask, 1] = 24
        step2_decomp[overlap_mask, 2] = 27
        step2_decomp[overlap_mask, 3] = 255

        # 距離変換による骨格アライメント
        dist1 = cv2.distanceTransform((img1 > 0).astype(np.uint8), cv2.DIST_L2, 5)
        dist2 = cv2.distanceTransform((img2_rot > 0).astype(np.uint8), cv2.DIST_L2, 5)
        
        # 正規化
        cv2.normalize(dist1, dist1, 0, 1.0, cv2.NORM_MINMAX)
        cv2.normalize(dist2, dist2, 0, 1.0, cv2.NORM_MINMAX)

        # 重み付きエネルギー合成
        f_common = (intersection.astype(np.float32) / 255.0) * 1.0
        f_diff1 = (diff1.astype(np.float32) / 255.0) * blend_weight * (0.5 + 0.5 * dist1)
        f_diff2 = (diff2.astype(np.float32) / 255.0) * blend_weight * (0.5 + 0.5 * dist2)

        energy = np.clip(f_common + f_diff1 + f_diff2, 0, 1.0) * 255.0
        energy_uint8 = energy.astype(np.uint8)

        # 中間ステップ3: 連続値エネルギー場
        step3_energy = energy_uint8.copy()

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

        # 自己回転対称文字 (c1 == c2) の場合、180度自己回転との対称和をとることで微小なラスタライズ誤差を完全に解消
        if c1 == c2:
            opened = cv2.bitwise_or(opened, cv2.rotate(opened, cv2.ROTATE_180))

        if return_intermediates:
            step4_final = opened.copy()
            intermediates = {
                "step1": step1_overlay,
                "step2": step2_decomp,
                "step3": step3_energy,
                "step4": step4_final,
            }
            return opened, intermediates

        return opened

    def generate(
        self,
        word: str,
        blend_weight: float = 0.65,
        smoothness: int = 7,
        threshold_val: int = 110,
        font_id: str = "auto",
        **params
    ) -> dict[str, Any]:
        """単語全体のビットマップアンビグラムを生成し、Base64エンコードPNGを返す"""
        n = len(word)
        if n == 0:
            return {"engine": "bitmap", "type": "png", "data": "", "details": {}}

        char_size = 512
        slots = [None] * n
        slot_intermediates = [None] * n

        selected_font_path = font_manager.get_font_path(font_id if font_id != "auto" else "zen_maru")

        half_len = (n + 1) // 2
        for i in range(half_len):
            c1 = word[i]
            c2 = word[n - 1 - i]
            is_center = (i == n - 1 - i)

            slot_img, inter = self.optimize_slot(
                c1,
                c2,
                size=char_size,
                blend_weight=blend_weight,
                smoothness=smoothness,
                threshold_val=threshold_val,
                font_path=selected_font_path,
                return_intermediates=True,
            )
            slots[i] = slot_img
            slot_intermediates[i] = inter

            if not is_center:
                slots[n - 1 - i] = cv2.rotate(slot_img, cv2.ROTATE_180)
                slot_intermediates[n - 1 - i] = {
                    "step1": cv2.rotate(inter["step1"], cv2.ROTATE_180),
                    "step2": cv2.rotate(inter["step2"], cv2.ROTATE_180),
                    "step3": cv2.rotate(inter["step3"], cv2.ROTATE_180),
                    "step4": cv2.rotate(inter["step4"], cv2.ROTATE_180),
                }

        # 単語全体の画像を水平に結合
        combined = np.hstack(slots)

        # パディング付加
        pad_y = int(char_size * 0.15)
        pad_x = int(char_size * 0.15)
        padded_img = cv2.copyMakeBorder(
            combined,
            pad_y,
            pad_y,
            pad_x,
            pad_x,
            cv2.BORDER_CONSTANT,
            value=0,
        )

        # 背景白、文字黒のRGBA画像に変換
        h, w = padded_img.shape
        rgba = np.full((h, w, 4), 255, dtype=np.uint8)
        mask = padded_img > 0
        rgba[mask, 0] = 17
        rgba[mask, 1] = 17
        rgba[mask, 2] = 17
        rgba[mask, 3] = 255

        pil_img = Image.fromarray(rgba, mode="RGBA")
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

        # 中間ステップのフル画像結合とData URI生成
        step1_img = np.hstack([s["step1"] for s in slot_intermediates])
        step2_img = np.hstack([s["step2"] for s in slot_intermediates])
        step3_img = np.hstack([s["step3"] for s in slot_intermediates])
        step4_img = np.hstack([s["step4"] for s in slot_intermediates])

        steps = [
            {
                "step": 1,
                "title": "正反オーバーレイ配置",
                "description": "正位置（青）と180度反転（赤）を初期配置し、交差部分と差分領域を特定",
                "image": array_to_png_data_uri(step1_img, color_mode="raw", add_padding=True),
            },
            {
                "step": 2,
                "title": "共通核・差分分解",
                "description": "共通して重なる核ストローク（黒）と、正位置（青）・反転位置（赤）固有の差分ストロークに分解",
                "image": array_to_png_data_uri(step2_img, color_mode="raw", add_padding=True),
            },
            {
                "step": 3,
                "title": "距離重み付けエネルギー場",
                "description": "共通部からのユークリッド距離変換に基づいて差分パーツの重みを減衰させ、連続値エネルギーマップを生成",
                "image": array_to_png_data_uri(step3_img, color_mode="heatmap", add_padding=True),
            },
            {
                "step": 4,
                "title": "ガウシアン平滑化＆二値化輪郭",
                "description": "ガウシアンフィルタで境界を滑らかに融合し、閾値処理およびモルフォロジー演算で最終輪郭を確定",
                "image": array_to_png_data_uri(step4_img, color_mode="black_on_white", add_padding=True),
            },
        ]

        return {
            "engine": "bitmap",
            "type": "png",
            "data": f"data:image/png;base64,{b64_str}",
            "steps": steps,
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
