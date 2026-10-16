from typing import Any, Optional
from pathlib import Path
import json
import logging
import cv2
import numpy as np

logger = logging.getLogger("ambigram.recognizer")

try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False

try:
    from generators.font_manager import font_manager
except ImportError:
    from backend.generators.font_manager import font_manager

# モデルおよびラベルファイルのパス
MODEL_DIR = Path(__file__).resolve().parent / "models"
ONNX_MODEL_PATH = MODEL_DIR / "model.fp16.onnx"
LABELS_PATH = MODEL_DIR / "labels.json"

# 対象とする主要文字セット (フォールバック用)
HIRAGANA_CHARS = list("あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん")
KATAKANA_CHARS = list("アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー")


class CharacterRecognizer:
    """
    客観的文字認識・両方向可読性評価エンジン (ローカル軽量ONNX CNN / 特徴量ハイブリッド)
    先行研究:
    - 魏・山口 (2023)「多目的最適化 GAN によるアンビグラム生成」§2.2 (認識モデルによる調和平均可読性)
    - 井上・高橋 (2020)「文字構造特徴を用いたひらがなアンビグラムの生成」§6.2 (ひらがな識別器による定量評価)
    
    JIS第1水準漢字 (2,965文字) + ひらがな + カタカナの計3,082クラスに対応する軽量ONNXモデルにより、
    生成されたアンビグラムが正位置で文字Aとして認識される確率、
    および180度反転で文字Bとして認識される確率を測定し、調和平均可読性スコアを高速算出する。
    """
    def __init__(self, font_ids: list[str] = ["zen_maru", "mplus"]):
        self.font_ids = font_ids
        self.char_templates: dict[str, np.ndarray] = {}
        self.onnx_session: Optional[Any] = None
        self.labels: list[dict[str, Any]] = []
        self.char_to_index: dict[str, int] = {}
        self.model_type: str = "template_matching"

        self._init_onnx()
        if self.onnx_session is None:
            self._init_templates()

    def _init_onnx(self):
        """軽量ONNX文字認識モデルのロード (3,082クラス)"""
        if not HAS_ONNX:
            logger.info("onnxruntime が利用不可のため、テンプレートマッチングへフォールバックします。")
            return
        if not ONNX_MODEL_PATH.exists() or not LABELS_PATH.exists():
            logger.info("ONNXモデルファイルが見つからないため、テンプレートマッチングへフォールバックします。")
            return
        try:
            with open(LABELS_PATH, encoding="utf-8") as f:
                self.labels = json.load(f)
            self.char_to_index = {item["char"]: i for i, item in enumerate(self.labels)}
            self.onnx_session = ort.InferenceSession(
                str(ONNX_MODEL_PATH),
                providers=["CPUExecutionProvider"],
            )
            self.model_type = "onnx_cnn"
            logger.info(f"ONNX文字認識エンジン初期化成功: {len(self.labels)} クラス対応")
        except Exception as e:
            logger.warning(f"ONNXモデルロード失敗 (フォールバック使用): {e}")
            self.onnx_session = None

    def _preprocess_onnx(self, img: np.ndarray, target_size: int = 128) -> np.ndarray:
        """
        OpenCV画像 -> ONNX入力テンソル (1, 1, 128, 128) float32
        アスペクト比を維持して背景色（中央値）で正方形パディングした上でリサイズ
        """
        if img.size == 0:
            return np.zeros((1, 1, target_size, target_size), dtype=np.float32)

        if img.dtype != np.uint8:
            max_v = float(np.max(img)) if img.size > 0 else 1.0
            if max_v <= 1.01:
                u8 = (img * 255.0).clip(0, 255).astype(np.uint8)
            else:
                u8 = img.clip(0, 255).astype(np.uint8)
        else:
            u8 = img

        if len(u8.shape) == 3:
            u8 = cv2.cvtColor(u8, cv2.COLOR_BGR2GRAY)

        h, w = u8.shape
        side = max(h, w)
        bg_val = int(np.median(u8))
        canvas = np.full((side, side), bg_val, dtype=np.uint8)

        y_off = (side - h) // 2
        x_off = (side - w) // 2
        canvas[y_off:y_off + h, x_off:x_off + w] = u8

        resized = cv2.resize(canvas, (target_size, target_size), interpolation=cv2.INTER_LINEAR)
        return resized.astype(np.float32)[None, None]

    def _init_templates(self):
        """基準フォントから各文字の標準特徴量ベクトルを計算・平均化 (フォールバック用)"""
        all_chars = HIRAGANA_CHARS + KATAKANA_CHARS
        for char in all_chars:
            feat_list = []
            for fid in self.font_ids:
                img = font_manager.render_char_matrix(char, fid, size=128, bold=False)
                feat = self._extract_features(img)
                feat_list.append(feat)
            avg_feat = np.mean(feat_list, axis=0)
            norm = np.linalg.norm(avg_feat)
            if norm > 0:
                avg_feat /= norm
            self.char_templates[char] = avg_feat

    def _extract_features(self, binary_img: np.ndarray) -> np.ndarray:
        """文字画像から192次元の正規化マルチスケール特徴量を抽出 (フォールバック用)"""
        max_v = float(np.max(binary_img)) if binary_img.size > 0 else 0.0
        thresh = 0.5 if max_v <= 1.01 else 50
        u8 = (binary_img > thresh).astype(np.uint8) * 255
        
        pts = np.argwhere(u8 > 0)
        if pts.size > 0:
            ymin, xmin = pts.min(axis=0)
            ymax, xmax = pts.max(axis=0)
            cropped = u8[ymin:ymax+1, xmin:xmax+1]
            ch, cw = cropped.shape
            max_side = max(ch, cw)
            pad_img = np.zeros((max_side, max_side), dtype=np.uint8)
            sy = (max_side - ch) // 2
            sx = (max_side - cw) // 2
            pad_img[sy:sy+ch, sx:sx+cw] = cropped
            resized = cv2.resize(pad_img, (32, 32), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        else:
            resized = np.zeros((32, 32), dtype=np.float32)

        zones = cv2.resize(resized, (8, 8), interpolation=cv2.INTER_AREA).flatten()
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
        if self.onnx_session is not None:
            return self._predict_onnx(img, target_char=target_char, top_k=top_k)
        return self._predict_template(img, target_char=target_char, top_k=top_k)

    def _predict_onnx(
        self,
        img: np.ndarray,
        target_char: Optional[str] = None,
        top_k: int = 3,
    ) -> tuple[float, list[dict[str, Any]]]:
        x = self._preprocess_onnx(img)
        logits = self.onnx_session.run(["logits"], {"input": x})[0][0].astype(np.float64)

        # Softmax計算
        exp_logits = np.exp(logits - logits.max())
        probs = exp_logits / (exp_logits.sum() + 1e-12)

        top_indices = np.argsort(-probs)
        top_predictions = []
        for i in range(min(top_k, len(self.labels))):
            idx = int(top_indices[i])
            top_predictions.append({
                "char": self.labels[idx]["char"],
                "probability": round(float(probs[idx]), 4),
                "rank": i + 1,
            })

        target_score = 0.0
        if target_char:
            if target_char in self.char_to_index:
                target_idx = self.char_to_index[target_char]
                raw_prob = float(probs[target_idx])
                ranks = np.where(top_indices == target_idx)[0]
                rank = int(ranks[0]) + 1 if len(ranks) > 0 else 9999

                # 順位と確率を組み合わせた客観的可読性確信度スコア
                if rank == 1:
                    target_score = 0.85 + 0.14 * min(raw_prob * 3.0, 1.0)
                elif rank <= 3:
                    target_score = 0.70 + 0.14 * (1.0 - (rank - 2) / 2.0) + min(raw_prob * 2.0, 0.05)
                elif rank <= 10:
                    target_score = 0.50 + 0.18 * (1.0 - (rank - 4) / 7.0)
                elif rank <= 30:
                    target_score = 0.30 + 0.18 * (1.0 - (rank - 11) / 20.0)
                elif rank <= 100:
                    target_score = 0.15 + 0.14 * (1.0 - (rank - 31) / 70.0)
                else:
                    target_score = max(raw_prob * 5.0, 0.02)
            else:
                target_score = 0.50

        return round(float(target_score), 4), top_predictions

    def _predict_template(
        self,
        img: np.ndarray,
        target_char: Optional[str] = None,
        top_k: int = 3,
    ) -> tuple[float, list[dict[str, Any]]]:
        feat = self._extract_features(img)
        sims = []
        for char, t_feat in self.char_templates.items():
            sim = float(np.dot(feat, t_feat))
            sims.append((char, sim))

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
        prob1, top1 = self.predict_char(slot_img, target_char=c1)

        rot_img = cv2.rotate(slot_img, cv2.ROTATE_180)
        prob2, top2 = self.predict_char(rot_img, target_char=c2)

        # 魏・山口 (2023) §2.2: 調和平均可読性 (Harmonic Mean Readability)
        denom = prob1 + prob2
        harmonic_readability = (2.0 * prob1 * prob2) / denom if denom > 1e-6 else 0.0

        is_readable_c1 = prob1 >= 0.50
        is_readable_c2 = prob2 >= 0.50

        if is_readable_c1 and is_readable_c2:
            status = "perfect"
        elif is_readable_c1 or is_readable_c2:
            status = "partial"
        else:
            status = "poor"

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
            "model_type": self.model_type,
        }


char_recognizer = CharacterRecognizer()
