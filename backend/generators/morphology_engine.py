import base64
import io
from pathlib import Path
from typing import Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator
from .font_manager import font_manager
from .snap_warper import snap_warper

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
        pre_bold: int = 4,
        font_path: Optional[Path] = None,
        shift: tuple[int, int] = (0, 0),
        enable_snap: bool = True,
    ) -> np.ndarray:
        """
        1文字スロットの論理積＋モルフォロジー最適化
        - c1: 正位置の文字
        - c2: 180度反転位置の文字 (c2を180度回転して重ねる)
        - pre_bold: 事前太らせ量 (水平異方性膨張により「の」の中央縦棒等の近接ストロークを確実に結合)
        - shift: 座標揺らし探索で得られた最適オフセット (dx, dy)
        - enable_snap: 近接ストローク吸引・局所非剛体変形 (Skeleton Attraction & TPS Warping)
        """
        img1 = self.render_glyph_bitmap(c1, size=size, font_path=font_path)
        img2 = self.render_glyph_bitmap(c2, size=size, font_path=font_path)
        img2_rot = cv2.rotate(img2, cv2.ROTATE_180)

        # 自己回転対称文字 (c1 == c2) の場合は中心対称性を保つためシフトを強制ゼロ化
        if c1 == c2:
            shift = (0, 0)

        # 最適重心シフトの対称配分 (中心原点を基準に img1 に -s/2, img2_rot に +s/2)
        dx, dy = shift
        if dx != 0 or dy != 0:
            scale_factor = size / 128.0
            shift_x = dx * scale_factor
            shift_y = dy * scale_factor
            M1 = np.float32([[1, 0, -shift_x / 2.0], [0, 1, -shift_y / 2.0]])
            M2 = np.float32([[1, 0, shift_x / 2.0], [0, 1, shift_y / 2.0]])
            img1 = cv2.warpAffine(img1, M1, (size, size))
            img2_rot = cv2.warpAffine(img2_rot, M2, (size, size))

        # ② フォントを太らせて（Pre-Dilation）判定・共通核を強化
        # 水平方向を優先した異方性カーネルにより、左右に離れやすい縦棒同士を確実に接触・合体させる
        if pre_bold > 0:
            kw = pre_bold * 2 + 1
            kh = max(3, (pre_bold * 2 + 1) // 2 * 2 + 1)
            pre_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kw, kh))
            p_img1 = cv2.dilate(img1, pre_kernel)
            p_img2_rot = cv2.dilate(img2_rot, pre_kernel)
        else:
            p_img1 = img1
            p_img2_rot = img2_rot

        # ③ 近接ストローク吸引・局所非剛体変形 (Skeleton Attraction & TPS Warping)
        if enable_snap:
            p_img1, p_img2_rot, _ = snap_warper.snap_and_warp(
                p_img1, p_img2_rot, max_distance=24, snap_strength=0.5
            )

        # 1. 論理積 (AND): 太らせた文字同士の交差領域を抽出
        intersection = cv2.bitwise_and(p_img1, p_img2_rot)

        # 2. 差分抽出 (異文字ペアの固有識別ストローク)
        diff1 = cv2.subtract(img1, img2_rot)
        diff2 = cv2.subtract(img2_rot, img1)

        # 同文字ペア (こ-こ, の等) では純粋なANDを重視し、異文字ペアでは固有パーツを適応ブレンド
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

        # 自己回転対称文字 (c1 == c2) の場合、180度自己回転との対称和をとることで微小なラスタライズ誤差を完全に解消
        if c1 == c2:
            opened = cv2.bitwise_or(opened, cv2.rotate(opened, cv2.ROTATE_180))

        return opened

    def generate(
        self,
        word: str,
        dilation_size: int = 11,
        smoothness: int = 7,
        diff_blend: float = 0.35,
        pre_bold: int = 4,
        slot_size: int = 512,
        font_id: str = "auto",
        enable_snap: bool = True,
        **params,
    ) -> dict[str, Any]:
        """単語全体のアンビグラム画像を生成してBase64形式で返却"""
        n = len(word)
        if n == 0:
            return {"engine": "morphology", "type": "png", "data": "", "details": {}}

        enable_snap = params.get("enable_snap", enable_snap)

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

        slots = [None] * n
        half_len = (n + 1) // 2
        for i in range(half_len):
            c1 = word[i]
            c2 = word[n - 1 - i]
            is_center = (i == n - 1 - i)
            shift = (0, 0) if is_center else (selected_offsets[i] if i < len(selected_offsets) else (0, 0))

            slot_img = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                dilation_size=dilation_size,
                smoothness=smoothness,
                diff_blend=diff_blend,
                pre_bold=pre_bold,
                font_path=selected_font_path,
                shift=shift,
                enable_snap=enable_snap,
            )
            slots[i] = slot_img
            if not is_center:
                # 自己回転対称性の厳密保証: 後半スロットは対応する前半スロットの180度回転画像
                slots[n - 1 - i] = cv2.rotate(slot_img, cv2.ROTATE_180)

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
                "pre_bold": pre_bold,
                "enable_snap": enable_snap,
                "selected_font_id": selected_fid,
                "selected_font_name": selected_name,
                "selected_style": selected_meta.get("style", "") if selected_meta else "",
                "selected_offsets": selected_offsets,
                "best_font_id": font_eval["best_font_id"],
                "best_font_name": font_eval["best_font_name"],
                "font_scores": font_eval["font_scores"],
                "description": f"手法A: 論理積＋モルフォロジー (フォント: {selected_name})",
            },
        }
