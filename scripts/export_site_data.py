"""解説サイト用の作例画像と中間工程画像を書き出す。

実行: uv run --project backend python scripts/export_site_data.py
"""

from __future__ import annotations

import base64
import io
import json
import shutil
import sys
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from generators.font_manager import SIMILARITY_WEIGHTS, font_manager  # noqa: E402
from generators.skeleton_engine import (  # noqa: E402
    CENTERLINE_THRESHOLD_DIFF,
    SkeletonAmbigramEngine,
)

OUTPUT_DIR = ROOT / "output"
PUBLIC_DIR = ROOT / "site" / "public" / "generated"
DATA_FILE = ROOT / "site" / "src" / "data" / "site-data.json"

GALLERY_WORDS = ["長寿", "日曜日", "奥歯", "垂直", "聖職者", "蜘蛛", "概論", "留置場", "秋桜", "折り紙", "追い風", "気の毒"]
PIPELINE_WORDS = ["長寿", "日曜日", "蜘蛛"]
SNAP_WORD = "長寿"
SNAP_LEVELS = [0.0, 0.25, 0.5, 0.75, 1.0]
# 中心線の閾値の比較。長寿は違う文字の組なので、既定値は CENTERLINE_THRESHOLD_DIFF
THRESHOLD_WORD = "長寿"
THRESHOLD_LEVELS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35]

# 工程画像と吸引の比較画像に使う変形方式 (作例ギャラリーは保存済みの作品をそのまま使う)
WARP_METHOD = "tps"

SLOT_SIZE = 512
MAX_WIDTH = 1400
PADDING_RATIO = 0.15

INK = (17, 17, 17)
ACCENT = (209, 48, 12)
MUTED = (176, 176, 176)
PAPER = (255, 255, 255)


def load_parameters(word: str) -> dict[str, Any]:
    """制作時に保存したパラメータを読み込む。"""
    path = OUTPUT_DIR / f"ambigram_{word}_skeleton_parameters.json"
    saved = json.loads(path.read_text(encoding="utf-8"))["reproducibility"]
    params = saved["parameters"]
    return {
        "font_id": saved["font"]["id"],
        "offsets": [tuple(offset) for offset in saved["alignment"]["offsets"]],
        "stroke_thickness": params["stroke_thickness"],
        "diff_blend": params["diff_blend"],
        "pre_bold": params["pre_bold"],
        "brush_style": params["brush_style"],
        "stroke_modulation": params["stroke_modulation"],
        "snap_strength": params.get("snap_strength", 0.75) if params.get("enable_snap", True) else 0.0,
        "warp_method": WARP_METHOD,
        "centerline_threshold": None,
    }


def load_saved_work(word: str) -> tuple[np.ndarray, str]:
    """制作時に書き出した作品画像を、白地に合成して読み込む。"""
    saved = json.loads((OUTPUT_DIR / f"ambigram_{word}_skeleton_parameters.json").read_text(encoding="utf-8"))
    image = Image.open(OUTPUT_DIR / f"ambigram_{word}_skeleton.png").convert("RGBA")
    paper = Image.new("RGBA", image.size, (*PAPER, 255))
    paper.alpha_composite(image)
    return np.array(paper.convert("RGB")), saved["reproducibility"]["font"]["name"]


def recolor_overlay(rgba: np.ndarray) -> np.ndarray:
    """正位置と反転位置の重ね合わせを、サイトの配色に置き換える。"""
    out = np.full((*rgba.shape[:2], 3), PAPER, dtype=np.uint8)
    out[(rgba[..., :3] == (37, 99, 235)).all(axis=2)] = MUTED
    out[(rgba[..., :3] == (225, 59, 25)).all(axis=2)] = ACCENT
    out[(rgba[..., :3] == (24, 24, 27)).all(axis=2)] = INK
    return out


def recolor_field(field: np.ndarray) -> np.ndarray:
    """距離場を、白から朱色、黒へ変化する単色の階調にする。"""
    t = field.astype(np.float32)[..., None] / 255.0
    low = np.clip(t / 0.6, 0.0, 1.0)
    high = np.clip((t - 0.6) / 0.4, 0.0, 1.0)
    paper, accent, ink = (np.array(color, dtype=np.float32) for color in (PAPER, ACCENT, INK))
    color = paper * (1 - low) + accent * low
    color = color * (1 - high) + ink * high
    return color.astype(np.uint8)


