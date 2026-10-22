// 自動生成されたアプリ実装コード読解コンテンツ (sync_code.pyにより生成)
// ベースコードが変更されても、sync_code.pyを実行すれば自動で最新シンボル・Docstringが同期される
window.APP_CODE_MODULES = [
  {
    "id": "mod-cognitive-scoring",
    "title": "文脈認知補完数理モデル & 幾何マトリクス",
    "file": "backend/generators/font_manager.py",
    "related_paper": "論文②: 井上・高橋 (2020) §6.2 表5「単語の可読性の評価」",
    "why": "「単独では読めない崩れた文字でも、単語の中に入ると87.8%読める」という人間のトップダウン認知処理を数理モデル化。ボトルネック文字のペナルティ重みを単語長と常用語フラグから適応的に減衰させる。",
    "symbols": [
      {
        "type": "function",
        "name": "compute_word_cognitive_score",
        "docstring": "井上・高橋 (2020) §6.2「単語の可読性の評価」に基づく文脈認知補完スコア算出。\n- 単語を構成する他の文字の可読率が高いほど、1文字の低可読性（ボトルネック）が単語全体の可読性に\n  及ぼす悪影響は大幅に減衰する（表5: 被験者の87.8%が単語として読めた実証）。\n- 幾何平均と単語長N、日常語フラグに応じてmin_scoreのペナルティ重みを適応的に減衰。\n- 恣意的な乗算ゲイン (1.10倍等) を廃止し、数学的な凸結合 (w_geom + w_min = 1.0) で正規化算出。",
        "snippet": "def compute_word_cognitive_score(\n    scores: list[float],\n    word_len: int,\n    is_common: bool = False,\n) -> tuple[float, float, float]:\n    \"\"\"\n    井上・高橋 (2020) §6.2「単語の可読性の評価」に基づく文脈認知補完スコア算出。\n    - 単語を構成する他の文字の可読率が高いほど、1文字の低可読性（ボトルネック）が単語全体の可読性に\n      及ぼす悪影響は大幅に減衰する（表5: 被験者の87.8%が単語として読めた実証）。\n    - 幾何平均と単語長N、日常語フラグに応じてmin_scoreのペナルティ重みを適応的に減衰。\n    - 恣意的な乗算ゲイン (1.10倍等) を廃止し、数学的な凸結合 (w_geom + w_min = 1.0) で正規化算出。\n    \"\"\"\n    if not scores:\n        return 0.0, 0.0, 0.0\n\n    product = 1.0\n    for s in scores:\n        product *= max(0.01, float(s))\n    geom_mean = product ** (1.0 / len(scores))\n    min_score = min(scores)\n\n    # 単語長Nに応じた文脈冗長度 (文字数が多いほど1文字の欠損を前後文脈で補完可能)\n    context_power = (word_len - 1) / max(1, word_len) if word_len > 1 else 0.0\n\n    # ボトルネック最小値に対する適応的重み:\n    # 基準重み0.25から、全体の幾何平均と文脈冗長度が高い場合に最大0.05まで適応的に減少\n    # 常用語では語彙親密度補完が作用するため減衰係数が高まる\n    familiarity_factor = 1.25 if is_common else 1.0\n    reduction = min(1.0, (geom_mean ** 2) * context_power * familiarity_factor)\n    w_min = 0.25 * (1.0 - 0.80 * reduction)\n    w_geom = 1.0 - w_min\n\n    # 凸結合により常に 0.0 〜 1.0 の幾何・認知平均スコアを保証\n    final_score = w_geom * geom_mean + w_min * min_score\n",
        "line": 81
      }
    ]
  },
  {
    "id": "mod-empirical-matrix",
    "title": "先行研究実証データ統合マトリクス",
    "file": "backend/scoring/matrix.py",
    "related_paper": "論文②: 井上・高橋 (2020) §6.1 表1・表2「1,081ペア被験者可読率」 / 論文⑤: 魏・山口 (2023) §2.2",
    "why": "1,081組の被験者実験で実証された「可読率1.0の鉄板ペア」と「不可読0.0ペア」をボーナス・ペナルティ辞書として統合し、未学習文字は調和平均幾何類似度でフォールバック判定する。",
    "symbols": [
      {
        "type": "function",
        "name": "build_compatibility_matrix",
        "docstring": "全ひらがなペアのハイブリッド適性マトリクスを構築してJSONに保存",
        "snippet": "def build_compatibility_matrix(output_path: Path = OUTPUT_MATRIX_PATH) -> dict[str, dict[str, float]]:\n    \"\"\"全ひらがなペアのハイブリッド適性マトリクスを構築してJSONに保存\"\"\"\n    print(\"ひらがな画像のレンダリング中...\")\n    char_images = {}\n    for c in ALL_HIRAGANA:\n        char_images[c] = render_char_image(c, FONT_PATH)\n    \n    print(\"幾何学的類似度 (調和平均) & 先行研究エビデンス補正計算中...\")\n    matrix: dict[str, dict[str, float]] = {}\n    \n    for c1 in ALL_HIRAGANA:\n        matrix[c1] = {}\n        for c2 in ALL_HIRAGANA:\n            geom_score = calculate_geometric_similarity(char_images[c1], char_images[c2])\n            \n            pair_key = (c1, c2)\n            rev_pair_key = (c2, c1)\n            \n            # 1. 井上・高橋 (2020) 実証不可読ペアのペナルティ判定\n            if pair_key in EMPIRICAL_UNREADABLE_PAIRS or rev_pair_key in EMPIRICAL_UNREADABLE_PAIRS:\n                penalty_val = EMPIRICAL_UNREADABLE_PAIRS.get(pair_key, EMPIRICAL_UNREADABLE_PAIRS.get(rev_pair_key))\n                final_score = min(penalty_val, geom_score * 0.5)\n            # 2. 実証可読ペア / デザイン定義ペアの適用\n            elif pair_key in EMPIRICAL_READABLE_PAIRS or rev_pair_key in EMPIRICAL_READABLE_PAIRS:\n                rule_score = EMPIRICAL_READABLE_PAIRS.get(pair_key, EMPIRICAL_READABLE_PAIRS.get(rev_pair_key))\n                # 実証ルールを強く反映 (75% ルール, 25% 幾何)\n                final_score = 0.75 * rule_score + 0.25 * geom_score\n            else:\n                # 純粋幾何スコア (調和平均ベース)\n                final_score = min(1.0, geom_score * 1.4)\n                \n            # 濁点・半濁点の整合性チェック\n            has_dakuon_1 = c1 in DAKUON or c1 in HANDAKUON\n            has_dakuon_2 = c2 in DAKUON or c2 in HANDAKUON\n            if has_dakuon_1 != has_dakuon_2:",
        "line": 242
      }
    ]
  },
  {
    "id": "mod-tps-snap",
    "title": "近接ストローク引力スナップ & Thin Plate Spline (TPS) 弾性変形",
    "file": "backend/generators/snap_warper.py",
    "related_paper": "論文②: 井上・高橋 (2020) §4.2「アフィン変形」の拡張・進化版",
    "why": "論文②のアフィン変換（一次変換）では「の」の中央縦棒のような非線形な近接ストロークを綺麗に一本化できない。そこでThin Plate Spline（薄板スプライン弾性変形）とベクトル引力場を導入し、自然な磁石スナップを実現した。",
    "symbols": [
      {
        "type": "function",
        "name": "extract_skeleton_u8",
        "docstring": "画像の細線化スケルトン（1px中心線）を抽出",
        "snippet": "def extract_skeleton_u8(img: np.ndarray) -> np.ndarray:\n    \"\"\"画像の細線化スケルトン（1px中心線）を抽出\"\"\"\n    u8 = (img > 100).astype(np.uint8) * 255\n    try:\n        return (cv2.ximgproc.thinning(u8) > 0).astype(np.uint8)\n    except Exception:\n        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))\n        temp = u8.copy()\n        skel = np.zeros_like(temp)\n        while True:\n            eroded = cv2.erode(temp, element)\n            opened = cv2.morphologyEx(eroded, cv2.MORPH_OPEN, element)\n            subset = cv2.subtract(eroded, opened)\n            skel = cv2.bitwise_or(skel, subset)\n            temp = eroded.copy()\n            if cv2.countNonZero(temp) == 0:\n                break\n        return (skel > 0).astype(np.uint8)",
        "line": 5
      },
      {
        "type": "class",
        "name": "StrokeSnapWarper",
        "docstring": "近接ストローク吸引・局所非剛体変形エンジン (Skeleton Attraction & TPS Warper)\n先行研究:\n- 魏・山口 (2023)「中心線表現に基づくひらがなアンビグラムの自動生成」\n- 石崎ほか (2024)「ひらがな~る: 非剛体局所変形」\n平仮名の「の」「き」「さ」等において、外周の対称性を崩すことなく、\nオフセットした内側ストロークを磁石のように中間回転対称軸へスナップ（1本化）させる。",
        "snippet": "class StrokeSnapWarper:\n    \"\"\"\n    近接ストローク吸引・局所非剛体変形エンジン (Skeleton Attraction & TPS Warper)\n    先行研究:\n    - 魏・山口 (2023)「中心線表現に基づくひらがなアンビグラムの自動生成」\n    - 石崎ほか (2024)「ひらがな~る: 非剛体局所変形」\n    平仮名の「の」「き」「さ」等において、外周の対称性を崩すことなく、\n    オフセットした内側ストロークを磁石のように中間回転対称軸へスナップ（1本化）させる。\n    \"\"\"\n    def __init__(self):\n        pass\n\n    def compute_snap_displacement_fields(\n        self,\n        img1: np.ndarray,\n        img2_rot: np.ndarray,\n        max_distance: int = 40,\n        snap_strength: float = 0.75,\n        smooth_sigma: float = 14.0,\n    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:\n        \"\"\"\n        正反2画像の骨格から中間対称軸への局所変位ベクトル場 (dx, dy) を算出。\n        - max_distance: スナップを適用する最大近接ストローク距離 (px)\n        - snap_strength: 中間軸への引き寄せ係数 (0.0: 無変形, 0.5: 中間線で完全一致, 0.75: 強力吸引)\n        - smooth_sigma: 変形場の滑らかさ (Thin Plate Spline弾性補間拡散)\n        \"\"\"\n        h, w = img1.shape[:2]\n\n        skel1 = extract_skeleton_u8(img1)\n        skel2 = extract_skeleton_u8(img2_rot)\n\n        # 共通部分（すでに一致しているストローク等の固定アンカー）\n        overlap = cv2.bitwise_and((img1 > 100).astype(np.uint8), (img2_rot > 100).astype(np.uint8))\n        overlap_dilated = cv2.dilate(overlap, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))\n\n        # 距離変換場と最近傍骨格への勾配ベクトルの算出\n        d2 = cv2.distanceTransform((skel2 == 0).astype(np.uint8), cv2.DIST_L2, 5)\n        d1 = cv2.distanceTransform((skel1 == 0).astype(np.uint8), cv2.DIST_L2, 5)\n\n        grad2_x = cv2.Sobel(d2, cv2.CV_32F, 1, 0, ksize=3)",
        "line": 24
      }
    ]
  },
  {
    "id": "mod-skeleton-engine",
    "title": "骨格中心線平均化 & 45度毛筆太さ抑揚変調",
    "file": "backend/generators/skeleton_engine.py",
    "related_paper": "論文②: 井上・高橋 (2020) §3「細線化」 / §5「ストロークの太線化」",
    "why": "均一な線幅ではどちらの文字の線か脳が判別できなくなる問題を解決するため、共通対称核（両方の文字にある部分）を太く協調し、固有パーツ（片方にしかない部分）を細線化する太さ抑揚変調を実装。",
    "symbols": [
      {
        "type": "class",
        "name": "SkeletonAmbigramEngine",
        "docstring": "手法B: 骨格中心線 (スケルトン) 平均化 Engine\n魏・山口 (2023) に着想を得た中心線アプローチ。\n正位置文字と180度反転文字の距離変換場 (Distance Transform) から平均骨格中心線を算出し、\n指定した線幅の均一な単一ストロークとして滑らかに再描画する。\nマルチフォント自動最適化 & 重心微小シフト補正に対応。",
        "snippet": "class SkeletonAmbigramEngine(BaseAmbigramGenerator):\n    \"\"\"\n    手法B: 骨格中心線 (スケルトン) 平均化 Engine\n    魏・山口 (2023) に着想を得た中心線アプローチ。\n    正位置文字と180度反転文字の距離変換場 (Distance Transform) から平均骨格中心線を算出し、\n    指定した線幅の均一な単一ストロークとして滑らかに再描画する。\n    マルチフォント自動最適化 & 重心微小シフト補正に対応。\n    \"\"\"\n    def __init__(self):\n        # スロット画像キャッシュ: (c1, c2, size, stroke_thickness, diff_blend, pre_bold, str(font_path), shift, brush_style, stroke_modulation, enable_snap, snap_strength, return_intermediates) -> (result, intermediates)\n        self._slot_cache: dict[tuple, Any] = {}\n\n    def render_glyph_bitmap(self, char: str, size: int = 512, font_path: Optional[Path] = None) -> np.ndarray:\n        \"\"\"指定文字を高解像度ビットマップとしてレンダリング (0: 背景, 255: 文字)\"\"\"\n        path = font_path or font_manager.get_font_path(\"zen_maru\")\n        img = Image.new(\"L\", (size, size), 0)\n        draw = ImageDraw.Draw(img)\n        try:\n            font = ImageFont.truetype(str(path), int(size * 0.72))\n        except Exception:\n            font = ImageFont.load_default()\n\n        bbox = draw.textbbox((0, 0), char, font=font)\n        w = bbox[2] - bbox[0]\n        h = bbox[3] - bbox[1]\n        x = (size - w) // 2 - bbox[0]\n        y = (size - h) // 2 - bbox[1]\n\n        draw.text((x, y), char, fill=255, font=font)\n        u8 = np.array(img, dtype=np.uint8)\n\n        # 実インク（非ゼロ画素）のバウンディングボックス中心による精密幾何中央揃え\n        # 「一」などの特殊アスペクト比グリフで上下にズレて回転対称性が崩れるのを防止\n        y_idx, x_idx = np.where(u8 > 30)\n        if len(y_idx) > 0:\n            cy = (y_idx.min() + y_idx.max()) / 2.0\n            cx = (x_idx.min() + x_idx.max()) / 2.0\n            shift_x = int(round(size / 2.0 - cx))\n            shift_y = int(round(size / 2.0 - cy))\n            if shift_x != 0 or shift_y != 0:",
        "line": 13
      }
    ]
  },
  {
    "id": "mod-onnx-recognizer",
    "title": "3,082文字対応 客観文字認識 & 双方向調和平均可読性評価",
    "file": "backend/evaluation/recognizer.py",
    "related_paper": "論文⑤: 魏・山口 (2023) §2.2「評価手法」",
    "why": "製作者の主観的思い込みを排除し、0°と180°の双方でAI文字認識モデル（JIS第1水準漢字＋仮名）が認識できる確率P(c1), P(c2)から、調和平均可読性をリアルタイム算出する。",
    "symbols": [
      {
        "type": "class",
        "name": "CharacterRecognizer",
        "docstring": "客観的文字認識・両方向可読性評価エンジン (ローカル軽量ONNX CNN / 特徴量ハイブリッド)\n先行研究:\n- 魏・山口 (2023)「多目的最適化 GAN によるアンビグラム生成」§2.2 (認識モデルによる調和平均可読性)\n- 井上・高橋 (2020)「文字構造特徴を用いたひらがなアンビグラムの生成」§6.2 (ひらがな識別器による定量評価)\n\nJIS第1水準漢字 (2,965文字) + ひらがな + カタカナの計3,082クラスに対応する軽量ONNXモデルにより、\n生成されたアンビグラムが正位置で文字Aとして認識される確率、\nおよび180度反転で文字Bとして認識される確率を測定し、調和平均可読性スコアを高速算出する。",
        "snippet": "class CharacterRecognizer:\n    \"\"\"\n    客観的文字認識・両方向可読性評価エンジン (ローカル軽量ONNX CNN / 特徴量ハイブリッド)\n    先行研究:\n    - 魏・山口 (2023)「多目的最適化 GAN によるアンビグラム生成」§2.2 (認識モデルによる調和平均可読性)\n    - 井上・高橋 (2020)「文字構造特徴を用いたひらがなアンビグラムの生成」§6.2 (ひらがな識別器による定量評価)\n    \n    JIS第1水準漢字 (2,965文字) + ひらがな + カタカナの計3,082クラスに対応する軽量ONNXモデルにより、\n    生成されたアンビグラムが正位置で文字Aとして認識される確率、\n    および180度反転で文字Bとして認識される確率を測定し、調和平均可読性スコアを高速算出する。\n    \"\"\"\n    def __init__(self, font_ids: list[str] = [\"zen_maru\", \"mplus\"]):\n        self.font_ids = font_ids\n        self.char_templates: dict[str, np.ndarray] = {}\n        self.onnx_session: Optional[Any] = None\n        self.labels: list[dict[str, Any]] = []\n        self.char_to_index: dict[str, int] = {}\n        self.model_type: str = \"template_matching\"\n\n        self._init_onnx()\n        if self.onnx_session is None:\n            self._init_templates()\n\n    def _init_onnx(self):\n        \"\"\"軽量ONNX文字認識モデルのロード (3,082クラス)\"\"\"\n        if not HAS_ONNX:\n            logger.info(\"onnxruntime が利用不可のため、テンプレートマッチングへフォールバックします。\")\n            return\n        if not ONNX_MODEL_PATH.exists() or not LABELS_PATH.exists():\n            logger.info(\"ONNXモデルファイルが見つからないため、テンプレートマッチングへフォールバックします。\")\n            return\n        try:\n            with open(LABELS_PATH, encoding=\"utf-8\") as f:\n                self.labels = json.load(f)\n            self.char_to_index = {item[\"char\"]: i for i, item in enumerate(self.labels)}\n            self.onnx_session = ort.InferenceSession(\n                str(ONNX_MODEL_PATH),\n                providers=[\"CPUExecutionProvider\"],\n            )\n            self.model_type = \"onnx_cnn\"",
        "line": 31
      }
    ]
  }
];
