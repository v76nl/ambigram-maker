import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DATA_DIR = Path(__file__).parent
FONT_PATH = Path(__file__).parent.parent / "fonts" / "ZenMaruGothic-Medium.ttf"
OUTPUT_MATRIX_PATH = DATA_DIR / "compatibility.json"

# 対象とするひらがな全文字リスト
SEION = list("あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん")
DAKUON = list("がぎぐげござじずぜぞだぢづでどばびぶべぼ")
HANDAKUON = list("ぱぴぷぺぽ")
KOMOJI = list("ぁぃぅぇぉっゃゅょゎ")
CHOUON = ["ー"]

ALL_HIRAGANA = sorted(list(set(SEION + DAKUON + HANDAKUON + KOMOJI + CHOUON)))

# ドメイン知識および先行研究の実証実験に基づく高相性・不可読ペア定義
# 1. 井上・高橋 (2020) §6.1 表1・表2: 被験者可読率 1.0 (完璧に読めた実証ペア)
# 2. 野村一晟 (2018): アンビグラム作家の実践的デザインペア
EMPIRICAL_READABLE_PAIRS = {
    # 井上・高橋 (2020) 可読率 1.0 実証ペア
    ("あ", "ま"): 0.95,
    ("い", "け"): 0.95,
    ("え", "る"): 0.96,
    ("き", "わ"): 0.94,
    ("さ", "や"): 0.93,
    ("を", "を"): 0.95,
    ("せ", "み"): 0.93,
    ("た", "む"): 0.93,
    ("は", "れ"): 0.94,
    ("も", "よ"): 0.94,
    # 手動困難とされていたが自動生成で可読率 1.0 を達成したペア
    ("せ", "ぬ"): 0.95,
    ("さ", "を"): 0.91,
    ("つ", "む"): 0.92,
    ("う", "ぬ"): 0.93,
    ("あ", "そ"): 0.91,
    # 井上・高橋 (2020) 図16(d) 認識器および被験者可読率 1.0 実証ペア
    ("ま", "れ"): 0.94,
    
    # 伝統的・幾何学的にほぼ自明な回転対称ペア
    ("し", "つ"): 0.96,
    ("い", "い"): 0.90,
    ("の", "の"): 0.98,
    ("こ", "こ"): 0.92,
    ("く", "く"): 0.90,
    ("へ", "へ"): 0.94,
    ("り", "り"): 0.90,
    ("ー", "ー"): 1.00,
    
    # タイポグラフィデザイン定番ペア (野村 2018)
    ("う", "ん"): 0.85,
    ("た", "に"): 0.82,
    ("ち", "さ"): 0.80,
    ("て", "と"): 0.78,
    ("る", "ろ"): 0.86,
    ("あ", "お"): 0.78,
    ("ま", "ほ"): 0.75,
    ("す", "む"): 0.73,
    ("め", "ぬ"): 0.82,
    ("そ", "そ"): 0.78,
    ("わ", "れ"): 0.75,
    ("ね", "わ"): 0.72,
    ("ゆ", "ゆ"): 0.72,
    ("み", "み"): 0.70,
}

# 井上・高橋 (2020) §6.1: 幾何学的に重なりがあっても被験者可読率 0.0 (判読不能) だったペア
EMPIRICAL_UNREADABLE_PAIRS = {
    ("い", "ね"): 0.15,
    ("う", "お"): 0.15,
    ("く", "と"): 0.15,
    ("し", "や"): 0.15,
    ("せ", "ち"): 0.15,
    ("ね", "へ"): 0.15,
    ("と", "の"): 0.15,
    ("て", "へ"): 0.15,
    ("ぬ", "ぬ"): 0.15,
    ("ん", "ん"): 0.15,
}

_char_image_cache: dict[tuple[str, Path, int], np.ndarray] = {}
_pair_score_cache: dict[tuple[str, str], float] = {}

# カタカナの代表的自己対称・高相性ペア（ルールベース補正）
KATAKANA_SYMMETRIC_PAIRS = {
    ("ー", "ー"): 1.00,
    ("エ", "エ"): 0.95,
    ("ロ", "ロ"): 0.96,
    ("ハ", "ハ"): 0.92,
    ("ト", "ト"): 0.88,
    ("ス", "ヌ"): 0.90,
    ("フ", "フ"): 0.86,
    ("リ", "リ"): 0.88,
    ("コ", "コ"): 0.85,
    ("ニ", "ニ"): 0.90,
    ("メ", "メ"): 0.86,
    ("ク", "ク"): 0.82,
    ("ヘ", "ヘ"): 0.94,
    ("オ", "オ"): 0.78,
}

