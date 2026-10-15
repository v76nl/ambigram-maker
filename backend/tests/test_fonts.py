import numpy as np
import pytest
from generators.font_manager import font_manager, FONT_PRESETS

EXPECTED_FONTS = [
    "zen_maru",
    "mplus",
    "klee",
    "shippori",
    "biz_udpgothic",
    "yuji_mai",
    "kaisei_tokumin",
    "dot_gothic",
    "marumonica",
]

def test_font_presets_completeness():
    """全9書体が正しくプリセットに登録されているか検証"""
    assert len(FONT_PRESETS) == 9
    for font_id in EXPECTED_FONTS:
        assert font_id in FONT_PRESETS, f"Missing preset: {font_id}"
        path = font_manager.get_font_path(font_id)
        assert path.exists(), f"Font file not found on disk: {path}"

@pytest.mark.parametrize("font_id", EXPECTED_FONTS)
def test_font_rendering(font_id):
    """各フォントで基本文字が欠損なく描画できるか検証"""
    test_chars = ["日", "の", "目", "急", "事"]
    for c in test_chars:
        matrix = font_manager.render_char_matrix(c, font_id, size=128)
        assert isinstance(matrix, np.ndarray)
        assert matrix.shape == (128, 128)
        assert matrix.sum() > 0, f"Font {font_id} rendered empty glyph for '{c}'"

@pytest.mark.parametrize("font_id", EXPECTED_FONTS)
def test_font_skeleton_extraction(font_id):
    """各フォントで骨格中心線 (1px skeleton) が正常に抽出できるか検証"""
    skel = font_manager.render_char_skeleton("日", font_id, size=128)
    assert isinstance(skel, np.ndarray)
    assert skel.shape == (128, 128)
    assert skel.sum() > 0, f"Skeleton extraction failed for {font_id}"

def test_marumonica_complex_kanji_support():
    """MaruMonicaが第1・第2水準の難読漢字も欠損なく描画できるか検証"""
    complex_chars = ["薔", "薇", "憂", "鬱", "幻", "零"]
    for c in complex_chars:
        matrix = font_manager.render_char_matrix(c, "marumonica", size=128)
        assert matrix.sum() > 0, f"MaruMonica failed to render complex kanji '{c}'"
