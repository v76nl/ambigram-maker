from abc import ABC, abstractmethod
import base64
import io
from typing import Any
import cv2
import numpy as np
from PIL import Image

def make_bicolor_overlay(img1: np.ndarray, img2_rot: np.ndarray) -> np.ndarray:
    """
    正位置文字(青: #2563eb) と 180度反転文字(赤: #e13b19) のオーバーレイRGBA画像を作成
    共通重なり部分は墨黒(#18181b)、背景は白(#ffffff)
    """
    h, w = img1.shape[:2]
    # 白背景のRGBA画像
    out = np.full((h, w, 4), 255, dtype=np.uint8)

    p1 = img1 > 30
    p2 = img2_rot > 30

    # 共通核 (墨黒: 24, 24, 27)
    overlap = p1 & p2
    out[overlap, 0] = 24
    out[overlap, 1] = 24
    out[overlap, 2] = 27
    out[overlap, 3] = 255

    # 正位置のみ (青: 37, 99, 235)
    pos_only = p1 & ~p2
    out[pos_only, 0] = 37
    out[pos_only, 1] = 99
    out[pos_only, 2] = 235
    out[pos_only, 3] = 255

    # 反転位置のみ (赤: 225, 59, 25)
    rot_only = ~p1 & p2
    out[rot_only, 0] = 225
    out[rot_only, 1] = 59
    out[rot_only, 2] = 25
    out[rot_only, 3] = 255

    return out

def array_to_png_data_uri(
    img: np.ndarray,
    color_mode: str = "black_on_white",
    add_padding: bool = True,
    pad_ratio: float = 0.15,
) -> str:
    """NumPy配列(uint8またはfloat)をData URI形式のPNG画像に変換"""
    if img.dtype != np.uint8:
        max_v = float(np.max(img)) if img.size > 0 else 0.0
        if max_v <= 1.01:
            u8 = np.clip(img * 255.0, 0, 255).astype(np.uint8)
        else:
            u8 = np.clip(img, 0, 255).astype(np.uint8)
    else:
        u8 = img

    # パディングの付加 (水平スロットの余白を整える)
    if add_padding:
        h, w = u8.shape[:2]
        pad_y = int(h * pad_ratio)
        pad_x = int(h * pad_ratio)
        if len(u8.shape) == 2:
            u8 = cv2.copyMakeBorder(u8, pad_y, pad_y, pad_x, pad_x, cv2.BORDER_CONSTANT, value=0)
        elif len(u8.shape) == 3 and u8.shape[2] == 4:
            # RGBA (白背景パディング)
            u8 = cv2.copyMakeBorder(u8, pad_y, pad_y, pad_x, pad_x, cv2.BORDER_CONSTANT, value=[255, 255, 255, 255])
        elif len(u8.shape) == 3:
            u8 = cv2.copyMakeBorder(u8, pad_y, pad_y, pad_x, pad_x, cv2.BORDER_CONSTANT, value=[255, 255, 255])

    if len(u8.shape) == 2:
        h, w = u8.shape
        if color_mode == "black_on_white":
            # 文字部分(非ゼロ)を墨黒(#111111)、背景を白に描画
            rgba = np.full((h, w, 4), 255, dtype=np.uint8)
            mask = u8 > 0
            rgba[mask, 0] = 17
            rgba[mask, 1] = 17
            rgba[mask, 2] = 17
            rgba[mask, 3] = 255
            pil_img = Image.fromarray(rgba, mode="RGBA")
        elif color_mode == "heatmap":
            # 連続値をカラーマップ(INFERNO)で美しく視覚化
            colored = cv2.applyColorMap(u8, cv2.COLORMAP_INFERNO)
            pil_img = Image.fromarray(cv2.cvtColor(colored, cv2.COLOR_BGR2RGB))
        else:
            pil_img = Image.fromarray(u8)
    elif len(u8.shape) == 3 and u8.shape[2] == 3:
        pil_img = Image.fromarray(cv2.cvtColor(u8, cv2.COLOR_BGR2RGB))
    elif len(u8.shape) == 3 and u8.shape[2] == 4:
        pil_img = Image.fromarray(u8, mode="RGBA")
    else:
        pil_img = Image.fromarray(u8)

    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"

class BaseAmbigramGenerator(ABC):
    @abstractmethod
    def generate(self, word: str, **params) -> dict[str, Any]:
        """
        単語を受け取り、180度回転自己対称アンビグラムを生成する
        
        Returns:
            dict: {
                "engine": str,           # エンジン名
                "type": "svg" | "png",   # 出力形式
                "data": str,             # SVG文字列 または base64エンコード画像
                "details": dict,         # 付加情報
                "steps": list[dict],     # 各処理ステップのプレビュー画像と解説
            }
        """
        pass
