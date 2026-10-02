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

    def get_font_path(self, font_id: Optional[str] = None) -> Path:
        """指定されたフォントIDのファイルパスを取得（デフォルト: zen_maru）"""
        if font_id and font_id in self.font_paths:
            return self.font_paths[font_id]
        return self.font_paths.get("zen_maru", self.fonts_dir / "ZenMaruGothic-Medium.ttf")

    def get_available_fonts(self) -> list[dict[str, Any]]:
        """利用可能なフォントプリセットの一覧を取得"""
        return list(FONT_PRESETS.values())

    def render_char_matrix(
        self,
        char: str,
        font_id: str,
        size: int = 128,
        bold: bool = True,
    ) -> np.ndarray:
        """
        指定文字・指定フォントの2値配列（0 or 1）を取得（キャッシュ付き）。
        bold=True の場合、フォントを適度に太らせて（水平方向優先膨張）判定を強化し、
        「の」の中央縦棒のような近接ストロークの重なり判定精度を高める。
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

        if bold:
            # 水平方向をやや優先した膨張カーネル (3x3 または 5x3) でストロークを太らせる
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 3))
            u8 = cv2.dilate(u8, kernel, iterations=1)

        binary = (u8 > 90).astype(np.float32)
        self._char_cache[cache_key] = binary
        return binary

    def calculate_pair_similarity_with_shift(
        self,
        img_a: np.ndarray,
        img_b: np.ndarray,
        max_shift: int = 5,
    ) -> tuple[float, tuple[int, int]]:
        """
        正位置Aと180度反転Bの幾何類似度（調和平均IoU）を計算。
        座標揺らし探索 (-max_shift <= dx, dy <= max_shift) を行い、
        最も一致率が高くなる座標オフセットと最高スコアを採用する。
        """
        img_b_rot = np.rot90(img_b, 2)
        h, w = img_a.shape

        area_a = np.sum(img_a)
        area_b = np.sum(img_b_rot)
        if area_a == 0 or area_b == 0:
            return 0.0, (0, 0)

        best_score = 0.0
        best_offset = (0, 0)

        # 座標揺らし探索 (計 (2*max_shift+1)^2 点を全数探索)
        shifts = range(-max_shift, max_shift + 1, 1)

        for dy in shifts:
            for dx in shifts:
                shifted_b = np.zeros_like(img_b_rot)
                
                src_y_start = max(0, -dy)
                src_y_end = min(h, h - dy)
                dst_y_start = max(0, dy)
                dst_y_end = min(h, h + dy)

                src_x_start = max(0, -dx)
                src_x_end = min(w, w - dx)
                dst_x_start = max(0, dx)
                dst_x_end = min(w, w + dx)

                shifted_b[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
                    img_b_rot[src_y_start:src_y_end, src_x_start:src_x_end]

                intersection = np.sum(img_a * shifted_b)
                if intersection == 0:
                    continue

                cov_a = intersection / area_a
                cov_b = intersection / area_b
                harmonic_cov = (2.0 * cov_a * cov_b) / (cov_a + cov_b + 1e-6)

                union = np.sum(np.clip(img_a + shifted_b, 0, 1))
                iou = intersection / union if union > 0 else 0.0

                score = float(0.35 * iou + 0.65 * harmonic_cov)
                if score > best_score:
                    best_score = score
                    best_offset = (dx, dy)

        return best_score, best_offset

    def evaluate_word_fonts(self, word: str) -> dict[str, Any]:
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
                img_a = self.render_char_matrix(c1, fid)
                img_b = self.render_char_matrix(c2, fid)
                score, offset = self.calculate_pair_similarity_with_shift(img_a, img_b)
                pair_scores.append(score)
                offsets.append(offset)

            # 幾何平均スコアとボトルネック最小値
            product = 1.0
            for s in pair_scores:
                product *= max(0.01, s)
            geom_mean = product ** (1.0 / len(pair_scores))
            min_score = min(pair_scores) if pair_scores else 0.0
            total_score = 0.75 * geom_mean + 0.25 * min_score

            font_evaluations.append({
                "id": fid,
                "name": meta["name"],
                "style": meta["style"],
                "description": meta["description"],
                "score": round(float(total_score), 4),
                "geometric_mean": round(float(geom_mean), 4),
                "min_pair_score": round(float(min_score), 4),
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
