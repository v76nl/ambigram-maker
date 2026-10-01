import base64
import io
from pathlib import Path
from typing import Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator

from .font_manager import font_manager

class MorphologyAmbigramEngine(BaseAmbigramGenerator):
    """
    手法A: 論理積 (AND) ＋ モルフォロジー膨張・平滑化 Engine
    正位置と180度回転文字のピクセル論理積 (AND) を『共通対称核』として抽出し、
    モルフォロジー膨張 (Dilation) と平滑化によって二重線を解消した滑らかな単一ストロークを生成する。
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

    def generate_slot(
        self,
        c1: str,
        c2: str,
        size: int = 512,
        dilation_size: int = 11,
        smoothness: int = 7,
        diff_blend: float = 0.35,
        font_path: Optional[Path] = None,
        shift: tuple[int, int] = (0, 0),
    ) -> np.ndarray:
        """
        1文字スロットの論理積＋モルフォロジー最適化
        - c1: 正位置の文字
        - c2: 180度反転位置の文字 (c2を180度回転して重ねる)
        - shift: 重心微小シフト (dx, dy)
        """
        img1 = self.render_glyph_bitmap(c1, size=size, font_path=font_path)
        img2 = self.render_glyph_bitmap(c2, size=size, font_path=font_path)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 最適重心シフトの適用 (128px空間の微小オフセットを高解像度にスケール)
        dx, dy = shift
        if dx != 0 or dy != 0:
            scale_factor = size / 128.0
            shift_x = int(round(dx * scale_factor))
            shift_y = int(round(dy * scale_factor))
            M = np.float32([[1, 0, shift_x], [0, 1, shift_y]])
            img2_rot = cv2.warpAffine(img2_rot, M, (size, size))

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
        font_id: str = "auto",
        **params,
    ) -> dict[str, Any]:
        """単語全体のアンビグラム画像を生成してBase64形式で返却"""
        n = len(word)
        if n == 0:
            return {"engine": "morphology", "type": "png", "data": "", "details": {}}

        # 全フォントの幾何スコアと最適シフトを評価
        font_eval = font_manager.evaluate_word_fonts(word)
        
        # 適用フォントの決定 (autoの場合は最高スコアフォント)
        if font_id and font_id != "auto":
            selected_fid = font_id
            selected_meta = next((f for f in font_eval["font_scores"] if f["id"] == font_id), None)
            selected_name = selected_meta["name"] if selected_meta else font_id
            selected_offsets = selected_meta["offsets"] if selected_meta else [(0, 0)] * n
        else:
            selected_fid = font_eval["best_font_id"]
            selected_name = font_eval["best_font_name"]
            best_meta = next((f for f in font_eval["font_scores"] if f["id"] == selected_fid), None)
            selected_offsets = best_meta["offsets"] if best_meta else [(0, 0)] * n

        selected_font_path = font_manager.get_font_path(selected_fid)

        slots = []
        half_len = (n + 1) // 2
        for i in range(n):
            c1 = word[i]
            c2 = word[n - 1 - i]
            # 対応する文字ペアの最適シフト
            pair_idx = i if i < half_len else (n - 1 - i)
            shift = selected_offsets[pair_idx] if pair_idx < len(selected_offsets) else (0, 0)
            if i >= half_len:
                # 反転側ではシフト方向を反転
                shift = (-shift[0], -shift[1])

            slot_img = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                dilation_size=dilation_size,
                smoothness=smoothness,
                diff_blend=diff_blend,
                font_path=selected_font_path,
                shift=shift,
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
                "selected_font_id": selected_fid,
                "selected_font_name": selected_name,
                "best_font_id": font_eval["best_font_id"],
                "best_font_name": font_eval["best_font_name"],
                "font_scores": font_eval["font_scores"],
                "description": f"手法A: 論理積＋モルフォロジー (フォント: {selected_name})",
            },
        }
