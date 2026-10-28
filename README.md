# ambigram-maker

フォント骨格の手順的変形に基づく180度回転型日本語アンビグラム制作支援システム。

180度回転させた際に元の単語と同じ文字列として読める「自己対称型 (Rotational Symmetry) アンビグラム」の制作を支援するタイポグラフィ設計システムです。
JMdict辞書から抽出した20万語以上の日本語単語から正規表現・文字種で探索し、フォント骨格の手順的変形 (近接ストローク吸引、調和平均骨格化、モルフォロジー膨張) によって高品質なアンビグラムを生成します。

## 目次

1. [概要](#概要)
2. [特徴](#特徴)
3. [仕組みと技術スタック](#仕組みと技術スタック)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [実行方法](#実行方法)
6. [グラフィック生成エンジン仕様](#グラフィック生成エンジン仕様)
7. [適性判定アルゴリズム](#適性判定アルゴリズム)
8. [先行研究読解リーダー (Paper & Code Inspector)](#先行研究読解リーダー-paper--code-inspector)
9. [今後の展望 (次世代アーキテクチャロードマップ)](#今後の展望-次世代アーキテクチャロードマップ)
10. [同梱フォントのライセンスとクレジット](#同梱フォントのライセンスとクレジット)
11. [関連ドキュメント](#関連ドキュメント)

---

## 概要

アンビグラム制作は従来、文字のパーツ対応や重心配置、対称軸の錯視的バランス調整など高度な職人的技術と試行錯誤を要していました。
本システムは、文字の幾何学的骨格抽出、近接ストロークの引力場吸引スナップ (Thin-Plate Splines)、および先行研究の実証データに基づく客観的可読性評価を統合し、実用的な日本語アンビグラムの自動生成と探索を可能にします。

---

## 特徴

- **正規表現対応の高速単語探索**  
  単なる部分一致検索だけでなく、正規表現 (例: `.+の.+` や `^.の.$`, `.*桜.*` 等) による柔軟な単語パターン探索に対応。
- **真の文字表記によるアンビグラム判別・生成**  
  漢字語 (「頼む」等) やカタカナ語 (「アイス」等) をひらがなに強制変換せず、本来の文字ペア (「頼」↔「む」、「ア」↔「ス」) で幾何対称性を判別し、本物のアンビグラムグラフィックを描画。
- **先行研究エビデンスに基づく適性評価**  
  査読論文 (井上・高橋 2020、魏・山口 2023) の実証実験データ (可読率100%ペア/不可読0%ペア) および調和平均 (Harmonic Mean) による双方向成立度判定 (`0.xxx` 形式の厳密な小数スコア表示)。
- **文脈認知補完数理モデル (井上・高橋 2020 §6.2 表5)**  
  幾何平均と単語長・常用語フラグから、ボトルネック文字の引き下げ重みを動的に緩和するトップダウン認知補完数理モデルを実装。
- **近接ストローク引力スナップ & 局所非剛体変形 (Thin-Plate Spline)**  
  剛体回転の限界を突破するベクトル引力場と距離変換ワープ、およびThin-Plate Spline (TPS) 弾性変形モデル (吸引強度0〜100%をスライダー調整可能) により、「の」の中央縦棒など近接した非対称ストロークを中間対称軸へ滑らかに磁石スナップ・一本化。
- **筆文字可変幅ストローク & 太さ抑揚変調 (井上・高橋 2020 §5 / 野村 2018)**  
  手法B (スケルトン平均化) に毛筆45度楕円ブラシおよび共通対称核強調・固有パーツ細線化の太さ変調を搭載。
- **生成工程パイプラインの可視化**  
  各生成エンジンが内部で実行している中間処理ステップ (元画像描画、距離場計算、骨格抽出、近接吸引、輪郭復元等) をサムネイル一覧で提示し、ワンクリックでメイン画面に拡大プレビュー可能。
- **研究・制作の再現可能性 (Reproducibility) を担保するエクスポート & インポート復元**  
  ベクターSVG・PNG画像に加え、使用フォント、文字ペア別XYシフト量、生成パラメータ、可読性評価数値をまとめた設定JSONを同時書き出し可能。
  保存したJSONを読み込むことで作業状態を完全再現。
- **対応文字ペアごとの重心位置微調整 (XYずらし)**  
  全文字ペア (「動 ↔ 画」など) の重心シフト量 (X/Y) を一覧で見渡しながら個別にスライダー調整可能。
- **最優先割り込み (Cancellation) & 高速レスポンス**  
  単語選択時の即座発火 (0ms) と先行バックグラウンド処理の即時中断シグナル発行、幾何シフト探索・スロット画像の多層インメモリキャッシュによるスムーズなUIレスポンス。
- **リアルタイム生成中インジケータ**  
  スライダー操作やパラメータ変更による再生成時に、メイン画面上に「生成中……」のオーバーレイを即座に表示。
- **AI客観文字認識・双方向可読性評価 (魏・山口 2023 §2.2)**  
  JIS第1水準漢字 (2,965文字) ＋ ひらがな ＋ カタカナの計3,082字種に対応する軽量ONNX CNNモデル (`model.fp16.onnx`, `labels.json`) を内包し、アンビグラムの正反両方向の認識確率 $P(c_1), P(c_2)$ および調和平均可読性をリアルタイム評価。
- **固定ピン留め比較ギャラリー (Pinned Gallery)**  
  画面右下のピン留めアイコンにより、お気に入りの生成結果を画面下部トレイに永続保存 (`localStorage`)。
  複数単語・フォントの並行比較やワンクリックでのパラメータ復元が可能。
- **スイス・スタイル 3ペイン Sticky レイアウト**  
  左右ペイン (単語探索・微調整パラメータ) をスクロールしても、中央ペインのアンビグラムビューワーが画面上部に固定 (sticky) され、作業中の視線移動を最小化。

---

## 仕組みと技術スタック

本システムは、Python による非剛体幾何学・画像処理・機械学習バックエンドと、TypeScript / React によるリアルタイム操作フロントエンド、および先行研究を数理・実装レベルで解読するリーダー環境から構成されます。

- **バックエンド**  
  Python 3.11+ / FastAPI / Uvicorn / Pydantic
- **数値計算・画像処理**  
  NumPy, SciPy (TPS弾性スプライン補間), OpenCV, scikit-image (モルフォロジー細線化), Pillow (PIL)
- **機械学習・評価**  
  PyTorch, ONNX Runtime (軽量ひらがな・漢字CNN識別モデル), ETL8手書き文字データセット
- **フロントエンド**  
  TypeScript / React 19 / Vite / Vanilla CSS (スイス・スタイル)
- **研究解読リーダー**  
  Vanilla HTML5, Vanilla CSS3, KaTeX (数式レンダリング), Python ThreadingHTTPServer (`serve.py`)
- **パッケージマネージャー**  
  uv (Python), pnpm (Node.js)

---

## ディレクトリ構造

```text
ambigram-maker/
├── backend/                        - バックエンドAPI・生成・評価エンジン群
│   ├── pyproject.toml              - uv パッケージ管理設定
│   ├── app.py                      - FastAPI サーバーエントリポイント
│   ├── cancellation.py             - 先行処理中断マネージャー
│   ├── tests/                      - pytest 自動テストスイート
│   ├── fonts/                      - オープンライセンス日本語フォント群 (全9書体)
│   ├── dictionary/                 - JMdict 単語辞書パーサーおよび索引データ
│   ├── scoring/                    - 幾何学的類似度 (4層幾何エンジン) 計算機
│   ├── search/                     - 正規表現対応 単語探索・ランキングエンジン
│   ├── evaluation/                 - 客観文字認識・両方向可読性評価エンジン (ONNX CNN)
│   └── generators/                 - 各種アンビグラム変形・生成アルゴリズム
│       ├── base.py                 - 共通生成インターフェース (PipelineStep 定義)
│       ├── font_manager.py         - フォント管理・重心シフト探索
│       ├── snap_warper.py          - 近接ストローク引力スナップ・Thin-Plate Splines (TPS) 弾性変形
│       ├── morphology_engine.py    - 手法A: 論理積 ＋ モルフォロジー膨張
│       ├── skeleton_engine.py      - 手法B: 骨格中心線平均化 (筆文字・太さ抑揚変調)
│       ├── stroke_modulator.py     - 毛筆ストローク太さ変調モデル (井上・高橋 2020 式(10)-(12))
│       ├── vector_engine.py        - 原案: ベクター幾何合成
│       └── bitmap_engine.py        - 手法2: ビットマップ最適化
├── frontend/                       - メイン制作支援Webアプリケーション
│   ├── package.json                - pnpm パッケージ管理設定
│   ├── vite.config.ts
│   ├── index.html                  - アプリケーションHTML
│   └── src/
│       ├── index.css               - スイス・スタイル デザインシステム
│       ├── App.tsx                 - 3ペイン Sticky ワークスペース
│       ├── components/             - 各種UIコンポーネント
│       └── services/api.ts         - バックエンドAPIクライアント
├── research/                       - 先行研究論文の解読・検証環境
│   ├── reader/                     - 先行研究数理・コード解読リーダー
│   │   ├── index.html              - 3ペイン論文読解UI
│   │   ├── reader.css              - リーダー用スタイルシート
│   │   ├── reader.js               - 目次連動・用語ハイライト・動的レンダラー
│   │   ├── serve.py                - キャッシュ無効化・マルチスレッド開発サーバー
│   │   ├── papers_content.js       - 論文本文データ (高橋・井上 2020、魏・山口 2023 等)
│   │   ├── annotations.js          - 数理用語・実装コード解説アノテーション
│   │   └── code_content.js         - 対応コードブロックデータ
│   └── scholar_ambigram/           - 収集論文PDFおよび図版アーカイブ
├── slides/                         - 研究発表スライド環境 (Marp)
└── docs/                           - 数理設計・最適化アルゴリズム仕様書
```

---

## 実行方法

複数の起動方法と開発支援コマンドを表形式で示します。

| コマンド | ディレクトリ | 実行内容 |
| :-- | :-- | :-- |
| `pnpm dev` | ルート | フロントエンド (Vite: 5173) とバックエンド (FastAPI: 8000) を一括起動 (推奨) |
| `python run.py` / `run.bat` | ルート | 一括起動スクリプトの別形態 (Python / Windowsバッチ) |
| `uv run uvicorn app:app --port 8000 --reload` | `backend/` | バックエンドサーバー単体起動 |
| `pnpm dev` | `frontend/` | フロントエンド開発サーバー単体起動 |
| `python research/reader/serve.py` | ルート | 先行研究読解リーダーを起動 (ポート: 8089) |
| `pnpm test` | ルート | 全自動テストを一括実行 (pytest & Vitest) |
| `uv run pytest` | `backend/` | バックエンド単体テストの実行 |
| `pnpm test` | `frontend/` | フロントエンド単体テストの実行 |
| `pnpm slides:serve` | ルート | 研究発表スライドのローカル確認サーバー起動 (ポート: 8080) |
| `pnpm slides:build` | ルート | スライド原稿から全形式 (HTML, PDF, PPTX) を一括ビルド |

---

## グラフィック生成エンジン仕様

1. **手法A: 論理積 ＋ モルフォロジー膨張 Engine (`morphology_engine.py`)**  
   正位置と180度反転文字のピクセル論理積 ($A \cap B_{180}$) を「共通対称核」として抽出。  
   二重線・ゴーストを消去した上で、モルフォロジー膨張 (Dilation) とガウシアン平滑化により、文字本来の太さと丸みを持つ単一ストロークを再構築。  
   距離場勾配による局所非剛体ワープを適用し、「の」など内側ストロークがオフセットしている文字を中間対称軸へ引き寄せてマージ。
2. **手法B: 骨格中心線 (スケルトン) 平均化 Engine (`skeleton_engine.py`)**  
   正位置と反転文字のユークリッド距離変換の調和平均場から極大線 (平均中心骨格) を抽出。  
   45度傾斜の毛筆楕円ブラシにより、品格ある筆跡を再現。  
   正反の共通核 (交差部) を太線化し、片方固有のパーツを自然な細線で補助することで、可読性と自然さを両立。
3. **原案: ベクター / 幾何学的合成 Engine (`vector_engine.py`)**  
   `FontTools` でフォントからSVGアウトラインを抽出し、正位置パスと180度回転パスを中心アライメントで幾何学的にマージ。  
   パーツ対応表示モード (正位置固有: 青、反転固有: 橙、共通部分: 深色) を搭載。
4. **手法2: ビットマップ画像最適化 Engine (`bitmap_engine.py`)**  
   高解像度グリフ画像に対し、距離変換 (Distance Transform) とエネルギー最小化を適用。

---

## 適性判定アルゴリズム

各文字ペア $(c_1, c_2)$ の回転適性スコアは以下を組み合わせて算出されます。

- **幾何学的類似度 (調和平均)**  
  魏・山口 (2023) §2.2 に従い、正位置と180度反転位置のカバー率の調和平均 (Harmonic Mean) を採用。
  片方しか読めない非対称ペアを排除。
- **4層幾何類似度エンジン**  
  極太見出し書体での過大評価を防ぐ「適応的Pre-Bold」「骨格スケルトン交差率」「負の空間 (穴・ふところ) 一致度」「偶然重なり期待値補正 (Chance-Adjusted IoU)」の統合評価。
- **先行研究実証ペア反映**  
  井上・高橋 (2020) の被験者可読性実験 (1,081ペア) で実証された可読率1.0のペア (「あ」↔「ま」、「せ」↔「ぬ」等) を高スコアにシードし、不可読ペアにペナルティを付与。
- **文脈認知補完数理モデル**  
  井上・高橋 (2020) §6.2 の実証 (常用単語で87.8%可読) に基づき、幾何平均と単語長・常用語フラグから最悪文字の引き下げ重みを動的に緩和。
- **客観的文字認識・双方向可読性評価 (魏・山口 2023 §2.2)**  
  JIS第1水準漢字・仮名3,082字種に対応する軽量ONNX CNNモデルにより、生成されたアンビグラムの正反認識確率 $P(c_1), P(c_2)$ および調和平均可読性をリアルタイム算出・判定。

---

## 先行研究読解リーダー (Paper & Code Inspector)

本システムの研究的基盤となった査読論文および数理モデルを解読するための専用Webビューワーを `research/reader/` に同梱しています。

- **閲覧方法**  
  `python research/reader/serve.py` を実行し、ブラウザで `http://localhost:8089/` を開く。
- **収録論文**  
  論文 02: 井上 和輝, 高橋 裕樹, 「文字構造特徴を用いたひらがなアンビグラムの生成」, 画像電子学会誌, 2020.  
  論文 05: 魏 延輝, 山口 裕, 「多目的最適化 GAN によるアンビグラム生成」, 電気関係学会九州支部連合大会講演論文集, 2023.  
  論文 09: 石崎 航琉, 荒俣 蓮, 的場 やすし ほか, 「『MOjiULE』『G-FITs』『ひらがな~る』― 文字形状に着目した日本語作品の報告」, 静岡文化芸術大学研究紀要, 2024.  
  論文 17: Fred L. Bookstein, "Principal Warps: Thin-Plate Splines and the Decomposition of Deformations", IEEE TPAMI, 1989.
- **機能**  
  KaTeX による数式完全復元、数理用語と本リポジトリ実装コード (`skeleton_engine.py`, `snap_warper.py` 等) の双方向リンク解説カード。

---

## 今後の展望 (次世代アーキテクチャロードマップ)

離散グラフマッチングの探索計算量およびラスター画像の解像度限界を解決するため、GitHub Issue [#6](https://github.com/v76nl/ambigram-maker/issues/6) にて以下の次世代パイプラインを策定しています。

- **DiffVG (微分可能レンダラー) によるベクター直接最適化**  
  3次ベジェ曲線の制御点座標・ストローク幅をパラメータとし、勾配降下法 (Adam) により連続空間上で直接最適化。  
  出力結果は解像度無限のクリーンなベクターSVG形式。
- **拡散モデル (Diffusion Models / Visual Anagrams) の対称誘導**  
  180度反転潜在変数を並行デノイズする Dual-Guidance 機構により、毛筆のかすれや洗練されたタイポグラフィ表現を創発。
- **VectorFusion ハイブリッドアーキテクチャ**  
  「表現＝ベクタースプライン」×「ガイダンス＝拡散モデルSDS損失 ＋ 文字認識器損失」によるエンドツーエンド生成パイプライン。

---

## 同梱フォントのライセンスとクレジット

本システムの `backend/fonts/` および `frontend/public/fonts/` に配備されているフォントファイルは、各作者様のオープンライセンス・フリーライセンスに基づいて利用されています。

| フォント名 | スタイル | 著作権表示 (Copyright) / 作者 | プロジェクト / 配布元 | ライセンス |
| :-- | :-- | :-- | :-- | :-- |
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

- [`docs/ISSUES.md`](docs/ISSUES.md): 剛体回転の幾何的限界に対する数理解析と、近接ストローク吸引スナップ・非剛体局所変形 (TPS) による解決アルゴリズムの詳細。
- [`docs/OPTIMIZATION_PIPELINE.md`](docs/OPTIMIZATION_PIPELINE.md): 画像処理・幾何最適化パイプラインの数理的詳細設計。
