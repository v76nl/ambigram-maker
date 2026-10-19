from search.finder import AmbigramFinder
from search.rules import RankingRuleManager


def test_curation_rules_exclude_words():
    f = AmbigramFinder()

    # 1. デフォルト検索（同国、日の目が除外されていること）
    res_default = [w["target_text"] for w in f.search(limit=20)]
    assert "同国" not in res_default, "「同国」がデフォルト検索から除外されていません"
    assert "日の目" not in res_default, "「日の目」がデフォルト検索から除外されていません"

    # 2. scope="all" なので、query='同国' でも除外されること
    res_query = [w["target_text"] for w in f.search(query="同国", limit=10)]
    assert "同国" not in res_query, "「同国」がクエリ検索から除外されていません"

    # 3. 自由入力評価（evaluate_word）では計算できること
    eval_res = f.evaluate_word("同国")
    assert eval_res["score"] > 0, "自由入力評価は正常に動作するべきです"


def test_ranking_rule_manager_operations(tmp_path):
    config_file = tmp_path / "test_rules.json"
    manager = RankingRuleManager(config_path=config_file)

    # 初期状態
    assert not manager.is_excluded("テスト")

    # 除外ルールの追加
    manager.add_exclusion("テスト", reason="テスト理由")
    assert manager.is_excluded("テスト")

    # 新しいインスタンスで永続化確認
    manager2 = RankingRuleManager(config_path=config_file)
    assert manager2.is_excluded("テスト")

    # スコア補正ルールの追加
    manager2.add_score_adjustment("テスト", adjustment=0.1, reason="ブースト")
    assert manager2.get_score_adjustment("テスト") == 0.1

    # 削除
    assert manager2.remove_exclusion("テスト")
    assert not manager2.is_excluded("テスト")
