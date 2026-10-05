from pathlib import Path
from typing import Any, Optional
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import cv2

FONTS_DIR = Path(__file__).parent.parent / "fonts"

FONT_PRESETS = {
    "zen_maru": {
        "id": "zen_maru",
        "name": "Zen Maru Gothic",
        "style": "丸ゴシック",
        "description": "曲線が滑らかで調和しやすい標準丸文字",
        "filename": "ZenMaruGothic-Medium.ttf",
    },
    "dela_gothic": {
        "id": "dela_gothic",
        "name": "Dela Gothic One",
        "style": "極太フラット",
        "description": "ストロークが極太で重なり面積が広く二重線が消えやすい",
        "filename": "DelaGothicOne-Regular.ttf",
    },
    "mplus": {
        "id": "mplus",
        "name": "M PLUS 1p Bold",
        "style": "幾何角ゴシック",
        "description": "直線的で垂直・水平の対称性が高い角ゴシック",
        "filename": "MPLUS1p-Bold.ttf",
    },
    "klee": {
        "id": "klee",
        "name": "Klee One",
        "style": "硬筆ペン字",
        "description": "手書き風のしなやかな筆致で有機的に融合する",
        "filename": "KleeOne-SemiBold.ttf",
    },
    "shippori": {
        "id": "shippori",
        "name": "Shippori Mincho",
        "style": "明朝体",
        "description": "太線と細線のコントラストが美しい優美な書体",
        "filename": "ShipporiMincho-Bold.ttf",
    },
}

def compute_word_cognitive_score(
    scores: list[float],
    word_len: int,
    is_common: bool = False,
) -> tuple[float, float, float]:
    """
    井上・高橋 (2020) §6.2「単語の可読性の評価」に基づく文脈認知補完スコア算出。
    - 単語を構成する他の文字の可読率が高いほど、1文字の低可読性（ボトルネック）が単語全体の可読性に
      及ぼす悪影響は大幅に減衰する（表5: 被験者の87.8%が単語として読めた実証）。
    - 幾何平均と単語長N、日常語フラグに応じてmin_scoreのペナルティ重みを適応的に減衰。
    """
    if not scores:
        return 0.0, 0.0, 0.0

    product = 1.0
    for s in scores:
        product *= max(0.01, float(s))
    geom_mean = product ** (1.0 / len(scores))
    min_score = min(scores)

    # 単語長Nに応じた文脈冗長度 (文字数が多いほど1文字の欠損を前後文脈で補完可能)
    context_power = (word_len - 1) / max(1, word_len) if word_len > 1 else 0.0
    
    # 常用語ではトップダウンの語彙親密度補完が働く (井上・高橋 2020 §6.2)
    common_factor = 1.25 if is_common else 1.0

    # ボトルネック最小値に対する重み:
    # 通常0.25から、幾何平均と文脈冗長度が高い場合に最大0.05まで適応的に減少
    reduction = (geom_mean ** 2) * context_power * common_factor
    w_min = 0.25 * max(0.20, 1.0 - reduction)
    w_geom = 1.0 - w_min

    base_score = w_geom * geom_mean + w_min * min_score
    bias = 1.10 if is_common else 1.0
    final_score = min(1.0, base_score * bias)

    return round(float(final_score), 4), round(float(geom_mean), 4), round(float(min_score), 4)

