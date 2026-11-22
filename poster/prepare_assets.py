"""A0ポスター用の高解像度素材を作る。

実行: uv run --project backend --with pymupdf python poster/prepare_assets.py <予稿PDF> <過去ポスターpptx> <ロゴ画像>

二値の図形は輪郭を滑らかに補間して、貼る大きさで300dpi以上になる解像度で描き直す。
"""

from __future__ import annotations

import json
import shutil
import sys
import zipfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from generators.font_manager import font_manager  # noqa: E402
from generators.skeleton_engine import SkeletonAmbigramEngine  # noqa: E402
from generators.snap_warper import snap_warper  # noqa: E402

OUT = ROOT / "poster" / "build" / "assets"
OUTPUT_DIR = ROOT / "output"

INK = (35, 24, 21)
RED = (230, 46, 30)
GRAY = (178, 178, 178)
PAPER = (255, 255, 255)

GALLERY = ["日曜日", "奥歯", "垂直", "蜘蛛", "留置場", "気の毒"]
PIPELINE_WORD = "長寿"


def smooth_upscale(mask: np.ndarray, out_width: int) -> np.ndarray:
    """二値マスクを滑らかな輪郭で拡大し、0〜1のアンチエイリアス付き被覆率を返す。"""
    h, w = mask.shape
    scale = out_width / w
    out_height = round(h * scale)
    up = cv2.resize(mask.astype(np.float32), (out_width, out_height), interpolation=cv2.INTER_CUBIC)
    sigma = max(0.8, 0.95 * scale)
    up = cv2.GaussianBlur(up, (0, 0), sigma)
    # 境界の遷移幅を約1.2pxに絞り、滑らかさを保ったまま輪郭をくっきりさせる
    sharpness = sigma * 2.5 / 1.2
    return np.clip((up - 0.5) * sharpness + 0.5, 0.0, 1.0)


def paint(layers: list[tuple[np.ndarray, tuple[int, int, int]]], shape: tuple[int, int]) -> np.ndarray:
    canvas = np.empty((*shape, 3), dtype=np.float32)
    canvas[:] = PAPER
    for alpha, color in layers:
        canvas = canvas * (1 - alpha[..., None]) + np.array(color, dtype=np.float32) * alpha[..., None]
    return canvas.clip(0, 255).astype(np.uint8)


def save(rgb: np.ndarray, name: str) -> dict:
    path = OUT / name
    Image.fromarray(rgb).save(path, optimize=True)
    return {"file": name, "width": rgb.shape[1], "height": rgb.shape[0]}


