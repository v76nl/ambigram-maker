import base64
import io
from pathlib import Path
from typing import Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator

from .font_manager import font_manager

class SkeletonAmbigramEngine(BaseAmbigramGenerator):
    """
    手法B: 骨格中心線 (スケルトン) 平均化 Engine
    魏・山口 (2023) に着想を得た中心線アプローチ。
    正位置文字と180度反転文字の距離変換場 (Distance Transform) から平均骨格中心線を算出し、
    指定した線幅の均一な単一ストロークとして滑らかに再描画する。
    マルチフォント自動最適化 & 重心微小シフト補正に対応。
    """
    def __init__(self):
        pass

    def render_glyph_bitmap(self, char: str, size: int = 512, font_path: Optional[Path] = None) -> np.ndarray:
        """指定文字を高解像度ビットマップとしてレンダリング (0: 背景, 255: 文字)"""
        path = font_path or font_manager.get_font_path("zen_maru")
        img = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(str(path), int(size * 0.72))
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
        pre_bold: int = 4,
        font_path: Optional[Path] = None,
        shift: tuple[int, int] = (0, 0),
    ) -> np.ndarray:
        """
        1文字スロットにおける平均骨格線の抽出と単一ストローク再描画
        - c1: 正位置の文字
        - c2: 180度反転位置の文字
        - stroke_thickness: 再描画するストロークの線幅 (px)
        - diff_blend: 異文字ペア時に固有ストローク骨格を残す重み
        - pre_bold: 事前太らせ量 (近接ストローク距離場の吸引力を強化)
        - shift: 重心微小シフト (dx, dy)
        """
        img1 = self.render_glyph_bitmap(c1, size=size, font_path=font_path)
        img2 = self.render_glyph_bitmap(c2, size=size, font_path=font_path)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 最適重心シフトの適用
        dx, dy = shift
        if dx != 0 or dy != 0:
            scale_factor = size / 128.0
            shift_x = int(round(dx * scale_factor))
            shift_y = int(round(dy * scale_factor))
            M = np.float32([[1, 0, shift_x], [0, 1, shift_y]])
            img2_rot = cv2.warpAffine(img2_rot, M, (size, size))

        # ② 事前太らせ (Pre-Bold) で距離場の交差領域・吸引力を強化
        if pre_bold > 0:
            kw = pre_bold * 2 + 1
            kh = max(3, (pre_bold * 2 + 1) // 2 * 2 + 1)
            pre_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kw, kh))
            p_img1 = cv2.dilate(img1, pre_kernel)
            p_img2_rot = cv2.dilate(img2_rot, pre_kernel)
        else:
            p_img1 = img1
            p_img2_rot = img2_rot

        # 1. 各文字のL2ユークリッド距離変換
        d1 = cv2.distanceTransform((p_img1 > 0).astype(np.uint8), cv2.DIST_L2, 5)
        d2 = cv2.distanceTransform((p_img2_rot > 0).astype(np.uint8), cv2.DIST_L2, 5)

        # 2. 調和平均距離場による中心線エネルギー場の算出
        harmonic_field = (2.0 * d1 * d2) / (d1 + d2 + 1e-5)

        if c1 == c2:
            combined_field = harmonic_field
            threshold_ratio = 0.20
        else:
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
        pre_bold: int = 4,
        slot_size: int = 512,
        font_id: str = "auto",
        **params,
    ) -> dict[str, Any]:
        """単語全体の平均骨格アンビグラム画像を生成してBase64形式で返却"""
        n = len(word)
        if n == 0:
            return {"engine": "skeleton", "type": "png", "data": "", "details": {}}

        # 全フォントの幾何スコアと最適シフトを評価
        font_eval = font_manager.evaluate_word_fonts(word)
        
        # 適用フォントの決定
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

        # カスタムオフセット指定時の上書きとスコア再計算
        custom_offsets = params.get("custom_offsets")
        if custom_offsets:
            selected_offsets = [tuple(o) for o in custom_offsets]
            custom_eval = font_manager.evaluate_word_with_custom_offsets(
                word, selected_fid, selected_offsets
            )
            for fs in font_eval["font_scores"]:
                if fs["id"] == selected_fid:
                    fs["score"] = custom_eval["score"]
                    fs["geometric_mean"] = custom_eval["geometric_mean"]
                    fs["min_pair_score"] = custom_eval["min_pair_score"]
                    fs["offsets"] = custom_eval["offsets"]
            if selected_fid == font_eval["best_font_id"]:
                font_eval["best_score"] = custom_eval["score"]

        selected_font_path = font_manager.get_font_path(selected_fid)

        slots = []
        half_len = (n + 1) // 2
        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            pair_idx = i if i < half_len else (n - 1 - i)
            shift = selected_offsets[pair_idx] if pair_idx < len(selected_offsets) else (0, 0)
            if i >= half_len:
                shift = (-shift[0], -shift[1])

            slot_img = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                stroke_thickness=stroke_thickness,
                diff_blend=diff_blend,
                pre_bold=pre_bold,
                font_path=selected_font_path,
                shift=shift,
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
                "pre_bold": pre_bold,
                "selected_font_id": selected_fid,
                "selected_font_name": selected_name,
                "selected_style": selected_meta.get("style", "") if selected_meta else "",
                "selected_offsets": selected_offsets,
                "best_font_id": font_eval["best_font_id"],
                "best_font_name": font_eval["best_font_name"],
                "font_scores": font_eval["font_scores"],
                "description": f"手法B: 骨格中心線平均化 (フォント: {selected_name})",
            },
        }
