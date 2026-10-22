/**
 * 論文②（井上・高橋 2020）および論文⑤（魏・山口 2023）読解アノテーションデータ
 * - 平易な日常のたとえ話
 * - 論文での役割
 * - ambigram-makerアプリのコード実装との対応関係
 */

window.PAPER_ANNOTATIONS = {
  // ==========================================
  // 論文⑤: 魏・山口 (2023) 関連キーワード
  // ==========================================
  "harmonic-mean": {
    term: "調和平均 (Harmonic Mean)",
    reading: "ちょうわへいきん",
    category: "評価・数理",
    difficulty: "★★☆",
    papers: ["paper05", "paper02"],
    shortSummary: "「双方が読めなければ意味がない」というアンビグラムの性質を評価する平均計算。極端に低い値に強く引きずられる。",
    intuitiveAnalogy: "「国語100点・数学0点」の生徒がいるとき、普通の平均（相加平均）だと50点になります。しかし「両方できなきゃ落第」という基準にしたいとき、調和平均を使うと【0点】になります。片方だけ読めてもアンビグラムとしては失格、という判定に最適です。",
    paperRole: "論文⑤ §2.2にて、正位置正解率Aと180度回転正解率Bの双方の成立度を評価する指標として導入。騙し絵（片方しか読めない文字）を厳格に排除するために採用された。",
    appImplementation: {
      filePath: "backend/scoring/matrix.py",
      functionName: "compute_word_cognitive_score() / score_matrix",
      description: "本アプリの文字ペア回転適性スコア、およびAI文字認識（ReadabilityCard）の両方向認識率の統合スコアに採用。2 * A * B / (A + B + eps) で計算されている。",
      codeSnippet: `def harmonic_mean(a: float, b: float, eps: float = 1e-6) -> float:
    return (2.0 * a * b) / (a + b + eps)`
    }
  },

  "multi-objective": {
    term: "多目的最適化 (Multi-objective Optimization)",
    reading: "たもくてきさいてきか",
    category: "機械学習・数理",
    difficulty: "★★★",
    papers: ["paper05"],
    shortSummary: "「正位置で読めること」と「反転位置で読めること」という、相反しやすい2つのゴールを同時にバランス良く満たす解を探す手法。",
    intuitiveAnalogy: "「安くてウマい店」を探すようなものです。「安さ」だけを突き詰めると不味くなり、「味」だけを突き詰めると高くなります。アンビグラムも「文字Aに似せる」と「文字Bに似せる」が綱引きをするため、両者の妥協点（パレート最適）を見つける必要があります。",
    paperRole: "論文⑤ §1にて、アンビグラム生成問題を単一の目的関数ではなく、2つの判別器（正位置判別器と180度回転判別器）を同時に満足させる多目的問題として定式化。",
    appImplementation: {
      filePath: "backend/generators/snap_warper.py",
      functionName: "TPSWarper / 引力スナップ場",
      description: "本アプリでは、文字Aのストロークと180度回転した文字Bのストロークの間で、双方向の引力エネルギー最小化（TPS変形）により多目的バランスをとっている。"
    }
  },

  "cgan-wgan": {
    term: "CGAN / WGAN (条件付き・Wasserstein敵対的生成ネットワーク)",
    reading: "シージーエーエヌ / ダブリューガン",
    category: "機械学習",
    difficulty: "★★★",
    papers: ["paper05"],
    shortSummary: "「指定した文字ペア」を生成する生成AIアーキテクチャ。学習の安定性に優れたWasserstein距離を損失関数に使用する。",
    intuitiveAnalogy: "偽札職人（生成器G）と警察官（判別器D）が競い合って上達する仕組みがGANです。CGANは「5千円札を作れ」と注文（条件）をつけられる版。WGANは「本物と偽物の分布のズレ（土をならす労力＝Wasserstein距離）」を測ることで、職人が途中で挫折（勾配消失）せずに安定して修行できるようにした改良版です。",
    paperRole: "論文⑤ §2.1にて、文字ペア(C1, C2)を条件入力し、2つの判別器（通常画像用・回転画像用）と対峙させて学習させる主骨格モデル。",
    appImplementation: {
      filePath: "backend/evaluation/recognizer.py",
      functionName: "ReadabilityRecognizer (ONNX CNN)",
      description: "本アプリではGANそのものではなく、論文⑤で検証器として使われた『認識モデル（判別器）』の思想を軽量ONNX CNNとして移植し、3,082字種の客観的文字認識をリアルタイム実行している。"
    }
  },

  "hypervolume": {
    term: "超体積最大化 (Hypervolume Maximization)",
    reading: "ちょうたいせきさいだいか",
    category: "数理・最適化",
    difficulty: "★★★",
    papers: ["paper05"],
    shortSummary: "複数の目的（2つの判別器スコア）が同時にどこまで高い水準をカバーできているかを「体積」として測り、最大化する指標。",
    intuitiveAnalogy: "長方形の「縦（文字Aらしさ）」と「横（文字Bらしさ）」があるとき、片方だけが100で他方が0だと面積はゼロです。縦も横もバランス良く広げて「長方形の面積（多次元なら超体積）」を最大にするポイントを探す手法です。",
    paperRole: "論文⑤ §2.1にて、2つの判別器の損失関数を合成する際の基準として、先行研究[3]（Albuquerque et al. 2019）の超体積最大化法を採用。",
    appImplementation: {
      filePath: "backend/scoring/matrix.py",
      functionName: "pair_similarity()",
      description: "本アプリの幾何類似度計算では、IoU（重なり面積比）とCoverage（包含率）の積により、面積的なバランス度合いを評価している。"
    }
  },

  "wasserstein-distance": {
    term: "Wasserstein 距離 (Earth Mover's Distance)",
    reading: "ヴァッサースタインきょり",
    category: "数学・統計",
    difficulty: "★★★",
    papers: ["paper05"],
    shortSummary: "2つの確率分布の形の違いを「土の山を別の形に変形するのに必要な仕事量」として測る数学的距離。",
    intuitiveAnalogy: "左側にある土の山を、右側の穴にシャベルで移すとき、「土の量 × 運んだ距離」が最小になる労力のこと。画像が全く重なっていなくても『あとどれくらい移動すれば重なるか』が計算できるため、AIが迷子になりません。",
    paperRole: "論文⑤ §3.1（図2）にて、モデルの学習が正常に進んでいるか（本物文字の分布に近づいているか）を確認する指標として提示。",
    appImplementation: {
      filePath: "backend/generators/snap_warper.py",
      functionName: "compute_distance_transform_field()",
      description: "本アプリではOpenCVの距離変換（Distance Transform）を用いて、各画素が最近傍ストロークまでどれだけ離れているか（輸送コスト場）を計算し、近接ストローク吸引に利用している。"
    }
  },

  "recognition-model": {
    term: "客観文字認識モデル (Character Recognizer)",
    reading: "もじにんしきモデル",
    category: "機械学習・評価",
    difficulty: "★☆☆",
    papers: ["paper05", "paper02"],
    shortSummary: "人間の主観（作者の思い込み）を排し、AIが0°と180°で本当に意図した文字として読めるかを客観判定する仕組み。",
    intuitiveAnalogy: "自分で作ったアンビグラムは、答えを知っているため「読める」と錯覚しがちです。第三者の公平な判定者としてAI文字認識モデルを使い、「正位置でAと読める確率」と「反転でBと読める確率」をテストさせます。",
    paperRole: "論文⑤ §2.2でGAN生成画像の正解率を検証するためにEMNISTで学習した認識モデルを使用。論文② §6.2でもETL8手書き漢字データベース等による識別器を用いて可読性を評価。",
    appImplementation: {
      filePath: "backend/evaluation/recognizer.py",
      functionName: "ReadabilityRecognizer.evaluate_ambigram()",
      description: "JIS第1水準漢字（2,965字）＋ひらがな＋カタカナの全3,082文字に対応した軽量ONNX CNNモデルを常駐させ、0°画像と180°画像の双方のトップ確率・調和平均可読性を即座に算出する。",
      codeSnippet: `prob_0 = top_0.probability if top_0.character == char_0 else 0.0
prob_180 = top_180.probability if top_180.character == char_1 else 0.0
readability = (2.0 * prob_0 * prob_180) / (prob_0 + prob_180 + 1e-6)`
    }
  },

  // ==========================================
  // 論文②: 井上・高橋 (2020) 関連キーワード
  // ==========================================
  "thinning-zhang-suen": {
    term: "細線化処理 (Zhang-Suenアルゴリズム)",
    reading: "さいせんかしょり / チャン・スエン",
    category: "画像処理",
    difficulty: "★★☆",
    papers: ["paper02"],
    shortSummary: "太さを持った文字の輪郭から肉を均等に削ぎ落とし、文字のトポロジー（穴や連結性）を保ったまま1ピクセル幅の「背骨」にするアルゴリズム。",
    intuitiveAnalogy: "太巻き寿司から具や海苔の外側を均等に削って、中心の1本の芯だけを残す作業です。文字がどんなフォント（太字ゴシックや毛筆）であっても、線の繋がり（幾何構造）だけを純粋に取り出せます。",
    paperRole: "論文② §3「文字構造の取得」の第1ステップ。文献[15]（Zhang & Suen 1984）のアルゴリズムを用いて、文字画像からストロークの中心線（骨格）を抽出。",
    appImplementation: {
      filePath: "backend/generators/skeleton_engine.py",
      functionName: "extract_skeleton_pixels() / morphology_skeleton",
      description: "本アプリの手法B（スケルトン中心線平均化）において、フォント画像からZhang-Suenまたはモルフォロジー骨格化を行い、文字の中心背骨を抽出している。"
    }
  },

  "rdp-simplification": {
    term: "ストローク単純化 (Ramer-Douglas-Peucker / RDP)",
    reading: "ストロークたんじゅんか / アールディーピー",
    category: "幾何アルゴリズム",
    difficulty: "★★☆",
    papers: ["paper02"],
    shortSummary: "曲がりくねったピクセルの列から、形状の特徴を損なわずに重要でない点を間引き、端点・折れ曲がり点・交点だけを抽出する手法。",
    intuitiveAnalogy: "手書きで描いたグニャグニャした曲線を、形の雰囲気を保ったまま『折れ線グラフ（カクカクした最小限のピン）』に置き換えるアルゴリズムです。データ量が激減し、どこが角（かど）かが分かります。",
    paperRole: "論文② §3にて、細線化された曲線を折れ線近似し、端点・交点・屈曲点を文字の「特徴点（グラフのノード）」として特定するために使用（文献[16]）。",
    appImplementation: {
      filePath: "backend/generators/font_manager.py",
      functionName: "approximate_polygon() / cv2.approxPolyDP",
      description: "本アプリのベクター幾何エンジンおよび重心シフト探索において、OpenCVのapproxPolyDP（RDPのC++実装）を用いて輪郭・骨格の頂点数を単純化している。"
    }
  },

  "skeleton-graph": {
    term: "文字骨格グラフ (Skeleton Graph)",
    reading: "もじこっかくグラフ",
    category: "グラフ理論",
    difficulty: "★★☆",
    papers: ["paper02"],
    shortSummary: "文字の特徴点（端点・交点・角）を「頂点（ノード）」、線で繋がっている部分を「辺（エッジ）」として表現した数理ネットワーク構造。",
    intuitiveAnalogy: "地下鉄の路線図のようなものです。駅が「ノード（端点や乗換駅）」、線路が「エッジ（ストローク）」です。カーブの曲がり具合などの見た目に惑わされず、『線がどこで交わり、何本に枝分かれしているか』という構造そのものを数学として扱えます。",
    paperRole: "論文② §3の最終成果。文字を $G = (V, E)$ というグラフに変換することで、後段の『2文字の間で共通する構造を探す（部分グラフ同型）』数学的処理が可能になる。",
    appImplementation: {
      filePath: "backend/generators/skeleton_engine.py",
      functionName: "SkeletonGraph / build_stroke_graph",
      description: "手法Bの中心線平均化において、抽出した骨格ピクセルから分岐点・端点を検出し、文字ストロークの連結関係を保持・変形している。"
    }
  },

  "subgraph-isomorphism": {
    term: "部分グラフ同型判定 (Subgraph Isomorphism)",
    reading: "ぶぶんグラフどうけいはんてい",
    category: "グラフ理論・数理",
    difficulty: "★★★",
    papers: ["paper02"],
    shortSummary: "2つの異なる文字の骨格グラフの中に、「全く同じ接続関係を持っている共通の骨組み」が存在するかを判定する計算。",
    intuitiveAnalogy: "「あ」の骨組みの一部（たとえば十字に交わる部分）が、「ま」や「す」の骨組みの一部とそっくり同じ形・繋がり方をしていないか照合するパズル合わせです。共通の骨組みが見つかれば、そこをアンビグラムの共有ストロークにできます。",
    paperRole: "論文② §4.1の最重要コア理論。大局的（文字全体）および局所的（交点周辺）な部分グラフ同型を調べることで、2文字の共通部分を自動抽出。",
    appImplementation: {
      filePath: "backend/generators/snap_warper.py",
      functionName: "find_corresponding_points() / TPSスナップ",
      description: "本アプリでは厳密なグラフ同型解法（NP完全問題で計算が重い）の代わりに、近接ストローク引力場とThin Plate Spline（TPS）弾性変形モデルを組み合わせ、幾何的に最も近いストローク同士を中間対称軸へ引き寄せる高速アプローチを採用。"
    }
  },

  "affine-transformation": {
    term: "アフィン変換 (Affine Transformation)",
    reading: "アフィンへんかん",
    category: "幾何・線形代数",
    difficulty: "★★☆",
    papers: ["paper02"],
    shortSummary: "平行性を保ったまま、拡大縮小・回転・平行移動・せん断（傾き）を行う2次元幾何変換行列。",
    intuitiveAnalogy: "ゴムシートに描いた文字を、斜めに引っ張ったり回したりスライドさせたりして、相手の文字のストロークの位置・向きにピッタリ重ね合わせる幾何学的な変形操作です。",
    paperRole: "論文② §4.2にて、部分グラフ同型で対応づいた2文字の共通特徴点を最小二乗法で重ね合わせるためのアフィン変換行列 $A, B$ を算出（式8・式9）。",
    appImplementation: {
      filePath: "backend/generators/font_manager.py",
      functionName: "find_optimal_offset() / get_affine_transform",
      description: "本アプリのフォントマネージャーおよびベクターエンジンにて、文字ペア間の重心差や回転位置合わせを行う最適なXYシフト・アフィン行列探索に使用されている。"
    }
  },

  "brush-modulation": {
    term: "筆文字化・太さ抑揚変調 (Brush Stroke Modulation)",
    reading: "ふでもじか / ふとさよくようへんちょう",
    category: "タイポグラフィ・認知",
    difficulty: "★☆☆",
    papers: ["paper02"],
    shortSummary: "均一な線（丸ゴシック等）ではなく、筆の入り・抜き・トメ・ハライのように線の太さに抑揚をつけ、正反どちらの文字の線かを脳に誤認・補正させる技法。",
    intuitiveAnalogy: "均一な太さのマジックペンで書くと「ただの落書き」に見える線でも、毛筆の入り・抜きで『ここはハライだから上に抜けている』と見せることで、脳が勝手に目的の文字として認識しやすくなります。",
    paperRole: "論文② §5「ストロークの太線化」の核心。幾何学的な骨格線だけでは可読性が低いため、書道（石亀らの毛筆モデル）の45度楕円ブラシや入り抜きのグラデーションを適用して可読率を劇的に向上させた。",
    appImplementation: {
      filePath: "backend/generators/skeleton_engine.py",
      functionName: "apply_brush_stroke_modulation() / stroke_dilation",
      description: "手法B（骨格中心線平均化）に搭載。共通対称核（両方の文字にある部分）を太く強調し、固有パーツ（片方にしかない部分）を細線化する太さ変調スライダーとして実装されている。"
    }
  },

  "context-cognitive-completion": {
    term: "文脈認知補完 (Contextual Cognitive Completion)",
    reading: "ぶんみゃくにんちほかん",
    category: "認知心理学・言語",
    difficulty: "★☆☆",
    papers: ["paper02"],
    shortSummary: "1文字だけでは崩れていて読めない文字でも、前後の単語の文脈（単語親密度）によって人間の脳が自動的に正しく読んでしまう心理現象（トップダウン処理）。",
    intuitiveAnalogy: "「名○屋」という看板を見たとき、真ん中の文字が雨風で半分消えていても、私たちは迷わず「名古屋」と読めます。アンビグラムも同じで、単語として知っている言葉なら、多少崩れた文字が混ざっていても脳が勝手に補完してくれます。",
    paperRole: "論文② §6.3（表5）にて実証。単一文字では可読率0.0〜0.2（ほぼ読めない）文字を含む4文字単語でも、87.8%（246語中216語）が読めたという衝撃的な実験結果。",
    appImplementation: {
      filePath: "backend/scoring/matrix.py",
      functionName: "compute_word_cognitive_score()",
      description: "本アプリの探索エンジンで実装。JMdictの単語長（文字数）や常用語フラグ（common）に基づき、ボトルネック文字の引き下げペナルティを動的に緩和する数理モデルとして組み込まれている。"
    }
  },

  "readability-experiment": {
    term: "1,081組の被験者可読性実験",
    reading: "ひけんしゃかどくせいじっけん",
    category: "実証実験・データ",
    difficulty: "★☆☆",
    papers: ["paper02"],
    shortSummary: "ひらがな46文字の一対一の全組み合わせ（46C2 + 46 = 1,081ペア）を被験者に実際に見せ、読めた確率（可読率）を網羅的に測定した実証データ。",
    intuitiveAnalogy: "机上の空論ではなく、「実際に人間に見せて何人が正しく読めたか」を全ひらがなペアについてテストしたデータベースです。可読率100%の鉄板ペアと、0%の絶対無理なペアが科学的に判明しています。",
    paperRole: "論文② §6.1（表1・表2・図14）。プロの作家が作った手動アンビグラムとの比較や、自動生成ならではの『意外に読める新発見ペア（せ↔ぬ、さ↔を 等）』を発掘。",
    appImplementation: {
      filePath: "backend/scoring/matrix.py",
      functionName: "INCORPORATED_READABILITY_EXPERIMENT_DATA",
      description: "論文②の実証実験結果（可読率1.0のペア、0.0の不可読ペア）が本アプリのスコアマトリクスにボーナス/ペナルティとして組み込まれており、探索時のランキング精度を支えている。"
    }
  }
};
