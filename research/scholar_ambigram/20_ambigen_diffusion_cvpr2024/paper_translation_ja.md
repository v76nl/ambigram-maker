# AmbiGen: 事前学習済み拡散モデルからのアンビグラム生成
## 原題: AmbiGen: Generating Ambigrams from Pre-trained Diffusion Model
**著者**: Boheng Zhao^1^，Rana Hanocka^2^，Raymond A. Yeh^1^  
**所属**: ^1^パデュー大学 計算機科学科 (Dept. of CS, Purdue University)，^2^シカゴ大学 計算機科学科 (Dept. of CS, University of Chicago)  
**出典**: Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition Workshops (CVPRW 2024)  
**arXiv**: [arXiv:2312.02967](https://arxiv.org/abs/2312.02967)  
**プロジェクトページ**: [https://ambigen.github.io/](https://ambigen.github.io/)

---

### 要旨 (Abstract)
アンビグラム (Ambigram) とは，視覚的な観察方向に応じて異なる意味を持つカリグラフィ (書道・文字芸術) のデザインである．
アンビグラムの作成は，同時に2つの異なる視点からの意味を維持しなければならないため，熟練したアーティストにとっても極めて難易度の高いタスクである．
本研究では，大規模な視覚・言語拡散モデルである「DeepFloyd IF」の知識を蒸留 (Distillation) することにより，2つの観察方向における可読性 (Legibility) を満たすよう文字のアウトライン (輪郭線) を最適化するアンビグラム生成手法「AmbiGen」を提案する．
実験的検証により，本アプローチが既存のアンビグラム生成手法を明確に凌駕することを示す．
英語で最も頻出する上位500単語を用いた評価において，本手法は単語精度を 11.6% 以上向上させ，編集距離を少なくとも 41.9% 削減することに成功した．

---

### 1. はじめに (Introduction)
綿密に設計されたフォントを通じて，アンビグラムは異なる向きから鑑賞できる単語表現を実現する．
最も一般的なものは180度回転させた後にも読める「回転アンビグラム (Rotational Ambigrams)」であり，例えば「SWIMS」という単語は，自然な正立状態でも180度倒立させた状態でも全く同じように読むことができる．

アンビグラムのデザインは「デザイナーが視覚的なパズルを解くこと」を要求するため，極めて困難で時間を要する作業である [27]．
アンビグラムのデザイン手順を解説したチュートリアル [27, 33] は存在するものの，それらの指示は大まかなガイドラインに留まっており，煩雑で細かな実装の多くはデザイナー自身の手に委ねられている．
究極的には，高品質で効果的なアンビグラムを制作できるかどうかは，デザイナー自身のカリグラフィに対する深い理解，対称性パターンの把握，そして異なる向きにおける単語の可読性をいかにトレードオフさせるかという職人技に依存している．

既存の生成器 [1, 26] は，文字対文字 (Letter-to-Letter) のアプローチに基づいてアンビグラムを構築している．
すなわち，単語内の各グリフ (字形) が，異なる向きから見たときに2つの文字に見えるように設計される．
回転アンビグラムの場合，フォントセットはアルファベットのすべての文字ペア間の写像をカバーする $26 \times 26 = 676$ 個のグリフで構成される．
従来，これらのアンビグラムフォントはアーティストの手作業によってデザインされてきた [1, 26]．
より最近では，AmbiDream [6] や Ambifusion [34] が深層ニューラルネットワークを活用し，ピクセル空間におけるアンビグラムの生成を支援している．
しかしながら，これらは単一の文字レベルでのアンビグラム設計に限定されており，単語レベルでの性能ベンチマークや最適化は行われていなかった．

本研究では，近年のテキスト画像生成基盤モデル (Text-to-Image Foundation Models) の発展を活用したアンビグラム生成手法を提案する．
我々はアンビグラムのデザインプロセスを，アンビグラムを表現するベジェ曲線 (Bézier Curves) の制御点を直接最適化する最適化問題として定式化する．
高レベルの視点では，生成結果の可読性を維持するための目的関数は「DeepFloyd IF」[2] に基づいており，入力テキストプロンプトからより的確に情報を捉えるためにT5-XXL [9] テキストエンコーダを採用している．
さらに，フォントスタイルを制御するためのスタイル損失 (Style Loss) も統合している．
図1は，本手法によって設計された回転アンビグラムの例を示している．

提案手法の妥当性を検証するため，我々は光学文字認識 (OCR: Optical Character Recognition) [18] を用いて，2つの観察方向 (180度回転) における生成アンビグラムの可読性を客観的に評価する．
さらに，定性的な結果の提示およびユーザー調査を実施した．
全体として，提案手法が定量的および定性の両面において，既存のアンビグラム生成ベースラインを圧倒的に凌駕していることを確認した．

本論文の主な貢献は以下の通りである:
- 事前学習済み拡散モデルに基づき，アンビグラムを生成するための最適化フレームワークを提案する．
- 著者の知る限り，単語レベルのアンビグラムをベンチマーク評価し，深層ニューラルネットワークを介して直接生成した初の試みである．
- 本手法は，アーティストによってデザインされたものを含む既存のアンビグラム生成手法と比較して，生成アンビグラムの単語認識精度において 11.2% 以上の絶対的な向上を達成した．

---

### 2. 関連研究 (Related Work)
- **拡散モデルとその応用 (Diffusion models and applications)**:
  Stable Diffusion [31]，DALL-E 2 [29]，Imagen [32] などの視覚・言語拡散モデルは，自然言語条件付き画像生成において驚異的な性能を達成している．
  これらの進展に伴い，学習済み拡散モデルを事前分布 (Prior) として利用する様々な応用が誕生している．
  例えば，3Dモデルの生成 [28, 38]，ベクターアートの生成 [15]，画像修復 [16, 24, 41]，形状再構成 [20] などである．
  本研究は，事前学習済み拡散モデルをアンビグラム生成にどのように応用するかを探求する．

- **生成AIによるフォント生成 (Font generation with AI)**:
  生成AIを用いたフォント生成は数多く研究されており，一般にピクセル空間における確率的生成モデル [3, 10, 11, 38]，あるいはベクターフォント空間におけるモデル [4, 5, 7, 21–23, 30, 37, 40] として定式化されてきた．
  単なるフォント合成にとどまらず，Wangら [39] はグリフの配置に着目したテキストロゴの生成を研究した．
  本研究とより密接に関連するものとして，Iluzら [14] による「WordAsImage」は，ベクターフォント上でStable Diffusionのスコア蒸留 (Score Distillation) を用いてセマンティック・タイポグラフィを設計している．
  本研究も事前学習済み拡散モデルを蒸留する点では類似しているが，アンビグラムの生成に特化している．
  この目的のため，最適化の初期化手法，使用すべき事前学習済み拡散モデルの選定，単語レベル最適化の実行方法など，アンビグラム生成に特化した複数の新規コンポーネントを導入している．

- **AIによるアンビグラム生成 (Ambigram generation with AI)**:
  AmbiDream [6] は，学習済みの文字分類器を蒸留してピクセル値を更新することによりアンビグラムを生成することを提案した．
  これに対し我々は，大規模拡散モデルを蒸留して各グリフの輪郭線 (アウトライン) を直接更新する．
  ごく最近，Ambifusion [34] は，MyFontsデータセット [8] から手作業で選別・整形した個々のアルファベット画像データセットを用意し，アンビグラム生成に特化した拡散モデルをゼロから学習させる手法を提案した．
  対照的に本手法は，文字特化型の拡散モデルを独自に再学習させる必要が一切ない．
  さらに，AmbiDreamとAmbifusionはいずれも単一文字のアンビグラム生成に限定されており，手法や評価において単語レベルの相互作用を考慮していない．

---

### 3. 基礎概念 (Preliminaries)
本手法を理解し表記法を確立するために必要な概念を整理する．

- **グリフ表現 (Glyph representation)**:
  グリフは通常，アウトラインを捉えるベジェ曲線などのベクター形式で保持される．
  この表現形式は，詳細を失うことなく任意の解像度へとスケーリング可能であるためである．
  詳細には，グリフ $G = \{g_i\}$ はベジェ曲線の制御点 $g_i \in \mathbb{R}^2$ の集合として表現される．
  Liら [19] による微分可能ラスタライザ (Differentiable Rasterizer) である「DiffVG」$R$ を用いることで，ベクター形式のグリフは画像 $x = R(G)$ へとラスタライズされ，画像を介した逆伝播，すなわち $\frac{\partial x}{\partial g_i}$ の計算が可能となる．
  これにより，グリフの制御点を更新するための勾配ベースの手法の適用が可能となる．
  目的関数の選定が，最適化後のグリフの最終的な形状を決定づける．
  次に，事前学習済み拡散モデルを目的関数として利用する方法を説明する．

- **拡散モデルとスコア蒸留 (Diffusion models and score distillation)**:
  テキスト画像拡散モデル [31] は，自然言語で記述された高レベル概念の埋め込み $c$ が与えられたとき，画像 $x$ の条件付き分布 $p(x \mid c)$ を学習することを目的とする．
  拡散モデルの背後にある高レベルの着想は，様々なレベルのノイズ $\sigma$ を持つ加法的ガウスノイズで入力データを劣化させるプロセスを逆転させること，すなわちノイズ除去器 (Denoiser) $D(x; \sigma)$ を学習することである．
  先行研究 [13, 35] は，このノイズ除去器がスコア関数，すなわちデータ対数尤度の勾配場として解釈できることを示している:
  $$\nabla_x \log p_\sigma(x \mid c) \approx \frac{D(x; \sigma) - x}{\sigma^2} \quad (1)$$

  先駆的研究であるDreamFusion [28] およびScore Jacobian Chaining (SJC) [36] は，3Dアセット生成タスクのためにこのスコア関数を蒸留することを提案した．
  その基本的な考え方は，スコア関数に連鎖律 (Chain Rule) を適用し，微分可能レンダラーを通じて逆伝播させることで3Dパラメータを更新することである．
  3Dパラメータ $\theta$ からレンダリングされた画像 $x = R(\theta)$ が与えられたとき，$\theta$ に関する条件付き分布の勾配は次式で表される:
  $$\frac{\partial p_\sigma(x \mid c)}{\partial \theta} = \frac{\partial p_\sigma(x \mid c)}{\partial x} \cdot \frac{\partial x}{\partial \theta} \quad (2)$$

  言い換えれば，微分可能レンダラーさえ備わっていれば，事前学習済み拡散モデルを用いて任意の画像表現を更新することができる．
  実際には，レンダリングされた画像 $x$ にノイズが含まれていないのに対し，ノイズ除去器はノイズ混じりの画像で学習されているため，分布外 (Out-of-Distribution) 問題が生じる [36]．
  そこでWangら [36] は，式(1)の代わりに以下の摂動・平均スコアリング (PAAS: Perturb-and-Average Scoring) を提案した:
  $$\text{PAAS}(x, \sigma) = \mathbb{E}_{n \sim \mathcal{N}(0, I)} \left[ \frac{D(x + \sigma n; \sigma) - x}{\sigma^2} \right] \quad (3)$$
  式(3)は，異なる数学的観点から導出されているものの，本質的にDreamFusionのスコア蒸留 [28] と等価である．

---

### 4. 提案手法 (Approach)
我々の目的は，異なる方向から読めるグリフの構成体，すなわちアンビグラムを設計することである．
本稿では回転アンビグラムを例として説明を進めるが，このフレームワークは他のタイプのアンビグラムにも容易に一般化可能である．
提案アプローチの全体像を図2に示す．

- **問題の定式化 (Problem formulation)**:
  正立方向では単語 $a$ として読め，180度回転させたときには単語 $b$ として読めるアンビグラムの構築を目指す．
  回転変換を $T$ で表す．
  2つの単語 $a = (a_1, \dots, a_N)$ と $b = (b_1, \dots, b_N)$ は同じ長さ $N$ を持ち，$a_n, b_n$ は英語アルファベットの文字を表すものとする．
  我々はアンビグラムのデザインプロセスを以下の最適化問題として定式化する:
  $$G^\star = \arg \min_G \mathcal{L}_{\text{Ambi}}(G, a, b) + \mathcal{L}_{\text{Style}}(G) \quad (4)$$
  ここで $G^\star = (G^{(1)}, \dots, G^{(N)})$ は，設計されたアンビグラムの第 $n$ 番目のグリフを表す制御点集合 $G^{(n)}$ のシーケンスを示す．
  目的関数は2つの項からなる: $\mathcal{L}_{\text{Ambi}}$ はグリフの構成がアンビグラムを形成することを促し，$\mathcal{L}_{\text{Style}}$ はグリフが指定されたフォントのスタイルを持つことを促す．

- **アンビグラム損失 (Ambigram loss)**:
  アンビグラム損失は，文字レベル損失と単語レベル損失に分解される:
  $$\mathcal{L}_{\text{Ambi}}(G, a, b) = \mathcal{L}_{\text{Letr}}(G, a, b) + \mathcal{L}_{\text{Word}}(G, a, b) \quad (5)$$

  文字レベル損失 $\mathcal{L}_{\text{Letr}}$ は，アンビグラム内の各文字が異なる向きから鑑賞できるように促す:
  $$\mathcal{L}_{\text{Letr}}(G, a, b) = - \sum_{n=1}^N \left[ \lambda_{\text{Letr}} \log p_\sigma(x^{(n)} \mid c(a_n)) + (1 - \lambda_{\text{Letr}}) \log p_\sigma(T(x^{(n)}) \mid c(b_{N-n+1})) \right] \quad (6)$$
  ここで $p_\sigma(x \mid c)$ は事前学習済み拡散モデルの条件付き確率，$x^{(n)} = R(G^{(n)})$ はDiffVG [19] によるラスタライズ画像，$T$ は回転変換，$c(a_n)$ は入力文字 $a_n$ に基づくテキストプロンプトの埋め込み，$\lambda_{\text{Letr}} \in [0, 1]$ は2つの向きのバランスをとる重みである．
  直感的には，第1項は第 $n$ グリフが文字 $a_n$ に見えるように促し，第2項は回転時に文字 $b_{N-n+1}$ に見えるように促す．

  次に単語レベル損失 $\mathcal{L}_{\text{Word}}$ は，単語全体がアンビグラムを形成することを目指す．
  文字間の依存関係をモデル化するため，単語レベル損失は連続する文字ペア全体の総和として定義される:
  $$\mathcal{L}_{\text{Word}}(G, a, b) = - \sum_{n=1}^{N-1} \left[ \log p_\sigma(x^{(n:n+1)} \mid c(a_n, a_{n+1})) + \log p_\sigma(T(x^{(n:n+1)}) \mid c(b_{N-n}, b_{N-n+1})) \right] \quad (7)$$
  ここで $x^{(n:n+1)} = [R(G^{(n)}), R(G^{(n+1)})]$ は連続する2つのグリフ画像の結合を表し，$c(a_n, a_{n+1})$ は2文字のテキストプロンプトによる埋め込みである．
  この損失により，グリフのペア同士が自然なアンビグラムを形成するよう促される．

- **スタイル損失 (Style loss)**:
  我々は，様々なフォントスタイルを促進するための追加損失を提案する．
  スタイル損失 $\mathcal{L}_{\text{Style}}(G)$ は，構成文字に依存しないグリフのスタイル的側面を制御する．
  具体的には，フォント損失と自己一貫性損失から構成される:
  $$\mathcal{L}_{\text{Style}}(G) = \lambda_{\text{Font}} \mathcal{L}_{\text{Font}}(G) + \lambda_{\text{Const}} \mathcal{L}_{\text{Const}}(G) \quad (8)$$
  フォント損失 $\mathcal{L}_{\text{Font}}(G)$ は，生成されるグリフが目標フォントに近づくよう促す．
  Wangら [38] による学習済みフォント属性予測器 $A$ を用い，すべてのグリフ $G^{(n)}$ に対する予測属性と，選択されたフォントの属性ベクトル $v$ との間の $\ell_2$ ノルム差を最小化する:
  $$\mathcal{L}_{\text{Font}}(G) = \sum_{n=1}^N \mathbb{E}_v \| v - A(R(G^{(n)})) \|_2^2 \quad (9)$$
  ここで $v$ は，目標フォントから同一の予測器 $A$ を用いて抽出された属性ベクトルの集合から一様サンプリングされる．

  さらに，$a$ と $b$ が同一の単語である自己アンビグラムの場合，変換後の自己相似性を促す自己一貫性損失 (Self-consistency Loss) $\mathcal{L}_{\text{Const}}$ を課す:
  $$\mathcal{L}_{\text{Const}}(G) = \sum_n \| \text{Blur}(x^{(N-n+1)}) - \text{Blur}(T(x^{(n)})) \|_2^2 \quad (10)$$
  ここで $x^{(n)} = R(G^{(n)})$ である．
  全体的な形状のマッチングを確実にするため，$3 \times 3$ のガウシアンフィルタによるブラー処理 (Blurring) を施している．

- **勾配ベースの最適化 (Gradient-based optimization)**:
  式(4)の最小化問題を解くために，Adamオプティマイザ [17] を用いてベジェ曲線の制御点を更新する．
  拡散モデルを通じた勾配計算には，式(3)に示したPAASを採用する．
  実際の実装では，2段階のステージ最適化を実施する．
  まず個々の文字に対して最適化を行い，その後，単語損失を用いて全文字を合同で微調整する．

#### 4.1 文字レベルの最適化 (Letter-level optimization)
- **グリフの初期化とアライメント戦略**:
  最適化を解くには，グリフの制御点 $G = (G^{(1)}, \dots, G^{(N)})$ を適切に初期化する必要がある．
  我々は既存フォントの重ね合わせによって制御点を初期化することを提案する．
  単語 $a$ と $b$ が与えられたとき，グリフ $G^{(n)}$ は文字 $a_n$ と回転させた文字 $b_{N-n+1}$ の事前定義フォントの制御点によって初期化される．
  重要な課題は，これら2つの既存フォントをどのように配置・整列 (アライメント) させるかである．
  初期アライメントが異なると，最適化後のデザインが大きく変化する．
  我々は，水平および垂直シフトに基づく以下の4つのアライメント戦略を提案する (図3参照):
  1. **Naive (ナイーブ重ね合わせ)**: 2つの文字を中心で直接重ね合わせる．
  2. **Max Overlap (最大重複)**: 重なり合うピクセル数が最大になるように整列する．
  3. **Contact (Left) (左端接触)**: 2文字が接触を保つ最も左側のシフト量を求め，確実に重なるようそのシフト量に0.7を乗じる．
  4. **Contact (Right) (右端接触)**: 左端接触と同様であるが，最も右側のシフト量を用いる．
  これらのアライメント手法の違いが最終デザインの多様性を生み出す．

- **最適化の詳細**:
  拡散モデルの勾配を計算するため，「An image of the letter {} in lower/upper case」というプロンプトを用いて埋め込みを作成する．
  ラスタライズ画像に対してランダムな射影変換 (Random Perspective) によるデータ拡張を施し，バッチサイズ5で学習率を指数関数的に減衰させながらAdamオプティマイザで合計500ステップ更新する．

- **自動デザイン選別と後処理**:
  生成された多数のデザイン候補を手作業で精査する代わりに，学習済み文字分類器のクロスエントロピー損失に基づいて有望なデザインを自動的にランク付け・フィルタリングする．
  最適化されたグリフの輪郭線にはギザギザや細かなノイズ (浮遊物: floaters) が含まれる場合があるため，メディアンフィルタと画像シャープニングを組み合わせた画像処理を後処理として適用し，滑らかで審美的なグリフ輪郭を復元する (図4参照)．

#### 4.2 単語レベルの最適化 (Word-level optimization)
文字レベルで設計された各グリフを単語テンプレート内に配置し，アスペクト比を維持しながらスケールを統一する．
その後，隣接する文字ペアに対して「A blank paper with the text “{}” written on it」というプロンプトを与え，単語レベル損失 $\mathcal{L}_{\text{Word}}$ (式7) に基づいて110ステップの合同最適化を実行する．
この際，文字レベルで獲得した優れたデザインから逸脱しすぎないよう正則化項を導入している．

---

### 5. 実験 (Experiments)
- **ベースライン手法**:
  比較対象として，アーティストによる手作業フォント3種 (DsmonoHD, Ambimaticv2, Ambigramania) およびAI手法2種 (AmbiDream [6], Ambifusion [34]) の計5つのアンビグラムフォントを採用した．
  Ambifusionについては公開コードを用い，生成された単一文字画像を水平方向に連結して単語アンビグラムを構築した．
- **評価設定**:
  英語で最も一般的な2文字以上の頻出単語上位500語 [25] をベンチマークとして用いた．

#### 5.1 定量比較 (Quantitative comparisons)
- **評価指標**:
  生成された単語の可読性を測るため，オープンソースの最新Transformer型OCRモデル「TrOCR」[18] を用いた．
  - **Accuracy (単語精度↑)**: 双方の観察方向において，単語内のすべての文字が正しく認識された場合に「正解」と判定する割合．
  - **Edit Distance (編集距離↓)**: 正解単語とTrOCRの予測文字列との間のレーベンシュタイン距離 (挿入・削除・置換数) を両方向について合計し，データセット全体で平均した値．

- **定量結果 (表1)**:
  | 手法 (Method) | 設計主体 | 単語精度 (Accuracy↑) | 編集距離 (Edit Distance↓) |
  | :--- | :--- | :---: | :---: |
  | Ambigramania [1] | アーティスト | 6.2% | 8.112 |
  | Ambimaticv2 [26] | アーティスト | 7.2% | 7.670 |
  | DsmonoHD [26] | アーティスト | 9.2% | 7.042 |
  | Ambidream [6] | AI (分類器蒸留) | 6.8% | 7.212 |
  | Ambifusion [34] | AI (文字拡散モデル) | 3.6% | 8.726 |
  | **Ours (Font 1)** | **提案手法 (AmbiGen)** | **24.2%** | **3.634** |
  | **Ours (Font 2)** | **提案手法 (AmbiGen)** | **20.8%** | **4.088** |

  提案手法の両フォントは，既存の全手法を大きく引き離して圧倒的な最高精度 (24.2%) と最小編集距離 (3.634) を記録した．
  最高性能のアーティストフォント (DsmonoHD) の精度9.2%に対し，本手法は2倍以上の精度向上を達成している．

#### 5.2 定性比較 (Qualitative comparisons)
- **視覚的品質**:
  図5および図6に示すように，本手法の生成結果は可読性が高く，アーティスト設計フォントに匹敵する審美性を備えている．
  対称文字 (「the」の ‘H’ など) において，アーティスト同様に対称性をきれいに維持している．
  また，「Base」の B↕E においてBの左側を開放して回転時にEに見せるなど，熟練デザイナーの技法に極めて類似したデザインを自律的に発見している．
  さらに「Correct」の中央の ‘R’ において大文字と小文字を自動選択するなど，全体の可読性を高める柔軟性を示した．

- **ユーザー調査 (User Study)**:
  被験者30名に対し，正解単語，本手法の生成結果，ベースラインの生成結果を提示し，どちらがより読みやすく審美的に優れているかを選択させた (図7)．
  本手法はすべてのベースラインに対して圧倒的な支持率を獲得した．
  TrOCRの定量スコアとユーザーの主観評価の順位は完全に一致した．

- **スタイルの多様性**:
  初期フォント，参照フォントスタイル，アライメント戦略，拡散モデルのランダム性を切り替えることで，同一の文字ペアに対しても極めて多様なスタイルのアンビグラムを生成可能である (図8)．

#### 5.3 アブレーション研究 (Ablation studies)
1. **ベクター表現の妥当性**:
   ベクター輪郭の代わりにピクセル輝度値を直接最適化した場合，画像の四隅に文字が重複して生成されたり，背景ノイズが激しくなったりしてフォントとして実用不能となった (図9)．ベクター空間への制約が品質向上に不可欠である．
2. **単語レベル最適化の有効性**:
   文字レベル最適化のみの場合と比較して，単語レベルの最適化 (式7) を追加することで，アンビグラムの品質とまとまりが明確に向上した (図10)．
3. **スタイル損失の効果**:
   参照フォントを変更することで，アンビグラムの形状を保ちながら異なる書体スタイル (Typewriter, Genzschなど) へと自在に誘導できることを確認した (図11)．
4. **損失重み $\lambda_{\text{Letr}}$ の選定**:
   DeepFloyd IFの事前分布には特定の文字を優遇する偏りがあるため，文字ペアごとに最適な重み $\lambda$ が異なる (図12)．本手法の自動選別機構が不可欠である．
5. **拡散モデルの選定比較**:
   DeepFloyd IFの代わりにStable Diffusion (v1-5, v2-1) を用いて蒸留した場合，破綻した文字しか生成できずアンビグラムの形成に失敗した (図13)．T5-XXLエンコーダによる優れたテキスト理解力を持つDeepFloyd IFの選定が極めて重要であった．

#### 5.4 異なる文字長への拡張概念実証 (Proof of concept for unequal length ambigrams)
既存手法は文字対文字の1対1対応を前提とするため，文字数が異なる単語間のアンビグラム (例: 「Stir (4文字)」↔「Sup (3文字)」，「Fight (5文字)」↔「Easy (4文字)」) を生成できなかった．
本手法はプロンプトの工夫により，1つのグリフが正立時1文字・倒立時2文字として読めるように最適化することで，文字長が異なるアンビグラムの生成にも世界で初めて概念実証として成功した (図14)．

---

### 6. 結論 (Conclusion)
本論文では，事前学習済み拡散モデル「DeepFloyd IF」を蒸留することにより，高品質なアンビグラムを自動生成する新しい最適化手法「AmbiGen」を提案した．
文字単位の生成に留まっていた既存研究と異なり，本アプローチは文字レベルと単語レベルの双方においてアンビグラムの品質を考慮する．
また，単語レベルでのアンビグラムの客観的評価を導入した初の研究である．
実験結果は本手法の圧倒的な優位性を実証し，ベースラインに対して単語精度で 11.2% 以上の向上，編集距離で 41.9% 以上の削減を達成した．

---

### 参考文献 (References)
[1] Ambigramania: Online ambigram generator. www.ambigramania.com/ (2023)  
[2] DeepFloyd Lab at StabilityAI: DeepFloyd IF. https://www.deepfloyd.ai/deepfloyd-if (2023)  
[3] S. Azadi, et al.: Multi-content gan for few-shot font style transfer. CVPR (2018)  
[4] D. Cao, et al.: Svgformer: Representation learning for continuous vector graphics using transformers. CVPR (2023)  
[5] A. Carlier, et al.: Deepsvg: A hierarchical generative network for vector graphics animation. NeurIPS (2020)  
[6] K. Chandra: Words that do handstands — dreaming ambigrams by gradient descent. (2023)  
[7] C.-H. Chen, et al.: Joint implicit neural representation for high-fidelity and compact vector fonts. ICCV (2023)  
[8] T. Chen, et al.: Large-scale tag-based font retrieval with generative feature learning. ICCV (2019)  
[9] H. W. Chung, et al.: Scaling instruction-finetuned language models. arXiv:2210.11416 (2022)  
[10] Y. Gao, et al.: Artistic glyph image synthesis via one-stage few-shot learning. ACM TOG (2019)  
[11] H. Hayashi, K. Abe, S. Uchida: GlyphGAN: Style-consistent font generation based on generative adversarial networks. Knowledge-Based Systems (2019)  
[12] K. He, et al.: Deep residual learning for image recognition. CVPR (2016)  
[13] A. Hyvärinen: Estimation of non-normalized statistical models by score matching. JMLR (2005)  
[14] S. Iluz, et al.: Word-as-image for semantic typography. ACM TOG (2023)  
[15] A. Jain, et al.: Vectorfusion: Text-to-svg by abstracting pixel-based diffusion models. CVPR (2023)  
[16] B. Kawar, et al.: Denoising diffusion restoration models. NeurIPS (2022)  
[17] D. P. Kingma, J. Ba: Adam: A method for stochastic optimization. ICLR (2015)  
[18] M. Li, et al.: TrOCR: Transformer-based optical character recognition with pre-trained models. (2022)  
[19] T.-M. Li, et al.: Differentiable vector graphics rasterization for editing and learning. ACM TOG (2020)  
[20] R. Liu, et al.: Zero-1-to-3: Zero-shot one image to 3d object. CVPR (2023)  
[21] Y.-T. Liu, et al.: Learning implicit glyph shape representation. IEEE TVCG (2022)  
[22] Y.-T. Liu, et al.: Dualvector: Unsupervised vector font synthesis with dual-part representation. CVPR (2023)  
[23] R. G. Lopes, et al.: A learned representation for scalable vector graphics. ICCV (2019)  
[24] A. Lugmayr, et al.: RePaint: Inpainting using denoising diffusion probabilistic models. CVPR (2022)  
[25] D. Norman: 1,000 most common us english words. (2023)  
[26] Makeambigrams: Free online ambigram generator. makeambigrams.com (2023)  
[27] A. Pander, R. Casey: Create ambigrams for typography logo art. Adobe Creative Cloud (2023)  
[28] B. Poole, et al.: Dreamfusion: Text-to-3d using 2d diffusion. ICLR (2023)  
[29] A. Ramesh, et al.: Hierarchical text-conditional image generation with clip latents. (2022)  
[30] P. Reddy, et al.: A multi-implicit neural representation for fonts. NeurIPS (2021)  
[31] R. Rombach, et al.: High-resolution image synthesis with latent diffusion models. CVPR (2022)  
[32] C. Saharia, et al.: Photorealistic text-to-image diffusion models with deep language understanding. NeurIPS (2022)  
[33] R. Scheil: Tutorial: Designing an ambigram in 5 steps. (2023)  
[34] T. Shirakawa, S. Uchida: Ambigram generation by a diffusion model. ICDAR (2023)  
[35] Y. Song, S. Ermon: Generative modeling by estimating gradients of the data distribution. NeurIPS (2019)  
[36] H. Wang, et al.: Score jacobian chaining: Lifting pretrained 2d diffusion models for 3d generation. CVPR (2023)  
[37] Y. Wang, Z. Lian: Deepvecfont: Synthesizing high-quality vector fonts via dual-modality learning. ACM TOG (2021)  
[38] Y. Wang, et al.: Attribute2font: Creating fonts you want from attributes. ACM TOG (2020)  
[39] Y. Wang, et al.: Aesthetic text logo synthesis via content-aware layout inferring. CVPR (2022)  
[40] Y. Wang, et al.: Deepvecfont-v2: Exploiting transformers to synthesize vector fonts with higher quality. CVPR (2023)  
[41] S. Xie, et al.: Smartbrush: Text and shape guided object inpainting with diffusion model. CVPR (2023)  
