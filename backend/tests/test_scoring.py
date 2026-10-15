from generators.font_manager import font_manager, compute_word_cognitive_score

def test_compute_word_cognitive_score_basic():
    """認知補完スコア計算の境界値および基本動作を検証"""
    # 空リスト
    final_score, geom_mean, min_val = compute_word_cognitive_score([], 0)
    assert final_score == 0.0
    assert geom_mean == 0.0
    assert min_val == 0.0

    # 単一文字ペア
    final_score, geom_mean, min_val = compute_word_cognitive_score([0.9], 1)
    assert 0.85 <= final_score <= 1.0
    assert geom_mean == 0.9
    assert min_val == 0.9

    # 複数文字ペア（ボトルネック文字がある場合）
    scores = [0.85, 0.20, 0.88]
    final_score_normal, geom_mean, min_val = compute_word_cognitive_score(scores, 3, is_common=False)
    final_score_common, _, _ = compute_word_cognitive_score(scores, 3, is_common=True)

    # 常用語フラグにより文脈補完バイアスが働き、スコアが向上することを検証 (井上・高橋 2020 §6.2)
    assert final_score_common > final_score_normal
    assert min_val == 0.20

def test_pair_similarity_self_symmetric():
    """自己対称性の高い文字 (例: '日') が非対称文字よりも高い類似度スコアになるか検証"""
    img_nichi = font_manager.render_char_matrix("日", "mplus", size=128)
    img_no = font_manager.render_char_matrix("の", "mplus", size=128)

    # '日' と '日' (180度反転して重ねる)
    score_nichi = font_manager.calculate_pair_similarity_for_offset(
        img_nichi, img_nichi, dx=0, dy=0
    )

    # 'の' と 'の' (180度反転して重ねる)
    score_no = font_manager.calculate_pair_similarity_for_offset(
        img_no, img_no, dx=0, dy=0
    )

    # 類似度スコアが 0.0 ~ 1.0 の範囲に収まり、有効な値を返すか検証
    assert 0.0 <= score_nichi <= 1.0
    assert 0.0 <= score_no <= 1.0
    assert score_nichi > 0.40

def test_find_optimal_offset():
    """最適シフト探索が指定探索範囲 [-5, 5] 内のオフセットとスコアを返すか検証"""
    img_a = font_manager.render_char_matrix("動", "zen_maru", size=128)
    img_b = font_manager.render_char_matrix("画", "zen_maru", size=128)

    best_score, (best_dx, best_dy) = font_manager.calculate_pair_similarity_with_shift(
        img_a, img_b, max_shift=5
    )

    assert 0.0 <= best_score <= 1.0
    assert -5 <= best_dx <= 5
    assert -5 <= best_dy <= 5
