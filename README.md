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
- [同梱フォントのライセンスとクレジット](#同梱フォントのライセンスとクレジット)

---

## 特徴
- **自己対称型特化探索**: 偶数文字・奇数文字（中央文字の自己回転対称性）の対称ペアを厳密にスコアリング。
- **先行研究エビデンスに基づく適性評価**: 査読論文（井上・高橋 2020、魏・山口 2023）の実証実験データ（可読率100%ペア／不可読0%ペア）および調和平均 (Harmonic Mean) による双方向成立度判定。
- **文脈認知補完モデル**: 常用語におけるトップダウン認知補完を考慮した単語ランキング。
- **20万語以上のマルチ表記辞書**: JMdictから抽出した日本語データ。カタカナ語表記（「アイス」「カメラ」等）や漢字表記（「大人」「花火」等）を統合管理。
- **表記ゆれ完全吸収・相互探索**: 「あいす」⇄「アイス」、「おとな」⇄「大人」など、ひらがな・カタカナ・漢字のどの表記で検索・直接入力しても相互に自動解決してアンビグラム適性評価および画像生成を実行。
- **マルチフォント自動幾何最適化 (Multi-Font Auto-Optimizer)**: 単語ごとに5種類の高品質日本語オープンソースフォント（極太フラット、丸ゴシック、幾何角ゴシック、硬筆ペン字、明朝体）の正反重なり面積・調和平均IoUおよび微小重心シフト（$\Delta x, \Delta y$）を探索し、最も高スコアとなるフォントを自動選定・適用。手動でのフォント切り替えやスコア比較ランキング一覧表示にも対応。
- **多彩な生成エンジン群**:
  1. **手法A: 論理積＋モルフォロジー膨張 (`morphology_engine.py`)**: 正反ピクセルの論理積 (AND) を核とし、二重線・ゴーストを解消した丸みのある単一ストロークを生成。
  2. **手法B: 骨格中心線 (スケルトン) 平均化 (`skeleton_engine.py`)**: 魏・山口 (2023) に着想を得た中心線アプローチ。調和平均距離場から中心骨格を抽出し、均一ブラシで一本化。
  3. **原案: ベクター / 幾何学的合成 (`vector_engine.py`)**: FontTools によるSVGアウトライン配置（パーツ対応ハイライト色分け対応）。
  4. **手法2: ビットマップ画像最適化 (`bitmap_engine.py`)**: OpenCV の距離変換とエネルギー最小化による輪郭融合。
  5. **手法3: クラウド生成AI (`gemini_engine.py`)**: Gemini API (Imagen 3) によるタイポグラフィアート生成。
- **Material Design 3 (M3) Web UI**: 適用フォント最適化セレクター、キャンバス直上での手法クイック切り替えバー、滑らかな180度回転アニメーション、正反スプリットビュー、ストローク色分け表示、SVG/PNGエクスポート。

---

## システム構成・ファイル構造

```
ambigram-maker/
├── backend/
│   ├── pyproject.toml              # uv パッケージ管理設定
│   ├── app.py                      # FastAPI サーバーエントリポイント
│   ├── fonts/                      # SIL OFL オープンソースフォント群
│   │   ├── ZenMaruGothic-Medium.ttf # 丸ゴシック
│   │   ├── DelaGothicOne-Regular.ttf# 極太フラット
│   │   ├── MPLUS1p-Bold.ttf        # 幾何角ゴシック
│   │   ├── KleeOne-SemiBold.ttf    # 硬筆ペン字
│   │   ├── ShipporiMincho-Bold.ttf # 明朝体
│   │   └── OFL.txt                 # SIL Open Font License 1.1 条文 & 著作権表示
│   ├── dictionary/
│   │   ├── parser.py               # JMdict ダウンロード・パーススクリプト (マルチ表記対応)
│   │   └── hiragana_words.json     # 抽出済み辞書 (208,532語)
│   ├── scoring/
│   │   ├── matrix.py               # 調和平均 & 実証ペア反映ハイブリッド適性マトリクス計算機
│   │   └── compatibility.json      # 82x82文字の適性スコアマトリクス
│   ├── search/
│   │   └── finder.py               # 文脈認知補完対応 自己対称単語探索・ランキングエンジン
│   └── generators/
│       ├── base.py                 # 共通生成インターフェース
│       ├── font_manager.py         # マルチフォント管理・微小シフト探索・幾何最適化判定
│       ├── morphology_engine.py    # 手法A: 論理積 (AND) ＋ モルフォロジー膨張エンジン (二重線解消)
│       ├── skeleton_engine.py      # 手法B: 骨格中心線 (スケルトン) 平均化エンジン (単一ストローク)
│       ├── vector_engine.py        # 原案: ベクター幾何合成エンジン (パーツ色分け対応)
│       ├── bitmap_engine.py        # 手法2: ビットマップ最適化エンジン
│       └── gemini_engine.py        # 手法3: Gemini API 生成エンジン
├── frontend/
│   ├── package.json                # pnpm パッケージ管理設定
│   ├── vite.config.ts
│   ├── index.html                  # Zen Maru Gothic読み込み & [DEV] タイトル
│   └── src/
│       ├── index.css               # Material Design 3 スタイルシート
│       ├── App.tsx                 # メインレイアウト & 状態管理
│       ├── components/
│       │   ├── WordSearch.tsx      # 単語探索・フィルタパネル (表記ゆれ対応・実証バッジ)
│       │   ├── AmbigramViewer.tsx  # 180度回転ビューワー (フォント最適化バー・手法切り替え)
│       │   ├── EngineCompare.tsx   # 手法比較・詳細パラメータ調整パネル (フォント選択対応)
│       │   └── ExportBar.tsx       # SVG / PNG エクスポートバー
│       └── services/
│           └── api.ts              # FastAPI 通信クライアント (フォント評価・生成API)
├── research/                       # 先行研究文献調査資料
│   ├── scholar_ambigram/           # Google Scholar調査結果 (メタデータ・論文要約・インデックス)
│   └── prior_research_insights.md  # 先行研究知見に基づくシステム改善提案書
├── reference                       # 参考仕様ファイル
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

1. **手法A: 論理積 ＋ モルフォロジー膨張 Engine (`morphology_engine.py`)**:
   - 正位置と180度反転文字のピクセル論理積（$A \cap B_{180}$）を「共通対称核」として抽出。
   - 二重線・ゴーストを100%消去した上で、モルフォロジー膨張（Dilation）とガウシアン平滑化により、文字本来の太さと美しい丸みを持つ単一ストロークを再構築します。
   - 異文字ペア（「た」↔「む」等）では固有パーツを適応ブレンド（`diff_blend`）して文字の消失を防止します。
2. **手法B: 骨格中心線 (スケルトン) 平均化 Engine (`skeleton_engine.py`)**:
   - 先行研究（魏・山口 2023）に着想を得た中心線アプローチ。
   - 正位置と反転文字のユークリッド距離変換の調和平均場から極大線（平均中心骨格）を抽出し、指定した均一線幅（`stroke_thickness`）の丸筆ペンで一本のストロークとして滑らかに再描画します。
3. **原案: ベクター / 幾何学的合成 Engine (`vector_engine.py`)**:
   - `FontTools` でフォントからSVGアウトラインを抽出し、正位置パスと180度回転パスを中心アライメントで幾何学的にマージします。
   - 「パーツ対応表示（Color Overlay）」モードを搭載（正位置固有：青、反転固有：橙、共通部分：深色合成）。
4. **手法2: ビットマップ画像最適化 Engine (`bitmap_engine.py`)**:
   - 高解像度グリフ画像に対し、`OpenCV` の距離変換（Distance Transform）とエネルギー最小化を適用。
   - ガウシアンブラーとモルフォロジー演算によって滑らかな白黒PNG画像を生成します。
5. **手法3: Gemini API 生成 Engine (`gemini_engine.py`)**:
   - Google GenAI SDK を通じて Imagen 3 を呼び出し、プロンプト誘導によるタイポグラフィアートを生成します。
   - APIキー未設定時でも他のエンジンは完全に動作します。

---

## 適性判定アルゴリズム

各文字ペア $(c_1, c_2)$ の回転適性スコアは以下を組み合わせて算出されます：
- **幾何学的類似度 (調和平均)**: 魏・山口 (2023) §2.2 に従い、正位置と180度反転位置のカバー率の調和平均 (Harmonic Mean) を採用。片方しか読めない非対称ペアを排除。
- **先行研究実証ペア反映**: 井上・高橋 (2020) の被験者可読性実験（1,081ペア）で実証された可読率1.0のペア（「あ」↔「ま」、「せ」↔「ぬ」等）を高スコアにシードし、不可読ペア（「と」↔「の」等）にペナルティを付与。
- **文脈認知補完モデル**: 井上・高橋 (2020) §6.2 の実証（常用単語で87.8%可読）に基づき、常用語に対するボトルネック文字の過剰な引き下げを緩和。
- **構造ペナルティ**: 濁音・半濁音の不一致や小文字（促音・拗音）の不一致に対する調整。

---

## 同梱フォントのライセンスとクレジット

本システムの `backend/fonts/` ディレクトリに同梱されているフォントファイルは、すべて **SIL Open Font License 1.1 (OFL-1.1)** に基づいて配布されているオープンソースフォントです。

### Git管理・同梱（バンドル）方針
SIL Open Font License 1.1 の規定（第2条）において：
> *"Original or Modified Versions of the Font Software may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license."*
（フォントソフトウェアは、著作権表示およびライセンス条文を保持する限り、任意のソフトウェアにバンドル・同梱して再配布することが許可される）

と明記されており、ソフトウェアリポジトリへの同梱および再配布が公式に認められています（単体での有償販売のみ禁止）。

本プロジェクトでは、`git clone` してすぐにフォント不足のエラーなくローカルでアンビグラム画像生成・ベクター合成を実行できるよう、フォントファイルをGit管理下に含めています（5フォント合計 約25.6MBであり、GitHubの単一ファイル制限100MBおよびリポジトリ推奨容量1GBの範囲内に完全に収まっています）。

| フォント名 | スタイル | 著作権表示 (Copyright) | プロジェクト / 配布元 | ライセンス |
| :--- | :--- | :--- | :--- | :--- |
| **Zen Maru Gothic** | 丸ゴシック (標準) | Copyright 2021 The Zen Maru Gothic Project Authors | [googlefonts/zen-marugothic](https://github.com/googlefonts/zen-marugothic) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Dela Gothic One** | 極太フラット | Copyright 2020 The Dela Gothic Project Authors | [syakuzen/DelaGothic](https://github.com/syakuzen/DelaGothic) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **M PLUS 1p** (Bold) | 幾何角ゴシック | Copyright 2020 The M+ FONT PROJECT Authors | [coz-m/MPLUS_FONTS](https://github.com/coz-m/MPLUS_FONTS) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Klee One** (SemiBold) | 硬筆ペン字 | Copyright 2020 The Klee Project Authors (Fontworks Inc.) | [fontworks-fonts/Klee](https://github.com/fontworks-fonts/Klee) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Shippori Mincho** (Bold) | 明朝体 | Copyright 2020 The Shippori Mincho Project Authors (FONTDASU) | [fontdasu/ShipporiMincho](https://github.com/fontdasu/ShipporiMincho) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |

ライセンス条文全文は [`backend/fonts/OFL.txt`](backend/fonts/OFL.txt) に収録されています。