def ink_on_paper(mask: np.ndarray, dilate: int = 0) -> np.ndarray:
    """二値画像を白地に墨色で描く。"""
    if dilate > 0:
        mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate, dilate)))
    out = np.full((*mask.shape[:2], 3), PAPER, dtype=np.uint8)
    out[mask > 0] = INK
    return out


def add_padding(rgb: np.ndarray) -> np.ndarray:
    pad = int(SLOT_SIZE * PADDING_RATIO)
    return cv2.copyMakeBorder(rgb, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=PAPER)


def save_webp(rgb: np.ndarray, name: str) -> dict[str, Any]:
    image = Image.fromarray(rgb)
    if image.width > MAX_WIDTH:
        image = image.resize((MAX_WIDTH, round(image.height * MAX_WIDTH / image.width)), Image.Resampling.LANCZOS)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    image.save(PUBLIC_DIR / name, format="WEBP", quality=86, method=6)
    return {"src": f"generated/{name}", "width": image.width, "height": image.height}


def generate_final(engine: SkeletonAmbigramEngine, word: str, params: dict[str, Any]) -> tuple[np.ndarray, str]:
    result = engine.generate(
        word,
        font_id=params["font_id"],
        custom_offsets=[list(offset) for offset in params["offsets"]],
        stroke_thickness=params["stroke_thickness"],
        diff_blend=params["diff_blend"],
        pre_bold=params["pre_bold"],
        slot_size=SLOT_SIZE,
        brush_style=params["brush_style"],
        stroke_modulation=params["stroke_modulation"],
        snap_strength=params["snap_strength"],
        warp_method=params["warp_method"],
        centerline_threshold=params["centerline_threshold"],
    )
    encoded = result["data"].split(",", 1)[1]
    image = Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")
    return np.array(image), result["details"]["selected_font_name"]


