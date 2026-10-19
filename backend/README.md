# バックエンド (Backend API)

日本語180度回転型アンビグラムの探索・生成・可読性評価を提供する FastAPI サーバーです。

## ランキング・キュレーションルール設定

探索ランキングの上位（サムネイル・初期表示）に対し、ルールベースで表示をコントロールできます。

設定ファイル: [`search/ranking_rules.json`](search/ranking_rules.json)

### ルールの構成

```json
{
  "version": 1,
  "description": "アンビグラム探索・ランキングのキュレーションルール設定",
  "rules": {
    "excluded_words": [
      {
        "word": "同国",
        "reading": "どうこく",
        "scope": "all",
        "reason": "感覚として日常的・一般的な言葉ではないため除外"
      },
      {
        "word": "日の目",
        "reading": "ひのめ",
        "scope": "all",
        "reason": "スコアは良いが生成結果の視覚的品質が良くないため除外"
      }
    ],
    "score_adjustments": [
      {
        "word": "最悪",
        "adjustment": 0.05,
        "reason": "代表作のため上位にブースト"
      }
    ]
  }
}
```

### 設定項目
- `excluded_words`:
  - `word`: 除外する表記（漢字、カタカナ、ひらがな等）
  - `reading`: 読み（任意）
  - `scope`:
    - `"all"`: クエリ検索含む完全除外
    - `"ranking"`: デフォルトランキング（空クエリ時）のみ除外
  - `reason`: ルール追加の理由・メモ
- `score_adjustments`:
  - `word`: 補正対象の単語
  - `adjustment`: スコア加算値（正の値でブースト、負の値で降格）
  - `reason`: 補正理由・メモ
