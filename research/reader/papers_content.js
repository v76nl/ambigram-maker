// 自動生成された論文HTMLコンテンツ (高品質PDF再構築版・日本語句読点スタイル適用)
// 2段組の混ざり、段落ブツ切れ、TOCノイズを完全解消
// 学術論文スタイル（，．）を自然な日本語句読点（、。）に標準化
window.PAPERS_CONTENT = {
  paper05: {
    id: "paper05",
    title: "多目的最適化 GAN によるアンビグラム生成",
    authors: "魏 延輝, 山口 裕（福岡工業大学）",
    year: "2023",
    source: "電気関係学会九州支部連合大会講演論文集",
    badge: "短編・評価指標の核心",
    toc: `<li class="toc-item toc-level-2"><a href="#p5-sec-1" title="1. はじめに">1. はじめに</a></li>
<li class="toc-item toc-level-2"><a href="#p5-sec-2" title="2. 手法">2. 手法</a></li>
<li class="toc-item toc-level-3"><a href="#p5-sec-3" title="2.1 モデル">2.1 モデル</a></li>
<li class="toc-item toc-level-3"><a href="#p5-sec-4" title="2.2 評価手法">2.2 評価手法</a></li>
<li class="toc-item toc-level-2"><a href="#p5-sec-5" title="3. 結果">3. 結果</a></li>
<li class="toc-item toc-level-3"><a href="#p5-sec-6" title="3.1 Wasserstein 距離">3.1 Wasserstein 距離</a></li>
<li class="toc-item toc-level-3"><a href="#p5-sec-7" title="3.2 評価の結果">3.2 評価の結果</a></li>
<li class="toc-item toc-level-2"><a href="#p5-sec-8" title="4. まとめ">4. まとめ</a></li>
<li class="toc-item toc-level-2"><a href="#p5-sec-9" title="参考文献">参考文献</a></li>`,
    html: `<section id="p5-sec-meta" class="paper-section">
<h2 class="section-title">多目的最適化 GAN によるアンビグラム生成</h2>
<blockquote class="paper-quote">
<strong>書誌情報</strong>: 魏 延輝, 山口 裕 (福岡工業大学 大学院工学研究科 / 情報工学部) <br>
<strong>掲載誌</strong>: 2023年度 電気・情報関係学会九州支部連合大会講演論文集 p.39 (講演番号: 08-1A-01) <br>
<strong>DOI</strong>: 10.11527/jceeek.2023.0_39
</blockquote>
</section>
<section id="p5-sec-1" class="paper-section">
<h2 class="section-title">1. はじめに</h2>
<p class="paper-paragraph">回転や鏡像などの変換を施しても可読性を保つ文字画像はアンビグラムと呼ばれる。従来アンビグラムは人間によって設計されているが、本研究ではアンビグラムを生成モデルにより生成させることを考える。具体的には、実際のデータと類似した新しいデータを生成できる<mark class="annotated-term" data-term-id="cgan-wgan">敵対生成ネットワーク</mark>（GAN）[1, 2]を利用し、回転可読性のある文字の生成を行う。</p>
<p class="paper-paragraph">GANは鮮明な画像を生成できるため、芸術分野での活用が期待されている。アンビグラムはカリグラフィーであり、芸術形式の一種でもある。GANに関する研究では、生成データが回転しても可読性を保たせることを目的とした研究例は少ない。本研究では、アンビグラム生成課題を<mark class="annotated-term" data-term-id="multi-objective">多目的最適化</mark>として捉える。その手法のひとつである<mark class="annotated-term" data-term-id="hypervolume">超体積最大化指標</mark>[3]を損失関数に用いて、アンビグラム画像を生成するモデルを構築した。そして、<mark class="annotated-term" data-term-id="recognition-model">画像認識モデル</mark>を用いて、生成された画像をラベルペアごとに評価する。</p>
</section>
<section id="p5-sec-2" class="paper-section">
<h2 class="section-title">2. 手法</h2>
</section>
<section id="p5-sec-3" class="paper-section">
<h3 class="section-title">2.1 モデル</h3>
<p class="paper-paragraph">本実験のモデルは図1のように、<mark class="annotated-term" data-term-id="cgan-wgan">条件付きGAN</mark> (<mark class="annotated-term" data-term-id="cgan-wgan">CGAN</mark>) を拡張し、ラベルペアを条件入力に持つ生成器と、2つの判別器からなる構成とする。WGAN[2]の損失関数を用いて学習し、画像を生成する。</p>
<p class="paper-paragraph">2つの判別器それぞれには訓練サンプル画像データと、それを180度回転した画像データ及びラベルを訓練データとして入力する。生成器は2つの判別器による評価をともに高めることが求められ、これは<mark class="annotated-term" data-term-id="multi-objective">多目的最適化</mark>問題となる。GANに対する<mark class="annotated-term" data-term-id="multi-objective">多目的最適化</mark>手法として提案されている<mark class="annotated-term" data-term-id="hypervolume">超体積最大化法</mark>を導入して、生成器を訓練する。生成器は、2つの訓練データの特徴を同時に学習することができる。訓練データには <mark class="annotated-term" data-term-id="emnist">EMNIST</mark>を用いる。</p>
<blockquote class="paper-quote"><strong>図1 ネットワークモデル</strong></blockquote>
</section>
<section id="p5-sec-4" class="paper-section">
<h3 class="section-title">2.2 評価手法</h3>
<p class="paper-paragraph">生成された画像の品質を評価するために、<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を利用する。<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>に、GAN モデル学習時と同様の訓練データを用いてクラス判別を学習させる。そして、学習後の GANにより生成された画像を入力し、生成された画像のラベルを判定する。</p>
<p class="paper-paragraph">生成画像に対しては生成器 $G$ に入力したラベル $C_1$、その180度回転画像に対しては $C_2$ が<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>の出力として得られた場合を正解とする。各ラベルペアに対し、生成した画像と回転画像に対する正解率を求め、さらに2つの値の<mark class="annotated-term" data-term-id="harmonic-mean">調和平均値</mark>を計算する。</p>
</section>
<section id="p5-sec-5" class="paper-section">
<h2 class="section-title">3. 結果</h2>
</section>
<section id="p5-sec-6" class="paper-section">
<h3 class="section-title">3.1 Wasserstein 距離</h3>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark>は、生成器によって生成された画像の分布と、実際の画像の分布との間の距離を表す。図2に訓練による <mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark>推定値の変化を示す。</p>
<blockquote class="paper-quote"><strong>図2 <mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark>の変化</strong></blockquote>
</section>
<section id="p5-sec-7" class="paper-section">
<h3 class="section-title">3.2 評価の結果</h3>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を用いて生成画像をラベルペア毎に評価し、文字ごとに、最も正解率の<mark class="annotated-term" data-term-id="harmonic-mean">調和平均</mark>が高いペアを求めた。そのラベルペアによる生成画像例を図3に示す。</p>
<blockquote class="paper-quote"><strong>図3 各ラベルペアによる生成画像例</strong></blockquote>
</section>
<section id="p5-sec-8" class="paper-section">
<h2 class="section-title">4. まとめ</h2>
<p class="paper-paragraph">本研究では、2つの判別器を持つ <mark class="annotated-term" data-term-id="cgan-wgan">CGAN</mark>を用いて、生成データが実際のデータと回転データの特徴を学習できるように訓練し、アンビグラムを生成した。そして、<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を用いて生成データを評価し、評価結果に基づいて回転可読性の良い文字を探し出した。</p>
</section>
<section id="p5-sec-9" class="paper-section">
<h2 class="section-title">参考文献</h2>
<p class="paper-paragraph paper-ref-item">[1] I. Goodfellow, et al. "Generative adversarial nets." Advances in neural information processing systems 27 (2014).</p>
<p class="paper-paragraph paper-ref-item">[2] I. Gulrajani, et al. "Improved training of Wasserstein GANs." Advances in neural information processing systems 30 (2017).</p>
<p class="paper-paragraph paper-ref-item">[3] I. Albuquerque, et al. "Multi-objective training of generative adversarial networks with multiple discriminators." International Conference on Machine Learning. PMLR, 2019.</p>
</section>`
  },
  paper02: {
    id: "paper02",
    title: "文字構造特徴を用いたひらがなアンビグラムの生成",
    authors: "井上 和輝, 高橋 裕樹（電気通信大学）",
    year: "2020",
    source: "画像電子学会誌 49巻 4号 (ビジュアルコンピューティング特集)",
    badge: "本命・骨格幾何変形",
    toc: `<li class="toc-item toc-level-2"><a href="#p2-sec-1" title="抄録 (あらまし)">抄録 (あらまし)</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-2" title="Summary (English Abstract)">Summary (English Abstract)</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-3" title="1. はじめに">1. はじめに</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-4" title="2. 従来研究">2. 従来研究</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-5" title="3. 文字構造の取得">3. 文字構造の取得</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-6" title="4. アンビグラムの基本構造生成">4. アンビグラムの基本構造生成</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-7" title="4.1 特徴点の対応付け">4.1 特徴点の対応付け</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-8" title="4.1.1 大局的な部分グラフによる対応付け">4.1.1 大局的な部分グラフによる対応付け</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-9" title="4.1.2 局所的な部分グラフによる対応付け">4.1.2 局所的な部分グラフによる対応付け</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-10" title="4.2 特徴点のアフィン変換">4.2 特徴点のアフィン変換</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-11" title="5. ストロークの太線化">5. ストロークの太線化</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-12" title="6. 可読性評価">6. 可読性評価</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-13" title="6.1 単一文字の可読性の評価">6.1 単一文字の可読性の評価</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-14" title="6.1.1 実施方法">6.1.1 実施方法</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-15" title="6.1.2 評価結果">6.1.2 評価結果</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-16" title="6.1.3 デザイナの作成したアンビグラムとの比較">6.1.3 デザイナの作成したアンビグラムとの比較</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-17" title="6.2 ひらがな識別器による単一文字の可読性の評価">6.2 ひらがな識別器による単一文字の可読性の評価</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-18" title="6.3 単語の可読性の評価">6.3 単語の可読性の評価</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-19" title="6.3.1 実施方法">6.3.1 実施方法</a></li>
<li class="toc-item toc-level-4"><a href="#p2-sec-20" title="6.3.2 評価結果">6.3.2 評価結果</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-21" title="7. 可読性との相関関係">7. 可読性との相関関係</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-22" title="7.1 共通部分との相関">7.1 共通部分との相関</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-23" title="7.2 形状変化との相関">7.2 形状変化との相関</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-24" title="8. 提案手法の検証">8. 提案手法の検証</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-25" title="8.1 有効性の検証">8.1 有効性の検証</a></li>
<li class="toc-item toc-level-3"><a href="#p2-sec-26" title="8.2 適用範囲の検証">8.2 適用範囲の検証</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-27" title="9. 適用限界">9. 適用限界</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-28" title="10. むすび">10. むすび</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-29" title="参考文献">参考文献</a></li>
<li class="toc-item toc-level-2"><a href="#p2-sec-30" title="著者紹介">著者紹介</a></li>`,
    html: `<section id="p2-sec-meta" class="paper-section">
<h2 class="section-title">文字構造特徴を用いたひらがなアンビグラムの生成</h2>
<blockquote class="paper-quote">
<strong>書誌情報</strong>: 井上 和輝, 高橋 裕樹 (電気通信大学 大学院 情報理工学研究科 / 人工知能先端研究センター) <br>
<strong>掲載誌</strong>: 画像電子学会誌 49巻 4号 (ビジュアルコンピューティング特集) pp.301-314 (2020) <br>
<strong>DOI</strong>: 10.11371/iieej.49.301
</blockquote>
</section>
<section id="p2-sec-1" class="paper-section">
<h2 class="section-title">抄録 (あらまし)</h2>
<p class="paper-paragraph">アンビグラムとは文字を異なる方向から見ても読み取れるようにした文字である。しかし、アンビグラムの制作には手間や可読性を維持するためのデザイン的技量が必要である。そこで、ひらがなアンビグラムを文字構造特徴から生成する手法を検討する。まず、文字を<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>して<mark class="annotated-term" data-term-id="thinning-zhang-suen">ストロークの抽出</mark>を行い、<mark class="annotated-term" data-term-id="rdp-simplification">ストロークを単純化</mark>することで文字の特徴点を得る。次に、<mark class="annotated-term" data-term-id="skeleton-graph">特徴点をノードとしたグラフ</mark>から<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を抽出し、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の同型性を調べることで対象文字間の共通部分を検出する。さらに、共通部分の対応関係を基に<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>することで、アンビグラムの文字構造を生成した。最後に、可読性向上のために<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>に変化を加えて<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark>することで、ひらがな46文字を一対一で対応付けた1,081組のアンビグラムを生成した。また、<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>を行った。その結果、単一文字に対しては、作成可能であることが示唆されているアンビグラム724文字中325文字、作成できるかが不明なアンビグラム357文字中93文字が可読であった。さらに、<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の低いアンビグラム1文字を含めたひらがな4文字で構成される<mark class="annotated-term" data-term-id="context-cognitive-completion">単語の可読性</mark>の評価を行った結果、246文字中216文字が可読であった。</p>
<p class="paper-paragraph">**キーワード：アンビグラム、文字構造特徴、<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>、<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>**</p>
</section>
<section id="p2-sec-2" class="paper-section">
<h2 class="section-title">Summary (English Abstract)</h2>
<p class="paper-paragraph">An ambigram is a word which can be also read from a different direction. Generation of ambigrams, however, requires not only enormous work but also design skills for maintaining their readability. This paper, therefore, aims at ambigram generation for a pair of Hiragana. First, characters are thinned, and strokes are extracted and simplified to obtain feature points of the characters. Next, subgraphs are identified from the graphs with the feature points as nodes, common structures between the characters are extracted by verifying isomorphism of the subgraphs, and ambigram structure is generated by affine transformation based on the correspondence between common structures. Finally, stroke thicknesses are exchanged with brush style strokes to improve their readability and 1,081 ambigrams were generated from pairs of 46 hiragana characters. Furthermore, readability of ambigrams was evaluated. In case of a single ambigram, 325 out of 724 ambigrams which can be given by hand crafted were readable. Moreover, 93 out of 357 ambigrams which are not pointed out to be generated were readable. Words composed of 4 hiragana characters including one ambigram with a low readability also revealed that 216 out of 246 words were readable.</p>
<p class="paper-paragraph">**Keywords: ambigram, character structure characteristics, affine transformation, subgraph, graph isomorphism**</p>
</section>
<section id="p2-sec-3" class="paper-section">
<h2 class="section-title">1. はじめに</h2>
<p class="paper-paragraph">文字のデザインは言葉の印象を左右する重要な要素である。例えば、文字に丸みを帯びさせて印象を柔らかくしたり、筆文字にすることで凛々しさを表現したりできる。このような文字のフォントだけでなく、文字の形を変えて言葉を印象的に伝えることができる文字のデザインに「アンビグラム」がある。図1はアンビグラムの例を示しており、図1(a)で「ありがとう」と読める文字を反転させると、図1(b)のように「またあおう」と別の文字で読むことができる。このように、アンビグラムは文字を別の角度から見ることで言葉の意味を変えることができるため、文字に意味の多重性を持たせることができるデザインとなっている。近年、アンビグラムは注目され始め、最近ではサッカー日本代表のユニフォームにまでアンビグラムが採用されるようになった2)。しかし、アンビグラムを生成するには2文字間の中間となる形を生成するための文字変形や、アンビグラムが可能な文字対を選択する手間が必要であり、また可読性を維持するためのデザイン的技量も求められる。さらに、アンビグラムの自動生成アプリケーションが提供されているアルファベット3)に比べて、日本で用いられるひらがなや漢字は、画数が多く、字体も複雑なため、アンビグラムはデザイナによる人の手で作成されている4)。そこで、本論文では可読性を維持しながら文字を適切に変形し、見栄え良い文字生成に主眼を置き、ひらがなのアンビグラムを生成することを目的とする。ただし、文字を90°回転させて読むなど、様々なタイプのアンビグラムが存在するが、本論文では文字の上下を反転させて読むアンビグラムを対象とする。ひらがなの構造特徴から文字間の共通部分を検出し、共通部分の対応関係を基に<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>することでアンビグラムの文字構造を生成する。可読性向上のために<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>に変化を加えて<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark>することでアンビグラムを生成する手法を提案する。</p>
<blockquote class="paper-quote"><strong>図1 アンビグラムの例1)</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.1 An example of Ambigram1)</strong></blockquote>
</section>
<section id="p2-sec-4" class="paper-section">
<h2 class="section-title">2. 従来研究</h2>
<p class="paper-paragraph">細谷ら5)は文字画像を正方形メッシュで変形することで変形文字を生成する研究を行った。変形演算を組み合わせることで文字の形状を多様に変化させることが実現できたが、格子線を変形し、メッシュ頂点の移動をするという限られた変形しかできない。アンビグラムを生成するために文字を変形する際は、対応する2文字間の中間構造に変化させる必要があり、ストロークごとに変形するような詳細な変形をすることが求められる。</p>
<p class="paper-paragraph">Igarashi ら6)やSchaefer ら7)は、変形演算を付与することなく、画像をメッシュで変形する手法を提案した。Igarashi らは画像内の閉多角形中に三角形のメッシュを作成し、各三角形の歪みが最小になるように移動させることで変形が伝搬していく手法を提案した。しかし、文字は曲線から構成されるためメッシュを作成できず、本手法をそのまま適用させることは困難である。また、Schaefer らは、画像全体を四角形メッシュで分割し、<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>、<mark class="annotated-term" data-term-id="affine-transformation">相似変換</mark>、剛体変換に最小二乗法を用いて、ユーザにとって自然な変形を実現した。しかし、本手法の欠点として画像を折り返すような変形が生成されることが挙げられており、文字画像に適応するとストロークが折り曲げられてしまう可能性がある。</p>
<p class="paper-paragraph">ストロークごとに変形を行う手法としては、Campbell ら8)やFujita ら9)によるmanifoldを用いたフォント変換が挙げられる。フォントごとにmanifoldを作成することで、形状の類似したフォントへ連続的に遷移することができ、同時にストロークごとに変形も行われる。しかし、本手法は形状の大きく異なるフォントへの変換が困難であるため、アンビグラムのように形状が大きく異なる2文字の中間形状の生成に適用することは難しい。</p>
<p class="paper-paragraph">成沢ら10)は画像のコンテンツを維持しつつ別の画像のスタイルを転写することのできるNeural Style Transfer11)を用いて、文字のフォントを変換する手法を提案した。英字をConvolutional Neural Networkで学習させることで、英字のフォントをひらがなや漢字にも適用することが可能になった。文字フォントの転写は他にも、異なるドメイン間で画像対をマッピング可能なCycleGAN(Generative Adversarial Networks)12)を用いて<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>した文字画像を毛筆文字へ変換する手法13)や、Recurrent Neural Networkを用いて筆順を考慮して毛筆文字へ変換する手法14)がある。このように、ディープラーニングによってフォントを多様に変換させることができるようになってきた。しかし、アンビグラムは二つの文字が合成されて一つの文字をなしているため、共通ストロークは目立つように、非共通ストロークは片方の文字の可読性に干渉しないように呈示する必要がある。そのため、各<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>まで考慮したフォント生成を行う必要があり、前述した文字のフォントを一様に変換する手法は用いることが困難である。</p>
<p class="paper-paragraph">そこで本論文では、<mark class="annotated-term" data-term-id="delaunay-triangulation">ドロネー三角形</mark>と文字の特徴点を基に<mark class="annotated-term" data-term-id="delaunay-triangulation">三角形メッシュ</mark>を作成し、三角形間の<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>行列を用いて文字変形を行い、2文字間の中間構造を生成する。そして、<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>を自在に制御しながら<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark>することのできる手法を用いてフォント生成を行う。</p>
<blockquote class="paper-quote"><strong>図2 提案手法</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.2 Proposed approach</strong></blockquote>
</section>
<section id="p2-sec-5" class="paper-section">
<h2 class="section-title">3. 文字構造の取得</h2>
<p class="paper-paragraph">提案手法の概要を図2に示す。入力文字の構造を得るために、文字を構成するストロークの端点、ストロークが交わる交点、ストロークの形状を近似する角点を特徴点として抽出する。なお、本論文では入力画像のサイズを300×300ピクセルで統一している。</p>
<p class="paper-paragraph">まず、<mark class="annotated-term" data-term-id="thinning-zhang-suen">Zhang-Suen</mark>の<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>アルゴリズム15)を用いて文字の細線化を行う。ただし、文字のフォントはうろこと呼ばれる文字の飾りがなく、文字の太さが均一である游ゴシック体を採用する。細線化では多数の点の集合として文字が表現されている。文字の形状を適切に表現可能な最低限の画素群で表現するために、まず、細線化した画素を追跡することで文字に含まれるストロークを全て抽出する。しかし、細線化文字では、ストローク交点の周辺に交点候補となる分岐点が複数生じ適切に文字構造を取得することが困難になる。また、ひらがなにおいて同一の場所で3本以上ストロークが交わることはないことから、ストローク交点における次数は最小3、最大4の2種類に限られる。そこで、まず細線化文字を追跡し、交点候補となる分岐点を検出する。次に分岐点を包含する矩形領域に含まれる線分を除去し、矩形領域に接する線分の画素位置を保持する。これによって交点の次数が3、あるいは、4であるかを判別する。交点の次数が4の場合、分断されたストロークが交差するように接続し、追跡を続ける。また、次数が3の場合、ストロークの曲率に基づき、2本のストロークに分割する。まず、分断されたストロークの端点をA, B, Cとする。次に、3点から1点、例えば点Aを選択する。点A から3画素離れたストローク上の画素を点Dとしたとき、∠BADと∠CADを比較して角度が大きい端点と点Aが接続しているとする。ただし、選ばなかった点を新たな端点とし、その点から追跡を行う。</p>
<p class="paper-paragraph">次に抽出した各<mark class="annotated-term" data-term-id="rdp-simplification">ストロークの単純化</mark>をRamer-Douglas-Peuckerのアルゴリズム16)を用いて行う。ただし、点を間引くための点と直線の距離のしきい値は20画素とし、「はね」や「はらい」による構造の変化が単純化により失われないように設定した。その後、交点の決定を行う。まず、交点の次数が4の場合、単純化したストロークを構成する線分を2本選択する。そして、選択した線分が交差していれば、2 線分の交点をストロークの交点とし、全ての線分の組み合わせを調べることで交点を求める。交点の次数が3の場合、接続したストロークと追跡時に得た端点を延長した直線との交点をストロークの交点とする。文字構造の解析過程の例を図3に示す。</p>
</section>
<section id="p2-sec-6" class="paper-section">
<h2 class="section-title">4. アンビグラムの基本構造生成</h2>
</section>
<section id="p2-sec-7" class="paper-section">
<h3 class="section-title">4.1 特徴点の対応付け</h3>
<p class="paper-paragraph">アンビグラム生成において最も重要な処理は、文字構造の共通部分の抽出である。そこで、本論文では得られた特徴点をノード、接続関係をエッジで表すことで文字構造をグラフで表現する。そして、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>と<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>の概念を組み合わせることで、文字間の共通部分を抽出し、対応点を決定する手法を提案する。グラフ, のノードの集合をそれぞれ, 、エッジの集合をそれぞれ, としたときに、 ⊆かつ ⊆を満たすがの部分グラフである。したがって、文字構造をグラフで表現したとき部分グラフを求めることで、文字の部分的な構造を取り出すことができる。また、全単射:  →があり、任意のノード、∈に対して次式が成り立つとき、とはグラフ同型であるという。</p>
<p class="paper-paragraph">, ∈ ⇔,  ∈(1)したがって、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を通常画像の文字と反転画像の文字からそれぞれ取り出し、取り出したグラフの<mark class="annotated-term" data-term-id="subgraph-isomorphism">同型性</mark>を調べることで、ノードの接続関係が等しいグラフを抽出することができる。しかし、同型性を満たしていても、グラフの幾何的な形状が類似しているとは限らず、1文字中のノード間の位置関係を維持するようなノードの対応関係を求める必要がある。そこで、同型性を満たしたグラフのランク付けを行い、文字間の共通部分を抽出する。本章で述べるグラフのランク付けに用いたパラメータは、基礎実験に基づき定めた値を用いている。また、ノードの座標は得られた特徴点の座標の100分の１スケールとしている。</p>
<p class="paper-paragraph">まず、大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の探索をし、エッジ濃度が3以上の連結グラフで表される文字構造及び幾何学的形状が類似した最大の共通部分を検出する。そして、得られた対応点を基に4.2 節で述べる<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を施し、共通部分が重なるように特徴点を移動する。この処理で、残りの未対応ノードの対応付けを行うための文字の位置や回転の影響を軽減する。局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の探索ではノード間の距離に注目することで、対応付けられなかった特徴点の対応付けを行う。最後に、新しい対応点を基に再度<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を行うことでアンビグラムの構造を得る。</p>
<p class="paper-paragraph">以降、式(1)を満たすノード、やノード、を対応点、エッジ,、, を対応エッジ、対応エッジの集合を共通部分とする。また、同じ<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対であってもノードの対応関係の異なる<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対は異なる部分グラフ対とし、別々に計算する。そして、対象の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>が非連結グラフであっても、求める部分グラフは連結グラフとする。</p>
<blockquote class="paper-quote"><strong>図3文字の解析過程</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.3 Process of character analysis</strong></blockquote>
</section>
<section id="p2-sec-8" class="paper-section">
<h4 class="section-title">4.1.1 大局的な部分グラフによる対応付け</h4>
<p class="paper-paragraph">本項の手法の概略を図4に示し、文字をグラフで表現した例を図5に示す。</p>
<p class="paper-paragraph">最大の共通部分を検出するために、まず、グラフ間で最大数のエッジを持つ<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を求め、<mark class="annotated-term" data-term-id="subgraph-isomorphism">同型性</mark>を満たす組を取り出す。得られた部分グラフの組に対し、式(2)で示すランク, を求める。</p>
<p class="paper-paragraph">, ,   ,   , (2)</p>
<p class="paper-paragraph">, は式(3)で示す対応点間のユークリッド距離の和を正規化したものである。正規化は、得られた<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組間で平均0、分散1になるように行う。以降の正規化も同様に行う。</p>
<p class="paper-paragraph">, ‖ "‖(3)したがって、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間で距離が遠くなるほど、値が大きくなる。</p>
<p class="paper-paragraph">, は<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間の対応エッジの角度差の標準偏差を正規化したものであり、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の回転不変な幾何構造の類似度を表す。ただし、以降エッジの角度差は、0°以上180°以下になるように求めている。文字の共通部分は対応エッジの角度差が一般に小さい値となる。また、回転を伴って一致する場合は回転角度に近い値となる。したがって、角度差の標準偏差が小さければ部分グラフが共通部分となる可能性が高く、大きければ角度差がばらついており、共通部分となる可能性が低くなる。</p>
<p class="paper-paragraph">, はあるノードが対応点に置き換わったとき、他のノードとの位置関係が崩れる場合のペナルティ値である。隣接ノードではないノード同士を結んだ線分とノードの対応点同士を結んだ線分間の角度差の集合を、許容する角度差のしきい値を、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間の対応エッジの角度差の平均を̅とすると正規化する前の値は次式のように計算される。</p>
<p class="paper-paragraph">, #$(4)∈</p>
<p class="paper-paragraph">#$%ℎ'$ " ̅ " (,̅) 90° かつ ) 10ℎ$ " ,,ℎ-./0-(5)</p>
<p class="paper-paragraph">ℎ120,1) 0 1,1 3 0(6)本論文のすべての結果で 70°として計算を行った。<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の幾何構造が類似している場合、は小さい値になる。また、類似した幾何構造の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>が回転している場合、その回転角は̅に近い値になる。したがって、式(5)では、̅を引くことで、回転に影響されないペナルティを計算している。各部分グラフの組でランクを計算した後、ランクが最小の部分グラフの組を選択する。そして、その部分グラフ対において、対応点間のユークリッド距離がどれも1.2未満かつ、が15未満であればその部分グラフによる対応点を特徴点の対応点とする。もし条件を満たしていなければ、抽出した部分グラフのエッジ濃度より1 少ない同型な部分グラフを元の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>から求め、同様の操作を条件が満たされるまで繰り返し行う。ただし、調べる部分グラフのエッジの最小値は3とし、条件を満たす部分グラフが見つからなかった場合は特徴点を対応付けずに次項で述べる処理を行い、見つかった場合は次節で述べる<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>をした後に処理を行う。大局的な部分グラフの探索によって図5の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>から抽出した部分グラフを図6に示す。ただし、同色のノードが対応関係にある。</p>
<blockquote class="paper-quote"><strong>図4 大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けの概略</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.4 Outline of correspond with global subgraph</strong></blockquote>
<blockquote class="paper-quote"><strong>図5文字のグラフ化</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.5 Graphed character</strong></blockquote>
<blockquote class="paper-quote"><strong>図6 <mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>抽出結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.6 Result of subgraph extraction</strong></blockquote>
</section>
<section id="p2-sec-9" class="paper-section">
<h4 class="section-title">4.1.2 局所的な部分グラフによる対応付け</h4>
<p class="paper-paragraph">大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けでは対応点を求めることができない、あるいは、不完全である場合が3通りある。一つ目は<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>の連結グラフのエッジ濃度が元々2以下である文字を対象とした場合である。二つ目は得られた<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>がどれも定めた幾何条件を満たせなかった場合である。三つ目は複数の連結グラフでグラフが構成されているため、一つの連結グラフでしか対応付けが行われない、大局的な部分グラフの対応付けだけでは不完全な場合である。</p>
<p class="paper-paragraph">これらの三つの場合でも対応付けを行うために、局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応付けを行う。ただし、ノードの少ない<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>と部分グラフ対は膨大に存在し、幾何情報だけでは適切な対応付けができない。そこで、本来の目的である三つの場合を解決することに限定するために、対応付けられているノードが存在していない連結グラフを必ず含む対応付けを対象とする。</p>
<p class="paper-paragraph">本項の手法の概略を図7に示し、本項で対象とする<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>対を図8に例示する。通常画像のグラフを, 、反転画像のグラフを	, 	とする。また、大域的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>で対応付けられたグラフのノード集合を、∈の隣接エッジの集合をとする。そして、 " ,  " となるグラフを定義する。つまり、はのうち対応付けられていないノードのみで構成されたグラフである。さらに、	を構成する連結グラフの中で、対応付けられたノードを含まない連結グラフ4の集合を5とする。例えば、図8(b)では、反転「に」のグラフは1, 2, 3, 4番、5, 6番、7, 8, 9番のノードからなる連結グラフから構成されており、どれも対応付けられていないため、三つのグラフが4となる。したがって、65	6=3である。このとき、から得られるエッジ濃度2の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>と4 ∈5	から得られるエッジ濃度2の部分グラフの全ての組み合わせに対し、4	ごとにランク付けを行う。つまり、と4を用いることで、本項の目的である連結グラフごとに適切な部分グラフを選択することができる。一つの4につき、得られた組み合わせが3組以上の場合は次式を用いる。</p>
<p class="paper-paragraph">, ̅,   0.7̅, (7)subgraphただし、̅, は対応点間のユークリッド距離の平均̅を正規化したものであり、̅, は<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間の対応エッジの角度差の平均̅を正規化したものである。</p>
<p class="paper-paragraph">すべての組に対してランクを求めた後、ランクが最小の組を選択する。そして、̅が0.75未満かつ、̅が45°未満であれば、<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>のノードを対応点候補とする。この時点で対応点に決定しない理由は、65	6 3 2の場合、連結グラフ4間で、求めた対応点が重複する可能性があるからである。</p>
<p class="paper-paragraph">得られた<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組が2組のとき、式(7)を用いると、正規化が適切に行えないため、次式で示すように正規化を施さない距離と角度差の平均を用いてランクを求める。</p>
<p class="paper-paragraph">, ̅,   ̅, 対応<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を求める場合には幾何特徴を優先するために、̅はそのまま用いた。また、0 : ̅ : 180であるため、180で割ることでスケールを1以下にし、角度差による影響を小さくした。同様にランクが最小の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組を選択し、̅が0.75未満かつ、̅が45°未満であれば、部分グラフのノードを対応点候補とする。</p>
<p class="paper-paragraph">対応点候補が見つからなかった場合、エッジ濃度2の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>で行った操作をエッジ濃度1の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>でも同様に行う。さらに、反転画像の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>	の既に対応付けされているノードを含まないグラフと通常画像の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>の対応付けられたノードを含まない連結グラフ4に対しても同様の操作を行い、対応点候補を探索する。</p>
<p class="paper-paragraph">最後に、対応点の決定を行う。まず、エッジ濃度2の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を調べたときに対応点候補としたノードに重複があるか調べ、ない場合は対応点とし、ある場合は対応点候補からなる<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組に対し、次式で示すランク,  を与える。</p>
<p class="paper-paragraph">, ̅, 0.75̅, 式(7)と式(8)で求めた対応点候補の拘束条件から0 : ̅)0.75かつ0∘: ̅) 45∘であり、ともに等しく評価するために̅は0.75で、̅は45で割ることで、スケールを等しくした。</p>
<p class="paper-paragraph">ランクを各<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組で求めた後、ランクが最小の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組を選択し、対応点を決定する。同様に、エッジ濃度1の部分グラフを調べたときに対応点候補としたノードに対しても対応点の決定を行う。ただし、エッジ濃度2の部分グラフから得た対応点と重複しない対応点候補のみを探索対象とする。局所的な部分グラフの探索によって図8の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>から抽出された部分グラフを図9に示す。ただし、同色の楕円で囲まれている特徴点が対応する部分グラフであり、同色のノードが対応している。</p>
<p class="paper-paragraph">なお、対応付けは全探索処理であるが、ひらがなは特徴点数が少ないため、大多数のひらがな対における探索時間は10秒未満であった。しかし、「あ」は特徴点が20個あり、かつ、同じ文字のため同型グラフが膨大に存在する「あ」と「あ」の対応付けには約4 時間を要した。ただし、本実験では後述のとおりIntel Core i7-8650U @ 1.90GHzを用いており、並列計算は行っていない。</p>
<blockquote class="paper-quote"><strong>図7 局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けの概略</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.7 Outline of correspond with local subgraph</strong></blockquote>
<blockquote class="paper-quote"><strong>図8 大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応付けができなかった例</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.8 An example of not being able to correspond with a global</strong></blockquote>
<blockquote class="paper-quote"><strong>図9 <mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>抽出結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.9 Result of subgraph extraction</strong></blockquote>
<blockquote class="paper-quote"><strong>図10 新たな点群の作成</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.10 Generation of new point group</strong></blockquote>
<blockquote class="paper-quote"><strong>図11文字画像分割結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.11 Result of character image division</strong></blockquote>
<blockquote class="paper-quote"><strong>図12 アンビグラム構造生成結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.12 Result of Ambigram structure generation</strong></blockquote>
</section>
<section id="p2-sec-10" class="paper-section">
<h3 class="section-title">4.2 特徴点のアフィン変換</h3>
<p class="paper-paragraph">特徴点の対応付けを行った後、共通部分を重ね合わせるために特徴点を<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>する。また、対応点の移動に合わせて対応付けされていない特徴点も追随して移動させるために、<mark class="annotated-term" data-term-id="delaunay-triangulation">ドロネー三角形</mark>分割を用いた<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を行う。</p>
<p class="paper-paragraph">まず、対応付けた点の中点を計算する。また、文字画像全体を領域分割するために、画像の周囲8 か所に新たな点群を作成する。これらの点群を用いて<mark class="annotated-term" data-term-id="delaunay-triangulation">ドロネー三角形</mark>で分割する。図10に示す。ただし、同色のノードが対応関係にある。そして、得られた<mark class="annotated-term" data-term-id="delaunay-triangulation">ドロネー三角形</mark>に対応するように通常文字画像及び反転文字画像も分割する。これにより、対応する三角形の頂点が必ず対応関係のある特徴点で構成されるようになる。図10に示す分割により文字画像を分割した結果を図11に示す。分割が終わった後に通常の文字画像と反転した文字画像の対応するドロネー三角形への<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>行列を計算する。そして、文字画像の三角形内に含まれる特徴点に対して<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を行う。以上の手順で特徴点をすべてアフィン変換することでアンビグラムの基本構造を生成する。</p>
<p class="paper-paragraph">図11に示す分割にしたがって<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>をし、アンビグラムを生成した結果を図12に示す。<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>で対応点を重ね合わせ、対応点以外の特徴点も適切に移動させることによって、対応エッジも重ね合わせることができる。本節の処理によって文字ストローク間の対応付けをし、共通部分と非共通部分を分離することができたので、次章でストロークの<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>を行う。</p>
<blockquote class="paper-quote"><strong>図6の対応付け結果から点群を生成し、分割を行った結果を</strong></blockquote>
</section>
<section id="p2-sec-11" class="paper-section">
<h2 class="section-title">5. ストロークの太線化</h2>
<p class="paper-paragraph">アンビグラムの可読性及び見栄えの向上のため、ストロークの<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>をする。生成したアンビグラムは<mark class="annotated-term" data-term-id="rdp-simplification">ストロークの単純化</mark>をしているためにストロークが角張っており、どのストロークも太さが共通である。可読性及び見栄えの向上のためにはストロークを滑らかに表現し、2文字間で共通部分は強調し、共通しない部分は目立たせなくすることが望ましい。そこで、この二つの問題を解決するために、文字を毛<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark>して太線化をすることを検討する。はじめに、ストロークを滑らかにするために<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>後の特徴点をスプライン曲線で補間する。図10(a)、(b)に示す単純化後の文字における特徴点の補間結果を図13に示す。石亀ら17)は三角形と円を組み合わせた図形を毛筆モデルとして定義し、この毛筆モデルを用いることで毛筆文字の生成を実現した。本論文ではこのモデルを用いて、スプライン補間した点をなぞることで毛筆文字の生成を行う。その際、筆圧値と筆先の角度を定義する必要がある。</p>
<p class="paper-paragraph">筆圧値は<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>を決定する値である。対応点、非対応点をなぞるときの筆圧値をそれぞれ=, =とし、ある特徴点とそれに隣接する特徴点が>分割されているとき、画素から?番目の画素の筆圧値0を式(10)で定義する。ただし、あるいはが対応点の場合、=,, =は=、非対応点の場合は=とする。</p>
<p class="paper-paragraph">0= " ?'= " =(>1 : ?) >(10)</p>
<p class="paper-paragraph">式(10)では対応点どうしで結ばれるストロークが、筆圧値=を維持したまま描画されることになる。しかし、図13 (a)に示す1番と2番の特徴点間にストロークは存在せず、図13(b)に示す1番と2番の特徴点間にはストロークが存在しているように、対応点間であってもストロークが共通しているとは限らない。したがって、式(10)で対応点間の筆圧値を計算する際はエッジが共通しているか、つまり対応点間にともにストロークが存在しているかを調べ、存在していない場合は次式(11)で筆圧値を計算する。式(11)を用いることで、対応点から遠ざかるにつれ筆圧値を小さくして<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>を徐々に細くするようにし、太いストロークから細いストロークへの遷移に一定の距離を設けることで、突然<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>が変化するような見た目の違和感を軽減した。⎪⎪⎧= " ?'= " =(>,1 : ?) > " 1 4: ? : 3> " 1=, > " 1</p>
<p class="paper-paragraph">0(11)⎩⎪⎪⎨>,3> " 1= " ?'= " =(4) ?) ></p>
<p class="paper-paragraph">筆先の次の角度は現在の筆先の角度、筆の現在の進行方向$、筆の次の進行方向$を用いて次式で定義する。本論文ではE 10を用い、の初期値を135°とした。</p>
<p class="paper-paragraph"> " E$ " $(12)</p>
<p class="paper-paragraph">筆圧値及び筆先の角度を考慮して図13(a), (b)の文字を<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>して重ね合わせた結果を図14に示す。スプライン曲線でストロークに丸みを付け筆圧値の変化によってストロークの共通部分を太く、非共通部分を目立たなくすることができた。</p>
<blockquote class="paper-quote"><strong>図13 スプライン補間結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.13 Result of spline interpolation</strong></blockquote>
</section>
<section id="p2-sec-12" class="paper-section">
<h2 class="section-title">6. 可読性評価</h2>
<p class="paper-paragraph">ひらがな46文字を一対一で対応付けた1,081組のアンビグラムの可読性を、単一文字及び単語の観点から評価する。ただし、アンビグラムの生成において、本論文ではIntel Core i7-8650U @ 1.90GHzを用いている。</p>
</section>
<section id="p2-sec-13" class="paper-section">
<h3 class="section-title">6.1 単一文字の可読性の評価</h3>
</section>
<section id="p2-sec-14" class="paper-section">
<h4 class="section-title">6.1.1 実施方法</h4>
<p class="paper-paragraph">被験者は図14に示したようなアンビグラムの通常画像と反転画像を並べた画像を見て、それぞれの読みを記述式で回答する。また、不可読な場合は「-」を記入する。ただし、不可読の理由については集計していない。また、後述する作成可能なアンビグラムは1組につき5 名、作成不明なアンビグラムは1組につき3 名回答が得られるように、被験者18 名を割り振ってGoogle フォーム上で回答を行う。そして、通常画像と反転画像の読みが両方正しかった場合のみ、可読とした。例えば、図14の場合は図14(a)を「も」と答え、かつ図14(b)を「お」と答えたときのみを可読とし、それ以外の誤答や読めなかった場合は、すべて不可読とした。なお、被験者には「アンビグラムは反転しても読み取れるようにした文字である」とだけ伝えており、作成経験はない。</p>
<p class="paper-paragraph">また、本論文では、文献1)に記載されていた724組のアンビグラムを作成可能なアンビグラムとし、このアンビグラムの集合をFで表す。そして、記載のない残りの357組のアンビグラムに関して、著者がアンビグラムの作成可能性を検討したが、全て作成が困難であると判断した。したがって、真にアンビグラムを作成できるか不明であるため、作成不明なアンビグラムと称する。</p>
<p class="paper-paragraph">本論文では、アンビグラムGの<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>を、［可読と判断した人数］/［評価者数］で定義し、HGで表す。したがって、アンビグラムGを5 名中2 名が可読とした場合、HG0.4となる。そして、1文字当りの評価者が3人または5人であるため、過半数の3/5、2/3が可読であればアンビグラムは可読性があるとした。</p>
<blockquote class="paper-quote"><strong>図14 <mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.14 Result of fatten stroke</strong></blockquote>
<blockquote class="paper-quote"><strong>図15 提案手法で生成したアンビグラム及びデザイナによるアンビグラム1)の比較</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.15 Comparison of Ambigrams generated by proposed method and by the designer1)</strong></blockquote>
</section>
<section id="p2-sec-15" class="paper-section">
<h4 class="section-title">6.1.2 評価結果</h4>
<p class="paper-paragraph">作成可能なアンビグラムの評価結果を表1に示す。表1 から、作成可能なアンビグラムのうち1文字単体では半数未満の文字にしか可読性がないという結果が得られた。一方で、あったことから、著者が一つも作成できなかった組み合わせからも可読性のあるアンビグラムの生成ができたことが明らかになった。</p>
<p class="paper-paragraph">評価したアンビグラムの一例として、<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0であっ</p>
<p class="paper-paragraph">(a-1) 「あ」・「ま」(a-2) 「い」・「け」(a-3) 「え」・「る」(a-4) 「き」・「わ」(a-5) 「さ」・「や」</p>
<p class="paper-paragraph">(a-1) “A” and “Ma”(a-2) “I” and “Ke”(a-3) “E” and “Ru”(a-4) “Ki” and “Wa”(a-5) “Sa” and “Ya”</p>
<p class="paper-paragraph">(a-6) 「を」・「を」(a-7) 「せ」・「み」(a-8) 「た」・「む」(a-9) 「は」・「れ」(a-10) 「も」・「よ」</p>
<p class="paper-paragraph">(a-6) “Wo” and “Wo”(a-7) “Se” and “Mi”(a-8) “Ta” and “Mu”(a-9) “Ha” and “Re”(a-10) “Mo” and “Yo”</p>
<p class="paper-paragraph">(b-1) 「せ」・「ぬ」(b-2) 「さ」・「を」(b-3) 「つ」・「む」(b-4) 「う」・「ぬ」(b-5) 「あ」・「そ」</p>
<p class="paper-paragraph">(b-1) “Se” and “Nu”(b-2) “Sa” and “Wo”(b-3) “Tsu” and “Mu”(b-4) “U” and “Nu”(b-5) “A” and “So”</p>
<p class="paper-paragraph">(c-1) 「い」・「ね」(c-2) 「う」・「お」(c-3) 「く」・「と」(c-4) 「し」・「や」(c-5) 「せ」・「ち」(c-1) “I” and “Ne”(c-2) “U” and “O”(c-3) “Ku” and “To”(c-4) “Shi” and “Ya”(c-5) “Se” and “Chi”</p>
<p class="paper-paragraph">(c-6) 「ね」・「へ」(c-7) 「と」・「の」(c-8) 「て」・「へ」(c-9) 「ぬ」・「ぬ」(c-10) 「ん」・「ん」</p>
<p class="paper-paragraph">(c-6) “Ne” and “He”(c-7) “To” and “No”(c-8) “Te” and “He”(c-9) “Nu” and “Nu”(c-10) “N” and “N”可読性文字数あり325なし399可読性文字数あり93なし264認識結果文字数可読78不可読1003た提案手法で生成したアンビグラムを図15(a)に、作成不明で<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0であったアンビグラムを図15(b)に、すべての被験者が不可読であったアンビグラムを図15(c)に例示する。また、図15において、四角で囲われた文字は本研究で生成し、評価実験をした文字であり、囲われていない文字は文献1)に記載されていたデザイナが作成した文字であり、評価実験は行っていない。</p>
<blockquote class="paper-quote"><strong>表2 から、作成不明なアンビグラムのうち26.1%で可読性が</strong></blockquote>
<blockquote class="paper-quote"><strong>表1 作成可能なアンビグラムの評価結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Table 1 Evaluation result of Ambigrams can be given by hand crafted</strong></blockquote>
<blockquote class="paper-quote"><strong>表2 作成不明なアンビグラムの評価結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Table 2 Evaluation result of Ambigrams not pointed out to be generated</strong></blockquote>
<blockquote class="paper-quote"><strong>表3 ひらがな認識器による認識結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Table 3 Evaluation result of Ambigrams by Hiragana Recognizer</strong></blockquote>
</section>
<section id="p2-sec-16" class="paper-section">
<h4 class="section-title">6.1.3 デザイナの作成したアンビグラムとの比較</h4>
<p class="paper-paragraph">まず、図15(a)に示した、<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0であった提案手法で生成したアンビグラムに着目する。これらは、対応関係付けられているストロークも一致しており、<mark class="annotated-term" data-term-id="brush-modulation">ストロークの太さ</mark>も強調すべき共通部分は太く、目立たなくすべき非共通部分は細くなっている。したがって、デザイナが作成したアンビグラムと遜色ない文字が生成できているといえる。</p>
<p class="paper-paragraph">次に、図15(b)に示した、作成不明で<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0であったアンビグラムに着目する。これらは、図15(a)に比べて非共通部分が多く見られるが、文字構造の変形が少なく、共通部分がアンビグラムの半分を占めている。例えば図15(b-4)は、「う」の文字全体が強調されており、かつ「う」と「ぬ」の形状はあまり変形されていないため、<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が高くなったといえる。</p>
<p class="paper-paragraph">最後に、図15(c)に示した、全ての被験者が不可読であったアンビグラムに着目する。これらは、デザイナのアンビグラムとはストロークの対応付けが異なっている。例えば図15(c-1)は、「い」の2画目が対応付けられておらず、非共通部分が多いため、不可読であった可能性が高い。さらに、図15(c-3)の対応付けはデザイナと同じであるが、非共通部分の影響によって「く」が「て」のように見える。実際、このアンビグラムは5人中5人が「く」の文字を「て」と読んでいたことから、共通部分をより太くしたり、非共通部分を変形させて目立たなくしたりするようなストロークの<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>の工夫が必要である。</p>
<blockquote class="paper-quote"><strong>図16 認識器が可読としたアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.16 Ambigram which can be read by Hiragana Recognizer</strong></blockquote>
</section>
<section id="p2-sec-17" class="paper-section">
<h3 class="section-title">6.2 ひらがな識別器による単一文字の可読性の評価</h3>
<p class="paper-paragraph">前節では、アンビグラムの可読性を人の目で主観的に評価したが、文字の識別には少なからず個人差がある。そこで、ひらがな識別器を用い、定量的な<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>を行う。</p>
<p class="paper-paragraph">電子技術総合研究所が収集した手書き文字データベースETL818) から160人分の手書きひらがなを用いて、CNN(Convolutional Neural Network)で学習することで、識別器を生成した。なお、学習データに対する識別精度は0.96、誤差関数の値は0.12であり、テストデータに対する識別精度は0.99、誤差関数の値は0.01であった。ただし、誤差関数は交差エントロピーを用いている。この識別器を用いてアンビグラムの識別を行い、前節と同じく通常状態と反転状態の両方の文字を正しく読めた場合を可読とした。</p>
<p class="paper-paragraph">識別結果を表3に示し、可読であったアンビグラムを前節で述べた人による<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>とともに図16に例示する。手書き文字と生成したアンビグラムは形状が大きく異なるため、可読と判断される文字は表1 及び表2に示す人の評価に比べて非常に少ない結果となった。また、識別器で可読と判断された78文字中、人の評価で可読性があった文字は42文字しかなかったことから、人と識別器の可読の判断に関係性はなかったといえる。</p>
<p class="paper-paragraph">なお、デザイナの作成したアンビグラム724文字1)を識別した結果、1文字しか可読でなかった。</p>
</section>
<section id="p2-sec-18" class="paper-section">
<h3 class="section-title">6.3 単語の可読性の評価</h3>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の低いアンビグラムを単語で用いた場合、その可読性が変化するかを調査した。</p>
</section>
<section id="p2-sec-19" class="paper-section">
<h4 class="section-title">6.3.1 実施方法</h4>
<p class="paper-paragraph">まず、ひらがな4文字で構成される単語を日本語教育語彙を一つにした4文字の単語の集合をIとする。このとき、|I|2,536であった。そして、LM ∣M ∈F, 0) HM)0.6, OP ∣P ∈F, 0.6 : HMとし、次式からアンビグラムの単語集合Q∈を得る。ただし、MはMを反転させた文字を表し、正規表現に従い文字列を記述した。⊂I ∣P, P, P ∈OPM	P</p>
<p class="paper-paragraph">Q∈PMPP, P(13)⊂I ∣P, P, P ∈OM	PP</p>
<p class="paper-paragraph">∪PPMP, P</p>
<p class="paper-paragraph">そして、Q∈の要素15,474組から、調査対象とする単語対をTの要素ごとに一つ選択した。その結果、集合Lに含まれるアンビグラム252文字中246文字をそれぞれ1文字ずつ使用した通常状態と反転状態の2 単語246組を得た。</p>
<p class="paper-paragraph">通常状態及び反転状態のアンビグラムの単語に対し、それぞれどのように読めるかは記述式の回答とした。また、各単語につき5 名の回答が得られるように、被験者15 名を割り振り、Google フォーム上での回答とした。そして、通常画像と反転画像の読みの両方が正しかった場合のみ可読とした。</p>
<blockquote class="paper-quote"><strong>表19)から抽出し、濁点、半濁点、小文字を除き、同音異義語</strong></blockquote>
</section>
<section id="p2-sec-20" class="paper-section">
<h4 class="section-title">6.3.2 評価結果</h4>
<p class="paper-paragraph">本論文では、単一文字の評価と同様にアンビグラムの単語。が可読であった<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>H.が0.6以上である場合を可読性があるとした。評価結果を表4に示し、評価単語を<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>とともに図17に例示する。ただし、通常状態と反転状態の単語二組を1 単語として表している。表4 から評価を行った246単語のうち87.8%もの単語が可読であったことから、可読性可読性単語数あり216なし30</p>
<p class="paper-paragraph">（「あきれる」と「おおゆき」）（「かみきれ」と「たようか」）</p>
<p class="paper-paragraph">(“Akireru” and “Ohyuki”)(“Kamikire” and “Tayoka”)が低い文字が含まれていたとしても、単語にすることで可読性が向上することが確認できた。</p>
<p class="paper-paragraph">また、単語を構成する文字の可読性が単語の可読に影響を及ぼしているかについて考察する。評価を行った246 単語について、単語を構成する文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせごとに評価単語数及び可読性がある単語数を集計し、「可読性がある単語の割合」を［可読性がある単語数］/［評価単語数］で定義する。文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせごとに集計した結果を表5に示す。ただし、括弧内は［可読性がある単語数］/［評価単語数］を表す。表5において、可読性がない1文字の可読率が「0.2」、可読性がある3文字の可読率の組み合わせが「0.8と1.0」の場合、単語を構成する4文字の可読率が(0.2, 0.8, 0.8,1.0)のように構成されていることを示している。以下、データ数が一つしかない「0.6と0.8」の列を除いて考察をする。</p>
<p class="paper-paragraph">まず、表5の「0.2」と「0.4」の行を比較すると、残りの3文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>によらず「0.4」を含む単語の方が、可読性がある単語の割合が高いことがわかる。したがって、4文字の単語の場合、1文字の非可読性が単語の可読に悪影響を及ぼすことが推察される。次に、表5の列に着目すると、3文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が上がるほど可読性がある単語の割合が高くなっていることがわかる。したがって、1文字では読みにくい文字が単語に含まれていたとしても、他に読める文字が多いほど単語が読める可能性が上がることが推察される。</p>
<blockquote class="paper-quote"><strong>表4 アンビグラムの単語の評価結果</strong></blockquote>
<blockquote class="paper-quote"><strong>Table 4 Evaluation result of Ambigram word</strong></blockquote>
<blockquote class="paper-quote"><strong>図17 評価単語例</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.17 Example of evaluated word</strong></blockquote>
</section>
<section id="p2-sec-21" class="paper-section">
<h2 class="section-title">7. 可読性との相関関係</h2>
</section>
<section id="p2-sec-22" class="paper-section">
<h3 class="section-title">7.1 共通部分との相関</h3>
<p class="paper-paragraph">6.1.3においてデザイナの作成したアンビグラムと比較することで、共通部分が多いアンビグラムは<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が高く、非共通部分が多いアンビグラムは<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が低くなる傾向にあることを定性的に示した。本節では、共通部分と可読性の関係を定量的に検証する。</p>
<p class="paper-paragraph">特徴点を<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>した結果、重なり合うエッジの長さの総和をU、各<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>の全エッジの長さの総和をそれぞれU, Uとすると、共通部分の割合は次式で与えられる。readability可読性がある3文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせ0.6と0.8 0.8のみ0.8と1.0 1.0のみ0.2 1.00 0.57 0.80 0.92</p>
<p class="paper-paragraph">可読性がない(1/1)(4/7)(78/97)(22/24)</p>
<p class="paper-paragraph">1文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>0.96 0.95(11/13)(79/82)(21/22)</p>
<p class="paper-paragraph">可読性がある文字の割合63/126</p>
<p class="paper-paragraph">0.8 30/49</p>
<p class="paper-paragraph">0.6</p>
<p class="paper-paragraph">0.4</p>
<p class="paper-paragraph">0.2[0.0,0.1)[0.1,0.2)[0.2,0.3)[0.3,0.4)[0.4,0.5)[0.5,0.6)[0.6,0.7)[0.7,0.8)[0.8,0.9)[0.9,1.0]共通部分の割合readable words</p>
<p class="paper-paragraph">H 0.2, V 0.09 H 0.2, V 0.14</p>
<p class="paper-paragraph">H 1.0, V 0.63 H 1.0, V 0.60</p>
<p class="paper-paragraph">U U  U " U(11)式(11)を用いて共通部分の割合を計算し、割合ごとに可読性がある文字の割合を求めた結果を図18に示す。ただし、棒グラフの上部の数値は、［可読性がある文字数］/［評価文字数］を表す。グラフが示すように、共通部分の割合が増加するほど、可読性がある文字の割合も上昇することが明らかになった。したがって、共通部分の割合と可読性には相関があるといえる。では、なぜそのような相関が得られるのかを視覚的にも考0.6</p>
<p class="paper-paragraph">可読性がある文字の割合0.5 13/37 0.4 12/43 2/7 0.3 28/114 3/19 0.2 0.1[0.0,0.1)[0.1,0.2)[0.2,0.3)[0.3,0.4)[0.4,0.5)[0.5,0.6)[0.6,0.7)[0.7,0.8)[0.8,0.9)[0.9,1.0]エッジの平均角度差関係and proportion of readable words察するために、図19に共通部分が少ないアンビグラムを、通部分の割合をVで表している。細いストロークが通常状態の文字と反転状態の文字のどちらに属するか判別できなくなり、結果的にそれぞれの文字の構造を区別できなくなったため可読性が低くなった推察する。一方で図20を見ると、太いストロークが多いことから、共通部分だけで何の文字かを判断することができ、結果的に非共通部分の可読に対する悪影響が小さくなり可読性が高くなったと推察する。</p>
<blockquote class="paper-quote"><strong>表5 <mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせごとの可読性がある単語の割合</strong></blockquote>
<blockquote class="paper-quote"><strong>Table 5 Proportion of readable words for each combination of</strong></blockquote>
<blockquote class="paper-quote"><strong>図18 共通部分の割合と可読性がある文字の割合との関係</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.18 Relationship between proportion of common strokes and</strong></blockquote>
<blockquote class="paper-quote"><strong>図19 共通部分が少ないアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.19 Ambigram with few common parts</strong></blockquote>
<blockquote class="paper-quote"><strong>図20 共通部分が多いアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.20 Ambigram with many common parts</strong></blockquote>
<blockquote class="paper-quote"><strong>図21 エッジの平均角度差と可読性のある文字の割合との</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.21 Relationship between average angular difference in edges</strong></blockquote>
<blockquote class="paper-quote"><strong>図20に共通部分が多いアンビグラムを例示する。なお、共</strong></blockquote>
<blockquote class="paper-quote"><strong>図19を見ると、非共通部分が多く混在していることから、</strong></blockquote>
</section>
<section id="p2-sec-23" class="paper-section">
<h3 class="section-title">7.2 形状変化との相関</h3>
<p class="paper-paragraph">次に、形状変化と可読性に相関があるか検証する。形状変化に関する要素をしては、エッジの傾きの変化が挙げられる。そこで、本節では<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>前後の<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>のエッジの平均角度差が可読性と相関があるか調べる。まず、エッジの平均角度差を［エッジの角度差の和］/［エッジ数］とする。ただし、平均角度差は1文字ごとに求めており、エッジの角度差は0°以上180°以下になるように求めている。そして、エッジの平均角度差を最小値0、最大値1になるように正規化し、各範囲で可読性がある文字の割合を求めた結果を図21に示す。ただし、図21の上部の数値は［可読性がある文字数］/［評価文字数］を表す。性に明確な相関は見られなかった。したがって、前節の共通部分の割合と可読性の顕著な相関を踏まえると、形状変化が大きくても共通部分の割合が多ければ、可読となることが期待できる。一方で、図15(c-1)のように、形状変化が小さくても共通部分の割合が少なければ、不可読となる可能性が高いと推察する。では、なぜエッジの平均角度差と可読性に相関が得られな</p>
<p class="paper-paragraph">H 0.2, M 0.16, V 0.21 H 1.0, M 0.14, V 0.40</p>
<p class="paper-paragraph">H 0.2, M 0.70, V 0.48 H 1.0, M 0.57, V 0.56かったのかを視覚的にも考察するために、図22に平均角度差が小さいアンビグラムを、図23に平均角度差が大きいアンビグラムを例示する。なお、平均角度差を前述のとおり正規化した値をMで表している。</p>
<p class="paper-paragraph">共通部分の割合は元々の文字構造の違いに依存するため、図22に示すように平均角度差が等しく小さい場合でも共通部分の割合は異なる。したがって、平均角度差と共通部分の割合には相関がないため、可読性とも相関がないと推察する。</p>
<p class="paper-paragraph">さらに、文字が可読であるためには文字を決定付けるような重要な構造がエッジの角度変化により失われていないことが求められる。例えば、図23(b)を見ると、文字は共に大きく変形しているが、それぞれのストロークが干渉し合っていないため、文字の変形が可読に影響を及ぼさなかったと推測する。一方、図23(a)の矢印が指す部分は「き」と判別するか「さ」と判別するかを決定する重要な部分であるが、エッジの角度変化によりストロークがくっついてしまい、「き」の構造が失われてしまっている。このような可読性に大きな影響を与える一部のエッジの角度変化は平均角度差の大小にかかわらず発生するため、文字全体の変形量の指標である平均角度差では考慮できないことも、可読性との相関が現れなかった要因であると推察する。</p>
<blockquote class="paper-quote"><strong>図21 から、エッジの平均角度差、すなわち形状変化と可読</strong></blockquote>
<blockquote class="paper-quote"><strong>図22 平均角度差が小さいアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.22 Ambigram with small average angular difference</strong></blockquote>
<blockquote class="paper-quote"><strong>図23 平均角度差が大きいアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.23 Ambigram with large average angular difference</strong></blockquote>
</section>
<section id="p2-sec-24" class="paper-section">
<h2 class="section-title">8. 提案手法の検証</h2>
</section>
<section id="p2-sec-25" class="paper-section">
<h3 class="section-title">8.1 有効性の検証</h3>
<p class="paper-paragraph">本論文では、ノードの対応付け、すなわちグラフマッチングに<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>と文字の構造特徴を用いているが、グラフマッチングの手法は多岐にわたっている20)~24)。そこで、<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>や文字構造特徴を用いない、Riesen らのグラフマッチング手法24)によりアンビグラムを生成し、提案手法の有効性を検証する。Riesen らは、全ノードに対して、グラフ編集における置換コスト、削除コスト、挿入コストをノードのラベルや隣接エッジ数を基に与え、割り当て問題を解くことで最小のグラフ編集コストを計算し、ノードのマッチングを行っている。したがって、例えばノードのラベルがノードの座標であれば、ノード間の距離が近く、隣接エッジの数が等しいノードが優先的に対応付けされる。本節の比較実験では、Riesen らの<mark class="annotated-term" data-term-id="skeleton-graph">文字グラフ</mark>を用いた実験と同様にノードのラベルをノードの座標として置換コストを計算する。また、削除コスト及び挿入コストは定められた値がないため、基本的な対応付けである、「い」と「い」のアンビグラムが生成できるようなパラメータを設定した。</p>
<p class="paper-paragraph">Riesen らの手法を用いて対応付けをした結果と提案手法を用いて対応付けをした結果を図24に示し、その対応付けを用いてアンビグラムを生成した結果を図25に示す。ただし、同色のノードが対応関係にあり、赤丸の白色ノードは対応付けされていないノードである。</p>
<p class="paper-paragraph">対応点全体を見ると、提案手法は式(2)のにより対応点の位置関係が「す」と「ま」で等しくなっている。さらに、<mark class="annotated-term" data-term-id="subgraph-isomorphism">同型性</mark>を満たしているため、対応点とエッジに注目すると共通部分が抽出できている。一方、Riesen らの手法は「す」の2番ノードと9番ノードに着目すると、対応する「ま」の4番ノードと7番ノードとの位置関係が崩れている。また、図24(a)ではノード間の対応する隣接エッジの傾きは、式(2)のにしきい値を定めているため、類似している。一方、図24(b)の「す」の4, 5番間のエッジと対応する「ま」の2, 10番間のエッジに注目すると、傾きが約90°も異なっている。</p>
<p class="paper-paragraph">したがって、文字としての形状を崩さないような対応点を求めるには、文字の構造特徴を加味した対応付けが必要である。</p>
<blockquote class="paper-quote"><strong>図24 「す」と「ま」の対応付け</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.24 Correspondence between “Su” and “Ma”</strong></blockquote>
<blockquote class="paper-quote"><strong>図25 「す」と「ま」のアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.25 Ambigram from “Su” and “Ma”</strong></blockquote>
</section>
<section id="p2-sec-26" class="paper-section">
<h3 class="section-title">8.2 適用範囲の検証</h3>
<p class="paper-paragraph">提案手法は、ストロークの交点の次数が4以下の文字という制限があるが、この条件以外でひらがなに依存した処理は行っていない。また、グラフを反転させるだけでなく、鏡映反転させてもアンビグラムの生成には影響がない。そこで、提案手法の適用範囲を実験的に検証した。実験対象を、アルファベット小文字、アルファベット大文字、カタカナの180°回転のアンビグラムと、鏡映反転させるひらがなアンビグラムとする。</p>
<p class="paper-paragraph">図26に生成結果を例示する。提案手法ではひらがな以外の文字でもアンビグラムを生成することができ、180°回転のアンビグラムだけでなく、鏡映反転のアンビグラムも生成することが可能である。</p>
</section>
<section id="p2-sec-27" class="paper-section">
<h2 class="section-title">9. 適用限界</h2>
<p class="paper-paragraph">本手法では、ひらがなの反転アンビグラムだけでなく、他の文字種や鏡映反転などのアンビグラムにも応用できることが前章で明らかとなった。しかし、本手法の大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けは連結グラフどうしでしか対応付けすることができない。したがって、2文字のアンビグラムを反転させると3文字として読めるような、1 対複数文字の対応付けのアンビグラムを生成できない。さらに、多くの漢字は複数の連結グラフから構成されているため、大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けが大局的ではなくなる。</p>
<p class="paper-paragraph">したがって、この問題を解決するためには、大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けにおいて、複数の連結グラフから同型なグラフを抽出し、適切な対応付けを計算する必要がある。</p>
<blockquote class="paper-quote"><strong>図26 複数の文字種及び鏡映反転のひらがなアンビグラム</strong></blockquote>
<blockquote class="paper-quote"><strong>Fig.26 Ambigrams with multiple characters and mirrored Hiragana</strong></blockquote>
</section>
<section id="p2-sec-28" class="paper-section">
<h2 class="section-title">10. むすび</h2>
<p class="paper-paragraph">文字構造の共通部分の抽出、特徴点の適切な対応付け、<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>を行うアンビグラム生成手法を提案した。アンビグラム作家が制作した724文字をすべて含み、新たな357文字を加えた1,081文字のアンビグラムを生成した。</p>
<p class="paper-paragraph">被験者による<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>により、作成可能なアンビグラムのうち半数以上で可読性がないという結果となったが、単一文字のときは可読性がなかった1文字を含む単語に対する<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>を行った結果、87.8%の単語に可読性があったことから、単語にすることによる可読性の向上がみられた。さらに、著者が作成困難と判断した357の文字対からも適切に文字の共通部分を検出し、可読性があるアンビグラムを93文字生成できた。</p>
<p class="paper-paragraph">可読性と共通部分及び形状変化に相関があるか検証した結果、ストロークが重なり合う部分の割合が大きいほど可読性が向上することが確認でき、形状変化の大小は可読性に影響しないと推察した。</p>
<p class="paper-paragraph">そして、別のグラフマッチング手法との比較により、提案手法の有効性を検証し、ひらがな以外のアンビグラムを本手法により生成することで、適用範囲の検証を行った。</p>
<p class="paper-paragraph">しかし、可読性の観点から文字表現の向上が必要である。「く」や「へ」といった特徴点の少ない文字や、特徴点が多くても対応点が少ない場合は変形が足りないため、非共通部分をより目立たなくする変形方法と<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>を検討する。</p>
</section>
<section id="p2-sec-29" class="paper-section">
<h2 class="section-title">参考文献</h2>
<p class="paper-paragraph paper-ref-item">[1] 野村一晟、つくろうよ！アンビグラム、飛鳥新社 (2018).</p>
<p class="paper-paragraph paper-ref-item">[2] 日刊スポーツ、日本代表ユニ「日本晴れ」文字反対にすると「侍魂」、https://www. nikkansports. com/soccer/japan/news/2019110600006 42.html (2020).</p>
<p class="paper-paragraph paper-ref-item">[3] FlipScript, Inc., FlipScript, https://flipscript. com/en/flip (2019).</p>
<p class="paper-paragraph paper-ref-item">[4] マイナビ、文字には、人の心を動かす“チカラ”がある - アンビグラム作家・野村一晟、https://news. mynavi. jp/article/20191128-929 543/ (2020).</p>
<p class="paper-paragraph paper-ref-item">[5] 細谷律子、是枝浩行、井上喜勇、山内司、松田泰昌: “非線形変換を組み合わせた変形文字の生成”、情報処理学会全国大会講演論文集、Vol.48、No.3、pp.301–302 (1994).</p>
<p class="paper-paragraph paper-ref-item">[6] T. Igarashi, T. Moscovich, J. F. Hughes: “As-Rigid-as-Possible Shape Manipulation”, ACM Trans. on Computer Graphics, Vol.24, No.3, pp.1134–1141 (2005).</p>
<p class="paper-paragraph paper-ref-item">[7] S. Schaefer, T. McPhail, J. Warren: “Image Deformation Using Moving Least Squares”, ACM Trans. Graph, Vol.25, No.3, pp.533–540 (2006).</p>
<p class="paper-paragraph paper-ref-item">[8] N. D. F. Campbell, J. Kautz: “Learning a Manifold of Fonts”, ACM Trans. on Graphics, Vol.33, No.4, pp.91:1–91:11 (2014).</p>
<p class="paper-paragraph paper-ref-item">[9] Y. Fujita, H. Xie, K. Miyata: “Perceptual Font Manifold from Generative Model”, Nicograph International (NicoInt), pp. 41–48 (2019).</p>
<p class="paper-paragraph paper-ref-item">[10] 成沢淳史、柳井啓司: “Neural Style Transferと Cycle GANを利用したフォント変換”、画像の認識・理解シンポジウム(MIRU), pp. PS2–26 (2017).</p>
<p class="paper-paragraph paper-ref-item">[11] L. A. Gatys, A. S. Ecker, M. Bethge: “Image Style Transfer Using Convolutional Neural Networks”, Proc. of IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp.2414–2423 (2016).</p>
<p class="paper-paragraph paper-ref-item">[12] J.-Y. Zhu, T. Park, P. Isola, A. A. Efros: “Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks”, Proc. of IEEE Conference on Computer Vision and Pattern Recognition (CVPR), pp.2414–2423 (2016).</p>
<p class="paper-paragraph paper-ref-item">[13] 島崎早智、多田信洋、藤岡寛之、日高章理: “ニューラル画像対画像変換による毛筆体文字の生成”、第81回全国大会講演論文集、Vol.2019、No.1、pp.189–190 (2019).</p>
<p class="paper-paragraph paper-ref-item">[14] S. Tang, Z. Xia, Z. Lian, Y. Tang, J. Xiao, “FontRNN: Generating Large-scale Chinese Fonts via Recurrent Neural Network”, Computer Graphics Forum, Vol.38, No.7, pp.567–577 (2019).</p>
<p class="paper-paragraph paper-ref-item">[15] T. -Y. Zhang, C. -Y. Suen: “A Fast Parallel Algorithms For Thinning Digital Patterns”, Communication of the ACM”, Vol.27, No.3, pp.236– 239 (1984).</p>
<p class="paper-paragraph paper-ref-item">[16] U. Ramer, “An Iterative Procedure for The Polygonal Approximation of Plane Curves”, Communication of the ACM, Vol.1, No.3, pp.244–256, (1972).</p>
<p class="paper-paragraph paper-ref-item">[17] 石亀昌明、三浦望、保坂暁子、福島隆行: “毛筆のモデル化による毛筆文字の生成”、情報処理学会研究報告。HI、ヒューマンインタフェース研究会報告、Vol.97、No.71、pp.45–51 (1997).</p>
<p class="paper-paragraph paper-ref-item">[18] 独立行政法人産業技術総合研究所、手書教育漢字データベース ETL8、http://etlcdb. db. aist. go. jp/specification-of-etl-8?lang=ja (2020).</p>
<p class="paper-paragraph paper-ref-item">[19] 日本語教育語彙表 ver1.0: http://jhlee. sakura. ne. jp/JEV. html (2020).</p>
<p class="paper-paragraph paper-ref-item">[20] A. Zanfir, C. Sminchisescu: “Deep Learning of Graph Matching”, Proc. of IEEE/CVF Conference on Computer Vision and Pattern Recognition(CVPR), pp.2684–2693 (2018).</p>
<p class="paper-paragraph paper-ref-item">[21] P. Morrison, J. J. Zou: “Inexact Graph Matching Using a Hierarchy of Matching Processes”, Computational Visual Media, pp.291–307 (2015).</p>
<p class="paper-paragraph paper-ref-item">[22] X. Bai, L. J. Latecki: “Path Similarity Skeleton Graph Matching”, IEEE Trans. on Pattern Analysis and Machine Intelligence, Vol.30, No.7, pp.1282–1292 (2008).</p>
<p class="paper-paragraph paper-ref-item">[23] M. Cho, J. Lee, K. M. Lee: “Reweighted Random Walks for Graph Matching”, Proc. of European Conference on Computer Vision (ECCV), Vol.6315, pp.492–505 (2010).</p>
<p class="paper-paragraph paper-ref-item">[24] K. Riesen, H. Bunke: “Approximate Graph Edit Distance Computation by Means of Bipartite Graph Matching”, Image and Vision Computing, Vol.27, pp.950–959 (2009).</p>
</section>
<section id="p2-sec-30" class="paper-section">
<h2 class="section-title">著者紹介</h2>
<p class="paper-paragraph">（受付情報・著者紹介） （2020年7 月19 日再受付）井上和輝2020年電気通信大学Ⅰ類卒業。在学時、画像処理の研究に従事。高橋裕樹（正会員）1990年東京工業大学工学部制御工学科卒業。1992年同大学院博士前期課程(物理情報工学専攻) 修了。1994年同大学院博士後期課程中退。1994年同大工学部情報工学科助手。同大大学院情報理工学研究科助手を経て、現在、電気通信大学大学院情報理工学研究科准教授。博士(工学)。視覚情報処理の研究に従事。</p>
</section>`
  }
};
