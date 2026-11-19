import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app import app
from generators.font_manager import font_manager
from generators.skeleton_engine import SkeletonAmbigramEngine
from generators.snap_warper import StrokeSnapWarper, normalize_warp_method, snap_warper


def _glyph_pair(c1: str, c2: str, size: int = 256) -> tuple[np.ndarray, np.ndarray]:
    engine = SkeletonAmbigramEngine()
    font_path = font_manager.get_font_path("zen_maru")
    img1 = engine.render_glyph_bitmap(c1, size=size, font_path=font_path)
    img2 = cv2.rotate(engine.render_glyph_bitmap(c2, size=size, font_path=font_path), cv2.ROTATE_180)
    return img1, img2


def test_warp_method_defaults_to_gaussian_for_compatibility():
    assert normalize_warp_method(None) == "gaussian"
    assert normalize_warp_method("") == "gaussian"
    assert normalize_warp_method("tps") == "tps"
    with pytest.raises(ValueError):
        normalize_warp_method("unknown")


def test_unspecified_method_matches_gaussian():
    img1, img2 = _glyph_pair("の", "の")
    default1, default2, _ = snap_warper.snap_and_warp(img1, img2, snap_strength=0.75)
    legacy1, legacy2, info = snap_warper.snap_and_warp(img1, img2, snap_strength=0.75, warp_method="gaussian")
    assert info["warp_method"] == "gaussian"
    assert np.array_equal(default1, legacy1)
    assert np.array_equal(default2, legacy2)


def test_tps_changes_shapes_and_brings_strokes_closer():
    img1, img2 = _glyph_pair("の", "の")
    before = ((img1 > 30) & (img2 > 30)).sum() / ((img1 > 30) | (img2 > 30)).sum()
    tps1, tps2, info = snap_warper.snap_and_warp(img1, img2, snap_strength=0.75, warp_method="tps")
    legacy1, _, _ = snap_warper.snap_and_warp(img1, img2, snap_strength=0.75, warp_method="gaussian")
    after = ((tps1 > 30) & (tps2 > 30)).sum() / ((tps1 > 30) | (tps2 > 30)).sum()

    assert info["warp_method"] == "tps"
    assert not np.array_equal(tps1, legacy1)
    assert after > before


def test_tps_interpolates_control_points_without_regularization():
    warper = StrokeSnapWarper(tps_regularization=0.0, tps_grid_divisions=64)
    points = np.array([[40.0, 40.0], [200.0, 60.0], [120.0, 200.0], [60.0, 180.0], [180.0, 180.0]])
    disp = np.array([[5.0, -3.0], [0.0, 0.0], [-4.0, 2.0], [1.0, 1.0], [0.0, 0.0]])
    warper.tps_grid_divisions = 256
    dx, dy = warper._tps_backward_map(points, disp, (256, 256))
    for (x, y), (ex, ey) in zip(points.astype(int), disp):
        assert dx[y, x] == pytest.approx(ex, abs=0.05)
        assert dy[y, x] == pytest.approx(ey, abs=0.05)


def test_tps_keeps_affine_motion_exact():
    """TPSは曲げエネルギーが0の平行移動をそのまま再現する。"""
    warper = StrokeSnapWarper(tps_regularization=0.0, tps_grid_divisions=32)
    points = np.array([[30.0, 30.0], [220.0, 40.0], [40.0, 220.0], [210.0, 210.0], [128.0, 128.0]])
    disp = np.tile([3.0, -2.0], (points.shape[0], 1))
    dx, dy = warper._tps_backward_map(points, disp, (256, 256))
    assert np.allclose(dx, 3.0, atol=1e-3)
    assert np.allclose(dy, -2.0, atol=1e-3)


def test_engines_cache_and_report_each_method():
    engine = SkeletonAmbigramEngine()
    legacy = engine.generate("のの", font_id="zen_maru", slot_size=256)
    tps = engine.generate("のの", font_id="zen_maru", slot_size=256, warp_method="tps")
    assert legacy["details"]["warp_method"] == "gaussian"
    assert tps["details"]["warp_method"] == "tps"
    assert legacy["data"] != tps["data"]
    assert "Thin Plate Spline" in tps["steps"][3]["title"]
    assert "Thin Plate Spline" not in legacy["steps"][3]["title"]


def test_api_accepts_warp_method_and_rejects_unknown():
    client = TestClient(app)
    base = {"word": "のの", "engine": "skeleton", "font": "zen_maru"}

    legacy = client.post("/api/generate", json=base)
    assert legacy.status_code == 200
    assert legacy.json()["results"]["skeleton"]["details"]["warp_method"] == "gaussian"

    tps = client.post("/api/generate", json={**base, "warp_method": "tps"})
    assert tps.status_code == 200
    assert tps.json()["results"]["skeleton"]["details"]["warp_method"] == "tps"

    bad = client.post("/api/generate", json={**base, "warp_method": "unknown"})
    assert bad.status_code == 400