def trim_mask(mask: np.ndarray, pad_ratio: float = 0.04) -> np.ndarray:
    ys, xs = np.nonzero(mask)
    pad = round(max(mask.shape) * pad_ratio)
    y0, y1 = max(0, ys.min() - pad), min(mask.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(mask.shape[1], xs.max() + pad + 1)
    return mask[y0:y1, x0:x1]


def ink_image(mask: np.ndarray, out_width: int, name: str, color=INK) -> dict:
    alpha = smooth_upscale(mask, out_width)
    return save(paint([(alpha, color)], alpha.shape), name)


def saved_work_mask(word: str) -> np.ndarray:
    image = Image.open(OUTPUT_DIR / f"ambigram_{word}_skeleton.png").convert("RGBA")
    rgba = np.array(image)
    return (rgba[..., 3] > 127) & (rgba[..., :3].mean(axis=2) < 128)


def saved_params(word: str) -> dict:
    saved = json.loads((OUTPUT_DIR / f"ambigram_{word}_skeleton_parameters.json").read_text(encoding="utf-8"))
    rep = saved["reproducibility"]
    p = rep["parameters"]
    return {
        "font_id": rep["font"]["id"],
        "offsets": [tuple(o) for o in rep["alignment"]["offsets"]],
        "stroke_thickness": p["stroke_thickness"],
        "diff_blend": p["diff_blend"],
        "pre_bold": p["pre_bold"],
        "brush_style": p["brush_style"],
        "stroke_modulation": p["stroke_modulation"],
        "snap_strength": p.get("snap_strength", 0.75),
    }


def pipeline_layers(word: str) -> dict[str, np.ndarray]:
    """生成工程の中間結果を、色分けせずに層ごとのマスクとして取り出す。"""
    engine = SkeletonAmbigramEngine()
    params = saved_params(word)
    font_path = font_manager.get_font_path(params["font_id"])
    n = len(word)
    slots: list[dict | None] = [None] * n
    for i in range((n + 1) // 2):
        _, inter = engine.generate_slot(
            word[i], word[n - 1 - i], size=512,
            stroke_thickness=params["stroke_thickness"], diff_blend=params["diff_blend"],
            pre_bold=params["pre_bold"], font_path=font_path, shift=params["offsets"][i],
            brush_style=params["brush_style"], stroke_modulation=params["stroke_modulation"],
            enable_snap=True, snap_strength=params["snap_strength"],
            return_intermediates=True, warp_method="tps",
        )
        slots[i] = inter
        if i != n - 1 - i:
            # 反対側の枠は180度回した複製なので、正立と倒立の色を入れ替えて凡例と揃える
            slots[n - 1 - i] = {k: swap_overlay_colors(cv2.rotate(v, cv2.ROTATE_180)) for k, v in inter.items()}
    return {key: np.hstack([s[key] for s in slots]) for key in slots[0]}


POS_COLOR = (37, 99, 235)
ROT_COLOR = (225, 59, 25)


def swap_overlay_colors(img: np.ndarray) -> np.ndarray:
    if img.ndim != 3:
        return img
    rgb = img[..., :3]
    pos = (rgb == POS_COLOR).all(axis=2)
    rot = (rgb == ROT_COLOR).all(axis=2)
    out = img.copy()
    out[pos, :3] = ROT_COLOR
    out[rot, :3] = POS_COLOR
    return out


def attraction_layers(word: str) -> dict:
    """TPSで引き寄せる前の骨格と、互いの骨格へ向かう引き寄せの向きを取り出す。

    実装 (snap_warper._sparse_snap_vectors) と同じく、両方の文字の骨格のうち、
    相手の骨格から40画素以内で、重なり部分ではない点を、相手の骨格へ向けて動かす。
    """
    engine = SkeletonAmbigramEngine()
    params = saved_params(word)
    font_path = font_manager.get_font_path(params["font_id"])
    size, max_distance, spacing, min_length = 512, 40, 46, 14
    n = len(word)
    upright = [np.zeros((size, size), bool) for _ in range(n)]
    inverted = [np.zeros((size, size), bool) for _ in range(n)]
    arrows: list[list[tuple[float, float, float, float]]] = [[] for _ in range(n)]
    for i in range((n + 1) // 2):
        img1 = engine.render_glyph_bitmap(word[i], size=size, font_path=font_path)
        img2 = cv2.rotate(engine.render_glyph_bitmap(word[n - 1 - i], size=size, font_path=font_path), cv2.ROTATE_180)
        dx, dy = (v * size / 128.0 for v in params["offsets"][i])
        img1 = cv2.warpAffine(img1, np.float32([[1, 0, -dx / 2], [0, 1, -dy / 2]]), (size, size))
        img2 = cv2.warpAffine(img2, np.float32([[1, 0, dx / 2], [0, 1, dy / 2]]), (size, size))
        sparse = snap_warper._sparse_snap_vectors(img1, img2, max_distance, 1.0)
        # 長く動く点から順に、既に選んだ点と間隔を空けて矢印にする (両方の文字から選ぶ)
        candidates = []
        for mask, vx, vy in ((sparse["mask_snap1"], sparse["vx1"], sparse["vy1"]),
                             (sparse["mask_snap2"], sparse["vx2"], sparse["vy2"])):
            for y, x in zip(*np.nonzero(mask)):
                length = float(np.hypot(vx[y, x], vy[y, x]))
                if length >= min_length:
                    candidates.append((length, x, y, x + vx[y, x], y + vy[y, x]))
        found: list[tuple[float, float, float, float]] = []
        for _, x0, y0, x1, y1 in sorted(candidates, reverse=True):
            if all(np.hypot(x0 - a, y0 - b) >= spacing for a, b, _, _ in found):
                found.append((x0, y0, x1, y1))
        upright[i], inverted[i], arrows[i] = sparse["skel1"] > 0, sparse["skel2"] > 0, found
        j = n - 1 - i
        if j != i:
            # 反対側の枠は180度回した複製。回すと正立と倒立が入れ替わる
            flip = lambda a: tuple(size - 1 - v for v in a)  # noqa: E731
            upright[j], inverted[j] = np.rot90(inverted[i], 2).copy(), np.rot90(upright[i], 2).copy()
            arrows[j] = [flip(a) for a in found]
    return {
        "upright": np.hstack(upright),
        "inverted": np.hstack(inverted),
        "arrows": [(x0 + k * size, y0, x1 + k * size, y1) for k, row in enumerate(arrows) for x0, y0, x1, y1 in row],
    }


def attraction_image(layers: dict, out_width: int, name: str) -> dict:
    """正立の骨格を灰、倒立の骨格を朱で描き、相手の骨格へ引き寄せる向きを墨の矢印で重ねる。"""
    h, w = layers["upright"].shape
    scale = out_width / w
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    thick = lambda m: cv2.dilate(m.astype(np.uint8), kernel) > 0  # noqa: E731
    canvas = paint([(smooth_upscale(thick(layers["upright"]), out_width), GRAY),
                    (smooth_upscale(thick(layers["inverted"]), out_width), RED)],
                   (round(h * scale), out_width))
    canvas = np.ascontiguousarray(canvas[..., ::-1])
    sub = 4  # 小数座標で描くための固定小数点のビット数
    for x0, y0, x1, y1 in layers["arrows"]:
        p0 = (round(x0 * scale * 2**sub), round(y0 * scale * 2**sub))
        p1 = (round(x1 * scale * 2**sub), round(y1 * scale * 2**sub))
        length = np.hypot(x1 - x0, y1 - y0) * scale
        cv2.arrowedLine(canvas, p0, p1, INK[::-1], thickness=max(1, round(out_width / 330)),
                        line_type=cv2.LINE_AA, shift=sub, tipLength=min(0.5, out_width / 80 / max(length, 1)))
    return save(np.ascontiguousarray(canvas[..., ::-1]), name)


def overlay_image(overlay: np.ndarray, out_width: int, name: str) -> dict:
    rgb = overlay[..., :3]
    pos_only = (rgb == (37, 99, 235)).all(axis=2)
    rot_only = (rgb == (225, 59, 25)).all(axis=2)
    both = (rgb == (24, 24, 27)).all(axis=2)
    a1 = smooth_upscale(pos_only | both, out_width)
    a2 = smooth_upscale(rot_only | both, out_width)
    overlap = np.minimum(a1, a2)
    return save(paint([(a1, GRAY), (a2, RED), (overlap, INK)], a1.shape), name)


def field_image(field: np.ndarray, out_width: int, name: str) -> dict:
    h, w = field.shape
    up = cv2.resize(field.astype(np.float32) / 255.0, (out_width, round(h * out_width / w)), interpolation=cv2.INTER_CUBIC)
    up = cv2.GaussianBlur(up, (0, 0), out_width / w * 0.5).clip(0, 1)[..., None]
    low, high = np.clip(up / 0.6, 0, 1), np.clip((up - 0.6) / 0.4, 0, 1)
    color = np.array(PAPER, np.float32) * (1 - low) + np.array(RED, np.float32) * low
    color = color * (1 - high) + np.array(INK, np.float32) * high
    return save(color.clip(0, 255).astype(np.uint8), name)


def main() -> None:
    proceedings, past_pptx, logo = (Path(a) for a in sys.argv[1:4])
    OUT.mkdir(parents=True, exist_ok=True)
    # 制作画面のスクリーンショットは別手順で撮るため残す
    for old in OUT.iterdir():
        if old.name != "screenshot.png":
            old.unlink()
    manifest: dict = {}
    if (OUT / "screenshot.png").exists():
        with Image.open(OUT / "screenshot.png") as im:
            manifest["screenshot"] = {"file": "screenshot.png", "width": im.width, "height": im.height}

    # 主役の作例 (予稿の図4と同じ保存済み作品)。幅60cmまで300dpiを保てる解像度にする
    manifest["hero"] = ink_image(trim_mask(saved_work_mask("長寿")), 7200, "hero.png")

    manifest["gallery"] = []
    for i, word in enumerate(GALLERY):
        item = ink_image(trim_mask(saved_work_mask(word)), 2400, f"work-{i}.png")
        item["word"] = word
        manifest["gallery"].append(item)

    # 生成工程 (TPS方式)。幅25cmまで300dpiを保てる解像度にする
    layers = pipeline_layers(PIPELINE_WORD)
    width = 3000
    manifest["steps"] = {
        "align": overlay_image(layers["step2"], width, "step-align.png"),
        "attract": attraction_image(attraction_layers(PIPELINE_WORD), width, "step-attract.png"),
        "tps": overlay_image(layers["step4"], width, "step-tps.png"),
        "field": field_image(layers["step5"], width, "step-field.png"),
        "skeleton": ink_image(cv2.dilate(layers["step6"], np.ones((3, 3), np.uint8)) > 0, width, "step-skeleton.png"),
        "result": ink_image(layers["step7"] > 0, width, "step-result.png"),
    }

    # 予稿の図1 (第二著者の作例)
    import pymupdf

    doc = pymupdf.open(proceedings)
    xref = max(doc[0].get_images(full=True), key=lambda im: im[2] * im[3])[0]
    fig1 = np.array(Image.open(__import__("io").BytesIO(doc.extract_image(xref)["image"])).convert("L"))
    manifest["fig1"] = ink_image(trim_mask(fig1 < 200), 2400, "fig1.png", color=(90, 90, 90))

    # 先生のイラストとロゴは手を加えずにコピーする
    with zipfile.ZipFile(past_pptx) as z:
        (OUT / "illustration.png").write_bytes(z.read("ppt/media/image5.png"))
    shutil.copyfile(logo, OUT / "logo.png")
    for key in ("illustration", "logo"):
        with Image.open(OUT / f"{key}.png") as im:
            manifest[key] = {"file": f"{key}.png", "width": im.width, "height": im.height}

    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: (v if not isinstance(v, list) else len(v)) for k, v in manifest.items()}, ensure_ascii=False)[:600])


if __name__ == "__main__":
    main()
