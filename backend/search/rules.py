"""
ランキング・探索候補のキュレーションルール管理モジュール (backend/search/rules.py)

ユーザー体験やサムネイルとしての印象を左右するランキング上位に対し、
ルールベースで除外 (exclude) やスコア補正 (boost / penalty) を適用する。
"""

from dataclasses import dataclass, field
import json
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

DEFAULT_RULES_PATH = Path(__file__).parent / "ranking_rules.json"


@dataclass
class ExcludedWordRule:
    word: str
    reading: str = ""
    scope: str = "all"  # "all": クエリ検索含む完全除外, "ranking": デフォルト一覧のみ除外
    reason: str = ""


@dataclass
class ScoreAdjustmentRule:
    word: str
    adjustment: float
    reason: str = ""


class RankingRuleManager:
    """ランキングおよび探索候補のルール管理クラス"""

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or DEFAULT_RULES_PATH
        self.excluded_words: dict[str, ExcludedWordRule] = {}
        self.score_adjustments: dict[str, ScoreAdjustmentRule] = {}
        self.load()

    def load(self) -> None:
        """設定ファイルからルールをロード"""
        self.excluded_words.clear()
        self.score_adjustments.clear()

        if not self.config_path.exists():
            logger.warning(f"キュレーションルール設定ファイルが見つかりません: {self.config_path}")
            return

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            rules_data = data.get("rules", {})

            for item in rules_data.get("excluded_words", []):
                word = item.get("word", "").strip()
                if not word:
                    continue
                rule = ExcludedWordRule(
                    word=word,
                    reading=item.get("reading", "").strip(),
                    scope=item.get("scope", "all").strip(),
                    reason=item.get("reason", "").strip(),
                )
                self.excluded_words[word] = rule
                if rule.reading:
                    self.excluded_words[rule.reading] = rule

            for item in rules_data.get("score_adjustments", []):
                word = item.get("word", "").strip()
                if not word:
                    continue
                rule = ScoreAdjustmentRule(
                    word=word,
                    adjustment=float(item.get("adjustment", 0.0)),
                    reason=item.get("reason", "").strip(),
                )
                self.score_adjustments[word] = rule

            logger.info(
                f"キュレーションルール読み込み完了: 除外={len(rules_data.get('excluded_words', []))}件, "
                f"スコア補正={len(self.score_adjustments)}件"
            )
        except Exception as e:
            logger.error(f"キュレーションルール読み込み中にエラーが発生しました: {e}", exc_info=True)

    def save(self) -> None:
        """現在のルールを設定ファイルに保存"""
        # 重複（reading登録分）を除いてユニークなルールリストを作成
        unique_excluded = []
        seen_words = set()
        for rule in self.excluded_words.values():
            if rule.word not in seen_words:
                seen_words.add(rule.word)
                unique_excluded.append({
                    "word": rule.word,
                    "reading": rule.reading,
                    "scope": rule.scope,
                    "reason": rule.reason,
                })

        adjustments_list = [
            {
                "word": rule.word,
                "adjustment": rule.adjustment,
                "reason": rule.reason,
            }
            for rule in self.score_adjustments.values()
        ]

        data = {
            "version": 1,
            "description": "アンビグラム探索・ランキングのキュレーションルール設定 (サムネイル・上位候補の品質管理用)",
            "rules": {
                "excluded_words": unique_excluded,
                "score_adjustments": adjustments_list,
            },
        }

        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def is_excluded(self, word: str, reading: str = "", query: str = "") -> bool:
        """
        指定単語が除外対象か判定する。
        - scope == "all": クエリの有無に関わらず探索・ランキングから除外
        - scope == "ranking": クエリが空（デフォルトランキング）の場合のみ除外
        """
        rule = self.excluded_words.get(word) or (self.excluded_words.get(reading) if reading else None)
        if not rule:
            return False

        if rule.scope == "ranking":
            return not bool(query and query.strip())
        return True

    def get_score_adjustment(self, word: str) -> float:
        """指定単語のスコア補正値を取得（未登録なら0.0）"""
        rule = self.score_adjustments.get(word)
        return rule.adjustment if rule else 0.0

    def add_exclusion(
        self,
        word: str,
        reason: str = "",
        reading: str = "",
        scope: str = "all",
        save: bool = True,
    ) -> None:
        """新しい除外ルールを追加"""
        rule = ExcludedWordRule(
            word=word.strip(),
            reading=reading.strip(),
            scope=scope.strip(),
            reason=reason.strip(),
        )
        self.excluded_words[rule.word] = rule
        if rule.reading:
            self.excluded_words[rule.reading] = rule
        if save:
            self.save()

    def remove_exclusion(self, word: str, save: bool = True) -> bool:
        """除外ルールを削除"""
        rule = self.excluded_words.pop(word, None)
        if rule:
            if rule.reading and rule.reading in self.excluded_words:
                self.excluded_words.pop(rule.reading, None)
            if save:
                self.save()
            return True
        return False

    def add_score_adjustment(
        self, word: str, adjustment: float, reason: str = "", save: bool = True
    ) -> None:
        """新しいスコア補正ルールを追加"""
        rule = ScoreAdjustmentRule(
            word=word.strip(), adjustment=adjustment, reason=reason.strip()
        )
        self.score_adjustments[rule.word] = rule
        if save:
            self.save()
