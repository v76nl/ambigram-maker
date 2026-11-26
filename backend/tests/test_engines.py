from generators.skeleton_engine import SkeletonAmbigramEngine
from generators.morphology_engine import MorphologyAmbigramEngine
from generators.vector_engine import VectorAmbigramEngine
from generators.bitmap_engine import BitmapAmbigramEngine

def test_skeleton_engine_generation():
    """手法B: 骨格平均化エンジンの生成パイプラインを検証"""
    engine = SkeletonAmbigramEngine()
    result = engine.generate("日の目")

    assert result["engine"] == "skeleton"
    assert result["data"].startswith("data:image/png;base64,")
    assert "steps" in result
    assert len(result["steps"]) >= 4
    assert "details" in result
    assert result["details"]["length"] == 3

def test_morphology_engine_generation():
    """手法A: 論理積＋モルフォロジー膨張エンジンの生成パイプラインを検証"""
    engine = MorphologyAmbigramEngine()
    result = engine.generate("日の目")

    assert result["engine"] == "morphology"
    assert result["data"].startswith("data:image/png;base64,")
    assert "steps" in result
    assert len(result["steps"]) >= 4

def test_vector_engine_generation():
    """原案: ベクター幾何合成エンジンの生成パイプラインを検証"""
    engine = VectorAmbigramEngine()
    result = engine.generate("日の目")

    assert result["engine"] == "vector"
    assert result["data"].startswith("<svg") or result["data"].startswith("data:image/")
    assert "steps" in result

def test_bitmap_engine_generation():
    """手法2: ビットマップ最適化エンジンの生成パイプラインを検証"""
    engine = BitmapAmbigramEngine()
    result = engine.generate("日の目")

    assert result["engine"] == "bitmap"
    assert result["data"].startswith("data:image/png;base64,")


def test_skeleton_centerline_threshold():
    """中心線の閾値を省略すると既定値と同じ結果になり、上げると残る線が減る"""
    import numpy as np
    from generators.skeleton_engine import CENTERLINE_THRESHOLD_DIFF

    engine = SkeletonAmbigramEngine()
    default = engine.generate_slot("長", "寿", size=256, enable_snap=False)
    explicit = engine.generate_slot("長", "寿", size=256, enable_snap=False,
                                    centerline_threshold=CENTERLINE_THRESHOLD_DIFF)
    high = engine.generate_slot("長", "寿", size=256, enable_snap=False, centerline_threshold=0.45)

    assert np.array_equal(default, explicit)
    assert np.count_nonzero(high) < np.count_nonzero(default)
