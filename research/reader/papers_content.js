// 自動生成された論文HTMLコンテンツ
window.PAPERS_CONTENT = {
  paper05: {
    id: "paper05",
    title: "多目的最適化 GAN によるアンビグラム生成",
    authors: "魏 延輝, 山口 裕（福岡工業大学）",
    year: "2023",
    source: "電気関係学会九州支部連合大会講演論文集",
    badge: "短編・評価指標の核心",
    toc: `<li class="toc-item"><a href="#sec-1">多目的最適化 GAN によるアンビグラム生成 (全文テキスト)</a></li>
<li class="toc-item"><a href="#sec-2">１ はじめに</a></li>
<li class="toc-item"><a href="#sec-3">多目的最適化GAN によるアンビグラム生成</a></li>
<li class="toc-item"><a href="#sec-5">４ まとめ</a></li>`,
    html: `<section id="sec-1" class="paper-section">
<h2 class="section-title">多目的最適化 GAN によるアンビグラム生成 (全文テキスト)</h2>
<blockquote class="paper-quote">**書誌情報**:</blockquote>
<blockquote class="paper-quote">- **著者**: 魏 延輝, 山口 裕</blockquote>
<blockquote class="paper-quote">- **発行年**: 2023</blockquote>
<blockquote class="paper-quote">- **掲載誌/会議**: 電気関係学会九州支部連合大会講演論文集 2023年度 p.39</blockquote>
<blockquote class="paper-quote">- **DOI**: 10.11527/jceeek.2023.0_39</blockquote>
<blockquote class="paper-quote">- **元URL**: https://www.jstage.jst.go.jp/article/jceeek/2023/0/2023_39/_article/-char/ja/</blockquote>
<blockquote class="paper-quote">- **原本PDF**: \`paper.pdf\` (ローカル保存済み)</blockquote>
<p class="paper-paragraph">---</p>
</section>
<section id="sec-2" class="paper-section">
<h2 class="section-title">１ はじめに</h2>
<p class="paper-paragraph">回転や鏡像などの変換を施しても可読性を保つ文字画像はアンビグラムと呼ばれる．従来アンビグラムは人間によって設計されているが，本研究ではアンビグラムを生成モデルにより生成させることを考える．具体的には，実際のデータと類似した新しいデータを生成できる<mark class="annotated-term" data-term-id="cgan-wgan">敵対生成ネットワーク</mark>（GAN）[1,2]を利用し，回転可読性のある文字の生成を行う．</p>
<p class="paper-paragraph">GAN は鮮明な画像を生成できるため，芸術分野での活用が期待されている．アンビグラムはカリグラフィーであり， 芸術形式の一種でもある．GAN に関する研究では，生成データが回転しても可読性を保たせることを目的とした研究例は少ない．本研究では，アンビグラム生成課題を<mark class="annotated-term" data-term-id="multi-objective">多目的最適化</mark>として捉える，その手法のひとつである<mark class="annotated-term" data-term-id="hypervolume">超体積最大化</mark>指標[3]を損失関数に用いて，アンビグラム画像を生成するモデルを構築した．そして，画像<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を用いて，生成された画像をラベルペアごとに評価する． ２ 手法 ２．１ モデル</p>
<p class="paper-paragraph">本実験のモデルは図1 のように，<mark class="annotated-term" data-term-id="cgan-wgan">条件付きGAN</mark> (<mark class="annotated-term" data-term-id="cgan-wgan">CGAN</mark>) を拡張し，ラベルペアを条件入力に持つ生成器と，2 つの判別器からなる構成とする．<mark class="annotated-term" data-term-id="cgan-wgan">WGAN</mark>[2]の損失関数を用いて学習し，画像を生成する．2 つの判別器それぞれには訓練サンプル画像データとそれを180 度回転した画像データ及びラベルを訓練データとして入力する．生成器は2 つの判別器による評価をともに高めることが求められ，これは<mark class="annotated-term" data-term-id="multi-objective">多目的最適化</mark>問題となる．GAN に対する<mark class="annotated-term" data-term-id="multi-objective">多目的最適化</mark>手法として提案されている<mark class="annotated-term" data-term-id="hypervolume">超体積最大化</mark>法を導入して，生成器を訓練する．生成器は，2 つの訓練データの特徴を同時に学習することができる．訓練データにはEMNIST を用いる．</p>
<blockquote class="paper-quote">**図 1 ネットワークモデル**</blockquote>
<p class="paper-paragraph">２．２ 評価手法</p>
<p class="paper-paragraph">生成された画像の品質を評価するために，<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を利用する．<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>に，GAN モデル学習時と同様の訓練データを用いてクラス判別を学習させる．そして，学習後のGAN により生成された画像を入力し，生成された画像のラベルを判定する．生成画像に対してはG に入力したラベルC1，その回転画像に対してはC2 が<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>の出力として得られた場合を正解とする．各ラベルペアに対し，</p>
</section>
<section id="sec-3" class="paper-section">
<h2 class="section-title">多目的最適化GAN によるアンビグラム生成</h2>
<p class="paper-paragraph">魏延輝* 山口裕** （福岡工業大学 *大学院工学研究科 **情報工学部）</p>
<p class="paper-paragraph">生成した画像と回転画像に対する正解率を求め，さらに二つの値の<mark class="annotated-term" data-term-id="harmonic-mean">調和平均値</mark>を計算する. ３ 結果 ３．１ <mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark></p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark>は，生成器によって生成された画像の分布と実際の画像の分布との間の距離を表す．図2 に訓練による<mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark>推定値の変化を示す．</p>
<blockquote class="paper-quote">**図 2 <mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein 距離</mark>の変化**</blockquote>
<p class="paper-paragraph">３．２ 評価の結果</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を用いて生成画像をラベルペア毎に評価し，文字ごとに，最も正解率の<mark class="annotated-term" data-term-id="harmonic-mean">調和平均</mark>が高いペアを求めた，そのラベルペアによる生成画像例を図3 に示す．</p>
</section>
<section id="sec-5" class="paper-section">
<h2 class="section-title">４ まとめ</h2>
<p class="paper-paragraph">本研究では，2つの判別器を持つ<mark class="annotated-term" data-term-id="cgan-wgan">CGAN</mark>を用いて，生成データが実際のデータと回転データの特徴を学習できるように訓練し，アンビグラムを生成した．そして，<mark class="annotated-term" data-term-id="recognition-model">認識モデル</mark>を用いて生成データを評価し，評価結果に基づいて回転可読性の良い文字を探し出した． 参考文献 [1] I. Goodfellow, et al. "Generative adversarial nets."</p>
<p class="paper-paragraph">Advances in neural information processing systems 27 (2014). [2] I. Gulrajani, et al. "Improved training of <mark class="annotated-term" data-term-id="wasserstein-distance">Wasserstein</mark></p>
<p class="paper-paragraph">GANs." Advances in neural information processing systems 30 (2017). [3] I. Albuquerque, et al. "<mark class="annotated-term" data-term-id="multi-objective">Multi-objective</mark> training of</p>
<p class="paper-paragraph">generative adversarial networks with multiple discriminators." International Conference on Machine Learning. PMLR, 2019.</p>
</section>`
  },
  paper02: {
    id: "paper02",
    title: "文字構造特徴を用いたひらがなアンビグラムの生成",
    authors: "井上 和輝, 高橋 裕樹（電気通信大学）",
    year: "2020",
    source: "画像電子学会誌 49巻 4号 (ビジュアルコンピューティング特集)",
    badge: "本命・骨格幾何変形",
    toc: `<li class="toc-item"><a href="#sec-1">文字構造特徴を用いたひらがなアンビグラムの生成 (全文テキスト)</a></li>
<li class="toc-item"><a href="#sec-2">文字構造特徴を用いたひらがなアンビグラムの生成</a></li>
<li class="toc-item"><a href="#sec-3">Generation of Hiragana Ambigram Based on Character Structure Characteristics</a></li>
<li class="toc-item"><a href="#sec-4">〈あらまし〉 アンビグラムとは文字を異なる方向から見ても読み取れるようにした文字である．しかし，アンビ</a></li>
<li class="toc-item"><a href="#sec-5"><Summary> An ambigram is a word which can be also read from a different direction. Generation of ambigrams, however,</a></li>
<li class="toc-item"><a href="#sec-6">1. はじめに</a></li>
<li class="toc-item"><a href="#sec-7">2. 従来研究</a></li>
<li class="toc-item"><a href="#sec-8">3. 文字構造の取得</a></li>
<li class="toc-item"><a href="#sec-9">2 線分の交点をストロークの交点とし，全ての線分の組み合</a></li>
<li class="toc-item"><a href="#sec-10">4. アンビグラムの基本構造生成</a></li>
<li class="toc-item"><a href="#sec-11">180 (8)</a></li>
<li class="toc-item"><a href="#sec-12">45 (9)</a></li>
<li class="toc-item"><a href="#sec-13">5. ストロークの太線化</a></li>
<li class="toc-item"><a href="#sec-14">4 : ? : 3> " 1</a></li>
<li class="toc-item"><a href="#sec-15">4 ) ? ) ></a></li>
<li class="toc-item"><a href="#sec-16">6. 可読性評価</a></li>
<li class="toc-item"><a href="#sec-17">7. 可読性との相関関係</a></li>
<li class="toc-item"><a href="#sec-18">1 文字の可読率</a></li>
<li class="toc-item"><a href="#sec-19">8. 提案手法の検証</a></li>
<li class="toc-item"><a href="#sec-20">9. 適用限界</a></li>
<li class="toc-item"><a href="#sec-21">10. むすび</a></li>
<li class="toc-item"><a href="#sec-22">参考文献</a></li>
<li class="toc-item"><a href="#sec-23">239 (1984).</a></li>`,
    html: `<section id="sec-1" class="paper-section">
<h2 class="section-title">文字構造特徴を用いたひらがなアンビグラムの生成 (全文テキスト)</h2>
<blockquote class="paper-quote">**書誌情報**:</blockquote>
<blockquote class="paper-quote">- **著者**: 井上 和輝, 高橋 裕樹</blockquote>
<blockquote class="paper-quote">- **発行年**: 2020</blockquote>
<blockquote class="paper-quote">- **掲載誌/会議**: 画像電子学会誌 49巻 4号 pp.301-314</blockquote>
<blockquote class="paper-quote">- **DOI**: 10.11371/iieej.49.301</blockquote>
<blockquote class="paper-quote">- **元URL**: https://www.jstage.jst.go.jp/article/iieej/49/4/49_301/_article/-char/ja/</blockquote>
<blockquote class="paper-quote">- **原本PDF**: \`paper.pdf\` (ローカル保存済み)</blockquote>
<p class="paper-paragraph">---</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">-- ビジュアルコンピューティング特集 --</p>
</section>
<section id="sec-2" class="paper-section">
<h2 class="section-title">文字構造特徴を用いたひらがなアンビグラムの生成</h2>
<p class="paper-paragraph">井 上 和 輝†  高 橋 裕 樹††, ‡（正会員）</p>
<p class="paper-paragraph">†電気通信大学 情報理工学域， ††電気通信大学 大学院 情報理工学研究科，</p>
<p class="paper-paragraph">‡電気通信大学 人工知能先端研究センター</p>
</section>
<section id="sec-3" class="paper-section">
<h2 class="section-title">Generation of Hiragana Ambigram Based on Character Structure Characteristics</h2>
<p class="paper-paragraph">Kazuki INOUE†,  Hiroki TAKAHASHI††, ‡ (Member)</p>
<p class="paper-paragraph">† School of Informatics and Engineering, The University of Electro-Communications,</p>
<p class="paper-paragraph">††Graduate School of Informatics and Engineering, The University of Electro-Communications,</p>
<p class="paper-paragraph">‡Artificial Intelligence eXploration Research Center, The University of Electro-Communications</p>
</section>
<section id="sec-4" class="paper-section">
<h2 class="section-title">〈あらまし〉 アンビグラムとは文字を異なる方向から見ても読み取れるようにした文字である．しかし，アンビ</h2>
<p class="paper-paragraph">グラムの制作には手間や可読性を維持するためのデザイン的技量が必要である．そこで，ひらがなアンビグラムを</p>
<p class="paper-paragraph">文字構造特徴から生成する手法を検討する．まず，文字を<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>して<mark class="annotated-term" data-term-id="thinning-zhang-suen">ストロークの抽出</mark>を行い，ストロークを単純</p>
<p class="paper-paragraph">化することで文字の特徴点を得る．次に，<mark class="annotated-term" data-term-id="skeleton-graph">特徴点をノードとしたグラフ</mark>から<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を抽出し，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の同</p>
<p class="paper-paragraph">型性を調べることで対象文字間の共通部分を検出する．さらに，共通部分の対応関係を基に<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>すること</p>
<p class="paper-paragraph">で，アンビグラムの文字構造を生成した．最後に，可読性向上のためにストロークの太さに変化を加えて<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark></p>
<p class="paper-paragraph">することで，ひらがな46 文字を一対一で対応付けた1,081 組のアンビグラムを生成した．また，<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>を</p>
<p class="paper-paragraph">行った．その結果，単一文字に対しては，作成可能であることが示唆されているアンビグラム724 文字中325 文字，</p>
<p class="paper-paragraph">作成できるかが不明なアンビグラム357 文字中93 文字が可読であった．さらに，<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の低いアンビグラム1 文</p>
<p class="paper-paragraph">字を含めたひらがな4 文字で構成される<mark class="annotated-term" data-term-id="context-cognitive-completion">単語の可読性</mark>の評価を行った結果，246 文字中216 文字が可読であった．</p>
<p class="paper-paragraph">**キーワード：アンビグラム, 文字構造特徴, <mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>, <mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>, <mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>**</p>
</section>
<section id="sec-5" class="paper-section">
<h2 class="section-title"><Summary> An ambigram is a word which can be also read from a different direction. Generation of ambigrams, however,</h2>
<p class="paper-paragraph">requires not only enormous work but also design skills for maintaining their readability. This paper, therefore, aims at</p>
<p class="paper-paragraph">ambigram generation for a pair of Hiragana. First, characters are thinned, and strokes are extracted and simplified to obtain</p>
<p class="paper-paragraph">feature points of the characters. Next, subgraphs are identified from the graphs with the feature points as nodes, common</p>
<p class="paper-paragraph">structures between the characters are extracted by verifying isomorphism of the subgraphs, and ambigram structure is generated</p>
<p class="paper-paragraph">by affine transformation based on the correspondence between common structures. Finally, stroke thicknesses are exchanged</p>
<p class="paper-paragraph">with brush style strokes to improve their readability and 1,081 ambigrams were generated from pairs of 46 hiragana characters.</p>
<p class="paper-paragraph">Furthermore, readability of ambigrams was evaluated. In case of a single ambigram, 325 out of 724 ambigrams which can be</p>
<p class="paper-paragraph">given by hand crafted were readable. Moreover, 93 out of 357 ambigrams which are not pointed out to be generated were</p>
<p class="paper-paragraph">readable. Words composed of 4 hiragana characters including one ambigram with a low readability also revealed that 216 out</p>
<p class="paper-paragraph">of 246 words were readable.</p>
<p class="paper-paragraph">**Keywords: ambigram, character structure characteristics, affine transformation, subgraph, graph isomorphism**</p>
<p class="paper-paragraph">に伝えることができる文字のデザインに「アンビグラム」が</p>
</section>
<section id="sec-6" class="paper-section">
<h2 class="section-title">1. はじめに</h2>
<p class="paper-paragraph">文字のデザインは言葉の印象を左右する重要な要素である．</p>
<p class="paper-paragraph">例えば，文字に丸みを帯びさせて印象を柔らかくしたり，筆</p>
<p class="paper-paragraph">文字にすることで凛々しさを表現したりできる．このような</p>
<p class="paper-paragraph">文字のフォントだけでなく，文字の形を変えて言葉を印象的</p>
<p class="paper-paragraph">ある．図1 はアンビグラムの例を示しており，図1(a)で「あ</p>
<p class="paper-paragraph">りがとう」と読める文字を反転させると，図1(b)のように「ま</p>
<p class="paper-paragraph">たあおう」と別の文字で読むことができる．このように，ア</p>
<p class="paper-paragraph">ンビグラムは文字を別の角度から見ることで言葉の意味を変</p>
<p class="paper-paragraph">えることができるため，文字に意味の多重性を持たせること</p>
<p class="paper-paragraph">(a) 通常画像                 (b) 反転画像</p>
<p class="paper-paragraph">(a) Normal image             (b) Inverted image</p>
<blockquote class="paper-quote">**図1 アンビグラムの例1)**</blockquote>
<blockquote class="paper-quote">**Fig.1  An example of Ambigram1)**</blockquote>
<p class="paper-paragraph">ができるデザインとなっている． 近年，アンビグラムは注目</p>
<p class="paper-paragraph">され始め，最近ではサッカー日本代表のユニフォームにまで</p>
<p class="paper-paragraph">アンビグラムが採用されるようになった2)．しかし，アンビ</p>
<p class="paper-paragraph">グラムを生成するには2 文字間の中間となる形を生成するた</p>
<p class="paper-paragraph">めの文字変形や，アンビグラムが可能な文字対を選択する手</p>
<p class="paper-paragraph">間が必要であり，また可読性を維持するためのデザイン的技</p>
<p class="paper-paragraph">量も求められる．さらに，アンビグラムの自動生成アプリケ</p>
<p class="paper-paragraph">ーションが提供されているアルファベット3)に比べて，日本</p>
<p class="paper-paragraph">で用いられるひらがなや漢字は，画数が多く，字体も複雑な</p>
<p class="paper-paragraph">ため，アンビグラムはデザイナによる人の手で作成されてい</p>
<p class="paper-paragraph">る4)．そこで，本論文では可読性を維持しながら文字を適切</p>
<p class="paper-paragraph">に変形し，見栄え良い文字生成に主眼を置き，ひらがなのア</p>
<p class="paper-paragraph">ンビグラムを生成することを目的とする．ただし，文字を90°</p>
<p class="paper-paragraph">回転させて読むなど，様々なタイプのアンビグラムが存在す</p>
<p class="paper-paragraph">るが， 本論文では文字の上下を反転させて読むアンビグラム</p>
<p class="paper-paragraph">を対象とする．ひらがなの構造特徴から文字間の共通部分を</p>
<p class="paper-paragraph">検出し，共通部分の対応関係を基に<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>することで</p>
<p class="paper-paragraph">アンビグラムの文字構造を生成する．可読性向上のためにス</p>
<p class="paper-paragraph">トロークの太さに変化を加えて<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark>することでアンビグ</p>
<p class="paper-paragraph">ラムを生成する手法を提案する．</p>
</section>
<section id="sec-7" class="paper-section">
<h2 class="section-title">2. 従来研究</h2>
<p class="paper-paragraph">細谷ら5)は文字画像を正方形メッシュで変形することで変</p>
<p class="paper-paragraph">形文字を生成する研究を行った．変形演算を組み合わせるこ</p>
<p class="paper-paragraph">とで文字の形状を多様に変化させることが実現できたが，格</p>
<p class="paper-paragraph">子線を変形し，メッシュ頂点の移動をするという限られた変</p>
<p class="paper-paragraph">形しかできない．アンビグラムを生成するために文字を変形</p>
<p class="paper-paragraph">する際は，対応する2 文字間の中間構造に変化させる必要が</p>
<p class="paper-paragraph">あり，ストロークごとに変形するような詳細な変形をするこ</p>
<p class="paper-paragraph">とが求められる．</p>
<p class="paper-paragraph">Igarashi ら6)やSchaefer ら7)は，変形演算を付与することな</p>
<p class="paper-paragraph">く，画像をメッシュで変形する手法を提案した．Igarashi らは</p>
<p class="paper-paragraph">画像内の閉多角形中に三角形のメッシュを作成し，各三角形</p>
<p class="paper-paragraph">の歪みが最小になるように移動させることで変形が伝搬して</p>
<p class="paper-paragraph">いく手法を提案した．しかし，文字は曲線から構成されるた</p>
<p class="paper-paragraph">めメッシュを作成できず，本手法をそのまま適用させること</p>
<p class="paper-paragraph">は困難である．また，Schaefer らは，画像全体を四角形メッ</p>
<p class="paper-paragraph">シュで分割し，<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>，相似変換，剛体変換に最小二</p>
<p class="paper-paragraph">乗法を用いて，ユーザにとって自然な変形を実現した．しか</p>
<blockquote class="paper-quote">**図2 提案手法**</blockquote>
<blockquote class="paper-quote">**Fig.2  Proposed approach**</blockquote>
<p class="paper-paragraph">し，本手法の欠点として画像を折り返すような変形が生成さ</p>
<p class="paper-paragraph">れることが挙げられており，文字画像に適応するとストロー</p>
<p class="paper-paragraph">クが折り曲げられてしまう可能性がある．</p>
<p class="paper-paragraph">ストロークごとに変形を行う手法としては，Campbell ら8)</p>
<p class="paper-paragraph">やFujita ら9)によるmanifold を用いたフォント変換が挙げら</p>
<p class="paper-paragraph">れる．フォントごとにmanifold を作成することで，形状の類</p>
<p class="paper-paragraph">似したフォントへ連続的に遷移することができ，同時にスト</p>
<p class="paper-paragraph">ロークごとに変形も行われる．しかし，本手法は形状の大き</p>
<p class="paper-paragraph">く異なるフォントへの変換が困難であるため，アンビグラム</p>
<p class="paper-paragraph">のように形状が大きく異なる2 文字の中間形状の生成に適用</p>
<p class="paper-paragraph">することは難しい．</p>
<p class="paper-paragraph">成沢ら10)は画像のコンテンツを維持しつつ別の画像のスタ</p>
<p class="paper-paragraph">イルを転写することのできるNeural Style Transfer11)を用いて，</p>
<p class="paper-paragraph">文字のフォントを変換する手法を提案した．英字を</p>
<p class="paper-paragraph">Convolutional Neural Network で学習させることで，英字のフ</p>
<p class="paper-paragraph">ォントをひらがなや漢字にも適用することが可能になった．</p>
<p class="paper-paragraph">文字フォントの転写は他にも，異なるドメイン間で画像対を</p>
<p class="paper-paragraph">マッピング可能なCycleGAN(Generative Adversarial Networks)</p>
<li class="paper-li">12)を用いて<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>した文字画像を<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>文字へ変換する手法13)</li>
<p class="paper-paragraph">や，Recurrent Neural Network を用いて筆順を考慮して<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>文</p>
<p class="paper-paragraph">字へ変換する手法14)がある．このように，ディープラーニン</p>
<p class="paper-paragraph">グによってフォントを多様に変換させることができるように</p>
<p class="paper-paragraph">なってきた．しかし，アンビグラムは二つの文字が合成され</p>
<p class="paper-paragraph">て一つの文字をなしているため，共通ストロークは目立つよ</p>
<p class="paper-paragraph">うに，非共通ストロークは片方の文字の可読性に干渉しない</p>
<p class="paper-paragraph">ように呈示する必要がある．そのため，各ストロークの太さ</p>
<p class="paper-paragraph">まで考慮したフォント生成を行う必要があり，前述した文字</p>
<p class="paper-paragraph">のフォントを一様に変換する手法は用いることが困難である．</p>
<p class="paper-paragraph">そこで本論文では，ドロネー三角形と文字の特徴点を基に</p>
<p class="paper-paragraph">三角形メッシュを作成し，三角形間の<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換行列</mark>を用</p>
<p class="paper-paragraph">いて文字変形を行い，2 文字間の中間構造を生成する．そし</p>
<p class="paper-paragraph">て，ストロークの太さを自在に制御しながら<mark class="annotated-term" data-term-id="brush-modulation">筆文字化</mark>するこ</p>
<p class="paper-paragraph">とのできる手法を用いてフォント生成を行う．</p>
</section>
<section id="sec-8" class="paper-section">
<h2 class="section-title">3. 文字構造の取得</h2>
<p class="paper-paragraph">提案手法の概要を図2 に示す．入力文字の構造を得るため</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">に，文字を構成するストロークの端点，ストロークが交わる</p>
<p class="paper-paragraph">交点，ストロークの形状を近似する角点を特徴点として抽出</p>
<p class="paper-paragraph">する．なお，本論文では入力画像のサイズを300×300 ピク</p>
<p class="paper-paragraph">セルで統一している．</p>
<p class="paper-paragraph">まず，<mark class="annotated-term" data-term-id="thinning-zhang-suen">Zhang-Suen</mark> の<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>アルゴリズム15)を用いて文字の</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>を行う．ただし，文字のフォントはうろこと呼ばれる</p>
<p class="paper-paragraph">文字の飾りがなく，文字の太さが均一である游ゴシック体を</p>
<p class="paper-paragraph">採用する．<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>では多数の点の集合として文字が表現され</p>
<p class="paper-paragraph">ている．文字の形状を適切に表現可能な最低限の画素群で表</p>
<p class="paper-paragraph">現するために，まず，<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>した画素を追跡することで文字</p>
<p class="paper-paragraph">に含まれるストロークを全て抽出する．しかし，<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>文字</p>
<p class="paper-paragraph">では，ストローク交点の周辺に交点候補となる分岐点が複数</p>
<p class="paper-paragraph">生じ適切に文字構造を取得することが困難になる．また，ひ</p>
<p class="paper-paragraph">らがなにおいて同一の場所で3 本以上ストロークが交わるこ</p>
<p class="paper-paragraph">とはないことから，ストローク交点における次数は最小3，</p>
<p class="paper-paragraph">最大4 の2 種類に限られる．そこで，まず<mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>文字を追跡</p>
<p class="paper-paragraph">し，交点候補となる分岐点を検出する．次に分岐点を包含す</p>
<p class="paper-paragraph">る矩形領域に含まれる線分を除去し，矩形領域に接する線分</p>
<p class="paper-paragraph">の画素位置を保持する．これによって交点の次数が3，ある</p>
<p class="paper-paragraph">いは，4 であるかを判別する．交点の次数が4 の場合，分断</p>
<p class="paper-paragraph">されたストロークが交差するように接続し，追跡を続ける．</p>
<p class="paper-paragraph">また，次数が3 の場合，ストロークの曲率に基づき，2 本の</p>
<p class="paper-paragraph">ストロークに分割する．まず，分断されたストロークの端点</p>
<p class="paper-paragraph">をA, B, C とする．次に，3 点から1 点，例えば点A を選択</p>
<p class="paper-paragraph">する．点A から3 画素離れたストローク上の画素を点D とし</p>
<p class="paper-paragraph">たとき，∠BAD と∠CAD を比較して角度が大きい端点と点</p>
<p class="paper-paragraph">A が接続しているとする．ただし，選ばなかった点を新たな</p>
<p class="paper-paragraph">端点とし，その点から追跡を行う．</p>
<p class="paper-paragraph">次に抽出した各<mark class="annotated-term" data-term-id="rdp-simplification">ストロークの単純化</mark>をRamer-</p>
<p class="paper-paragraph">Douglas-Peucker のアルゴリズム16)を用いて行う．ただし，点</p>
<p class="paper-paragraph">を間引くための点と直線の距離のしきい値は20 画素とし，</p>
<p class="paper-paragraph">「はね」や「はらい」による構造の変化が単純化により失わ</p>
<p class="paper-paragraph">れないように設定した．その後，交点の決定を行う．まず，</p>
<p class="paper-paragraph">交点の次数が4 の場合，単純化したストロークを構成する線</p>
<p class="paper-paragraph">分を2 本選択する．そして，選択した線分が交差していれば，</p>
</section>
<section id="sec-9" class="paper-section">
<h2 class="section-title">2 線分の交点をストロークの交点とし，全ての線分の組み合</h2>
<p class="paper-paragraph">わせを調べることで交点を求める．交点の次数が3 の場合，</p>
<p class="paper-paragraph">接続したストロークと追跡時に得た端点を延長した直線との</p>
<p class="paper-paragraph">交点をストロークの交点とする．文字構造の解析過程の例を</p>
<blockquote class="paper-quote">**図3 に示す．**</blockquote>
</section>
<section id="sec-10" class="paper-section">
<h2 class="section-title">4. アンビグラムの基本構造生成</h2>
<p class="paper-paragraph">4.1特徴点の対応付け</p>
<p class="paper-paragraph">アンビグラム生成において最も重要な処理は，文字構造の</p>
<p class="paper-paragraph">共通部分の抽出である．そこで，本論文では得られた特徴点</p>
<p class="paper-paragraph">をノード，接続関係をエッジで表すことで文字構造をグラフ</p>
<p class="paper-paragraph">で表現する．そして，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>と<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>の概念を組み</p>
<p class="paper-paragraph">(a) 入力画像    (b) <mark class="annotated-term" data-term-id="thinning-zhang-suen">細線化</mark>後</p>
<p class="paper-paragraph">(a)  Input image   (b)  Thinning</p>
<p class="paper-paragraph">(c) ストローク抽出後       (d) 単純化後</p>
<p class="paper-paragraph">(c)  Stroke extraction     (d) Stroke simplification</p>
<blockquote class="paper-quote">**図3 文字の解析過程**</blockquote>
<blockquote class="paper-quote">**Fig.3  Process of character analysis**</blockquote>
<p class="paper-paragraph">合わせることで，文字間の共通部分を抽出し，対応点を決定</p>
<p class="paper-paragraph">する手法を提案する．グラフ, のノードの集合をそれぞ</p>
<p class="paper-paragraph">れ, ，エッジの集合をそれぞれ, としたときに， ⊆</p>
<p class="paper-paragraph">かつ ⊆を満たすがの<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>である．したが</p>
<p class="paper-paragraph">って，文字構造をグラフで表現したとき<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を求める</p>
<p class="paper-paragraph">ことで，文字の部分的な構造を取り出すことができる．また，</p>
<p class="paper-paragraph">全単射:  →があり，任意のノード</p>
<p class="paper-paragraph">,</p>
<p class="paper-paragraph">∈に対して次</p>
<p class="paper-paragraph">式が成り立つとき，とは<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>であるという．</p>
<p class="paper-paragraph"></p>
<p class="paper-paragraph">,</p>
<p class="paper-paragraph"> ∈ ⇔</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph"> ∈ (1)</p>
<p class="paper-paragraph">したがって，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を通常画像の文字と反転画像の文字</p>
<p class="paper-paragraph">からそれぞれ取り出し，取り出したグラフの同型性を調べる</p>
<p class="paper-paragraph">ことで，ノードの接続関係が等しいグラフを抽出することが</p>
<p class="paper-paragraph">できる．しかし，同型性を満たしていても，グラフの幾何的</p>
<p class="paper-paragraph">な形状が類似しているとは限らず，1 文字中のノード間の位</p>
<p class="paper-paragraph">置関係を維持するようなノードの対応関係を求める必要があ</p>
<p class="paper-paragraph">る．そこで，同型性を満たしたグラフのランク付けを行い，</p>
<p class="paper-paragraph">文字間の共通部分を抽出する．本章で述べるグラフのランク</p>
<p class="paper-paragraph">付けに用いたパラメータは，基礎実験に基づき定めた値を用</p>
<p class="paper-paragraph">いている．また，ノードの座標は得られた特徴点の座標の100</p>
<p class="paper-paragraph">分の１スケールとしている．</p>
<p class="paper-paragraph">まず，大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の探索をし，エッジ濃度が3 以</p>
<p class="paper-paragraph">上の連結グラフで表される文字構造及び幾何学的形状が類似</p>
<p class="paper-paragraph">した最大の共通部分を検出する．そして，得られた対応点を</p>
<p class="paper-paragraph">基に4.2 節で述べる<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を施し，共通部分が重なる</p>
<p class="paper-paragraph">ように特徴点を移動する．この処理で，残りの未対応ノード</p>
<p class="paper-paragraph">の対応付けを行うための文字の位置や回転の影響を軽減する．</p>
<p class="paper-paragraph">局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の探索ではノード間の距離に注目するこ</p>
<p class="paper-paragraph">とで，対応付けられなかった特徴点の対応付けを行う．最後</p>
<p class="paper-paragraph">に，新しい対応点を基に再度<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を行うことでアン</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">ビグラムの構造を得る．</p>
<p class="paper-paragraph">以降，式(1)を満たすノード</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">やノード</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">を対応点，</p>
<p class="paper-paragraph">エッジ</p>
<p class="paper-paragraph">,</p>
<p class="paper-paragraph">，</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">を対応エッジ，対応エッジの集合</p>
<p class="paper-paragraph">を共通部分とする．また，同じ<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対であってもノー</p>
<p class="paper-paragraph">ドの対応関係の異なる<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対は異なる<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対と</p>
<p class="paper-paragraph">し，別々に計算する．そして，対象の文字グラフが非連結グ</p>
<p class="paper-paragraph">ラフであっても，求める<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>は連結グラフとする．</p>
<p class="paper-paragraph">4.1.1大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応付け</p>
<p class="paper-paragraph">本項の手法の概略を図4 に示し，文字をグラフで表現した</p>
<p class="paper-paragraph">例を図5 に示す．</p>
<p class="paper-paragraph">最大の共通部分を検出するために，まず，グラフ間で最大</p>
<p class="paper-paragraph">数のエッジを持つ<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を求め，同型性を満たす組を取</p>
<p class="paper-paragraph">り出す．得られた<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組に対し，式(2)で示すランク</p>
<p class="paper-paragraph">, を求める．</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">,   ,   ,  (2)</p>
<p class="paper-paragraph">, は式(3)で示す対応点間のユークリッド距離の和</p>
<p class="paper-paragraph">を正規化したものである．正規化は，得られた<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark></p>
<p class="paper-paragraph">の組間で平均0，分散1 になるように行う．以降の正規化も</p>
<p class="paper-paragraph">同様に行う．</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">‖</p>
<p class="paper-paragraph"> "</p>
<p class="paper-paragraph">‖</p>
<p class="paper-paragraph">(3)</p>
<p class="paper-paragraph"></p>
<p class="paper-paragraph">したがって，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間で距離が遠くなるほど，値が大き</p>
<p class="paper-paragraph">くなる．</p>
<p class="paper-paragraph">, は<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間の対応エッジの角度差の標準偏</p>
<p class="paper-paragraph">差を正規化したものであり，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の回転不変な幾何構</p>
<p class="paper-paragraph">造の類似度を表す．ただし，以降エッジの角度差は，0°以上</p>
<p class="paper-paragraph">180°以下になるように求めている．文字の共通部分は対応エ</p>
<p class="paper-paragraph">ッジの角度差が一般に小さい値となる．また，回転を伴って</p>
<p class="paper-paragraph">一致する場合は回転角度に近い値となる．したがって，角度</p>
<p class="paper-paragraph">差の標準偏差が小さければ<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>が共通部分となる可能</p>
<p class="paper-paragraph">性が高く，大きければ角度差がばらついており，共通部分と</p>
<p class="paper-paragraph">なる可能性が低くなる．</p>
<p class="paper-paragraph">, はあるノードが対応点に置き換わったとき，他</p>
<p class="paper-paragraph">のノードとの位置関係が崩れる場合のペナルティ値である．</p>
<p class="paper-paragraph">隣接ノードではないノード同士を結んだ線分とノードの対応</p>
<p class="paper-paragraph">点同士を結んだ線分間の角度差の集合を，許容する角度差</p>
<p class="paper-paragraph">のしきい値を，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間の対応エッジの角度差の平均を</p>
<p class="paper-paragraph">̅とすると正規化する前の値は次式のように計算される．</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">#$</p>
<p class="paper-paragraph">(4)</p>
<p class="paper-paragraph">∈</p>
<p class="paper-paragraph">#$</p>
<p class="paper-paragraph">%ℎ'$ " ̅ " (, ̅ ) 90°  かつ   ) 10 ℎ$ " , ,ℎ-./0-</p>
<p class="paper-paragraph">(5)</p>
<p class="paper-paragraph">ℎ1</p>
<p class="paper-paragraph">20, 1 ) 0 1, 1 3 0 (6)</p>
<p class="paper-paragraph">本論文のすべての結果で </p>
<p class="paper-paragraph">70°として計算を行った．部分</p>
<blockquote class="paper-quote">**図4 大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けの概略**</blockquote>
<blockquote class="paper-quote">**Fig.4  Outline of correspond with global subgraph**</blockquote>
<p class="paper-paragraph">(a) 通常画像「も」     (b) 反転画像「お」</p>
<p class="paper-paragraph">(a)  Normal image “Mo”    (b)  Inverted image “O”</p>
<blockquote class="paper-quote">**図5 文字のグラフ化**</blockquote>
<blockquote class="paper-quote">**Fig.5  Graphed character**</blockquote>
<p class="paper-paragraph">グラフの幾何構造が類似している場合，は小さい値になる．</p>
<p class="paper-paragraph">また，類似した幾何構造の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>が回転している場合，</p>
<p class="paper-paragraph">その回転角は̅に近い値になる．したがって，式(5)では，̅を</p>
<p class="paper-paragraph">引くことで，回転に影響されないペナルティを計算している．</p>
<p class="paper-paragraph">各<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組でランクを計算した後，ランクが最小</p>
<p class="paper-paragraph">の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組を選択する．そして，その<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対に</p>
<p class="paper-paragraph">おいて，対応点間のユークリッド距離がどれも1.2未満かつ，</p>
<p class="paper-paragraph">が15 未満であればその<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応点を特徴点</p>
<p class="paper-paragraph">の対応点とする．もし条件を満たしていなければ，抽出した</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>のエッジ濃度より1 少ない同型な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を元</p>
<p class="paper-paragraph">の文字グラフから求め，同様の操作を条件が満たされるまで</p>
<p class="paper-paragraph">繰り返し行う．ただし，調べる<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>のエッジの最小値</p>
<p class="paper-paragraph">は3 とし，条件を満たす<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>が見つからなかった場合</p>
<p class="paper-paragraph">は特徴点を対応付けずに次項で述べる処理を行い，見つかっ</p>
<p class="paper-paragraph">た場合は次節で述べる<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>をした後に処理を行う．</p>
<p class="paper-paragraph">大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の探索によって図5 の文字グラフから抽</p>
<p class="paper-paragraph">出した<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を図6 に示す．ただし，同色のノードが対</p>
<p class="paper-paragraph">応関係にある．</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">(a) 通常画像「も」    (b) 反転画像「お」</p>
<p class="paper-paragraph">(a)  Normal image “Mo”  (b)  Inverted image “O”</p>
<blockquote class="paper-quote">**図6 <mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>抽出結果**</blockquote>
<blockquote class="paper-quote">**Fig.6  Result of subgraph extraction**</blockquote>
<p class="paper-paragraph">4.1.2局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応付け</p>
<p class="paper-paragraph">大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けでは対応点を求めること</p>
<p class="paper-paragraph">ができない，あるいは，不完全である場合が3 通りある．一</p>
<p class="paper-paragraph">つ目は文字グラフの連結グラフのエッジ濃度が元々2 以下で</p>
<p class="paper-paragraph">ある文字を対象とした場合である．二つ目は得られた部分グ</p>
<p class="paper-paragraph">ラフがどれも定めた幾何条件を満たせなかった場合である．</p>
<p class="paper-paragraph">三つ目は複数の連結グラフでグラフが構成されているため，</p>
<p class="paper-paragraph">一つの連結グラフでしか対応付けが行われない，大局的な部</p>
<p class="paper-paragraph">分グラフの対応付けだけでは不完全な場合である．</p>
<p class="paper-paragraph">これらの三つの場合でも対応付けを行うために，局所的な</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応付けを行う．ただし，ノードの少ない</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>と<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>対は膨大に存在し，幾何情報だけで</p>
<p class="paper-paragraph">は適切な対応付けができない．そこで，本来の目的である三</p>
<p class="paper-paragraph">つの場合を解決することに限定するために，対応付けられて</p>
<p class="paper-paragraph">いるノードが存在していない連結グラフを必ず含む対応付け</p>
<p class="paper-paragraph">を対象とする．</p>
<p class="paper-paragraph">本項の手法の概略を図7 に示し，本項で対象とする文字グ</p>
<p class="paper-paragraph">ラフ対を図8 に例示する．通常画像のグラフを</p>
<p class="paper-paragraph">, ，</p>
<p class="paper-paragraph">反転画像のグラフを</p>
<p class="paper-paragraph">	, 	とする．また，大域的な部</p>
<p class="paper-paragraph">分グラフで対応付けられたグラフのノード集合を</p>
<p class="paper-paragraph">，</p>
<p class="paper-paragraph"></p>
<p class="paper-paragraph">∈</p>
<p class="paper-paragraph">の隣接エッジの集合を</p>
<p class="paper-paragraph">とする．そして，</p>
<p class="paper-paragraph"> " </p>
<p class="paper-paragraph">,  " </p>
<p class="paper-paragraph">となるグラフを定義する．つまり，</p>
<p class="paper-paragraph">は</p>
<p class="paper-paragraph">のうち対応付けられていないノードのみで構成されたグ</p>
<p class="paper-paragraph">ラフである．さらに，	を構成する連結グラフの中で，対応</p>
<p class="paper-paragraph">付けられたノードを含まない連結グラフ4	の集合を5	とす</p>
<p class="paper-paragraph">る．例えば，図8(b)では，反転「に」のグラフは1, 2, 3, 4 番，</p>
<p class="paper-paragraph">5, 6 番，7, 8, 9 番のノードからなる連結グラフから構成されて</p>
<p class="paper-paragraph">おり，どれも対応付けられていないため，三つのグラフが4となる．したがって，65	6=3 である．このとき，</p>
<p class="paper-paragraph">から得ら</p>
<p class="paper-paragraph">れるエッジ濃度2 の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>と4	 ∈5	から得られるエッ</p>
<p class="paper-paragraph">ジ濃度2 の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の全ての組み合わせに対し，4	ごとに</p>
<p class="paper-paragraph">ランク付けを行う．つまり，</p>
<p class="paper-paragraph">と4	を用いることで，本項の</p>
<p class="paper-paragraph">目的である連結グラフごとに適切な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を選択するこ</p>
<p class="paper-paragraph">とができる．一つの4	につき，得られた組み合わせが3 組以</p>
<p class="paper-paragraph">上の場合は次式を用いる．</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">̅,   0.7̅,  (7)</p>
<blockquote class="paper-quote">**図7 局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の対応付けの概略**</blockquote>
<blockquote class="paper-quote">**Fig.7  Outline of correspond with local subgraph**</blockquote>
<p class="paper-paragraph">(a) 通常画像「か」      (b) 反転画像「に」</p>
<p class="paper-paragraph">(a)  Normal image “Ka”   (b)  Inverted image “Ni”</p>
<blockquote class="paper-quote">**図8 大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>による対応付けができなかった例**</blockquote>
<blockquote class="paper-quote">**Fig.8  An example of not being able to correspond with a global**</blockquote>
<p class="paper-paragraph">subgraph</p>
<p class="paper-paragraph">ただし，̅, は対応点間のユークリッド距離の平均̅を</p>
<p class="paper-paragraph">正規化したものであり，̅, は<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>間の対応エ</p>
<p class="paper-paragraph">ッジの角度差の平均̅を正規化したものである．</p>
<p class="paper-paragraph">すべての組に対してランクを求めた後，ランクが最小の</p>
<p class="paper-paragraph">組を選択する．そして，̅が0.75 未満かつ，̅が45°未満であ</p>
<p class="paper-paragraph">れば，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>のノードを対応点候補とする．この時点で</p>
<p class="paper-paragraph">対応点に決定しない理由は，65	6 3 2の場合，連結グラフ4間で，求めた対応点が重複する可能性があるからである．</p>
<p class="paper-paragraph">得られた<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組が2 組のとき，式(7)を用いると，</p>
<p class="paper-paragraph">正規化が適切に行えないため，次式で示すように正規化を施</p>
<p class="paper-paragraph">さない距離と角度差の平均を用いてランクを求める．</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">̅,   ̅, </p>
</section>
<section id="sec-11" class="paper-section">
<h2 class="section-title">180 (8)</h2>
<p class="paper-paragraph">対応<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を求める場合には幾何特徴を優先するために，</p>
<p class="paper-paragraph">̅はそのまま用いた．また，0 : ̅ : 180であるため，180 で</p>
<p class="paper-paragraph">割ることでスケールを1 以下にし，角度差による影響を小さ</p>
<p class="paper-paragraph">くした．同様にランクが最小の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組を選択し，̅</p>
<p class="paper-paragraph">が0.75 未満かつ，̅が45°未満であれば，<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>のノード</p>
<p class="paper-paragraph">を対応点候補とする．</p>
<p class="paper-paragraph">対応点候補が見つからなかった場合，エッジ濃度2 の部分</p>
<p class="paper-paragraph">グラフで行った操作をエッジ濃度1 の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>でも同様に</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">(a) 通常画像「か」   (b) 反転画像「に」</p>
<p class="paper-paragraph">(a)  Normal image “Ka”  (b)  Inverted image “Ni”</p>
<blockquote class="paper-quote">**図9 <mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>抽出結果**</blockquote>
<blockquote class="paper-quote">**Fig.9  Result of subgraph extraction**</blockquote>
<p class="paper-paragraph">(a) 「も」      (b) 反転「お」  (c) 新たな点群</p>
<p class="paper-paragraph">(a)  “Mo”        (b)  Inverted “O”   (c)  New point group</p>
<blockquote class="paper-quote">**図10 新たな点群の作成**</blockquote>
<blockquote class="paper-quote">**Fig.10  Generation of new point group**</blockquote>
<p class="paper-paragraph">(a) 通常画像「も」  (b) 反転画像「お」</p>
<p class="paper-paragraph">(a)  Normal image “Mo”  (b)  Inverted image “O”</p>
<blockquote class="paper-quote">**図11 文字画像分割結果**</blockquote>
<blockquote class="paper-quote">**Fig.11  Result of character image division**</blockquote>
<p class="paper-paragraph">行う．さらに，反転画像の文字グラフ	の既に対応付けされ</p>
<p class="paper-paragraph">ているノードを含まないグラフ</p>
<p class="paper-paragraph">と通常画像の文字グラフ</p>
<p class="paper-paragraph">の対応付けられたノードを含まない連結グラフ4に対し</p>
<p class="paper-paragraph">ても同様の操作を行い，対応点候補を探索する．</p>
<p class="paper-paragraph">最後に，対応点の決定を行う．まず，エッジ濃度2 の部分</p>
<p class="paper-paragraph">グラフを調べたときに対応点候補としたノードに重複がある</p>
<p class="paper-paragraph">か調べ，ない場合は対応点とし，ある場合は対応点候補から</p>
<p class="paper-paragraph">なる<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組に対し，次式で示すランク,  を</p>
<p class="paper-paragraph">与える．</p>
<p class="paper-paragraph">, </p>
<p class="paper-paragraph">̅, </p>
<p class="paper-paragraph">0.75 ̅, </p>
</section>
<section id="sec-12" class="paper-section">
<h2 class="section-title">45 (9)</h2>
<p class="paper-paragraph">(a) アンビグラム通常画像    (b) アンビグラ反転画像</p>
<p class="paper-paragraph">(a)  Normal Ambigram “Mo”  (b)  Inverted Ambigram “O”</p>
<blockquote class="paper-quote">**図12 アンビグラム構造生成結果**</blockquote>
<blockquote class="paper-quote">**Fig.12  Result of Ambigram structure generation**</blockquote>
<p class="paper-paragraph">式(7)と式(8)で求めた対応点候補の拘束条件から0 : ̅ )</p>
<p class="paper-paragraph">0.75かつ0∘: ̅ ) 45∘であり，ともに等しく評価するために̅</p>
<p class="paper-paragraph">は0.75 で，̅は45 で割ることで，スケールを等しくした．</p>
<p class="paper-paragraph">ランクを各<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組で求めた後，ランクが最小の</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の組を選択し，対応点を決定する．同様に，エッ</p>
<p class="paper-paragraph">ジ濃度1 の<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を調べたときに対応点候補としたノー</p>
<p class="paper-paragraph">ドに対しても対応点の決定を行う．ただし，エッジ濃度2 の</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>から得た対応点と重複しない対応点候補のみを探</p>
<p class="paper-paragraph">索対象とする．局所的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の探索によって図8 の文</p>
<p class="paper-paragraph">字グラフから抽出された<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>を図9 に示す．ただし，</p>
<p class="paper-paragraph">同色の楕円で囲まれている特徴点が対応する<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>であ</p>
<p class="paper-paragraph">り，同色のノードが対応している．</p>
<p class="paper-paragraph">なお，対応付けは全探索処理であるが，ひらがなは特徴点</p>
<p class="paper-paragraph">数が少ないため，大多数のひらがな対における探索時間は10</p>
<p class="paper-paragraph">秒未満であった．しかし，「あ」は特徴点が20 個あり，かつ，</p>
<p class="paper-paragraph">同じ文字のため同型グラフが膨大に存在する「あ」と「あ」</p>
<p class="paper-paragraph">の対応付けには約4 時間を要した． ただし，本実験では後述</p>
<p class="paper-paragraph">のとおりIntel Core i7-8650U @ 1.90GHz を用いており，並列</p>
<p class="paper-paragraph">計算は行っていない．</p>
<p class="paper-paragraph">4.2特徴点の<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark></p>
<p class="paper-paragraph">特徴点の対応付けを行った後，共通部分を重ね合わせるた</p>
<p class="paper-paragraph">めに特徴点を<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>する．また，対応点の移動に合わ</p>
<p class="paper-paragraph">せて対応付けされていない特徴点も追随して移動させるため</p>
<p class="paper-paragraph">に，ドロネー三角形分割を用いた<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を行う．</p>
<p class="paper-paragraph">まず，対応付けた点の中点を計算する．また，文字画像全</p>
<p class="paper-paragraph">体を領域分割するために，画像の周囲8 か所に新たな点群を</p>
<p class="paper-paragraph">作成する．これらの点群を用いてドロネー三角形で分割する．</p>
<blockquote class="paper-quote">**図6 の対応付け結果から点群を生成し，分割を行った結果を**</blockquote>
<blockquote class="paper-quote">**図10 に示す．ただし，同色のノードが対応関係にある．そ**</blockquote>
<p class="paper-paragraph">して，得られたドロネー三角形に対応するように通常文字画</p>
<p class="paper-paragraph">像及び反転文字画像も分割する．これにより，対応する三角</p>
<p class="paper-paragraph">形の頂点が必ず対応関係のある特徴点で構成されるようにな</p>
<p class="paper-paragraph">る．図10 に示す分割により文字画像を分割した結果を図11</p>
<p class="paper-paragraph">に示す．分割が終わった後に通常の文字画像と反転した文字</p>
<p class="paper-paragraph">画像の対応するドロネー三角形への<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換行列</mark>を計算</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">する．そして，文字画像の三角形内に含まれる特徴点に対し</p>
<p class="paper-paragraph">て<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>を行う．以上の手順で特徴点をすべてアフィ</p>
<p class="paper-paragraph">ン変換することでアンビグラムの基本構造を生成する．</p>
<blockquote class="paper-quote">**図11 に示す分割にしたがって<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>をし，アンビグ**</blockquote>
<p class="paper-paragraph">ラムを生成した結果を図12 に示す．<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>で対応点</p>
<p class="paper-paragraph">を重ね合わせ，対応点以外の特徴点も適切に移動させること</p>
<p class="paper-paragraph">によって，対応エッジも重ね合わせることができる．本節の</p>
<p class="paper-paragraph">処理によって文字ストローク間の対応付けをし，共通部分と</p>
<p class="paper-paragraph">非共通部分を分離することができたので，次章でストローク</p>
<p class="paper-paragraph">の<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>を行う．</p>
</section>
<section id="sec-13" class="paper-section">
<h2 class="section-title">5. ストロークの太線化</h2>
<p class="paper-paragraph">アンビグラムの可読性及び見栄えの向上のため，ストロー</p>
<p class="paper-paragraph">クの<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>をする．生成したアンビグラムはストロークの単</p>
<p class="paper-paragraph">純化をしているためにストロークが角張っており，どのスト</p>
<p class="paper-paragraph">ロークも太さが共通である．可読性及び見栄えの向上のため</p>
<p class="paper-paragraph">にはストロークを滑らかに表現し，2 文字間で共通部分は強</p>
<p class="paper-paragraph">調し，共通しない部分は目立たせなくすることが望ましい．</p>
<p class="paper-paragraph">そこで，この二つの問題を解決するために，文字を<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>文字</p>
<p class="paper-paragraph">化して<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>をすることを検討する．はじめに，ストローク</p>
<p class="paper-paragraph">を滑らかにするために<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>後の特徴点をスプライン</p>
<p class="paper-paragraph">曲線で補間する．図10(a)，(b)に示す単純化後の文字における</p>
<p class="paper-paragraph">特徴点の補間結果を図13 に示す．石亀ら17)は三角形と円を</p>
<p class="paper-paragraph">組み合わせた図形を<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>モデルとして定義し，この<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>モデ</p>
<p class="paper-paragraph">ルを用いることで<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>文字の生成を実現した．本論文ではこ</p>
<p class="paper-paragraph">のモデルを用いて，スプライン補間した点をなぞることで毛</p>
<p class="paper-paragraph">筆文字の生成を行う．その際，筆圧値と筆先の角度を定義す</p>
<p class="paper-paragraph">る必要がある．</p>
<p class="paper-paragraph">筆圧値はストロークの太さを決定する値である．対応点，</p>
<p class="paper-paragraph">非対応点をなぞるときの筆圧値をそれぞれ=</p>
<p class="paper-paragraph">, =</p>
<p class="paper-paragraph">とし，ある特</p>
<p class="paper-paragraph">徴点とそれに隣接する特徴点が>分割されているとき，画</p>
<p class="paper-paragraph">素から?番目の画素の筆圧値0を式(10)で定義する．ただし，</p>
<p class="paper-paragraph">あるいはが対応点の場合，=,, =は=</p>
<p class="paper-paragraph">，非対応点の場合は</p>
<p class="paper-paragraph">=</p>
<p class="paper-paragraph">とする．</p>
<p class="paper-paragraph">0</p>
<p class="paper-paragraph">= " ?'= " =( > 1 : ? ) > (10)</p>
<p class="paper-paragraph">(a) 「も」      (b) 反転「お」</p>
<p class="paper-paragraph">(a)  “Mo”        (b)  Inverted “O”</p>
<blockquote class="paper-quote">**図13 スプライン補間結果**</blockquote>
<blockquote class="paper-quote">**Fig.13  Result of spline interpolation**</blockquote>
<p class="paper-paragraph">式(10)では対応点どうしで結ばれるストロークが，筆圧値</p>
<p class="paper-paragraph">=</p>
<p class="paper-paragraph">を維持したまま描画されることになる．しかし，図13 (a)</p>
<p class="paper-paragraph">に示す1 番と2 番の特徴点間にストロークは存在せず，図</p>
<p class="paper-paragraph">13(b)に示す1 番と2 番の特徴点間にはストロークが存在して</p>
<p class="paper-paragraph">いるように，対応点間であってもストロークが共通している</p>
<p class="paper-paragraph">とは限らない．したがって，式(10)で対応点間の筆圧値を計</p>
<p class="paper-paragraph">算する際はエッジが共通しているか，つまり対応点間にとも</p>
<p class="paper-paragraph">にストロークが存在しているかを調べ，存在していない場合</p>
<p class="paper-paragraph">は次式(11)で筆圧値を計算する．式(11)を用いることで，対応</p>
<p class="paper-paragraph">点から遠ざかるにつれ筆圧値を小さくしてストロークの太さ</p>
<p class="paper-paragraph">を徐々に細くするようにし，太いストロークから細いストロ</p>
<p class="paper-paragraph">ークへの遷移に一定の距離を設けることで，突然ストローク</p>
<p class="paper-paragraph">の太さが変化するような見た目の違和感を軽減した．</p>
<p class="paper-paragraph">⎪⎪ ⎧= " ?'= " =(</p>
<blockquote class="paper-quote">, 1 : ? ) > " 1</blockquote>
<p class="paper-paragraph">4</p>
</section>
<section id="sec-14" class="paper-section">
<h2 class="section-title">4 : ? : 3> " 1</h2>
<p class="paper-paragraph">=</p>
<p class="paper-paragraph">,                       > " 1</p>
<p class="paper-paragraph">0</p>
<p class="paper-paragraph">(11)</p>
<p class="paper-paragraph">4</p>
<p class="paper-paragraph">⎩ ⎪⎪ ⎨</p>
<blockquote class="paper-quote">, 3> " 1</blockquote>
<p class="paper-paragraph">= " ?'= " =(</p>
</section>
<section id="sec-15" class="paper-section">
<h2 class="section-title">4 ) ? ) ></h2>
<p class="paper-paragraph">筆先の次の角度は現在の筆先の角度，筆の現在の進</p>
<p class="paper-paragraph">行方向$，筆の次の進行方向$を用いて次式で定義する．</p>
<p class="paper-paragraph">本論文ではE</p>
<p class="paper-paragraph">10を用い, の初期値を135°とした．</p>
<p class="paper-paragraph"></p>
<p class="paper-paragraph"> " E$ " $ (12)</p>
<p class="paper-paragraph">筆圧値及び筆先の角度を考慮して図13(a), (b)の文字を太線</p>
<p class="paper-paragraph">化して重ね合わせた結果を図14 に示す．スプライン曲線で</p>
<p class="paper-paragraph">ストロークに丸みを付け筆圧値の変化によってストロークの</p>
<p class="paper-paragraph">共通部分を太く，非共通部分を目立たなくすることができた．</p>
</section>
<section id="sec-16" class="paper-section">
<h2 class="section-title">6. 可読性評価</h2>
<p class="paper-paragraph">ひらがな46 文字を一対一で対応付けた1,081 組のアンビグ</p>
<p class="paper-paragraph">ラムの可読性を，単一文字及び単語の観点から評価する．た</p>
<p class="paper-paragraph">だし，アンビグラムの生成において，本論文ではIntel Core</p>
<p class="paper-paragraph">i7-8650U @ 1.90GHz を用いている．</p>
<p class="paper-paragraph">6.1単一文字の<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark></p>
<p class="paper-paragraph">6.1.1実施方法</p>
<p class="paper-paragraph">(c) アンビグラム通常画像    (d) アンビグラム反転画像</p>
<p class="paper-paragraph">(c)  Normal Ambigram “Mo”   (d)  Inverted Ambigram “O”</p>
<blockquote class="paper-quote">**図14 <mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>結果**</blockquote>
<blockquote class="paper-quote">**Fig.14  Result of fatten stroke**</blockquote>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">被験者は図14 に示したようなアンビグラムの通常画像と</p>
<p class="paper-paragraph">反転画像を並べた画像を見て，それぞれの読みを記述式で回</p>
<p class="paper-paragraph">答する．また，不可読な場合は「-」を記入する．ただし，不</p>
<p class="paper-paragraph">可読の理由については集計していない．また，後述する作成</p>
<p class="paper-paragraph">可能なアンビグラムは1 組につき5 名，作成不明なアンビグ</p>
<p class="paper-paragraph">ラムは1 組につき3 名回答が得られるように，被験者18 名を</p>
<p class="paper-paragraph">割り振ってGoogle フォーム上で回答を行う．そして，通常画</p>
<p class="paper-paragraph">像と反転画像の読みが両方正しかった場合のみ，可読とした．</p>
<p class="paper-paragraph">例えば，図14 の場合は図14(a)を「も」と答え，かつ図14(b)</p>
<p class="paper-paragraph">を「お」と答えたときのみを可読とし，それ以外の誤答や読</p>
<p class="paper-paragraph">めなかった場合は，すべて不可読とした．なお，被験者には</p>
<p class="paper-paragraph">「アンビグラムは反転しても読み取れるようにした文字であ</p>
<p class="paper-paragraph">る」とだけ伝えており，作成経験はない．</p>
<p class="paper-paragraph">また，本論文では，文献1)に記載されていた724 組のアン</p>
<p class="paper-paragraph">ビグラムを作成可能なアンビグラムとし，このアンビグラム</p>
<p class="paper-paragraph">の集合をFで表す．そして，記載のない残りの357 組のアン</p>
<p class="paper-paragraph">ビグラムに関して，著者がアンビグラムの作成可能性を検討</p>
<p class="paper-paragraph">したが，全て作成が困難であると判断した．したがって，真</p>
<p class="paper-paragraph">にアンビグラムを作成できるか不明であるため，作成不明な</p>
<p class="paper-paragraph">アンビグラムと称する．</p>
<p class="paper-paragraph">本論文では，アンビグラムGの<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>を，［可読と判断した</p>
<p class="paper-paragraph">人数］/［評価者数］で定義し，HGで表す．したがって，ア</p>
<p class="paper-paragraph">ンビグラムGを5 名中2 名が可読とした場合，HG</p>
<p class="paper-paragraph">0.4と</p>
<p class="paper-paragraph">なる．そして，1 文字当りの評価者が3 人または5 人である</p>
<p class="paper-paragraph">ため，過半数の3/5，2/3 が可読であればアンビグラムは可読</p>
<p class="paper-paragraph">性があるとした．</p>
<p class="paper-paragraph">6.1.2評価結果</p>
<p class="paper-paragraph">作成可能なアンビグラムの評価結果を表1 に示す．表1 か</p>
<p class="paper-paragraph">ら，作成可能なアンビグラムのうち1 文字単体では半数未満</p>
<p class="paper-paragraph">の文字にしか可読性がないという結果が得られた．一方で，</p>
<blockquote class="paper-quote">**表2 から，作成不明なアンビグラムのうち26.1%で可読性が**</blockquote>
<p class="paper-paragraph">あったことから，著者が一つも作成できなかった組み合わせ</p>
<p class="paper-paragraph">からも可読性のあるアンビグラムの生成ができたことが明ら</p>
<p class="paper-paragraph">かになった．</p>
<p class="paper-paragraph">評価したアンビグラムの一例として，<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0 であっ</p>
<p class="paper-paragraph">(a) 可読率1.0 の作成可能なアンビグラム</p>
<p class="paper-paragraph">(a) Ambigrams with readability 1.0 which can be given by hand crafted</p>
<p class="paper-paragraph">(b) 可読率1.0 の作成不明なアンビグラム</p>
<p class="paper-paragraph">(b)  Ambigrams with readability 1.0 which are not pointed out to be generated</p>
<p class="paper-paragraph">(c) 可読率0.0 の作成可能なアンビグラム</p>
<p class="paper-paragraph">(c) Ambigrams with readability 0.0 which can be given by hand crafted</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">(a-1) 「あ」・「ま」 (a-2) 「い」・「け」 (a-3) 「え」・「る」 (a-4) 「き」・「わ」 (a-5) 「さ」・「や」</p>
<p class="paper-paragraph">(a-1) “A” and “Ma” (a-2) “I” and “Ke” (a-3) “E” and “Ru” (a-4) “Ki” and “Wa” (a-5) “Sa” and “Ya”</p>
<p class="paper-paragraph">(a-6) 「を」・「を」 (a-7) 「せ」・「み」 (a-8) 「た」・「む」 (a-9) 「は」・「れ」 (a-10) 「も」・「よ」</p>
<p class="paper-paragraph">(a-6) “Wo” and “Wo” (a-7) “Se” and “Mi” (a-8) “Ta” and “Mu” (a-9) “Ha” and “Re” (a-10) “Mo” and “Yo”</p>
<p class="paper-paragraph">(b-1) 「せ」・「ぬ」 (b-2) 「さ」・「を」 (b-3) 「つ」・「む」 (b-4) 「う」・「ぬ」 (b-5) 「あ」・「そ」</p>
<p class="paper-paragraph">(b-1) “Se” and “Nu” (b-2) “Sa” and “Wo” (b-3) “Tsu” and “Mu” (b-4) “U” and “Nu” (b-5) “A” and “So”</p>
<p class="paper-paragraph">(c-1) 「い」・「ね」 (c-2) 「う」・「お」 (c-3) 「く」・「と」 (c-4) 「し」・「や」 (c-5) 「せ」・「ち」</p>
<p class="paper-paragraph">(c-1) “I” and “Ne” (c-2) “U” and “O” (c-3) “Ku” and “To” (c-4) “Shi” and “Ya” (c-5) “Se” and “Chi”</p>
<p class="paper-paragraph">(c-6) 「ね」・「へ」 (c-7) 「と」・「の」 (c-8) 「て」・「へ」 (c-9) 「ぬ」・「ぬ」 (c-10) 「ん」・「ん」</p>
<p class="paper-paragraph">(c-6) “Ne” and “He” (c-7) “To” and “No” (c-8) “Te” and “He” (c-9) “Nu” and “Nu” (c-10) “N” and “N”</p>
<blockquote class="paper-quote">**図15 提案手法で生成したアンビグラム及びデザイナによるアンビグラム1)の比較**</blockquote>
<blockquote class="paper-quote">**Fig.15  Comparison of Ambigrams generated by proposed method and by the designer1)**</blockquote>
<blockquote class="paper-quote">**表1 作成可能なアンビグラムの評価結果**</blockquote>
<blockquote class="paper-quote">**Table 1  Evaluation result of Ambigrams can be given by hand crafted**</blockquote>
<p class="paper-paragraph">可読性文字数</p>
<p class="paper-paragraph">あり 325</p>
<p class="paper-paragraph">なし 399</p>
<blockquote class="paper-quote">**表2 作成不明なアンビグラムの評価結果**</blockquote>
<blockquote class="paper-quote">**Table 2  Evaluation result of Ambigrams not pointed out to be generated**</blockquote>
<p class="paper-paragraph">可読性文字数</p>
<p class="paper-paragraph">あり 93</p>
<p class="paper-paragraph">なし 264</p>
<blockquote class="paper-quote">**表3 ひらがな認識器による認識結果**</blockquote>
<blockquote class="paper-quote">**Table 3  Evaluation result of Ambigrams by Hiragana Recognizer**</blockquote>
<p class="paper-paragraph">認識結果文字数</p>
<p class="paper-paragraph">可読 78</p>
<p class="paper-paragraph">不可読 1003</p>
<p class="paper-paragraph">た提案手法で生成したアンビグラムを図15(a)に，作成不明で</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0 であったアンビグラムを図15(b)に，すべての被</p>
<p class="paper-paragraph">験者が不可読であったアンビグラムを図15(c)に例示する．ま</p>
<p class="paper-paragraph">た，図15 において，四角で囲われた文字は本研究で生成し，</p>
<p class="paper-paragraph">評価実験をした文字であり，囲われていない文字は文献1)に</p>
<p class="paper-paragraph">記載されていたデザイナが作成した文字であり，評価実験は</p>
<p class="paper-paragraph">行っていない．</p>
<p class="paper-paragraph">6.1.3デザイナの作成したアンビグラムとの比較</p>
<p class="paper-paragraph">まず，図15(a)に示した，<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0 であった提案手法で</p>
<p class="paper-paragraph">生成したアンビグラムに着目する．これらは，対応関係付け</p>
<p class="paper-paragraph">られているストロークも一致しており，ストロークの太さも</p>
<p class="paper-paragraph">強調すべき共通部分は太く，目立たなくすべき非共通部分は</p>
<p class="paper-paragraph">細くなっている．したがって，デザイナが作成したアンビグ</p>
<p class="paper-paragraph">ラムと遜色ない文字が生成できているといえる．</p>
<p class="paper-paragraph">次に，図15(b)に示した，作成不明で<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が1.0 であった</p>
<p class="paper-paragraph">アンビグラムに着目する．これらは，図15(a)に比べて非共通</p>
<p class="paper-paragraph">部分が多く見られるが，文字構造の変形が少なく，共通部分</p>
<p class="paper-paragraph">がアンビグラムの半分を占めている．例えば図15(b-4)は， 「う」</p>
<p class="paper-paragraph">の文字全体が強調されており，かつ「う」と「ぬ」の形状は</p>
<p class="paper-paragraph">あまり変形されていないため，<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が高くなったといえる．</p>
<p class="paper-paragraph">最後に，図15(c)に示した，全ての被験者が不可読であった</p>
<p class="paper-paragraph">アンビグラムに着目する．これらは，デザイナのアンビグラ</p>
<p class="paper-paragraph">ムとはストロークの対応付けが異なっている．例えば図</p>
<p class="paper-paragraph">15(c-1)は，「い」の2 画目が対応付けられておらず，非共通部</p>
<p class="paper-paragraph">分が多いため，不可読であった可能性が高い．さらに，図</p>
<p class="paper-paragraph">15(c-3)の対応付けはデザイナと同じであるが，非共通部分の</p>
<p class="paper-paragraph">影響によって「く」が「て」のように見える．実際，このア</p>
<p class="paper-paragraph">(a) 「え」・「を」  = 0.0 (b) 「さ」・「ん」  = 0.4</p>
<p class="paper-paragraph">(a) “E” and “Wo”  = 0.0 (b) “Sa” and “N”  = 0.4</p>
<p class="paper-paragraph">(c) 「あ」・「か」  = 0.6 (d) 「ま」・「れ」  = 1.0</p>
<p class="paper-paragraph">(c) “A” and “Ka”  = 0.6 (d) “Ma” and “Re”  = 1.0</p>
<blockquote class="paper-quote">**図16 認識器が可読としたアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.16  Ambigram which can be read by Hiragana Recognizer**</blockquote>
<p class="paper-paragraph">ンビグラムは5 人中5 人が「く」の文字を「て」と読んでい</p>
<p class="paper-paragraph">たことから，共通部分をより太くしたり，非共通部分を変形</p>
<p class="paper-paragraph">させて目立たなくしたりするような<mark class="annotated-term" data-term-id="brush-modulation">ストロークの<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark></mark>の工</p>
<p class="paper-paragraph">夫が必要である．</p>
<p class="paper-paragraph">6.2ひらがな<mark class="annotated-term" data-term-id="recognition-model">識別器</mark>による単一文字の<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark></p>
<p class="paper-paragraph">前節では，アンビグラムの可読性を人の目で主観的に評価</p>
<p class="paper-paragraph">したが，文字の識別には少なからず個人差がある．そこで，</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="recognition-model">ひらがな<mark class="annotated-term" data-term-id="recognition-model">識別器</mark></mark>を用い，定量的な<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>を行う．</p>
<p class="paper-paragraph">電子技術総合研究所が収集した手書き文字データベース</p>
<p class="paper-paragraph">ETL818) から160 人分の手書きひらがなを用いて，</p>
<p class="paper-paragraph">CNN(Convolutional Neural Network)で学習することで，<mark class="annotated-term" data-term-id="recognition-model">識別器</mark></p>
<p class="paper-paragraph">を生成した．なお，学習データに対する識別精度は0.96，誤</p>
<p class="paper-paragraph">差関数の値は0.12 であり，テストデータに対する識別精度は</p>
<p class="paper-paragraph">0.99，誤差関数の値は0.01 であった．ただし，誤差関数は交</p>
<p class="paper-paragraph">差エントロピーを用いている．この<mark class="annotated-term" data-term-id="recognition-model">識別器</mark>を用いてアンビグ</p>
<p class="paper-paragraph">ラムの識別を行い，前節と同じく通常状態と反転状態の両方</p>
<p class="paper-paragraph">の文字を正しく読めた場合を可読とした．</p>
<p class="paper-paragraph">識別結果を表3 に示し，可読であったアンビグラムを前節</p>
<p class="paper-paragraph">で述べた人による<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>とともに図16 に例示する．手書き</p>
<p class="paper-paragraph">文字と生成したアンビグラムは形状が大きく異なるため，可</p>
<p class="paper-paragraph">読と判断される文字は表1 及び表2 に示す人の評価に比べて</p>
<p class="paper-paragraph">非常に少ない結果となった．また，<mark class="annotated-term" data-term-id="recognition-model">識別器</mark>で可読と判断され</p>
<p class="paper-paragraph">た78 文字中，人の評価で可読性があった文字は42 文字しか</p>
<p class="paper-paragraph">なかったことから，人と<mark class="annotated-term" data-term-id="recognition-model">識別器</mark>の可読の判断に関係性はなか</p>
<p class="paper-paragraph">ったといえる．</p>
<p class="paper-paragraph">なお，デザイナの作成したアンビグラム724 文字1)を識別</p>
<p class="paper-paragraph">した結果，1 文字しか可読でなかった．</p>
<p class="paper-paragraph">6.3単語の<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark></p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の低いアンビグラムを単語で用いた場合，その可読</p>
<p class="paper-paragraph">性が変化するかを調査した．</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">6.3.1実施方法</p>
<p class="paper-paragraph">まず，ひらがな4 文字で構成される単語を日本語教育語彙</p>
<blockquote class="paper-quote">**表19)から抽出し，濁点，半濁点，小文字を除き，同音異義語**</blockquote>
<p class="paper-paragraph">を一つにした4 文字の単語の集合をIとする．このとき，</p>
<p class="paper-paragraph">|I|</p>
<p class="paper-paragraph">2,536であった．そして，L</p>
<p class="paper-paragraph">M ∣M ∈F, 0 ) HM )</p>
<p class="paper-paragraph">0.6, O</p>
<p class="paper-paragraph">P ∣P ∈F, 0.6 : HMとし，次式からアンビグラ</p>
<p class="paper-paragraph">ムの単語集合Q∈を得る．ただし，M	はMを反転させた文字</p>
<p class="paper-paragraph">を表し，正規表現に従い文字列を記述した．</p>
<p class="paper-paragraph">⊂I ∣P, P, P ∈O</p>
<p class="paper-paragraph">P</p>
<p class="paper-paragraph">M	P</p>
<p class="paper-paragraph">Q∈</p>
<p class="paper-paragraph">PMPP, P</p>
<p class="paper-paragraph">(13)</p>
<p class="paper-paragraph">⊂I ∣P, P, P ∈O</p>
<p class="paper-paragraph">M	P</p>
<p class="paper-paragraph">P</p>
<p class="paper-paragraph">∪PPMP, P</p>
<p class="paper-paragraph">そして，Q∈の要素15,474 組から，調査対象とする単語</p>
<p class="paper-paragraph">対をTの要素ごとに一つ選択した．その結果，集合Lに含まれ</p>
<p class="paper-paragraph">るアンビグラム252 文字中246 文字をそれぞれ1 文字ずつ使</p>
<p class="paper-paragraph">用した通常状態と反転状態の2 単語246 組を得た．</p>
<p class="paper-paragraph">通常状態及び反転状態のアンビグラムの単語に対し，それ</p>
<p class="paper-paragraph">ぞれどのように読めるかは記述式の回答とした．また，各単</p>
<p class="paper-paragraph">語につき5 名の回答が得られるように，被験者15 名を割り振</p>
<p class="paper-paragraph">り，Google フォーム上での回答とした．そして，通常画像と</p>
<p class="paper-paragraph">反転画像の読みの両方が正しかった場合のみ可読とした．</p>
<p class="paper-paragraph">6.3.2評価結果</p>
<p class="paper-paragraph">本論文では，単一文字の評価と同様にアンビグラムの単語</p>
<p class="paper-paragraph">.が可読であった可読率H.が0.6 以上である場合を可読性</p>
<p class="paper-paragraph">があるとした．評価結果を表4 に示し，評価単語を<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>と</p>
<p class="paper-paragraph">ともに図17 に例示する．ただし，通常状態と反転状態の単</p>
<p class="paper-paragraph">語二組を1 単語として表している．表4 から評価を行った246</p>
<p class="paper-paragraph">単語のうち87.8%もの単語が可読であったことから，可読性</p>
<blockquote class="paper-quote">**表4 アンビグラムの単語の評価結果**</blockquote>
<blockquote class="paper-quote">**Table 4  Evaluation result of Ambigram word**</blockquote>
<p class="paper-paragraph">可読性単語数</p>
<p class="paper-paragraph">あり 216</p>
<p class="paper-paragraph">なし 30</p>
<p class="paper-paragraph">(a) 可読な単語 H</p>
<p class="paper-paragraph">1.0</p>
<p class="paper-paragraph">(b) 不可読な単語 H</p>
<p class="paper-paragraph">0.0</p>
<p class="paper-paragraph">（「あきれる」と「おおゆき」）</p>
<p class="paper-paragraph">（「かみきれ」と「たようか」）</p>
<p class="paper-paragraph">(a) Readable word  H</p>
<p class="paper-paragraph">1.0</p>
<p class="paper-paragraph">(a) Unreadable word H</p>
<p class="paper-paragraph">0.0</p>
<p class="paper-paragraph">(“Akireru” and “Ohyuki”)</p>
<p class="paper-paragraph">(“Kamikire” and “Tayoka”)</p>
<blockquote class="paper-quote">**図17 評価単語例**</blockquote>
<blockquote class="paper-quote">**Fig.17  Example of evaluated word**</blockquote>
<p class="paper-paragraph">が低い文字が含まれていたとしても，単語にすることで可読</p>
<p class="paper-paragraph">性が向上することが確認できた．</p>
<p class="paper-paragraph">また，単語を構成する文字の可読性が単語の可読に影響を</p>
<p class="paper-paragraph">及ぼしているかについて考察する．評価を行った246 単語に</p>
<p class="paper-paragraph">ついて，単語を構成する文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせごとに評</p>
<p class="paper-paragraph">価単語数及び可読性がある単語数を集計し， 「可読性がある単</p>
<p class="paper-paragraph">語の割合」を［可読性がある単語数］/［評価単語数］で定義</p>
<p class="paper-paragraph">する．文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせごとに集計した結果を表5</p>
<p class="paper-paragraph">に示す．ただし，括弧内は［可読性がある単語数］/［評価単</p>
<p class="paper-paragraph">語数］を表す．表5 において，可読性がない1 文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark></p>
<p class="paper-paragraph">が「0.2」，可読性がある3 文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせが「0.8</p>
<p class="paper-paragraph">と1.0」の場合，単語を構成する4 文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が(0.2, 0.8, 0.8,</p>
<p class="paper-paragraph">1.0)のように構成されていることを示している．以下，デー</p>
<p class="paper-paragraph">タ数が一つしかない「0.6 と0.8」の列を除いて考察をする．</p>
<p class="paper-paragraph">まず，表5 の「0.2」と「0.4」の行を比較すると，残りの3</p>
<p class="paper-paragraph">文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>によらず「0.4」を含む単語の方が，可読性があ</p>
<p class="paper-paragraph">る単語の割合が高いことがわかる．したがって，4 文字の単</p>
<p class="paper-paragraph">語の場合，1 文字の非可読性が単語の可読に悪影響を及ぼす</p>
<p class="paper-paragraph">ことが推察される．次に，表5 の列に着目すると，3 文字の</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が上がるほど可読性がある単語の割合が高くなってい</p>
<p class="paper-paragraph">ることがわかる．したがって，1 文字では読みにくい文字が</p>
<p class="paper-paragraph">単語に含まれていたとしても，他に読める文字が多いほど単</p>
<p class="paper-paragraph">語が読める可能性が上がることが推察される．</p>
</section>
<section id="sec-17" class="paper-section">
<h2 class="section-title">7. 可読性との相関関係</h2>
<p class="paper-paragraph">7.1共通部分との相関</p>
<p class="paper-paragraph">6.1.3 においてデザイナの作成したアンビグラムと比較す</p>
<p class="paper-paragraph">ることで，共通部分が多いアンビグラムは<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が高く，非</p>
<p class="paper-paragraph">共通部分が多いアンビグラムは<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>が低くなる傾向にある</p>
<p class="paper-paragraph">ことを定性的に示した．本節では，共通部分と可読性の関係</p>
<p class="paper-paragraph">を定量的に検証する．</p>
<p class="paper-paragraph">特徴点を<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>した結果，重なり合うエッジの長さ</p>
<p class="paper-paragraph">の総和をU</p>
<p class="paper-paragraph">，各文字グラフの全エッジの長さの総和をそれぞ</p>
<p class="paper-paragraph">れU, U	とすると，共通部分の割合</p>
<p class="paper-paragraph">は次式で与えられる．</p>
<blockquote class="paper-quote">**表5 <mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の組み合わせごとの可読性がある単語の割合**</blockquote>
<blockquote class="paper-quote">**Table 5  Proportion of readable words for each combination of**</blockquote>
<p class="paper-paragraph">readability</p>
<p class="paper-paragraph">可読性がある3 文字の<mark class="annotated-term" data-term-id="readability-experiment">可読率</mark>の</p>
<p class="paper-paragraph">組み合わせ 0.6 と 0.8 0.8のみ</p>
<p class="paper-paragraph">0.8 と 1.0 1.0のみ</p>
<p class="paper-paragraph">0.2 1.00</p>
<p class="paper-paragraph">0.57</p>
<p class="paper-paragraph">0.80</p>
<p class="paper-paragraph">0.92</p>
<p class="paper-paragraph">可読性がない</p>
<p class="paper-paragraph">(1/1)</p>
<p class="paper-paragraph">(4/7)</p>
<p class="paper-paragraph">(78/97)</p>
<p class="paper-paragraph">(22/24)</p>
</section>
<section id="sec-18" class="paper-section">
<h2 class="section-title">1 文字の可読率</h2>
<p class="paper-paragraph">0.4 (0/0) 0.85</p>
<p class="paper-paragraph">0.96</p>
<p class="paper-paragraph">0.95</p>
<p class="paper-paragraph">(11/13)</p>
<p class="paper-paragraph">(79/82)</p>
<p class="paper-paragraph">(21/22)</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">14/16 2/2 1/1 1/1</p>
<p class="paper-paragraph">1</p>
<p class="paper-paragraph">可読性がある文字の割合</p>
<p class="paper-paragraph">63/126</p>
<p class="paper-paragraph">0.8</p>
<p class="paper-paragraph">30/49</p>
<p class="paper-paragraph">8/43 60/215 140/387 99/241</p>
<p class="paper-paragraph">0.6</p>
<p class="paper-paragraph">0.4</p>
<p class="paper-paragraph">0.2</p>
<p class="paper-paragraph">0</p>
<p class="paper-paragraph">[0.0,</p>
<p class="paper-paragraph">0.1) [0.1,</p>
<p class="paper-paragraph">0.2) [0.2,</p>
<p class="paper-paragraph">0.3) [0.3,</p>
<p class="paper-paragraph">0.4) [0.4,</p>
<p class="paper-paragraph">0.5) [0.5,</p>
<p class="paper-paragraph">0.6) [0.6,</p>
<p class="paper-paragraph">0.7) [0.7,</p>
<p class="paper-paragraph">0.8) [0.8,</p>
<p class="paper-paragraph">0.9) [0.9,</p>
<p class="paper-paragraph">1.0]</p>
<p class="paper-paragraph">共通部分の割合</p>
<blockquote class="paper-quote">**図18 共通部分の割合と可読性がある文字の割合との関係**</blockquote>
<blockquote class="paper-quote">**Fig.18  Relationship between proportion of common strokes and**</blockquote>
<p class="paper-paragraph">readable words</p>
<p class="paper-paragraph">H</p>
<p class="paper-paragraph">0.2, V</p>
<p class="paper-paragraph">0.09</p>
<p class="paper-paragraph">H</p>
<p class="paper-paragraph">0.2, V</p>
<p class="paper-paragraph">0.14</p>
<p class="paper-paragraph">(a) 「お」・「ろ」 (b) 「ひ」・「も」</p>
<p class="paper-paragraph">(a) “O” and “Ro” (b) “Hi” and “Mo”</p>
<blockquote class="paper-quote">**図19 共通部分が少ないアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.19  Ambigram with few common parts**</blockquote>
<p class="paper-paragraph">H</p>
<p class="paper-paragraph">1.0, V</p>
<p class="paper-paragraph">0.63</p>
<p class="paper-paragraph">H</p>
<p class="paper-paragraph">1.0, V</p>
<p class="paper-paragraph">0.60</p>
<p class="paper-paragraph">(a) 「か」・「け」 (b) 「り」・「ん」</p>
<p class="paper-paragraph">(a) “Ka” and “Ke” (b) “Ri” and “N”</p>
<blockquote class="paper-quote">**図20 共通部分が多いアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.20  Ambigram with many common parts**</blockquote>
<p class="paper-paragraph"> U U  U	 " U</p>
<p class="paper-paragraph">(11)</p>
<p class="paper-paragraph">式(11)を用いて共通部分の割合を計算し，割合ごとに可読性</p>
<p class="paper-paragraph">がある文字の割合を求めた結果を図18 に示す．ただし，棒</p>
<p class="paper-paragraph">グラフの上部の数値は，［可読性がある文字数］/［評価文字</p>
<p class="paper-paragraph">数］を表す．</p>
<p class="paper-paragraph">グラフが示すように，共通部分の割合が増加するほど，可</p>
<p class="paper-paragraph">読性がある文字の割合も上昇することが明らかになった．し</p>
<p class="paper-paragraph">たがって，共通部分の割合と可読性には相関があるといえる．</p>
<p class="paper-paragraph">では，なぜそのような相関が得られるのかを視覚的にも考</p>
<p class="paper-paragraph">0.6</p>
<p class="paper-paragraph">可読性がある文字の割合</p>
<p class="paper-paragraph">109/227 157/382 94/250</p>
<p class="paper-paragraph">0.5</p>
<p class="paper-paragraph">13/37</p>
<p class="paper-paragraph">0.4</p>
<p class="paper-paragraph">12/43</p>
<p class="paper-paragraph">2/7</p>
<p class="paper-paragraph">0.3</p>
<p class="paper-paragraph">28/114</p>
<p class="paper-paragraph">3/19</p>
<p class="paper-paragraph">0.2</p>
<p class="paper-paragraph">0.1</p>
<p class="paper-paragraph">0/1 0/1 0</p>
<p class="paper-paragraph">[0.0,</p>
<p class="paper-paragraph">0.1) [0.1,</p>
<p class="paper-paragraph">0.2) [0.2,</p>
<p class="paper-paragraph">0.3) [0.3,</p>
<p class="paper-paragraph">0.4) [0.4,</p>
<p class="paper-paragraph">0.5) [0.5,</p>
<p class="paper-paragraph">0.6) [0.6,</p>
<p class="paper-paragraph">0.7) [0.7,</p>
<p class="paper-paragraph">0.8) [0.8,</p>
<p class="paper-paragraph">0.9) [0.9,</p>
<p class="paper-paragraph">1.0]</p>
<p class="paper-paragraph">エッジの平均角度差</p>
<blockquote class="paper-quote">**図21 エッジの平均角度差と可読性のある文字の割合との**</blockquote>
<p class="paper-paragraph">関係</p>
<blockquote class="paper-quote">**Fig.21  Relationship between average angular difference in edges**</blockquote>
<p class="paper-paragraph">and proportion of readable words</p>
<p class="paper-paragraph">察するために，図19 に共通部分が少ないアンビグラムを，</p>
<blockquote class="paper-quote">**図20 に共通部分が多いアンビグラムを例示する．なお，共**</blockquote>
<p class="paper-paragraph">通部分の割合をVで表している．</p>
<blockquote class="paper-quote">**図19 を見ると，非共通部分が多く混在していることから，**</blockquote>
<p class="paper-paragraph">細いストロークが通常状態の文字と反転状態の文字のどちら</p>
<p class="paper-paragraph">に属するか判別できなくなり，結果的にそれぞれの文字の構</p>
<p class="paper-paragraph">造を区別できなくなったため可読性が低くなった推察する．</p>
<p class="paper-paragraph">一方で図20 を見ると，太いストロークが多いことから，共通</p>
<p class="paper-paragraph">部分だけで何の文字かを判断することができ，結果的に非共</p>
<p class="paper-paragraph">通部分の可読に対する悪影響が小さくなり可読性が高くなっ</p>
<p class="paper-paragraph">たと推察する．</p>
<p class="paper-paragraph">7.2形状変化との相関</p>
<p class="paper-paragraph">次に，形状変化と可読性に相関があるか検証する．形状変</p>
<p class="paper-paragraph">化に関する要素をしては，エッジの傾きの変化が挙げられる．</p>
<p class="paper-paragraph">そこで，本節では<mark class="annotated-term" data-term-id="affine-transformation">アフィン変換</mark>前後の文字グラフのエッジの</p>
<p class="paper-paragraph">平均角度差が可読性と相関があるか調べる．</p>
<p class="paper-paragraph">まず，エッジの平均角度差を［エッジの角度差の和］/［エ</p>
<p class="paper-paragraph">ッジ数］とする．ただし，平均角度差は1 文字ごとに求めて</p>
<p class="paper-paragraph">おり，エッジの角度差は0°以上180°以下になるように求めて</p>
<p class="paper-paragraph">いる．そして，エッジの平均角度差を最小値0，最大値1 に</p>
<p class="paper-paragraph">なるように正規化し，各範囲で可読性がある文字の割合を求</p>
<p class="paper-paragraph">めた結果を図21 に示す．ただし，図21 の上部の数値は［可</p>
<p class="paper-paragraph">読性がある文字数］/［評価文字数］を表す．</p>
<blockquote class="paper-quote">**図21 から，エッジの平均角度差，すなわち形状変化と可読**</blockquote>
<p class="paper-paragraph">性に明確な相関は見られなかった．したがって，前節の共通</p>
<p class="paper-paragraph">部分の割合と可読性の顕著な相関を踏まえると，形状変化が</p>
<p class="paper-paragraph">大きくても共通部分の割合が多ければ，可読となることが期</p>
<p class="paper-paragraph">待できる．一方で，図15(c-1)のように，形状変化が小さくて</p>
<p class="paper-paragraph">も共通部分の割合が少なければ，不可読となる可能性が高い</p>
<p class="paper-paragraph">と推察する．</p>
<p class="paper-paragraph">では，なぜエッジの平均角度差と可読性に相関が得られな</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">H</p>
<p class="paper-paragraph">0.2, M</p>
<p class="paper-paragraph">0.16, V</p>
<p class="paper-paragraph">0.21 H</p>
<p class="paper-paragraph">1.0, M</p>
<p class="paper-paragraph">0.14, V</p>
<p class="paper-paragraph">0.40</p>
<p class="paper-paragraph">(a) 「ま」・「む」 (b) 「お」・「わ」</p>
<p class="paper-paragraph">(a) “Ma” and “Mu” (b) “O” and “Wa”</p>
<blockquote class="paper-quote">**図22 平均角度差が小さいアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.22  Ambigram with small average angular difference**</blockquote>
<p class="paper-paragraph">H</p>
<p class="paper-paragraph">0.2, M</p>
<p class="paper-paragraph">0.70, V</p>
<p class="paper-paragraph">0.48 H</p>
<p class="paper-paragraph">1.0, M</p>
<p class="paper-paragraph">0.57, V</p>
<p class="paper-paragraph">0.56</p>
<p class="paper-paragraph">(a) 「き」・「み」 (b) 「ち」・「ひ」</p>
<p class="paper-paragraph">(a) “Ki” and “Mi” (b) “Ti” and “Hi”</p>
<blockquote class="paper-quote">**図23 平均角度差が大きいアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.23  Ambigram with large average angular difference**</blockquote>
<p class="paper-paragraph">かったのかを視覚的にも考察するために，図22 に平均角度</p>
<p class="paper-paragraph">差が小さいアンビグラムを，図23 に平均角度差が大きいア</p>
<p class="paper-paragraph">ンビグラムを例示する．なお，平均角度差を前述のとおり正</p>
<p class="paper-paragraph">規化した値をMで表している．</p>
<p class="paper-paragraph">共通部分の割合は元々の文字構造の違いに依存するため，</p>
<blockquote class="paper-quote">**図22 に示すように平均角度差が等しく小さい場合でも共通**</blockquote>
<p class="paper-paragraph">部分の割合は異なる． したがって，平均角度差と共通部分の</p>
<p class="paper-paragraph">割合には相関がないため，可読性とも相関がないと推察する．</p>
<p class="paper-paragraph">さらに，文字が可読であるためには文字を決定付けるよう</p>
<p class="paper-paragraph">な重要な構造がエッジの角度変化により失われていないこと</p>
<p class="paper-paragraph">が求められる．例えば，図23(b)を見ると，文字は共に大きく</p>
<p class="paper-paragraph">変形しているが，それぞれのストロークが干渉し合っていな</p>
<p class="paper-paragraph">いため，文字の変形が可読に影響を及ぼさなかったと推測す</p>
<p class="paper-paragraph">る．一方，図23(a)の矢印が指す部分は「き」と判別するか「さ」</p>
<p class="paper-paragraph">と判別するかを決定する重要な部分であるが，エッジの角度</p>
<p class="paper-paragraph">変化によりストロークがくっついてしまい，「き」の構造が失</p>
<p class="paper-paragraph">われてしまっている．このような可読性に大きな影響を与え</p>
<p class="paper-paragraph">る一部のエッジの角度変化は平均角度差の大小にかかわらず</p>
<p class="paper-paragraph">発生するため，文字全体の変形量の指標である平均角度差で</p>
<p class="paper-paragraph">は考慮できないことも，可読性との相関が現れなかった要因</p>
<p class="paper-paragraph">であると推察する．</p>
</section>
<section id="sec-19" class="paper-section">
<h2 class="section-title">8. 提案手法の検証</h2>
<p class="paper-paragraph">8.1有効性の検証</p>
<p class="paper-paragraph">本論文では，ノードの対応付け，すなわちグラフマッチン</p>
<p class="paper-paragraph">(a) 提案手法</p>
<p class="paper-paragraph">(a) Proposed method</p>
<p class="paper-paragraph">(b) Riesen らの手法</p>
<p class="paper-paragraph">(b) Method by Riesen</p>
<blockquote class="paper-quote">**図24 「す」と「ま」の対応付け**</blockquote>
<blockquote class="paper-quote">**Fig.24  Correspondence between “Su” and “Ma”**</blockquote>
<p class="paper-paragraph">グに<mark class="annotated-term" data-term-id="subgraph-isomorphism">グラフ同型</mark>と文字の構造特徴を用いているが，グラフマ</p>
<p class="paper-paragraph">ッチングの手法は多岐にわたっている20)~24)．そこで，グラフ</p>
<p class="paper-paragraph">同型や文字構造特徴を用いない，Riesen らのグラフマッチン</p>
<p class="paper-paragraph">グ手法24)によりアンビグラムを生成し，提案手法の有効性を</p>
<p class="paper-paragraph">検証する．</p>
<p class="paper-paragraph">Riesen らは，全ノードに対して，グラフ編集における置換</p>
<p class="paper-paragraph">コスト，削除コスト，挿入コストをノードのラベルや隣接エ</p>
<p class="paper-paragraph">ッジ数を基に与え，割り当て問題を解くことで最小のグラフ</p>
<p class="paper-paragraph">編集コストを計算し，ノードのマッチングを行っている．し</p>
<p class="paper-paragraph">たがって，例えばノードのラベルがノードの座標であれば，</p>
<p class="paper-paragraph">ノード間の距離が近く，隣接エッジの数が等しいノードが優</p>
<p class="paper-paragraph">先的に対応付けされる．本節の比較実験では，Riesen らの文</p>
<p class="paper-paragraph">字グラフを用いた実験と同様にノードのラベルをノードの座</p>
<p class="paper-paragraph">標として置換コストを計算する．また，削除コスト及び挿入</p>
<p class="paper-paragraph">コストは定められた値がないため，基本的な対応付けである，</p>
<p class="paper-paragraph">「い」と「い」のアンビグラムが生成できるようなパラメー</p>
<p class="paper-paragraph">タを設定した．</p>
<p class="paper-paragraph">Riesen らの手法を用いて対応付けをした結果と提案手法を</p>
<p class="paper-paragraph">用いて対応付けをした結果を図24 に示し，その対応付けを</p>
<p class="paper-paragraph">用いてアンビグラムを生成した結果を図25 に示す．ただし，</p>
<p class="paper-paragraph">同色のノードが対応関係にあり，赤丸の白色ノードは対応付</p>
<p class="paper-paragraph">けされていないノードである．</p>
<p class="paper-paragraph">対応点全体を見ると，提案手法は式(2)のにより対応点の</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">(a) 提案手法 (b) Riesen らの手法</p>
<p class="paper-paragraph">(a) Proposed Method (b) Method by Riesen</p>
<blockquote class="paper-quote">**図25 「す」と「ま」のアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.25  Ambigram from “Su” and “Ma”**</blockquote>
<p class="paper-paragraph">位置関係が「す」と「ま」で等しくなっている．さらに，同</p>
<p class="paper-paragraph">型性を満たしているため，対応点とエッジに注目すると共通</p>
<p class="paper-paragraph">部分が抽出できている．一方，Riesen らの手法は「す」の2</p>
<p class="paper-paragraph">番ノードと9 番ノードに着目すると，対応する「ま」の4 番</p>
<p class="paper-paragraph">ノードと7番ノードとの位置関係が崩れている．また，図24(a)</p>
<p class="paper-paragraph">ではノード間の対応する隣接エッジの傾きは，式(2)のにし</p>
<p class="paper-paragraph">きい値を定めているため，類似している．一方，図24(b)の「す」</p>
<p class="paper-paragraph">の4, 5 番間のエッジと対応する「ま」の2, 10 番間のエッジに</p>
<p class="paper-paragraph">注目すると，傾きが約90°も異なっている．</p>
<p class="paper-paragraph">したがって，文字としての形状を崩さないような対応点を</p>
<p class="paper-paragraph">求めるには，文字の構造特徴を加味した対応付けが必要であ</p>
<p class="paper-paragraph">る．</p>
<p class="paper-paragraph">8.2適用範囲の検証</p>
<p class="paper-paragraph">提案手法は，ストロークの交点の次数が4 以下の文字とい</p>
<p class="paper-paragraph">う制限があるが，この条件以外でひらがなに依存した処理は</p>
<p class="paper-paragraph">行っていない．また，グラフを反転させるだけでなく，鏡映</p>
<p class="paper-paragraph">反転させてもアンビグラムの生成には影響がない．そこで，</p>
<p class="paper-paragraph">提案手法の適用範囲を実験的に検証した．</p>
<p class="paper-paragraph">実験対象を，アルファベット小文字，アルファベット大文</p>
<p class="paper-paragraph">字，カタカナの180°回転のアンビグラムと，鏡映反転させる</p>
<p class="paper-paragraph">ひらがなアンビグラムとする．</p>
<blockquote class="paper-quote">**図26 に生成結果を例示する．提案手法ではひらがな以外**</blockquote>
<p class="paper-paragraph">の文字でもアンビグラムを生成することができ，180°回転の</p>
<p class="paper-paragraph">アンビグラムだけでなく，鏡映反転のアンビグラムも生成す</p>
<p class="paper-paragraph">ることが可能である．</p>
</section>
<section id="sec-20" class="paper-section">
<h2 class="section-title">9. 適用限界</h2>
<p class="paper-paragraph">本手法では，ひらがなの反転アンビグラムだけでなく，他</p>
<p class="paper-paragraph">の文字種や鏡映反転などのアンビグラムにも応用できること</p>
<p class="paper-paragraph">が前章で明らかとなった．しかし，本手法の大局的な部分グ</p>
<p class="paper-paragraph">ラフの対応付けは連結グラフどうしでしか対応付けすること</p>
<p class="paper-paragraph">ができない．したがって，2 文字のアンビグラムを反転させ</p>
<p class="paper-paragraph">ると3 文字として読めるような，1 対複数文字の対応付けの</p>
<p class="paper-paragraph">アンビグラムを生成できない．さらに，多くの漢字は複数の</p>
<p class="paper-paragraph">連結グラフから構成されているため，大局的な<mark class="annotated-term" data-term-id="subgraph-isomorphism">部分グラフ</mark>の</p>
<p class="paper-paragraph">対応付けが大局的ではなくなる．</p>
<p class="paper-paragraph">(a) 「a」・「e」 (b) 「A」・「A」</p>
<p class="paper-paragraph">(a) “a”・”e” (b) “A”・”A”</p>
<p class="paper-paragraph">(c) 「セ」・「ヤ」 (d) 「カ」・「ネ」</p>
<p class="paper-paragraph">(c) “Se”・”Ya” (d) “Ka”・”Ne”</p>
<p class="paper-paragraph">(e) 「み」・「れ」 (f) 「は」・「ね」</p>
<p class="paper-paragraph">(e) “Mi”・”Re” (f) “Ha”・”Ne”</p>
<blockquote class="paper-quote">**図26 複数の文字種及び鏡映反転のひらがなアンビグラム**</blockquote>
<blockquote class="paper-quote">**Fig.26  Ambigrams with multiple characters and mirrored Hiragana**</blockquote>
<p class="paper-paragraph">したがって，この問題を解決するためには，大局的な部分</p>
<p class="paper-paragraph">グラフの対応付けにおいて，複数の連結グラフから同型なグ</p>
<p class="paper-paragraph">ラフを抽出し，適切な対応付けを計算する必要がある．</p>
</section>
<section id="sec-21" class="paper-section">
<h2 class="section-title">10. むすび</h2>
<p class="paper-paragraph">文字構造の共通部分の抽出，特徴点の適切な対応付け， 太</p>
<p class="paper-paragraph">線化を行うアンビグラム生成手法を提案した．アンビグラム</p>
<p class="paper-paragraph">作家が制作した724 文字をすべて含み，新たな357 文字を加</p>
<p class="paper-paragraph">えた1,081 文字のアンビグラムを生成した．</p>
<p class="paper-paragraph">被験者による<mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>により，作成可能なアンビグラ</p>
<p class="paper-paragraph">ムのうち半数以上で可読性がないという結果となったが，単</p>
<p class="paper-paragraph">一文字のときは可読性がなかった1 文字を含む単語に対する</p>
<p class="paper-paragraph"><mark class="annotated-term" data-term-id="readability-experiment">可読性の評価</mark>を行った結果，87.8%の単語に可読性があった</p>
<p class="paper-paragraph">ことから，単語にすることによる可読性の向上がみられた．</p>
<p class="paper-paragraph">さらに，著者が作成困難と判断した357 の文字対からも適切</p>
<p class="paper-paragraph">に文字の共通部分を検出し，可読性があるアンビグラムを93</p>
<p class="paper-paragraph">文字生成できた．</p>
<p class="paper-paragraph">可読性と共通部分及び形状変化に相関があるか検証した</p>
<p class="paper-paragraph">結果，ストロークが重なり合う部分の割合が大きいほど可読</p>
<p class="paper-paragraph">性が向上することが確認でき，形状変化の大小は可読性に影</p>
<p class="paper-paragraph">響しないと推察した．</p>
<p class="paper-paragraph">そして，別のグラフマッチング手法との比較により，提案</p>
<p class="paper-paragraph">手法の有効性を検証し，ひらがな以外のアンビグラムを本手</p>
<p class="paper-paragraph">法により生成することで，適用範囲の検証を行った．</p>
<p class="paper-paragraph">しかし，可読性の観点から文字表現の向上が必要である．</p>
<p class="paper-paragraph">「く」や「へ」といった特徴点の少ない文字や，特徴点が多</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
<p class="paper-paragraph">くても対応点が少ない場合は変形が足りないため，非共通部</p>
<p class="paper-paragraph">分をより目立たなくする変形方法と<mark class="annotated-term" data-term-id="brush-modulation">太線化</mark>を検討する．</p>
</section>
<section id="sec-22" class="paper-section">
<h2 class="section-title">参考文献</h2>
<li class="paper-li">1) 野村一晟，つくろうよ！アンビグラム，飛鳥新社 (2018).</li>
<li class="paper-li">2) 日刊スポーツ，日本代表ユニ「日本晴れ」文字反対にすると「侍</li>
<p class="paper-paragraph">魂」，https://www.nikkansports.com/soccer/japan/news/2019110600006</p>
<p class="paper-paragraph">42.html (2020).</p>
<li class="paper-li">3) FlipScript, Inc., FlipScript, https://flipscript.com/en/flip (2019).</li>
<li class="paper-li">4) マイナビ，文字には、人の心を動かす“チカラ”がある - アンビ</li>
<p class="paper-paragraph">グラム作家・野村一晟，https://news.mynavi.jp/article/20191128-929</p>
<p class="paper-paragraph">543/ (2020).</p>
<li class="paper-li">5) 細谷律子，是枝浩行，井上喜勇，山内司，松田泰昌: “非線形変換</li>
<p class="paper-paragraph">を組み合わせた変形文字の生成”，情報処理学会全国大会講演論文</p>
<p class="paper-paragraph">集，Vol.48，No.3，pp.301–302 (1994).</p>
<li class="paper-li">6) T. Igarashi, T. Moscovich, J. F. Hughes: “As-Rigid-as-Possible Shape</li>
<p class="paper-paragraph">Manipulation”, ACM Trans. on Computer Graphics, Vol.24, No.3,</p>
<p class="paper-paragraph">pp.1134–1141 (2005).</p>
<li class="paper-li">7) S. Schaefer, T. McPhail, J. Warren: “Image Deformation Using Moving</li>
<p class="paper-paragraph">Least Squares”, ACM Trans. Graph, Vol.25, No.3, pp.533–540 (2006).</p>
<li class="paper-li">8) N. D. F. Campbell, J. Kautz: “Learning a Manifold of Fonts”, ACM</li>
<p class="paper-paragraph">Trans. on Graphics, Vol.33, No.4, pp.91:1–91:11 (2014).</p>
<li class="paper-li">9) Y. Fujita, H. Xie, K. Miyata: “Perceptual Font Manifold from Generative</li>
<p class="paper-paragraph">Model”, Nicograph International (NicoInt), pp. 41–48 (2019).</p>
<li class="paper-li">10) 成沢淳史，柳井啓司: “Neural Style Transfer と Cycle GAN を利</li>
<p class="paper-paragraph">用したフォント変換”，画像の認識・理解シンポジウム(MIRU), pp.</p>
<p class="paper-paragraph">PS2–26 (2017).</p>
<li class="paper-li">11) L. A. Gatys, A. S. Ecker, M. Bethge: “Image Style Transfer Using</li>
<p class="paper-paragraph">Convolutional Neural Networks”, Proc. of IEEE Conference on</p>
<p class="paper-paragraph">Computer Vision and Pattern Recognition (CVPR), pp.2414–2423</p>
<p class="paper-paragraph">(2016).</p>
<li class="paper-li">12) J.-Y. Zhu, T. Park, P. Isola, A. A. Efros: “Unpaired Image-to-Image</li>
<p class="paper-paragraph">Translation using Cycle-Consistent Adversarial Networks”, Proc. of</p>
<p class="paper-paragraph">IEEE Conference on Computer Vision and Pattern Recognition (CVPR),</p>
<p class="paper-paragraph">pp.2414–2423 (2016).</p>
<li class="paper-li">13) 島崎早智，多田信洋，藤岡寛之，日高章理: “ニューラル画像対画</li>
<p class="paper-paragraph">像変換による<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>体文字の生成”，第81 回全国大会講演論文集，</p>
<p class="paper-paragraph">Vol.2019，No.1，pp.189–190 (2019).</p>
<li class="paper-li">14) S. Tang, Z. Xia, Z. Lian, Y. Tang, J. Xiao, “FontRNN: Generating</li>
<p class="paper-paragraph">Large-scale Chinese Fonts via Recurrent Neural Network”, Computer</p>
<p class="paper-paragraph">Graphics Forum, Vol.38, No.7, pp.567–577 (2019).</p>
<li class="paper-li">15) T. -Y. Zhang, C. -Y. Suen: “A Fast Parallel Algorithms For Thinning</li>
<p class="paper-paragraph">Digital Patterns”, Communication of the ACM”, Vol.27, No.3, pp.236–</p>
</section>
<section id="sec-23" class="paper-section">
<h2 class="section-title">239 (1984).</h2>
<li class="paper-li">16) U. Ramer, “An Iterative Procedure for The Polygonal Approximation of</li>
<p class="paper-paragraph">Plane Curves”, Communication of the ACM, Vol.1, No.3, pp.244–256,</p>
<p class="paper-paragraph">(1972).</p>
<li class="paper-li">17) 石亀昌明，三浦 望，保坂 暁子，福島 隆行: “<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>のモデル化に</li>
<p class="paper-paragraph">よる<mark class="annotated-term" data-term-id="brush-modulation">毛筆</mark>文字の生成”，情報処理 学会研究報告. HI，ヒューマン</p>
<p class="paper-paragraph">インタフェース研究会報告，Vol.97，No.71，pp.45–51 (1997).</p>
<li class="paper-li">18) 独立行政法人産業技術総合研究所，手書教育漢字データベース</li>
<p class="paper-paragraph">ETL8，http://etlcdb.db.aist.go.jp/specification-of-etl-8?lang=ja (2020).</p>
<li class="paper-li">19) 日本語教育語彙表 ver1.0: http://jhlee.sakura.ne.jp/JEV.html (2020).</li>
<li class="paper-li">20) A. Zanfir, C. Sminchisescu: “Deep Learning of Graph Matching”,</li>
<p class="paper-paragraph">Proc. of IEEE/CVF Conference on Computer Vision and Pattern</p>
<p class="paper-paragraph">Recognition(CVPR), pp.2684–2693 (2018).</p>
<li class="paper-li">21) P. Morrison, J.J. Zou: “Inexact Graph Matching Using a Hierarchy</li>
<p class="paper-paragraph">of Matching Processes”, Computational Visual Media, pp.291–307</p>
<p class="paper-paragraph">(2015).</p>
<li class="paper-li">22) X. Bai, L. J. Latecki: “Path Similarity Skeleton Graph Matching”,</li>
<p class="paper-paragraph">IEEE Trans. on Pattern Analysis and Machine Intelligence, Vol.30,</p>
<p class="paper-paragraph">No.7, pp.1282–1292 (2008).</p>
<li class="paper-li">23) M. Cho, J. Lee, K. M. Lee: “Reweighted Random Walks for Graph</li>
<p class="paper-paragraph">Matching”, Proc. of European Conference on Computer Vision (ECCV),</p>
<p class="paper-paragraph">Vol.6315, pp.492–505 (2010).</p>
<li class="paper-li">24) K. Riesen, H. Bunke: “Approximate Graph Edit Distance Computation</li>
<p class="paper-paragraph">by Means of Bipartite Graph Matching”, Image and Vision Computing,</p>
<p class="paper-paragraph">Vol.27, pp.950–959 (2009).</p>
<p class="paper-paragraph">（2020 年2 月29 日受付）</p>
<p class="paper-paragraph">（2020 年7 月19 日再受付）</p>
<p class="paper-paragraph">井 上 和 輝 2020 年 電気通信大学Ⅰ類卒業．在学時，画像処理の研究に従事．</p>
<p class="paper-paragraph">高 橋 裕 樹 （正会員） 1990 年 東京工業大学 工学部 制御工学科卒業．1992 年 同 大学院博士前期課程(物理情報工学専攻) 修了．1994 年 同 大学院博士後期課程中退．1994 年 同大工学部情報工学科助手．同大大学院情報理工学研究科助手を経て，現在，電気通信大学大学院情報理工学研究科 准教授．博士(工学)．視覚情報処理の研究に従事．</p>
<p class="paper-paragraph">The Journal of the Institute of Image Electronics Engineers of Japan Vol.49 No.4 （2020）</p>
</section>`
  }
};
