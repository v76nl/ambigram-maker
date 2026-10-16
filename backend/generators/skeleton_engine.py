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
        brush_style: str = "calligraphic",
        stroke_modulation: bool = True,
        enable_snap: bool = True,
        snap_strength: float = 0.75,
        return_intermediates: bool = False,
    ) -> np.ndarray | tuple[np.ndarray, dict[str, np.ndarray]]:
        """
        1文字スロットにおける平均骨格線の抽出と単一ストローク再描画
        - c1: 正位置の文字
        - c2: 180度反転位置の文字
        - stroke_thickness: 再描画するストロークの基準線幅 (px)
        - diff_blend: 異文字ペア時に固有ストローク骨格を残す重み
        - pre_bold: 事前太らせ量 (近接ストローク距離場の吸引力を強化)
        - shift: 重心微小シフト (dx, dy)
        - brush_style: 'calligraphic' (毛筆楕円ブラシ: 筆先角度135度) または 'uniform' (均一円形)
        - stroke_modulation: 井上・高橋(2020)§5に基づくストローク太さ変調 (共通部強調・固有部細線化)
        - enable_snap: 近接ストローク吸引・局所非剛体変形 (Skeleton Attraction & TPS Warping)
        - return_intermediates: 中間ステップ画像（バイカラー、距離場、骨格線等）を辞書で返すか
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

        # 中間ステップ3: 事前太らせ (Pre-Bold) で距離場の交差領域・吸引力を強化
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

        # 中間ステップ3: 調和平均距離場エネルギーマップ (uint8)
        step3_field = field_norm.copy()

        thresh_val = int(255 * threshold_ratio)
        _, field_bin = cv2.threshold(field_norm, thresh_val, 255, cv2.THRESH_BINARY)

        # 4. 平均骨格（スケルトン中心線）を抽出
        skeleton = self._morphological_skeleton(field_bin)

        # 中間ステップ4: 細線化スケルトン (uint8)
        step4_skeleton = skeleton.copy()

        # 5. 井上・高橋 (2020) §5 および野村 (2018) に基づくストローク太さ変調 & 筆文字描画
        base_radius = max(2, stroke_thickness // 2)
        canvas = np.zeros((size, size), dtype=np.uint8)

        if stroke_modulation or brush_style == "calligraphic":
            # 共通部分（論理積）の距離場による共通度スコア算出
            common_overlap = cv2.bitwise_and(img1, img2_rot)
            dist_common = cv2.distanceTransform(common_overlap, cv2.DIST_L2, 5)
            max_dc = dist_common.max()
            if max_dc > 0:
                dist_common /= max_dc

            # スケルトン画素の座標取得
            pts = np.argwhere(skeleton > 0)
            if pts.size > 0:
                # 8近傍カーネルで端点を検出 (近傍画素数 == 1)
                kernel_nbr = np.array([[1, 1, 1], [1, 0, 1], [1, 1, 1]], dtype=np.uint8)
                nbr_count = cv2.filter2D((skeleton > 0).astype(np.uint8), -1, kernel_nbr)

                for y, x in pts:
                    # 共通部分への近さ (0.0: 固有ストローク, 1.0: 共通核)
                    match_ratio = float(dist_common[y, x]) if max_dc > 0 else 0.5
                    
                    # 井上・高橋 式(10)(11): 共通部分は太く強調し、非共通部分は細くする
                    if stroke_modulation:
                        r = base_radius * (0.65 + 0.70 * match_ratio)
                    else:
                        r = base_radius

                    # 端点（ハライ・起筆）の筆圧減衰
                    is_endpoint = nbr_count[y, x] <= 1
                    if is_endpoint and stroke_modulation:
                        r *= 0.75

                    r_int = max(2, int(round(r)))

                    if brush_style == "calligraphic":
                        # 石亀ら(1997)・井上ら(2020): 筆先角度135度（-45度）の毛筆楕円ブラシ
                        ax_major = max(3, int(round(r_int * 1.5)))
                        ax_minor = max(2, int(round(r_int * 0.65)))
                        cv2.ellipse(canvas, (int(x), int(y)), (ax_major, ax_minor), -45, 0, 360, 255, -1)
                    else:
                        cv2.circle(canvas, (int(x), int(y)), r_int, 255, -1)
            stroked = canvas
        else:
            radius = max(3, stroke_thickness if stroke_thickness % 2 != 0 else stroke_thickness + 1)
            brush = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (radius, radius))
            stroked = cv2.dilate(skeleton, brush)

        # 6. 端点の丸めと滑らかな輪郭化
        blurred = cv2.GaussianBlur(stroked, (5, 5), 0)
        _, result = cv2.threshold(blurred, 110, 255, cv2.THRESH_BINARY)

        # 自己回転対称文字 (c1 == c2) の場合、180度自己回転との対称和をとることで微小なラスタライズ誤差を完全に解消
        if c1 == c2:
            result = cv2.bitwise_or(result, cv2.rotate(result, cv2.ROTATE_180))

        if return_intermediates:
            step7_render = result.copy()
            intermediates = {
                "step1": step1_overlay,
                "step2": step2_overlay,
                "step3": step3_overlay,
                "step4": step4_overlay,
                "step5": step3_field,
                "step6": step4_skeleton,
                "step7": step7_render,
            }
            return result, intermediates

        return result

    def generate(
        self,
        word: str,
        stroke_thickness: int = 15,
        diff_blend: float = 0.35,
        pre_bold: int = 4,
        slot_size: int = 512,
        font_id: str = "auto",
        brush_style: str = "calligraphic",
        stroke_modulation: bool = True,
        enable_snap: bool = True,
        snap_strength: float = 0.75,
        **params,
    ) -> dict[str, Any]:
        """単語全体の平均骨格アンビグラム画像を生成してBase64形式で返却"""
        n = len(word)
        if n == 0:
            return {"engine": "skeleton", "type": "png", "data": "", "details": {}}

        # paramsからの上書きチェック
        brush_style = params.get("brush_style", brush_style)
        stroke_modulation = params.get("stroke_modulation", stroke_modulation)
        enable_snap = params.get("enable_snap", enable_snap)
        snap_strength = float(params.get("snap_strength", snap_strength))
        if not enable_snap:
            snap_strength = 0.0

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

        slots = [None] * n
        slot_intermediates = [None] * n
        half_len = (n + 1) // 2
        for i in range(half_len):
            c1 = word[i]
            c2 = word[n - 1 - i]
            is_center = (i == n - 1 - i)
            shift = selected_offsets[i] if i < len(selected_offsets) else (0, 0)

            slot_img, inter = self.generate_slot(
                c1,
                c2,
                size=slot_size,
                stroke_thickness=stroke_thickness,
                diff_blend=diff_blend,
                pre_bold=pre_bold,
                font_path=selected_font_path,
                shift=shift,
                brush_style=brush_style,
                stroke_modulation=stroke_modulation,
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
        rgba = np.full((h, w, 4), 255, dtype=np.uint8)
        mask = padded_img > 0
        rgba[mask, 0] = 17  # #111111
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
                "title": "事前太らせ",
                "description": "楕円カーネル膨張によりストロークを太らせ、近接するストローク同士の間隙を縮小して結合準備",
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
                "title": "調和平均距離場 (Harmonic Mean Distance Field)",
                "description": "正位置の文字の輪郭からの距離 $d_1$ と、180度反転した文字の輪郭からの距離 $d_2$ を各画素で測定し、調和平均 $$H = \\frac{2 \\cdot d_1 \\cdot d_2}{d_1 + d_2}$$ を算出。どちらか一方でも文字の外周（距離0）に近いと値が0になり、両方の文字のストローク中心に同時に位置する画素だけが最大値（暖色）となります。",
                "image": array_to_png_data_uri(step5_img, color_mode="heatmap", add_padding=True),
            },
            {
                "step": 6,
                "title": "中心線細線化 (Morphological Thinning)",
                "description": "調和平均が一定基準以上の領域を二値化（白黒化）し、線の連続性を保ったまま外周から1ピクセルずつ均等に削り落とすことで、両文字のちょうど真ん中を通る幅1pxの中心線を抽出します。",
                "image": array_to_png_data_uri(step6_img, color_mode="black_on_white", add_padding=True),
            },
            {
                "step": 7,
                "title": "筆文字変調再描画",
                "description": "共通部の線幅変調・端点筆圧減衰を適用し、毛筆楕円ブラシで滑らかな輪郭を形成",
                "image": array_to_png_data_uri(step7_img, color_mode="black_on_white", add_padding=True),
            },
        ]

        return {
            "engine": "skeleton",
            "type": "png",
            "data": data_uri,
            "steps": steps,
            "details": {
                "word": word,
                "length": n,
                "stroke_thickness": stroke_thickness,
                "diff_blend": diff_blend,
                "pre_bold": pre_bold,
                "brush_style": brush_style,
                "stroke_modulation": stroke_modulation,
                "enable_snap": (snap_strength > 0.0),
                "snap_strength": snap_strength,
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
