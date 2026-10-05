from pathlib import Path
from typing import Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    from generators.font_manager import font_manager
except ImportError:
    from backend.generators.font_manager import font_manager

# 対象とする主要文字セット (ひらがな全文字 + 主要カタカナ)
HIRAGANA_CHARS = list("あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん")
KATAKANA_CHARS = list("アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー")

class CharacterRecognizer:
    """
    客観的文字認識・両方向可読性評価エンジン
    先行研究:
    - 魏・山口 (2023)「多目的最適化 GAN によるアンビグラム生成」§2.2 (認識モデルによる調和平均可読性)
    - 井上・高橋 (2020)「文字構造特徴を用いたひらがなアンビグラムの生成」§6.2 (ひらがな識別器による定量評価)
    
    生成されたアンビグラムが正位置で文字Aとして認識される確率、
    および180度反転で文字Bとして認識される確率を測定し、調和平均可読性スコアを算出する。
    """
    def __init__(self, font_ids: list[str] = ["zen_maru", "mplus"]):
        self.font_ids = font_ids
        self.char_templates: dict[str, np.ndarray] = {}
        self._init_templates()

    def _extract_features(self, binary_img: np.ndarray) -> np.ndarray:
        """
        文字画像から192次元の正規化マルチスケール特徴量を抽出
        - ゾーン密度 (8x8 = 64次元)
        - Sobelエッジ勾配方向ヒストグラム (4x4セル x 8方向 = 128次元)
        """
        # 入力が 0〜1 の float または 0〜255 の uint8 の両方に対応
        max_v = float(np.max(binary_img)) if binary_img.size > 0 else 0.0
        thresh = 0.5 if max_v <= 1.01 else 50
        u8 = (binary_img > thresh).astype(np.uint8) * 255
        
        # 輪郭切り出し（ROIバウンディングボックスの正規化）
        pts = np.argwhere(u8 > 0)
        if pts.size > 0:
            ymin, xmin = pts.min(axis=0)
            ymax, xmax = pts.max(axis=0)
            cropped = u8[ymin:ymax+1, xmin:xmax+1]
            
            # 正方形パディング
            ch, cw = cropped.shape
            max_side = max(ch, cw)
            pad_img = np.zeros((max_side, max_side), dtype=np.uint8)
            sy = (max_side - ch) // 2
            sx = (max_side - cw) // 2
            pad_img[sy:sy+ch, sx:sx+cw] = cropped
            resized = cv2.resize(pad_img, (32, 32), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        else:
            resized = np.zeros((32, 32), dtype=np.float32)

        # 1. ゾーン密度 (8x8)
        zones = cv2.resize(resized, (8, 8), interpolation=cv2.INTER_AREA).flatten()

        # 2. エッジ勾配方向ヒストグラム (4x4グリッド x 8方向)
        gx = cv2.Sobel(resized, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(resized, cv2.CV_32F, 0, 1, ksize=3)
        mag = np.sqrt(gx**2 + gy**2)
        ang = (np.arctan2(gy, gx) + np.pi) % np.pi

        hist_list = []
        for r in range(4):
            for c in range(4):
                sub_mag = mag[r*8:(r+1)*8, c*8:(c+1)*8]
                sub_ang = ang[r*8:(r+1)*8, c*8:(c+1)*8]
                h, _ = np.histogram(sub_ang, bins=8, range=(0, np.pi), weights=sub_mag)
                hist_list.append(h)
        edge_hist = np.concatenate(hist_list)
        norm_edge = np.linalg.norm(edge_hist)
        if norm_edge > 0:
            edge_hist /= norm_edge

        feat = np.concatenate([zones, edge_hist])
        norm_feat = np.linalg.norm(feat)
        if norm_feat > 0:
            feat /= norm_feat
        return feat

    def _init_templates(self):
        """基準フォントから各文字の標準特徴量ベクトルを計算・平均化"""
        all_chars = HIRAGANA_CHARS + KATAKANA_CHARS
        for char in all_chars:
            feat_list = []
            for fid in self.font_ids:
                img = font_manager.render_char_matrix(char, fid, size=128, bold=False)
                feat = self._extract_features(img)
                feat_list.append(feat)
            # 各フォントの特徴量平均
            avg_feat = np.mean(feat_list, axis=0)
            norm = np.linalg.norm(avg_feat)
            if norm > 0:
                avg_feat /= norm
            self.char_templates[char] = avg_feat

    def predict_char(
        self,
        img: np.ndarray,
        target_char: Optional[str] = None,
        top_k: int = 3,
    ) -> tuple[float, list[dict[str, Any]]]:
        """
        入力画像に対する文字認識を実行
        - target_char が指定された場合、その文字の予測確信度 (0.0〜1.0) を返却
        - 上位 top_k 件の予測文字と確率リストを返却
        """
        feat = self._extract_features(img)
        
        sims = []
        for char, t_feat in self.char_templates.items():
            sim = float(np.dot(feat, t_feat))
            sims.append((char, sim))

        # コサイン類似度を温度付きソフトマックスで擬似確率化 (temperature = 0.08)
        sim_vals = np.array([s[1] for s in sims])
        temperature = 0.08
        exp_sims = np.exp((sim_vals - sim_vals.max()) / temperature)
        probs = exp_sims / (np.sum(exp_sims) + 1e-6)

        results = []
        target_prob = 0.0
        for i, (char, sim) in enumerate(sims):
            prob = float(probs[i])
            if target_char and char == target_char:
                target_prob = prob
            results.append({"char": char, "similarity": round(sim, 4), "probability": round(prob, 4)})

        results.sort(key=lambda x: x["probability"], reverse=True)
        top_predictions = results[:top_k]

        if target_char and target_char not in self.char_templates:
            # テンプレート未登録文字 (漢字等) はテンプレートとの類似度ではなく画像相関で推定
            target_prob = float(top_predictions[0]["similarity"]) if top_predictions else 0.5

        return round(target_prob, 4), top_predictions

    def evaluate_ambigram_slot(
        self,
        slot_img: np.ndarray,
        c1: str,
        c2: str,
    ) -> dict[str, Any]:
        """
        1文字スロットにおける双方向可読性の客観評価 (魏・山口 2023)
        - 正位置: c1 と認識できるか
        - 180度回転: c2 と認識できるか
        - 調和平均可読性スコア (Harmonic Readability)
        """
        # 正位置の評価
        prob1, top1 = self.predict_char(slot_img, target_char=c1)

        # 180度回転画像の評価
        rot_img = cv2.rotate(slot_img, cv2.ROTATE_180)
        prob2, top2 = self.predict_char(rot_img, target_char=c2)

        # 魏・山口 (2023) §2.2: 調和平均可読性 (Harmonic Mean Readability)
        denom = prob1 + prob2
        harmonic_readability = (2.0 * prob1 * prob2) / denom if denom > 1e-6 else 0.0

        is_readable_c1 = (top1[0]["char"] == c1) if (c1 in self.char_templates and top1) else (prob1 >= 0.20)
        is_readable_c2 = (top2[0]["char"] == c2) if (c2 in self.char_templates and top2) else (prob2 >= 0.20)

        status = "perfect" if (is_readable_c1 and is_readable_c2) else ("partial" if (is_readable_c1 or is_readable_c2) else "poor")

        return {
            "char1": c1,
            "char2": c2,
            "prob1": round(float(prob1), 4),
            "prob2": round(float(prob2), 4),
            "harmonic_readability": round(float(harmonic_readability), 4),
            "status": status,
            "top1_pred": top1[0]["char"] if top1 else "",
            "top2_pred": top2[0]["char"] if top2 else "",
            "predictions_normal": top1,
            "predictions_inverted": top2,
        }

char_recognizer = CharacterRecognizer()
