# ひらがな自己対称180度回転アンビグラム自動生成システム

180度回転させた際に元の単語と同じ文字列として読める「自己対称型 (Rotational Symmetry) アンビグラム」を自動生成するシステムです。
JMdict辞書から抽出した20万語以上のひらがな単語から幾何学的適性スコアの高い単語を高速探索し、3つの異なるグラフィック生成エンジンでアンビグラムを生成・比較・エクスポートできます。

---

## 目次
- [特徴](#特徴)
- [システム構成・ファイル構造](#システム構成ファイル構造)
- [セットアップと実行方法](#セットアップと実行方法)
- [主要コマンド一覧](#主要コマンド一覧)
- [グラフィック生成エンジン仕様](#グラフィック生成エンジン仕様)
- [適性判定アルゴリズム](#適性判定アルゴリズム)

---

## 特徴
- **自己対称型特化探索**: 偶数文字・奇数文字（中央文字の自己回転対称性）の対称ペアを厳密にスコアリング。
- **20万語以上のひらがな辞書**: JMdictから抽出した日本語読みデータ（常用語フラグ付き）。
- **3つの生成エンジン**:
  1. ベクター / 幾何学的合成 (FontTools + Shapely によるSVG生成)
  2. ビットマップ画像最適化 (OpenCV + NumPy による高解像度PNG生成)
  3. クラウド生成AI (Gemini API / Imagen 3 によるタイポグラフィ生成)
- **Material Design 3 (M3) Web UI**: Zen Maru Gothicフォント、滑らかな180度回転アニメーション、正反スプリットビュー、SVG/PNGエクスポート。

---

## システム構成・ファイル構造

```
ambigram-maker/
├── backend/
│   ├── pyproject.toml              # uv パッケージ管理設定
│   ├── app.py                      # FastAPI サーバーエントリポイント
│   ├── fonts/
│   │   └── ZenMaruGothic-Medium.ttf # 基準フォント
│   ├── dictionary/
│   │   ├── parser.py               # JMdict ダウンロード・パーススクリプト
│   │   └── hiragana_words.json     # 抽出済みひらがな辞書 (208,532語)
│   ├── scoring/
│   │   ├── matrix.py               # ハイブリッド適性マトリクス計算機
│   │   └── compatibility.json      # 82x82文字の適性スコアマトリクス
│   ├── search/
│   │   └── finder.py               # 自己対称単語探索・ランキングエンジン
│   └── generators/
│       ├── base.py                 # 共通生成インターフェース
│       ├── vector_engine.py        # 1. ベクター幾何合成エンジン
│       ├── bitmap_engine.py        # 2. ビットマップ最適化エンジン
│       └── gemini_engine.py        # 3. Gemini API 生成エンジン
├── frontend/
│   ├── package.json                # pnpm パッケージ管理設定
│   ├── vite.config.ts
│   ├── index.html                  # Zen Maru Gothic読み込み & [DEV] タイトル
│   └── src/
│       ├── index.css               # Material Design 3 スタイルシート
│       ├── App.tsx                 # メインレイアウト & 状態管理
│       ├── components/
│       │   ├── WordSearch.tsx      # 単語探索・フィルタパネル
│       │   ├── AmbigramViewer.tsx  # 180度回転ビューワー & スプリット比較
│       │   ├── EngineCompare.tsx   # 3手法比較・パラメータ調整
│       │   └── ExportBar.tsx       # SVG / PNG エクスポートバー
│       └── services/
│           └── api.ts              # FastAPI 通信クライアント
├── reference                       # 参考仕様ファイル
└── README.md
```

---

## セットアップと実行方法

### 1. バックエンドの起動 (Python / uv)
```bash
cd backend
uv run uvicorn app:app --port 8000 --reload
```

### 2. フロントエンドの起動 (Node.js / pnpm)
```bash
cd frontend
pnpm install
pnpm dev
```
ブラウザで `http://localhost:5173` にアクセスしてください。

---

## 主要コマンド一覧

| 操作内容 | ディレクトリ | コマンド |
| :--- | :--- | :--- |
| バックエンド依存関係インストール | `backend/` | `uv sync` |
| 辞書データの再構築 | `backend/` | `uv run python dictionary/parser.py` |
| 適性マトリクスの再計算 | `backend/` | `uv run python scoring/matrix.py` |
| 探索エンジンの単体テスト | `backend/` | `uv run python search/finder.py` |
| バックエンドサーバー起動 | `backend/` | `uv run uvicorn app:app --port 8000 --reload` |
| フロントエンド依存関係インストール | `frontend/` | `pnpm install` |
| フロントエンド開発サーバー起動 | `frontend/` | `pnpm dev` |
| フロントエンドビルド・型チェック | `frontend/` | `pnpm run build` |

---

## グラフィック生成エンジン仕様

1. **ベクター / 幾何学的合成 Engine (`vector_engine.py`)**:
   - `FontTools` でフォントからSVGアウトラインを抽出し、正位置パスと180度回転パスを中心アライメントで幾何学的にマージします。
   - 共通骨格領域と差分ストロークをブレンド比率に応じて合成し、ベクターSVGとして出力します（拡大縮小無制限）。
2. **ビットマップ画像最適化 Engine (`bitmap_engine.py`)**:
   - 高解像度グリフ画像に対し、`OpenCV` の距離変換（Distance Transform）とエネルギー最小化を適用。
   - ガウシアンブラーとモルフォロジー演算によって滑らかな白黒PNG画像を生成します。
3. **Gemini API 生成 Engine (`gemini_engine.py`)**:
   - Google GenAI SDK を通じて Imagen 3 を呼び出し、プロンプト誘導によるタイポグラフィアートを生成します。
   - APIキー未設定時でも他のエンジンは完全に動作します。

---

## 適性判定アルゴリズム

各文字ペア $(c_1, c_2)$ の回転適性スコアは以下を組み合わせて算出されます：
- **幾何学的類似度**: 128x128グリフマスクの Intersection over Union (IoU) および包含度（Coverage）。
- **ドメイン知識補正**: アンビグラムとして伝統的・視覚的に成立しやすい代表ペア（例: 「し」↔「つ」、「の」↔「の」、「い」↔「い」等）に対するボーナス重み付け。
- **構造ペナルティ**: 濁音・半濁音の不一致や小文字（促音・拗音）の不一致に対する調整。
