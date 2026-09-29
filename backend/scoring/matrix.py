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
}

def render_char_image(char: str, font_path: Path, size: int = 128) -> np.ndarray:
    """指定文字を画像としてレンダリングし、2値NumPy配列（0 or 1）を返す"""
    img = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(str(font_path), int(size * 0.75))
    except Exception:
        font = ImageFont.load_default()
    
    # バウンディングボックスの中央に配置
    bbox = draw.textbbox((0, 0), char, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) // 2 - bbox[0]
    y = (size - h) // 2 - bbox[1]
    
    draw.text((x, y), char, fill=255, font=font)
    arr = np.array(img, dtype=np.float32) / 255.0
    return (arr > 0.3).astype(np.float32)

def calculate_geometric_similarity(img_a: np.ndarray, img_b: np.ndarray) -> float:
    """
    文字Aと180度回転した文字Bの幾何学的類似度を計算
    魏・山口 (2023) §2.2 に従い、正位置と180度反転位置の調和平均 (Harmonic Mean) を採用。
    片方しか成立しない非対称ペアを数学的に排除する。
    """
    img_b_rot = np.rot90(img_b, 2)
    
    intersection = np.sum(img_a * img_b_rot)
    area_a = np.sum(img_a)
    area_b = np.sum(img_b_rot)
    
    if area_a == 0 or area_b == 0 or intersection == 0:
        return 0.0
    
    # それぞれの文字に対するカバー率
    cov_a = intersection / area_a
    cov_b = intersection / area_b
    
    # 調和平均 (どちらか一方が低いと急激にペナルティがかかる)
    harmonic_cov = (2.0 * cov_a * cov_b) / (cov_a + cov_b + 1e-6)
    
    # IoU
    union = np.sum(np.clip(img_a + img_b_rot, 0, 1))
    iou = intersection / union if union > 0 else 0.0
    
    # 幾何スコア（IoU 30% + 調和カバー率 70%）
    return float(0.3 * iou + 0.7 * harmonic_cov)

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