def generate_steps(engine: SkeletonAmbigramEngine, word: str, params: dict[str, Any]) -> list[np.ndarray]:
    """単語全体の中間工程を、工程ごとに1枚へ連結する。"""
    n = len(word)
    slots: list[dict[str, np.ndarray] | None] = [None] * n
    font_path = font_manager.get_font_path(params["font_id"])
    for i in range((n + 1) // 2):
        _, intermediates = engine.generate_slot(
            word[i],
            word[n - 1 - i],
            size=SLOT_SIZE,
            stroke_thickness=params["stroke_thickness"],
            diff_blend=params["diff_blend"],
            pre_bold=params["pre_bold"],
            font_path=font_path,
            shift=params["offsets"][i],
            brush_style=params["brush_style"],
            stroke_modulation=params["stroke_modulation"],
            enable_snap=params["snap_strength"] > 0.0,
            snap_strength=params["snap_strength"],
            return_intermediates=True,
            warp_method=params["warp_method"],
            centerline_threshold=params["centerline_threshold"],
        )
        slots[i] = intermediates
        if i != n - 1 - i:
            slots[n - 1 - i] = {key: cv2.rotate(value, cv2.ROTATE_180) for key, value in intermediates.items()}

    def joined(key: str) -> np.ndarray:
        return np.hstack([slot[key] for slot in slots if slot is not None])

    return [
        add_padding(recolor_overlay(joined("step1"))),
        add_padding(recolor_overlay(joined("step2"))),
        add_padding(recolor_overlay(joined("step3"))),
        add_padding(recolor_overlay(joined("step4"))),
        add_padding(recolor_field(joined("step5"))),
        add_padding(ink_on_paper(joined("step6"), dilate=5)),
        add_padding(ink_on_paper(joined("step7"))),
    ]


def kept_region(field_rgb: np.ndarray, field: np.ndarray, threshold: float) -> np.ndarray:
    """距離場の階調のうち、閾値を超えて中心線のもとになる部分だけを残し、ほかは薄く描く。"""
    keep = field > int(255 * threshold)
    out = (field_rgb.astype(np.float32) * 0.18 + np.array(PAPER, dtype=np.float32) * 0.82).astype(np.uint8)
    out[keep] = field_rgb[keep]
    return out


def threshold_level(engine: SkeletonAmbigramEngine, word: str, base: dict[str, Any], index: int, threshold: float) -> dict[str, Any]:
    params = {**base, "centerline_threshold": threshold}
    final, _ = generate_final(engine, word, params)
    raw = generate_raw_field(engine, word, params)
    region = add_padding(kept_region(recolor_field(raw), raw, threshold))
    return {
        "value": threshold,
        "region": save_webp(region, f"threshold-{index}-region.webp"),
        "result": save_webp(final, f"threshold-{index}-result.webp"),
    }


def generate_raw_field(engine: SkeletonAmbigramEngine, word: str, params: dict[str, Any]) -> np.ndarray:
    """単語全体の正規化した距離場 (0〜255) を、余白なしで連結して返す。"""
    n = len(word)
    font_path = font_manager.get_font_path(params["font_id"])
    fields: list[np.ndarray | None] = [None] * n
    for i in range((n + 1) // 2):
        _, intermediates = engine.generate_slot(
            word[i], word[n - 1 - i], size=SLOT_SIZE,
            stroke_thickness=params["stroke_thickness"], diff_blend=params["diff_blend"],
            pre_bold=params["pre_bold"], font_path=font_path, shift=params["offsets"][i],
            brush_style=params["brush_style"], stroke_modulation=params["stroke_modulation"],
            enable_snap=params["snap_strength"] > 0.0, snap_strength=params["snap_strength"],
            return_intermediates=True, warp_method=params["warp_method"],
            centerline_threshold=params["centerline_threshold"],
        )
        fields[i] = intermediates["step5"]
        if i != n - 1 - i:
            fields[n - 1 - i] = cv2.rotate(intermediates["step5"], cv2.ROTATE_180)
    return np.hstack([f for f in fields if f is not None])


def similarity_components(word: str) -> dict[str, Any]:
    """作例の単語の文字の組ごとに、相性の3つの要素を、制作時の書体と位置で求める。"""
    params = load_parameters(word)
    fid = params["font_id"]
    n = len(word)
    pairs = []
    for i in range((n + 1) // 2):
        c1, c2 = word[i], word[n - 1 - i]
        dx, dy = params["offsets"][i]
        components = font_manager.pair_similarity_components(
            font_manager.render_char_matrix(c1, fid), font_manager.render_char_matrix(c2, fid), dx, dy,
            skel_a=font_manager.render_char_skeleton(c1, fid), skel_b=font_manager.render_char_skeleton(c2, fid),
        )
        values = components or {key: 0.0 for key in SIMILARITY_WEIGHTS}
        pairs.append({"chars": [c1, c2], "valid": components is not None,
                      **{key: round(value, 4) for key, value in values.items()}})
    return {"word": word, "pairs": pairs}


def main() -> None:
    if PUBLIC_DIR.exists():
        shutil.rmtree(PUBLIC_DIR)
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    engine = SkeletonAmbigramEngine()
    gallery = []
    for index, word in enumerate(GALLERY_WORDS):
        final, font_name = load_saved_work(word)
        gallery.append({"word": word, "font": font_name, "image": save_webp(final, f"work-{index:02d}.webp")})

    pipeline = []
    for index, word in enumerate(PIPELINE_WORDS):
        steps = generate_steps(engine, word, load_parameters(word))
        images = [save_webp(step, f"steps-{index:02d}-{number}.webp") for number, step in enumerate(steps, start=1)]
        pipeline.append({"word": word, "steps": images})

    snap_levels = []
    base = load_parameters(SNAP_WORD)
    for index, strength in enumerate(SNAP_LEVELS):
        params = {**base, "snap_strength": strength}
        final, _ = generate_final(engine, SNAP_WORD, params)
        overlay = generate_steps(engine, SNAP_WORD, params)[3]
        snap_levels.append(
            {
                "value": strength,
                "result": save_webp(final, f"snap-{index}-result.webp"),
                "overlay": save_webp(overlay, f"snap-{index}-overlay.webp"),
            }
        )

    threshold_base = load_parameters(THRESHOLD_WORD)
    threshold_levels = [
        threshold_level(engine, THRESHOLD_WORD, threshold_base, index, value)
        for index, value in enumerate(THRESHOLD_LEVELS)
    ]

    data = {
        "warpMethod": WARP_METHOD,
        "gallery": gallery,
        "pipeline": pipeline,
        "snap": {"word": SNAP_WORD, "levels": snap_levels},
        "threshold": {
            "word": THRESHOLD_WORD,
            "default": CENTERLINE_THRESHOLD_DIFF,
            "levels": threshold_levels,
        },
        "similarity": {
            "weights": SIMILARITY_WEIGHTS,
            "words": [similarity_components(word) for word in GALLERY_WORDS],
        },
    }
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"images: {len(list(PUBLIC_DIR.glob('*.webp')))}")


if __name__ == "__main__":
    main()
