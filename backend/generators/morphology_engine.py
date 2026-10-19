import base64
import io
from pathlib import Path
from typing import Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .base import BaseAmbigramGenerator, array_to_png_data_uri, make_bicolor_overlay
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
        u8 = np.array(img, dtype=np.uint8)

        # 実インク（非ゼロ画素）のバウンディングボックス中心による精密幾何中央揃え
        # 「一」などの特殊アスペクト比グリフで上下にズレて回転対称性が崩れるのを防止
        y_idx, x_idx = np.where(u8 > 30)
        if len(y_idx) > 0:
            cy = (y_idx.min() + y_idx.max()) / 2.0
            cx = (x_idx.min() + x_idx.max()) / 2.0
            shift_x = int(round(size / 2.0 - cx))
            shift_y = int(round(size / 2.0 - cy))
            if shift_x != 0 or shift_y != 0:
                M = np.float32([[1, 0, shift_x], [0, 1, shift_y]])
                u8 = cv2.warpAffine(u8, M, (size, size))

        return u8

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
        snap_strength: float = 0.75,
        return_intermediates: bool = False,
    ) -> np.ndarray | tuple[np.ndarray, dict[str, np.ndarray]]:
        """
        1文字スロットの論理積＋モルフォロジー最適化
        - c1: 正位置の文字
        - c2: 180度反転位置の文字 (c2を180度回転して重ねる)
        - pre_bold: 事前太らせ量 (水平異方性膨張により「の」の中央縦棒等の近接ストロークを確実に結合)
        - shift: 座標揺らし探索で得られた最適オフセット (dx, dy)
        - enable_snap: 近接ストローク吸引・局所非剛体変形 (Skeleton Attraction & TPS Warping)
        - return_intermediates: 中間ステップ画像（バイカラー、AND核、ブレンド等）を辞書で返すか
        """
        img1_orig = self.render_glyph_bitmap(c1, size=size, font_path=font_path)
        img2_orig = self.render_glyph_bitmap(c2, size=size, font_path=font_path)
        img2_rot_orig = cv2.rotate(img2_orig, cv2.ROTATE_180)

        # 中間ステップ1: 正反初期配置 (バイカラー)
        step1_overlay = make_bicolor_overlay(img1_orig, img2_rot_orig)

        # 最適重心シフトの対称配分 (中心原点を基準に img1 に -s/2, img2_rot に +s/2)
        dx, dy = shift
        if dx != 0 or dy != 0:
            scale_factor = size / 128.0
            shift_x = dx * scale_factor
            shift_y = dy * scale_factor
            M1 = np.float32([[1, 0, -shift_x / 2.0], [0, 1, -shift_y / 2.0]])
            M2 = np.float32([[1, 0, shift_x / 2.0], [0, 1, shift_y / 2.0]])
            img1 = cv2.warpAffine(img1_orig, M1, (size, size))
            img2_rot = cv2.warpAffine(img2_rot_orig, M2, (size, size))
        else:
            img1 = img1_orig.copy()
            img2_rot = img2_rot_orig.copy()

        # 中間ステップ2: 最適重心シフト適用後 (バイカラー)
        step2_overlay = make_bicolor_overlay(img1, img2_rot)

        # 中間ステップ3: 異方性事前太らせ (Pre-Dilation)
        if pre_bold > 0:
            kw = pre_bold * 2 + 1
            kh = max(3, (pre_bold * 2 + 1) // 2 * 2 + 1)
            pre_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kw, kh))
            p_img1_pre = cv2.dilate(img1, pre_kernel)
            p_img2_rot_pre = cv2.dilate(img2_rot, pre_kernel)
        else:
            p_img1_pre = img1.copy()
            p_img2_rot_pre = img2_rot.copy()

        step3_overlay = make_bicolor_overlay(p_img1_pre, p_img2_rot_pre)

        # 中間ステップ4: 近接ストローク吸引・局所非剛体変形 (Skeleton Attraction & TPS Warping)
        if enable_snap and snap_strength > 0.0:
            p_img1, p_img2_rot, _ = snap_warper.snap_and_warp(
                p_img1_pre,
                p_img2_rot_pre,
                guide_img1=img1,
                guide_img2=img2_rot,
                max_distance=40,
                snap_strength=snap_strength,
            )
        else:
            p_img1 = p_img1_pre
            p_img2_rot = p_img2_rot_pre

        step4_overlay = make_bicolor_overlay(p_img1, p_img2_rot)

        # 中間ステップ5: 論理積 (AND) 共通核
        intersection = cv2.bitwise_and(p_img1, p_img2_rot)
        step5_and = intersection.copy()

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

        # 中間ステップ6: 固有差分ブレンド
        step6_blend = base_img.copy()

        # 中間ステップ7: モルフォロジー膨張 (Dilation) でフォントの太さを復元
        ksize = max(3, dilation_size if dilation_size % 2 != 0 else dilation_size + 1)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ksize, ksize))
        dilated = cv2.dilate(base_img, kernel)
        step7_dilated = dilated.copy()

        # 中間ステップ8: ガウシアン平滑化と二値化で滑らかな輪郭を生成
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

        if return_intermediates:
            step8_final = opened.copy()
            intermediates = {
                "step1": step1_overlay,
                "step2": step2_overlay,
                "step3": step3_overlay,
                "step4": step4_overlay,
                "step5": step5_and,
                "step6": step6_blend,
                "step7": step7_dilated,
                "step8": step8_final,
            }
            return opened, intermediates

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
        snap_strength: float = 0.75,
        cancel_event: Any = None,
        **params,
    ) -> dict[str, Any]:
        """単語全体のアンビグラム画像を生成してBase64形式で返却"""
        if cancel_event and cancel_event.is_set():
            return {"engine": "morphology", "type": "png", "data": "", "cancelled": True, "details": {}}

        n = len(word)
        if n == 0:
            return {"engine": "morphology", "type": "png", "data": "", "details": {}}

        enable_snap = params.get("enable_snap", enable_snap)
        snap_strength = float(params.get("snap_strength", snap_strength))
        if not enable_snap:
            snap_strength = 0.0

        # 適用フォントの決定および幾何評価 (font_id指定時は単一フォントのみ高速評価)
        if font_id and font_id != "auto":
            font_eval = font_manager.evaluate_single_font(word, font_id)
            selected_fid = font_id
            selected_meta = font_eval["font_scores"][0] if font_eval["font_scores"] else None
            selected_name = font_eval["best_font_name"]
            selected_offsets = selected_meta["offsets"] if selected_meta else [(0, 0)] * n
        else:
            font_eval = font_manager.evaluate_word_fonts(word)
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
        slot_intermediates = [None] * n
        half_len = (n + 1) // 2
        for i in range(half_len):
            if cancel_event and cancel_event.is_set():
                return {"engine": "morphology", "type": "png", "data": "", "cancelled": True, "details": {}}
            c1 = word[i]
            c2 = word[n - 1 - i]
            is_center = (i == n - 1 - i)
            shift = selected_offsets[i] if i < len(selected_offsets) else (0, 0)

            slot_img, inter = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                dilation_size=dilation_size,
                smoothness=smoothness,
                diff_blend=diff_blend,
                pre_bold=pre_bold,
                font_path=selected_font_path,
                shift=shift,
                enable_snap=(snap_strength > 0.0),
                snap_strength=snap_strength,
                return_intermediates=True,
            )
            slots[i] = slot_img
            slot_intermediates[i] = inter
            if not is_center:
                # 自己回転対称性の厳密保証: 後半スロットは対応する前半スロットの180度回転画像
                slots[n - 1 - i] = cv2.rotate(slot_img, cv2.ROTATE_180)
                slot_intermediates[n - 1 - i] = {
                    k: cv2.rotate(v, cv2.ROTATE_180) for k, v in inter.items()
                }

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
        rgba = np.full((h, w, 4), 255, dtype=np.uint8)
        mask = padded_img > 0
        rgba[mask, 0] = 17  # #111111 (ダークグレー/黒)
        rgba[mask, 1] = 17
        rgba[mask, 2] = 17
        rgba[mask, 3] = 255

        pil_img = Image.fromarray(rgba, mode="RGBA")
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        # 中間ステップのフル画像結合とData URI生成
        step1_img = np.hstack([s["step1"] for s in slot_intermediates])
        step2_img = np.hstack([s["step2"] for s in slot_intermediates])
        step3_img = np.hstack([s["step3"] for s in slot_intermediates])
        step4_img = np.hstack([s["step4"] for s in slot_intermediates])
        step5_img = np.hstack([s["step5"] for s in slot_intermediates])
        step6_img = np.hstack([s["step6"] for s in slot_intermediates])
        step7_img = np.hstack([s["step7"] for s in slot_intermediates])
        step8_img = np.hstack([s["step8"] for s in slot_intermediates])

        steps = [
            {
                "step": 1,
                "title": "正反配置",
                "description": "正位置(青)と180度反転(赤)のグリフを中心位置に初期配置",
                "image": array_to_png_data_uri(step1_img, color_mode="raw", add_padding=True),
            },
            {
                "step": 2,
                "title": "最適シフト",
                "description": "幾何学的重なりを最大化する相対重心オフセットを精密に対称配分",
                "image": array_to_png_data_uri(step2_img, color_mode="raw", add_padding=True),
            },
            {
                "step": 3,
                "title": "異方性事前太らせ",
                "description": "水平楕円膨張で近接縦棒を太らせ、ストローク同士の間隙を縮小して結合準備",
                "image": array_to_png_data_uri(step3_img, color_mode="raw", add_padding=True),
            },
            {
                "step": 4,
                "title": "Thin Plate Spline (薄板スプライン非剛体変形)",
                "description": "薄板の弾性曲げエネルギー最小化モデル(Thin Plate Spline)により、文字輪郭を崩さず近接するストローク同士を中心対称軸へ滑らかに引き寄せて一体化",
                "image": array_to_png_data_uri(step4_img, color_mode="raw", add_padding=True),
            },
            {
                "step": 5,
                "title": "論理積共通核抽出",
                "description": "太らせた2文字のピクセル論理積を計算し、180度自己回転で不変な中心核を抽出",
                "image": array_to_png_data_uri(step5_img, color_mode="black_on_white", add_padding=True),
            },
            {
                "step": 6,
                "title": "固有差分ストローク適応ブレンド",
                "description": "各文字固有の差分ストロークパーツを適応比率で共通核に融合",
                "image": array_to_png_data_uri(step6_img, color_mode="black_on_white", add_padding=True),
            },
            {
                "step": 7,
                "title": "モルフォロジー膨張",
                "description": "楕円カーネル膨張によりフォント本来の肉厚なストローク太さを復元",
                "image": array_to_png_data_uri(step7_img, color_mode="black_on_white", add_padding=True),
            },
            {
                "step": 8,
                "title": "ガウシアン平滑化・輪郭確定",
                "description": "ガウシアンフィルタと適応二値化により、ジャギーのない滑らかな輪郭を生成",
                "image": array_to_png_data_uri(step8_img, color_mode="black_on_white", add_padding=True),
            },
        ]

        return {
            "engine": "morphology",
            "type": "png",
            "data": data_uri,
            "steps": steps,
            "details": {
                "word": word,
                "length": n,
                "dilation_size": dilation_size,
                "smoothness": smoothness,
                "diff_blend": diff_blend,
                "pre_bold": pre_bold,
                "enable_snap": (snap_strength > 0.0),
                "snap_strength": snap_strength,
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
