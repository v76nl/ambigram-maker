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


def test_similarity_components_blend_to_score():
    """3つの要素を既定の重みで足すと、従来の幾何類似度と一致する"""
    from generators.font_manager import SIMILARITY_WEIGHTS, blend_similarity

    img_a = font_manager.render_char_matrix("長", "zen_maru")
    img_b = font_manager.render_char_matrix("寿", "zen_maru")
    components = font_manager.pair_similarity_components(img_a, img_b, 0, 0)
    score = font_manager.calculate_pair_similarity_for_offset(img_a, img_b, 0, 0)

    assert components is not None
    assert set(components) == set(SIMILARITY_WEIGHTS)
    assert all(0.0 <= v <= 1.0 for v in components.values())
    assert abs(blend_similarity(components) - score) < 1e-9
    assert abs(sum(SIMILARITY_WEIGHTS.values()) - 1.0) < 1e-9