class FontManager:
    """複数フォントの管理・レンダリング・幾何最適化判定を行うマネージャー"""
    def __init__(self, fonts_dir: Path = FONTS_DIR):
        self.fonts_dir = fonts_dir
        self.font_paths: dict[str, Path] = {}
        for fid, meta in FONT_PRESETS.items():
            path = fonts_dir / meta["filename"]
            if path.exists():
                self.font_paths[fid] = path
            else:
                # フォールバック
                fallback = fonts_dir / "ZenMaruGothic-Medium.ttf"
                self.font_paths[fid] = fallback if fallback.exists() else path

        # レンダリングキャッシュ: (char, font_id, size, bold) -> np.ndarray
        self._char_cache: dict[tuple[str, str, int, bool], np.ndarray] = {}
        # 骨格（スケルトン）キャッシュ: (char, font_id, size) -> np.ndarray
        self._skel_cache: dict[tuple[str, str, int], np.ndarray] = {}

    def get_font_path(self, font_id: Optional[str] = None) -> Path:
        """指定されたフォントIDのファイルパスを取得（デフォルト: zen_maru）"""
        if font_id and font_id in self.font_paths:
            return self.font_paths[font_id]
        return self.font_paths.get("zen_maru", self.fonts_dir / "ZenMaruGothic-Medium.ttf")

    def get_available_fonts(self) -> list[dict[str, Any]]:
        """利用可能なフォントプリセットの一覧を取得"""
        return list(FONT_PRESETS.values())

    def _extract_skeleton(self, binary_img: np.ndarray) -> np.ndarray:
        """2値画像から1pxの細線化スケルトンを抽出"""
        u8 = (binary_img * 255).astype(np.uint8)
        try:
            return (cv2.ximgproc.thinning(u8) > 0).astype(np.float32)
        except Exception:
            element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
            temp = u8.copy()
            skel = np.zeros_like(temp)
            while True:
                eroded = cv2.erode(temp, element)
                opened = cv2.morphologyEx(eroded, cv2.MORPH_OPEN, element)
                subset = cv2.subtract(eroded, opened)
                skel = cv2.bitwise_or(skel, subset)
                temp = eroded.copy()
                if cv2.countNonZero(temp) == 0:
                    break
            return (skel > 0).astype(np.float32)

    def render_char_skeleton(
        self,
        char: str,
        font_id: str,
        size: int = 128,
    ) -> np.ndarray:
        """指定文字・指定フォントの細線化スケルトン（1px中心線）を取得（キャッシュ付き）"""
        cache_key = (char, font_id, size)
        if cache_key in self._skel_cache:
            return self._skel_cache[cache_key]

        raw = self.render_char_matrix(char, font_id, size, bold=False)
        skel = self._extract_skeleton(raw)
        self._skel_cache[cache_key] = skel
        return skel

    def render_char_matrix(
        self,
        char: str,
        font_id: str,
        size: int = 128,
        bold: bool = True,
    ) -> np.ndarray:
        """
        指定文字・指定フォントの2値配列（0 or 1）を取得（キャッシュ付き）。
        適応的 Pre-Bold（太らせ制御）:
        - Dela Gothic や黒画素率の高い極太文字は、文字内のスリット（ふところ）の黒潰れを防ぐため膨張をスキップ。
        - 通常フォントは適度な膨張 (3x3 楕円カーネル) で画線の微小ズレを許容。
        """
        cache_key = (char, font_id, size, bold)
        if cache_key in self._char_cache:
            return self._char_cache[cache_key]

        path = self.get_font_path(font_id)
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

        # 案A: 適応的太らせ判定
        # 生の黒画素密度
        raw_binary = (u8 > 90).astype(np.uint8)
        density = float(np.mean(raw_binary))

        # dela_gothic または黒画素率が 26% 以上の高密度文字は膨張をスキップ（内部空隙を保護）
        if bold and font_id != "dela_gothic" and density <= 0.26:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            u8 = cv2.dilate(u8, kernel, iterations=1)

        binary = (u8 > 90).astype(np.float32)
        self._char_cache[cache_key] = binary
        return binary

    def calculate_pair_similarity_for_offset(
        self,
        img_a: np.ndarray,
        img_b: np.ndarray,
        dx: int,
        dy: int,
        skel_a: Optional[np.ndarray] = None,
        skel_b: Optional[np.ndarray] = None,
        dil_skel_a: Optional[np.ndarray] = None,
        dil_skel_b_rot: Optional[np.ndarray] = None,
    ) -> float:
        """
        指定された特定の座標オフセット (dx, dy) での総合幾何類似度を計算。
        4つの柱（適応太らせ、偶然重なり補正、骨格スケルトン、負の空間/ふところ一致）を統合。
        """
        img_b_rot = np.rot90(img_b, 2)
        h, w = img_a.shape

        area_a = np.sum(img_a)
        area_b = np.sum(img_b_rot)
        if area_a == 0 or area_b == 0:
            return 0.0

        shifted_b = np.zeros_like(img_b_rot)
        src_y_start = max(0, -dy)
        src_y_end = min(h, h - dy)
        dst_y_start = max(0, dy)
        dst_y_end = min(h, h + dy)

        src_x_start = max(0, -dx)
        src_x_end = min(w, w - dx)
        dst_x_start = max(0, dx)
        dst_x_end = min(w, w + dx)

        if not (src_y_start < src_y_end and src_x_start < src_x_end and dst_y_start < dst_y_end and dst_x_start < dst_x_end):
            return 0.0

        shifted_b[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
            img_b_rot[src_y_start:src_y_end, src_x_start:src_x_end]

        # 1. 黒画素の交差 & 偶然重なり期待値補正 (Chance-Adjusted IoU)
        intersection = np.sum(img_a * shifted_b)
        if intersection == 0:
            return 0.0

        union_mask = np.clip(img_a + shifted_b, 0, 1)
        union_black = np.sum(union_mask)
        raw_iou = intersection / union_black if union_black > 0 else 0.0

        cov_a = intersection / area_a
        cov_b = intersection / area_b
        harmonic_cov = (2.0 * cov_a * cov_b) / (cov_a + cov_b + 1e-6)

        # 文字ROI内での偶然重なり確率
        pts = np.argwhere(union_mask > 0)
        if pts.size == 0:
            return 0.0
        ymin = int(pts[:, 0].min())
        xmin = int(pts[:, 1].min())
        ymax = int(pts[:, 0].max())
        xmax = int(pts[:, 1].max())
        roi_area = max(1, (ymax - ymin + 1) * (xmax - xmin + 1))

        p_a = area_a / roi_area
        p_b = area_b / roi_area
        e_iou = (p_a * p_b) / (p_a + p_b - p_a * p_b + 1e-6)
        adj_iou = max(0.0, (raw_iou - e_iou) / (1.0 - e_iou + 1e-6))
        area_score = float(0.50 * adj_iou + 0.50 * harmonic_cov)

        # 2. 骨格構造（細線化スケルトン）の一致度
        kernel_skel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        if skel_a is None:
            skel_a = self._extract_skeleton(img_a)
        if skel_b is None:
            skel_b = self._extract_skeleton(img_b)

        if dil_skel_a is None:
            dil_skel_a = cv2.dilate(skel_a, kernel_skel)

        skel_b_rot = np.rot90(skel_b, 2)
        if dil_skel_b_rot is None:
            dil_skel_b_rot = cv2.dilate(skel_b_rot, kernel_skel)

        shifted_skel_b = np.zeros_like(skel_b_rot)
        shifted_dil_b = np.zeros_like(dil_skel_b_rot)
        shifted_skel_b[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
            skel_b_rot[src_y_start:src_y_end, src_x_start:src_x_end]
        shifted_dil_b[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
            dil_skel_b_rot[src_y_start:src_y_end, src_x_start:src_x_end]

        sum_skel_a = np.sum(skel_a)
        sum_skel_b = np.sum(shifted_skel_b)
        if sum_skel_a > 0 and sum_skel_b > 0:
            skel_cov_a = np.sum(skel_a * shifted_dil_b) / sum_skel_a
            skel_cov_b = np.sum(shifted_skel_b * dil_skel_a) / sum_skel_b
            skel_score = float(2.0 * skel_cov_a * skel_cov_b / (skel_cov_a + skel_cov_b + 1e-6))
        else:
            skel_score = 0.0

        # 3. 負の空間（Negative Space・ふところ・開口部）の整合性
        roi_a_white = 1.0 - img_a[ymin:ymax+1, xmin:xmax+1]
        roi_b_white = 1.0 - shifted_b[ymin:ymax+1, xmin:xmax+1]
        inter_white = np.sum(roi_a_white * roi_b_white)
        union_white = np.sum(np.clip(roi_a_white + roi_b_white, 0, 1))
        neg_space_score = float(inter_white / union_white) if union_white > 0 else 1.0

        # 総合ブレンド（面積: 45%, 骨格: 35%, 負の空間: 20%）
        total_score = float(0.45 * area_score + 0.35 * skel_score + 0.20 * neg_space_score)
        return float(np.clip(total_score, 0.0, 1.0))

    def calculate_pair_similarity_with_shift(
        self,
        img_a: np.ndarray,
        img_b: np.ndarray,
        max_shift: int = 5,
        skel_a: Optional[np.ndarray] = None,
        skel_b: Optional[np.ndarray] = None,
    ) -> tuple[float, tuple[int, int]]:
        """
        正位置Aと180度反転Bの幾何類似度を計算。
        座標揺らし探索 (-max_shift <= dx, dy <= max_shift) を行い、
        最も一致率が高くなる座標オフセットと最高スコアを採用する。
        """
        best_score = 0.0
        best_offset = (0, 0)

        # 骨格スケルトンの事前準備
        kernel_skel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        if skel_a is None:
            skel_a = self._extract_skeleton(img_a)
        if skel_b is None:
            skel_b = self._extract_skeleton(img_b)

        dil_skel_a = cv2.dilate(skel_a, kernel_skel)
        skel_b_rot = np.rot90(skel_b, 2)
        dil_skel_b_rot = cv2.dilate(skel_b_rot, kernel_skel)

        # 座標揺らし探索 (計 (2*max_shift+1)^2 点を探索)
        shifts = range(-max_shift, max_shift + 1, 1)

        for dy in shifts:
            for dx in shifts:
                score = self.calculate_pair_similarity_for_offset(
                    img_a,
                    img_b,
                    dx,
                    dy,
                    skel_a=skel_a,
                    skel_b=skel_b,
                    dil_skel_a=dil_skel_a,
                    dil_skel_b_rot=dil_skel_b_rot,
                )
                if score > best_score:
                    best_score = score
                    best_offset = (dx, dy)

        return best_score, best_offset

    def evaluate_word_with_custom_offsets(
        self,
        word: str,
        font_id: str,
        custom_offsets: list[tuple[int, int]],
    ) -> dict[str, Any]:
        """指定単語・指定フォントに対し、カスタムオフセットでの一致率スコアを計算"""
        n = len(word)
        if n < 1:
            return {"score": 0.0, "geometric_mean": 0.0, "min_pair_score": 0.0, "pair_scores": [], "offsets": []}

        fid = font_id if (font_id and font_id != "auto") else "zen_maru"
        half_len = (n + 1) // 2
        pair_scores = []
        normalized_offsets = []

        for i in range(half_len):
            c1 = word[i]
            c2 = word[n - 1 - i]
            is_center = (i == n - 1 - i)
            img_a = self.render_char_matrix(c1, fid)
            img_b = self.render_char_matrix(c2, fid)
            skel_a = self.render_char_skeleton(c1, fid)
            skel_b = self.render_char_skeleton(c2, fid)
            offset = (0, 0) if is_center else (custom_offsets[i] if i < len(custom_offsets) else (0, 0))
            normalized_offsets.append(offset)
            score = self.calculate_pair_similarity_for_offset(
                img_a, img_b, offset[0], offset[1], skel_a=skel_a, skel_b=skel_b
            )
            pair_scores.append(round(float(score), 4))

        # 井上・高橋 (2020) §6.2 文脈認知補完モデルによる単語総合スコア算出
        total_score, geom_mean, min_score = compute_word_cognitive_score(
            pair_scores, word_len=n, is_common=False
        )

        return {
            "font_id": fid,
            "score": total_score,
            "geometric_mean": geom_mean,
            "min_pair_score": min_score,
            "pair_scores": pair_scores,
            "offsets": normalized_offsets,
        }

    def evaluate_word_fonts(self, word: str, is_common: bool = False) -> dict[str, Any]:
        """
        指定単語に対し、全フォント候補の幾何一致度スコアと最適オフセットを算出。
        最もスコアが高いフォントを自動決定する。
        """
        n = len(word)
        if n < 1:
            return {"best_font_id": "zen_maru", "best_font_name": "Zen Maru Gothic", "font_scores": []}

        half_len = (n + 1) // 2
        font_evaluations = []

        for fid, meta in FONT_PRESETS.items():
            pair_scores = []
            offsets = []

            for i in range(half_len):
                c1 = word[i]
                c2 = word[n - 1 - i]
                is_center = (i == n - 1 - i)
                img_a = self.render_char_matrix(c1, fid)
                img_b = self.render_char_matrix(c2, fid)
                skel_a = self.render_char_skeleton(c1, fid)
                skel_b = self.render_char_skeleton(c2, fid)
                if is_center:
                    # 自己回転対称文字は自己中心回転を保つためシフトを(0,0)に固定
                    score = self.calculate_pair_similarity_for_offset(
                        img_a, img_b, 0, 0, skel_a=skel_a, skel_b=skel_b
                    )
                    offset = (0, 0)
                else:
                    score, offset = self.calculate_pair_similarity_with_shift(
                        img_a, img_b, skel_a=skel_a, skel_b=skel_b
                    )
                pair_scores.append(score)
                offsets.append(offset)

            # 井上・高橋 (2020) §6.2 文脈認知補完モデルによる単語総合スコア算出
            total_score, geom_mean, min_score = compute_word_cognitive_score(
                pair_scores, word_len=n, is_common=is_common
            )

            font_evaluations.append({
                "id": fid,
                "name": meta["name"],
                "style": meta["style"],
                "description": meta["description"],
                "score": total_score,
                "geometric_mean": geom_mean,
                "min_pair_score": min_score,
                "offsets": offsets,
            })

        # スコア降順ソート
        font_evaluations.sort(key=lambda x: x["score"], reverse=True)
        best = font_evaluations[0]

        import logging
        logger = logging.getLogger("ambigram")
        logger.info(
            f"  [フォント幾何評価] 単語='{word}': 最適={best['name']} ({best['score']:.1%}) "
            f"シフト={best['offsets']} | 他候補: " +
            ", ".join([f"{f['name']}({f['score']:.1%})" for f in font_evaluations[1:]])
        )

        return {
            "best_font_id": best["id"],
            "best_font_name": best["name"],
            "best_font_style": best["style"],
            "best_score": best["score"],
            "font_scores": font_evaluations,
        }

# シングルトンインスタンス
font_manager = FontManager()