def render_proper_centered(char: str, font_path: Path = FONT_PATH, size: int = 64) -> np.ndarray:
    """文字の実際のピクセル描画領域（バウンディングボックス）を基準に正確に中央配置した2値画像を生成"""
    key = (char, font_path, size)
    if key in _char_image_cache:
        return _char_image_cache[key]

    big_size = size * 2
    img = Image.new("L", (big_size, big_size), 0)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(str(font_path), int(size * 0.75))
    except Exception:
        font = ImageFont.load_default()

    draw.text((big_size // 4, big_size // 4), char, fill=255, font=font)
    arr = np.array(img, dtype=np.float32) / 255.0

    rows, cols = np.where(arr > 0.3)
    if len(rows) == 0:
        res = np.zeros((size, size), dtype=np.float32)
    else:
        min_r, max_r = rows.min(), rows.max()
        min_c, max_c = cols.min(), cols.max()
        h = max_r - min_r + 1
        w = max_c - min_c + 1
        glyph = arr[min_r:max_r + 1, min_c:max_c + 1]

        res = np.zeros((size, size), dtype=np.float32)
        start_r = (size - h) // 2
        start_c = (size - w) // 2
        res[start_r:start_r + h, start_c:start_c + w] = glyph

    binary_res = (res > 0.3).astype(np.float32)
    _char_image_cache[key] = binary_res
    return binary_res

def render_char_image(char: str, font_path: Path, size: int = 128) -> np.ndarray:
    """指定文字を画像としてレンダリングし、2値NumPy配列（0 or 1）を返す"""
    return render_proper_centered(char, font_path, size)

def calculate_geometric_similarity_with_jitter(img_a: np.ndarray, img_b: np.ndarray, max_jitter: int = 2) -> float:
    """微小オフセット揺らし（±2px）を探索し、最も高い幾何対称性スコアを採用"""
    img_b_rot = np.rot90(img_b, 2)
    h, w = img_a.shape
    best = 0.0

    for dy in range(-max_jitter, max_jitter + 1):
        for dx in range(-max_jitter, max_jitter + 1):
            if dy == 0 and dx == 0:
                shifted = img_b_rot
            else:
                shifted = np.zeros_like(img_b_rot)
                sy1, sy2 = max(0, -dy), min(h, h - dy)
                sx1, sx2 = max(0, -dx), min(w, w - dx)
                dy1, dy2 = max(0, dy), min(h, h + dy)
                dx1, dx2 = max(0, dx), min(w, w + dx)
                shifted[dy1:dy2, dx1:dx2] = img_b_rot[sy1:sy2, sx1:sx2]

            intersection = np.sum(img_a * shifted)
            area_a = np.sum(img_a)
            area_b = np.sum(shifted)

            if area_a == 0 or area_b == 0 or intersection == 0:
                s = 0.0
            else:
                cov_a = intersection / area_a
                cov_b = intersection / area_b
                harmonic_cov = (2.0 * cov_a * cov_b) / (cov_a + cov_b + 1e-6)
                union = np.sum(np.clip(img_a + shifted, 0, 1))
                iou = intersection / union if union > 0 else 0.0
                s = float(0.3 * iou + 0.7 * harmonic_cov)

            if s > best:
                best = s

    return best

def calculate_geometric_similarity(img_a: np.ndarray, img_b: np.ndarray) -> float:
    """微小座標揺らし付き幾何学的類似度計算"""
    return calculate_geometric_similarity_with_jitter(img_a, img_b, max_jitter=2)

def get_any_char_compatibility(c1: str, c2: str, hiragana_matrix: dict | None = None) -> float:
    """
    任意の2文字（ひらがな、カタカナ、漢字、英数字）の180度回転相性スコアを取得する。
    - ひらがな同士: 井上・高橋 (2020) 実証マトリクスを優先使用
    - カタカナ同士: 定番ペア補正 ＋ 幾何学的類似度
    - 漢字・混在: 幾何学的類似度 (調和平均 ＋ IoU ＋ 座標揺らし)
    """
    if not c1 or not c2:
        return 0.1

    pair = (c1, c2)
    rev_pair = (c2, c1)

    if pair in _pair_score_cache:
        return _pair_score_cache[pair]

    # 1. ひらがなマトリクス
    if hiragana_matrix and c1 in hiragana_matrix and c2 in hiragana_matrix[c1]:
        score = hiragana_matrix[c1][c2]
        _pair_score_cache[pair] = score
        _pair_score_cache[rev_pair] = score
        return score

    # 2. カタカナ定番ペア
    if pair in KATAKANA_SYMMETRIC_PAIRS:
        score = KATAKANA_SYMMETRIC_PAIRS[pair]
        _pair_score_cache[pair] = score
        _pair_score_cache[rev_pair] = score
        return score
    if rev_pair in KATAKANA_SYMMETRIC_PAIRS:
        score = KATAKANA_SYMMETRIC_PAIRS[rev_pair]
        _pair_score_cache[pair] = score
        _pair_score_cache[rev_pair] = score
        return score

    # 3. 幾何学的類似度計算 (漢字・カタカナ・混在): font_managerの統合幾何計算エンジンを使用
    try:
        from generators.font_manager import font_manager
    except ImportError:
        from backend.generators.font_manager import font_manager

    im1 = font_manager.render_char_matrix(c1, "zen_maru")
    im2 = font_manager.render_char_matrix(c2, "zen_maru")
    skel1 = font_manager.render_char_skeleton(c1, "zen_maru")
    skel2 = font_manager.render_char_skeleton(c2, "zen_maru")
    raw_geom, _ = font_manager.calculate_pair_similarity_with_shift(
        im1, im2, max_shift=2, skel_a=skel1, skel_b=skel2
    )

    # 恣意的な乗算ゲイン (1.25倍) を廃止し、純粋な幾何類似度 (0.0〜1.0) を返却
    score = round(float(np.clip(raw_geom, 0.0, 1.0)), 4)

    _pair_score_cache[pair] = score
    _pair_score_cache[rev_pair] = score
    return score

def build_compatibility_matrix(output_path: Path = OUTPUT_MATRIX_PATH) -> dict[str, dict[str, float]]:
    """全ひらがなペアのハイブリッド適性マトリクスを構築してJSONに保存"""
    print("ひらがな画像のレンダリング中...")
    char_images = {}
    for c in ALL_HIRAGANA:
        char_images[c] = render_char_image(c, FONT_PATH)
    
    print("幾何学的類似度 (調和平均) & 先行研究エビデンス補正計算中...")
    matrix: dict[str, dict[str, float]] = {}
    
    for c1 in ALL_HIRAGANA:
        matrix[c1] = {}
        for c2 in ALL_HIRAGANA:
            geom_score = calculate_geometric_similarity(char_images[c1], char_images[c2])
            
            pair_key = (c1, c2)
            rev_pair_key = (c2, c1)
            
            # 1. 井上・高橋 (2020) 実証不可読ペアのペナルティ判定
            if pair_key in EMPIRICAL_UNREADABLE_PAIRS or rev_pair_key in EMPIRICAL_UNREADABLE_PAIRS:
                penalty_val = EMPIRICAL_UNREADABLE_PAIRS.get(pair_key, EMPIRICAL_UNREADABLE_PAIRS.get(rev_pair_key))
                final_score = min(penalty_val, geom_score * 0.5)
            # 2. 実証可読ペア / デザイン定義ペアの適用
            elif pair_key in EMPIRICAL_READABLE_PAIRS or rev_pair_key in EMPIRICAL_READABLE_PAIRS:
                rule_score = EMPIRICAL_READABLE_PAIRS.get(pair_key, EMPIRICAL_READABLE_PAIRS.get(rev_pair_key))
                # 実証ルールを強く反映 (75% ルール, 25% 幾何)
                final_score = 0.75 * rule_score + 0.25 * geom_score
            else:
                # 純粋幾何スコア (調和平均ベース)
                final_score = min(1.0, geom_score * 1.4)
                
            # 濁点・半濁点の整合性チェック
            has_dakuon_1 = c1 in DAKUON or c1 in HANDAKUON
            has_dakuon_2 = c2 in DAKUON or c2 in HANDAKUON
            if has_dakuon_1 != has_dakuon_2:
                final_score *= 0.70
                
            # 小文字の整合性
            has_komoji_1 = c1 in KOMOJI
            has_komoji_2 = c2 in KOMOJI
            if has_komoji_1 != has_komoji_2:
                final_score *= 0.65
                
            matrix[c1][c2] = round(float(final_score), 4)


    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(matrix, f, ensure_ascii=False, indent=2)
        
    print(f"適性マトリクス保存完了: {output_path} ({len(ALL_HIRAGANA)}x{len(ALL_HIRAGANA)})")
    return matrix

if __name__ == "__main__":
    build_compatibility_matrix()
