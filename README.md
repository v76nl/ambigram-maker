# フォント骨格の手順的変形に基づく180度回転型日本語アンビグラム制作支援システム

> **要約**  
> 辞書からの単語探索、近接ストローク吸引、文字骨格の変形などの手順的生成フローを統合し、180度点対称性と可読性を両立するタイポグラフィ設計のための日本語アンビグラム制作支援システムを実装した。

180度回転させた際に元の単語と同じ文字列として読める「自己対称型 (Rotational Symmetry) アンビグラム」の制作を支援するタイポグラフィ設計システムです。  
JMdict辞書から抽出した20万語以上の日本語単語から正規表現・文字種で探索し、フォント骨格の手順的変形（近接ストローク吸引、調和平均骨格化、モルフォロジー膨張）によって高品質なアンビグラムを生成します。

---

## 目次

- [特徴](#特徴)
- [システム構成・ファイル構造](#システム構成ファイル構造)
- [セットアップと実行方法](#セットアップと実行方法)
- [主要コマンド一覧](#主要コマンド一覧)
- [グラフィック生成エンジン仕様](#グラフィック生成エンジン仕様)
- [適性判定アルゴリズム](#適性判定アルゴリズム)
- [中間工程パイプラインと再現可能性](#中間工程パイプラインと再現可能性)
- [同梱フォントのライセンスとクレジット](#同梱フォントのライセンスとクレジット)
- [関連ドキュメント](#関連ドキュメント)

---

## 特徴

- **正規表現対応の高速単語探索**: 単なる部分一致検索だけでなく、正規表現 (例: `.+の.+` や `^.の.$`, `.*桜.*` 等) による柔軟な単語パターン探索に対応。
- **真の文字表記によるアンビグラム判別・生成**: 漢字語 (「頼む」等) やカタカナ語 (「アイス」等) をひらがなに強制変換せず、本来の文字ペア (「頼」↔「む」、「ア」↔「ス」) で幾何対称性を判別し、本物のアンビグラムグラフィックを描画。漢字表記語では冗長な読み仮名を排した端正なタイポグラフィ表示。
- **先行研究エビデンスに基づく適性評価**: 査読論文 (井上・高橋 2020、魏・山口 2023) の実証実験データ (可読率100%ペア／不可読0%ペア) および調和平均 (Harmonic Mean) による双方向成立度判定 (`0.xxx` 形式の厳密な小数スコア表示)。
- **文脈認知補完数理モデル (井上・高橋 2020 §6.2 表5)**: 幾何平均と単語長・常用語フラグから、ボトルネック文字の引き下げ重みを動的に緩和するトップダウン認知補完数理モデルを実装。
- **近接ストローク引力スナップ & 局所非剛体変形 (Thin Plate Spline)**: 剛体回転の限界を突破するベクトル引力場と距離変換ワープ、およびThin Plate Spline (TPS) 弾性変形モデル (吸引強度0〜100%をスライダー調整可能) により、「の」の中央縦棒など近接した非対称ストロークを中間対称軸へ滑らかに磁石スナップ・一本化 (数理設計は `docs/ISSUES.md` 参照)。
- **筆文字可変幅ストローク & 太さ抑揚変調 (井上・高橋 §5 / 野村 2018)**: 手法B (スケルトン平均化) に毛筆45度楕円ブラシおよび共通対称核強調・固有パーツ細線化の太さ変調を搭載。
- **生成工程パイプライン (Processing Pipeline Steps) の可視化**: 各生成エンジンが内部で実行している中間処理ステップ (元画像描画、距離場計算、骨格抽出、近接吸引、輪郭復元等) をサムネイル一覧で提示し、ワンクリックでメイン画面に拡大プレビュー可能。
- **研究・制作の再現可能性 (Reproducibility) を担保するエクスポート & インポート復元**: ベクターSVG・PNG画像に加え、使用フォント、文字ペア別XYシフト量、生成パラメータ、可読性評価数値をまとめた設定JSONを同時書き出し可能。また、保存したJSONを読み込むことで作業状態 (単語・手法・フォント・XYずらし・全パラメータ) を完全再現可能。
- **対応文字ペアごとの重心位置微調整 (XYずらし)**: タブを往復することなく、全文字ペア (「動 ↔ 画」など) の重心シフト量 (X/Y) を一覧で見渡しながら個別にスライダー調整可能。
- **各スライダーの操作ガイドヒント**: 「▲増: 線が細く読みにくいとき / ▼減: 線が潰れて黒く詰まるとき」など、各パラメータをいつ増減させるべきかの直感的なガイドを併記。
- **最優先割り込み (Cancellation) ＆ 高速レスポンス**: 単語選択時の即座発火 (0ms) と先行バックグラウンド処理 (可読性評価・スロット計算等) の即時中断シグナル発行、幾何シフト探索・スロット画像の多層インメモリキャッシュによるスムーズなUIレスポンス。
- **リアルタイム生成中インジケータ**: スライダー操作やパラメータ変更による再生成時に、メイン画面上に「生成中……」のオーバーレイを即座に表示。
- **AI客観文字認識・双方向可読性評価 (魏・山口 2023 §2.2)**: JIS第1水準漢字 (2,965文字) ＋ ひらがな ＋ カタカナの計3,082字種に対応する軽量ONNX CNNモデル (`model.fp16.onnx`, `labels.json`) を内包し、アンビグラムの正反両方向の認識確率 $P(c_1), P(c_2)$ および調和平均可読性をリアルタイム評価。
- **固定ピン留め比較ギャラリー (Pinned Gallery)**: 画面右下のピン留めアイコンにより、お気に入りの生成結果を画面下部トレイに永続保存 (`localStorage`)。複数単語・フォントの並行比較やワンクリックでのパラメータ復元が可能。
- **スイス・スタイル 3ペイン Sticky レイアウト**: 左右ペイン (単語探索・微調整パラメータ) をスクロールしても、中央ペインのアンビグラムビューワーが画面上部に固定 (sticky) され、作業中の視線移動を最小化。画面スクロール時には軽量追従バーが上部に出現。

---

## システム構成・ファイル構造

```
ambigram-maker/
├── backend/
│   ├── pyproject.toml              # uv パッケージ管理設定
│   ├── app.py                      # FastAPI サーバーエントリポイント (SSE・可読性・パイプラインAPI)
│   ├── cancellation.py             # 先行処理中断マネージャー (最優先割り込み・キャンセル制御)
│   ├── tests/                      # pytest 自動テストスイート (31テスト)
│   │   ├── conftest.py             # テスト環境・パス設定
│   │   ├── test_fonts.py           # フォント存在・文字描画・骨格抽出テスト
│   │   ├── test_scoring.py         # 幾何類似度・認知補完数理モデルテスト
│   │   ├── test_engines.py         # 全生成エンジンパイプライン検証
│   │   └── test_api.py             # FastAPI エンドポイント統合テスト
│   ├── fonts/                      # 日本語フォント群 (全9書体)
│   │   ├── ZenMaruGothic-Medium.ttf # 丸ゴシック
│   │   ├── MPLUS1p-Bold.ttf        # 幾何角ゴシック
│   │   ├── KleeOne-SemiBold.ttf    # 硬筆ペン字
│   │   ├── ShipporiMincho-Bold.ttf # 明朝体
│   │   ├── BIZUDPGothic-Bold.ttf   # UD角ゴシック
│   │   ├── YujiMai-Regular.ttf     # 毛筆・行書
│   │   ├── KaiseiTokumin-Bold.ttf  # 幾何学モダン明朝
│   │   ├── DotGothic16-Regular.ttf # 16pxドット
│   │   ├── x12y16pxMaruMonica.ttf  # 12x16px丸ピクセル
│   │   └── OFL.txt                 # SIL Open Font License 1.1 条文 & 著作権表示
│   ├── dictionary/
│   │   ├── parser.py               # JMdict パーススクリプト (マルチ表記対応)
│   │   ├── hiragana_words.json     # 抽出済み辞書 (208,532語)
│   │   ├── scored_words.json       # 事前スコア計算済み高速インデックス (10,917語)
│   │   └── test_words.json         # 既知の180度回転アンビグラム評価用データセット
│   ├── scoring/
│   │   ├── matrix.py               # 幾何学的類似度 (4層幾何エンジン) 計算機
│   │   └── compatibility.json      # 文字間回転適性スコアマトリクス
│   ├── search/
│   │   └── finder.py               # 正規表現対応 単語探索・ランキングエンジン
│   ├── evaluation/
│   │   ├── recognizer.py           # 客観文字認識・両方向可読性評価エンジン (ONNX CNN)
│   │   └── models/
│   │       ├── model.fp16.onnx     # 3,082字種 (漢字・仮名) 対応 軽量ONNX CNNモデル
│   │       └── labels.json         # 文字ラベル辞書 (3,082クラス)
│   └── generators/
│       ├── base.py                 # 共通生成インターフェース (PipelineStep 定義)
│       ├── font_manager.py         # マルチフォント管理・微小シフト探索・文脈認知補完
│       ├── snap_warper.py          # 近接ストローク引力スナップ・局所非剛体変形 (TPS弾性変形)
│       ├── morphology_engine.py    # 手法A: 論理積 ＋ モルフォロジー膨張 (ステッププレビュー対応)
│       ├── skeleton_engine.py      # 手法B: 骨格中心線平均化 (筆文字・太さ変調・ステップ対応)
│       ├── vector_engine.py        # 原案: ベクター幾何合成 (最適XYシフト・ステップ対応)
│       ├── bitmap_engine.py        # 手法2: ビットマップ最適化
│       └── gemini_engine.py        # 手法3: Gemini API 生成
├── frontend/
│   ├── package.json                # pnpm パッケージ管理設定
│   ├── vite.config.ts
│   ├── index.html                  # Zen Maru Gothic読み込み & メタデータ
│   └── src/
│       ├── index.css               # スイス・スタイル デザインシステム (Sticky, 生成中オーバーレイ等)
│       ├── App.tsx                 # 3ペイン Sticky ワークスペース & 状態管理
│       ├── components/
│       │   ├── WordSearch.tsx      # 単語探索パネル (正規表現・文字種トグル・小数表示)
│       │   ├── AmbigramViewer.tsx  # ビューワー (生成中オーバーレイ・追従Stickyバー・工程プレビュー)
│       │   ├── SymmetryCard.tsx    # 対称文字ペア解析カード (小数表示)
│       │   ├── ReadabilityCard.tsx # 客観文字認識・双方向可読性評価カード
│       │   ├── FontSelector.tsx    # フォント選定 & 文字ペア別XY重心微調整パネル
│       │   ├── EngineCompare.tsx   # 手法比較 & パラメータ操作 (増減ヒント付き)
│       │   ├── PipelineViewer.tsx  # 中間工程パイプライン (ステップ別プレビュー)
│       │   ├── PinnedGallery.tsx   # 固定ピン留め比較ギャラリー (永続化トレイ)
│       │   ├── MathText.tsx        # 数式・記号レンダリング
│       │   └── ExportBar.tsx       # SVG/PNG/JSON & 再現パラメータ一括エクスポート
│       └── services/
│           └── api.ts              # API クライアント (PipelineStep, Export パラメータ型定義)
├── slides/                         # 研究発表スライド環境 (Marp)
│   ├── slides.md                   # スライド原稿 (Markdown)
│   ├── scripts/                    # ビルドスクリプト ＆ はみ出し自動検査
│   └── .env.example                # 発表者情報用環境変数テンプレート
├── test_words.json                 # 既知アンビグラム単語データセット (評価・ベンチマーク用)
├── research/                       # 先行研究文献調査資料 (Google Scholar・分析提案書)
└── reference                       # 参考仕様ファイル
```

---

## セットアップと実行方法

### 一括起動 (推奨: フロント & バックを同時起動)

プロジェクトルートにて以下のいずれかを実行すると、バックエンド (FastAPI: 8000) とフロントエンド (Vite: 5173) が一括で起動します。

```bash
# 方法1: pnpm (推奨)
pnpm dev

# 方法2: Python スクリプト
python run.py

# 方法3: Windows バッチファイル (ダブルクリックでも可)
run.bat
```

起動後、ブラウザで `http://localhost:5173` にアクセスしてください。Ctrl+C で両プロセスを一括停止できます。

---

### 個別起動

#### 1. バックエンドのみ起動 (Python / uv)

```bash
cd backend
uv run uvicorn app:app --port 8000 --reload
```

#### 2. フロントエンドのみ起動 (Node.js / pnpm)

```bash
cd frontend
pnpm install
pnpm dev
```

---

## 主要コマンド一覧

| 操作内容                                | ディレクトリ | コマンド                                         |
| :-------------------------------------- | :----------- | :----------------------------------------------- |
| **フロント ＆ バック一括起動**          | ルート       | `pnpm dev` または `python run.py` / `run.bat`    |
| バックエンド依存関係インストール        | `backend/`   | `uv sync`                                        |
| 辞書データの再構築                      | `backend/`   | `uv run python dictionary/parser.py`             |
| 事前スコアインデックスの作成            | `backend/`   | `uv run python dictionary/build_scored_index.py` |
| 適性マトリクスの再計算                  | `backend/`   | `uv run python scoring/matrix.py`                |
| 探索エンジンの単体テスト (正規表現含む) | `backend/`   | `uv run python search/finder.py`                 |
| フロントエンド依存関係インストール      | `frontend/`  | `pnpm install`                                   |
| フロントエンド開発サーバー単体起動      | `frontend/`  | `pnpm dev`                                       |
| **全自動テスト一括実行 (pytest ＆ Vitest)** | ルート       | `pnpm test` または `python test.py` / `test.bat` |
| **バックエンド自動テスト (pytest)**     | `backend/`   | `uv run pytest`                                  |
| **フロントエンド自動テスト (Vitest)**   | `frontend/`  | `pnpm test`                                      |
| **スライドローカル確認 (ポート8080)**   | ルート       | `pnpm slides:serve`                              |
| **スライド全形式一括ビルド**           | ルート       | `pnpm slides:build`                              |
| **スライドPPTX形式 (PowerPoint) 生成** | ルート       | `pnpm slides:build:pptx`                         |
| **スライド要素はみ出し自動検査**        | ルート       | `pnpm slides:check`                              |

---

## グラフィック生成エンジン仕様

1. **手法A: 論理積 ＋ モルフォロジー膨張 Engine (`morphology_engine.py`)**:
   - 正位置と180度反転文字のピクセル論理積（$A \cap B_{180}$）を「共通対称核」として抽出。
   - 二重線・ゴーストを100%消去した上で、モルフォロジー膨張（Dilation）とガウシアン平滑化により、文字本来の太さと美しい丸みを持つ単一ストロークを再構築。
   - **近接ストローク引力スナップ (`enable_snap`)**: 距離場勾配による局所非剛体ワープを適用し、「の」など内側ストロークがオフセットしている文字を中間対称軸へ引き寄せてマージ。
   - 異文字パーツ保持（`diff_blend`）により片側固有のストロークを補正ブレンド。
2. **手法B: 骨格中心線 (スケルトン) 平均化 Engine (`skeleton_engine.py`)**:
   - 魏・山口 (2023) に着想を得た中心線アプローチ。
   - 正位置と反転文字のユークリッド距離変換の調和平均場から極大線（平均中心骨格）を抽出。
   - **筆文字楕円ブラシ描画 (井上・高橋 2020 §5 / 野村 2018)**: 45度傾斜の毛筆楕円ブラシにより、伝統的な和風タイポグラフィの品格ある筆跡を再現。均一丸ペンとの切り替えが可能。
   - **ストローク太さ変調 (`stroke_modulation`)**: 正反の共通核（交差部）を力強く太線化し、片方固有のパーツを自然な細線で補助することで、文字の破綻を防ぎつつ高い可読性を両立。
3. **原案: ベクター / 幾何学的合成 Engine (`vector_engine.py`)**:
   - `FontTools` でフォントからSVGアウトラインを抽出し、正位置パスと180度回転パスを中心アライメントで幾何学的にマージ（最適XYシフトオフセット完全連動）。
   - 「パーツ対応表示（Color Overlay）」モードを搭載（正位置固有：青、反転固有：橙、共通部分：深色合成）。
4. **手法2: ビットマップ画像最適化 Engine (`bitmap_engine.py`)**:
   - 高解像度グリフ画像に対し、`OpenCV` の距離変換（Distance Transform）とエネルギー最小化を適用。
5. **手法3: Gemini API 生成 Engine (`gemini_engine.py`)**:
   - Google GenAI SDK を通じて Imagen 3 を呼び出し、プロンプト誘導によるタイポグラフィアートを生成。

---

## 適性判定アルゴリズム

各文字ペア $(c_1, c_2)$ の回転適性スコアは以下を組み合わせて算出されます：

- **幾何学的類似度 (調和平均)**: 魏・山口 (2023) §2.2 に従い、正位置と180度反転位置のカバー率の調和平均 (Harmonic Mean) を採用。片方しか読めない非対称ペアを排除。
- **4層幾何類似度エンジン**: 極太見出し書体 (Dela Gothic等) での過大評価を防ぐ「適応的Pre-Bold」「骨格スケルトン交差率」「負の空間 (穴・ふところ) 一致度」「偶然重なり期待値補正 (Chance-Adjusted IoU)」の統合評価。
- **先行研究実証ペア反映**: 井上・高橋 (2020) の被験者可読性実験 (1,081ペア) で実証された可読率1.0のペア (「あ」↔「ま」、「せ」↔「ぬ」等) を高スコアにシードし、不可読ペア (「と」↔「の」、「ん」↔「ん」等) にペナルティを付与。
- **文脈認知補完数理モデル**: 井上・高橋 (2020) §6.2 の実証 (常用単語で87.8%可読) に基づき、幾何平均と単語長・常用語フラグから最悪文字の引き下げ重みを動的に緩和。
- **客観的文字認識・双方向可読性評価 (魏・山口 2023 §2.2)**: JIS第1水準漢字・仮名3,082字種に対応する軽量ONNX CNNモデル (`model.fp16.onnx`, `labels.json`) により、生成されたアンビグラムの正反認識確率 $P(c_1), P(c_2)$ および調和平均可読性をリアルタイム算出・判定。

---

## 中間工程パイプラインと再現可能性

### 1. 中間工程パイプライン (Processing Pipeline Steps)

各手法がどのような手順的変形を経て完成形に至るかを可視化します：

- **骨格平均化 (手法B)**: 正反グリフ描画 $\rightarrow$ ユークリッド距離場算出 $\rightarrow$ 調和平均ポテンシャル場 $\rightarrow$ 中心骨格線抽出 $\rightarrow$ 筆文字ブラシ描画 & 太さ変調
- **論理積 (手法A)**: 正反グリフ描画 $\rightarrow$ 重心アライメント $\rightarrow$ 近接ストローク吸引 (TPS) $\rightarrow$ 論理積 (AND) 対称核抽出 $\rightarrow$ モルフォロジー膨張 & 輪郭平滑化
- **ベクター合成 (原案)**: ベクターパス抽出 $\rightarrow$ 正位置・反転配置 $\rightarrow$ 固有・共通パーツ色分け $\rightarrow$ パスマージ
- **ビットマップ (手法2)**: ピクセル重み付け合成 $\rightarrow$ 閾値処理 $\rightarrow$ 2値画像化
- **Gemini AI (手法3)**: マルチモーダルAIモデルによる点対称アンビグラム画像生成

### 2. 再現可能性 (Reproducibility) パラメータのエクスポート & インポート復元

- **エクスポート**: エクスポートバーから「パラメータ付き保存 (PNG + JSON / SVG + JSON)」または「設定 (JSON)」を実行することで、画像ファイルとともに以下の構成を含む JSON ファイルが保存されます。
- **インポート (復元)**: エクスポートされた `ambigram_..._parameters.json` ファイルを画面下の「設定復元 (Import)」または初期画面の「保存した設定 (JSON) を読み込む」から選択するだけで、**対象単語・手法エンジン・フォント・文字ペア別XY重心オフセット・全微調整パラメータが即座に復元され、アンビグラムが完全再現**されます。

```json
{
  "system": "フォント骨格の手順的変形に基づく180度回転型日本語アンビグラム制作支援システム",
  "word": "日の目",
  "engine": "skeleton",
  "font": "zen_maru",
  "parameters": {
    "strokeThickness": 15,
    "diffBlend": 0.35,
    "preBold": 4,
    "enableSnap": true,
    "snapStrength": 0.75,
    "brushStyle": "calligraphic",
    "strokeModulation": true,
    "customOffsets": [
      [0, 0],
      [0, 0]
    ]
  },
  "scores": {
    "compatibilityScore": 0.963,
    "readabilityOverall": 0.824
  }
}
```

---

## 同梱フォントのライセンスとクレジット

本システムの `backend/fonts/` および `frontend/public/fonts/` に配備されているフォントファイルは、各作者様のオープンライセンス・フリーライセンスに基づいて利用されています。

| フォント名 | スタイル | 著作権表示 (Copyright) / 作者 | プロジェクト / 配布元 | ライセンス |
| :--- | :--- | :--- | :--- | :--- |
| **Zen Maru Gothic** | 丸ゴシック (標準) | Copyright 2021 The Zen Maru Gothic Project Authors | [googlefonts/zen-marugothic](https://github.com/googlefonts/zen-marugothic) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **M PLUS 1p** (Bold) | 幾何角ゴシック | Copyright 2020 The M+ FONT PROJECT Authors | [coz-m/MPLUS_FONTS](https://github.com/coz-m/MPLUS_FONTS) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Klee One** (SemiBold) | 硬筆ペン字 | Copyright 2020 The Klee Project Authors (Fontworks Inc.) | [fontworks-fonts/Klee](https://github.com/fontworks-fonts/Klee) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Shippori Mincho** (Bold) | 明朝体 | Copyright 2020 The Shippori Mincho Project Authors (FONTDASU) | [fontdasu/ShipporiMincho](https://github.com/fontdasu/ShipporiMincho) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **BIZ UDPGothic** (Bold) | UD角ゴシック | Copyright 2022 The BIZ UDGothic Project Authors (Morisawa Inc.) | [googlefonts/morisawa-biz-ud-gothic](https://github.com/googlefonts/morisawa-biz-ud-gothic) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Yuji Mai** (Regular) | 毛筆・行書 | Copyright 2020 The Yuji Project Authors (Kinuta Font Factory) | [googlefonts/yuji](https://github.com/googlefonts/yuji) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **Kaisei Tokumin** (Bold) | 幾何学モダン明朝 | Copyright 2020 The Kaisei Project Authors (FONT-KAISEI) | [googlefonts/kaisei](https://github.com/googlefonts/kaisei) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **DotGothic16** (Regular) | 16pxドット | Copyright 2020 The DotGothic16 Project Authors (Fontworks Inc.) | [fontworks-fonts/DotGothic16](https://github.com/fontworks-fonts/DotGothic16) | [SIL OFL 1.1](https://scripts.sil.org/OFL) |
| **MaruMonica** | 12x16px丸ピクセル | 患者長ひっく (hicc / x0y0pxFreeFont) | [BOOTH: x0y0pxFreeFont](https://x0y0px.booth.pm/) | フリー (商用・埋め込み可) |

SIL Open Font License の条文全文は [`backend/fonts/OFL.txt`](backend/fonts/OFL.txt) に収録されています。

---

## 関連ドキュメント

- [`docs/ISSUES.md`](docs/ISSUES.md): 剛体回転の幾何的限界（「の」などの内部オフセット問題）に対する数理解析と、近接ストローク吸引スナップ・非剛体局所変形（TPS）による解決アルゴリズムの詳細。
- [`docs/OPTIMIZATION_PIPELINE.md`](docs/OPTIMIZATION_PIPELINE.md): 画像処理・幾何最適化パイプラインの数理的詳細設計。
