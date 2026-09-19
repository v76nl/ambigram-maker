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

# ドメイン知識に基づく高相性ペア定義 (手動ボーナス/ベースライン)
# 180度回転アンビグラムで成立しやすい代表的ペア（双方向）
KNOWN_SYMMETRY_PAIRS = {
    # ほぼそのまま・わずかな調整で成立するペア
    ("し", "つ"): 0.95,
    ("い", "い"): 0.88,
    ("の", "の"): 0.98,
    ("こ", "こ"): 0.90,
    ("く", "く"): 0.88,
    ("へ", "へ"): 0.92,
    ("り", "り"): 0.88,
    ("ー", "ー"): 1.00,
    
    # タイポグラフィデザインでよく成立するペア
    ("う", "ん"): 0.82,
    ("た", "に"): 0.80,
    ("ち", "さ"): 0.78,
    ("て", "と"): 0.75,
    ("る", "ろ"): 0.85,
    ("あ", "お"): 0.75,
    ("ま", "ほ"): 0.72,
    ("す", "む"): 0.70,
    ("め", "ぬ"): 0.80,
    ("そ", "そ"): 0.75,
    ("わ", "れ"): 0.72,
    ("ね", "わ"): 0.70,
    ("ゆ", "ゆ"): 0.70,
    ("み", "み"): 0.68,
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
    """文字Aと180度回転した文字Bの幾何学的類似度（IoU＋重なり比率）を計算"""
    # img_b を 180度回転
    img_b_rot = np.rot90(img_b, 2)
    
    intersection = np.sum(img_a * img_b_rot)
    union = np.sum(np.clip(img_a + img_b_rot, 0, 1))
    
    if union == 0:
        return 0.0
    
    iou = intersection / union
    # 包含度（それぞれの文字の面積に対する重なり率）
    area_a = np.sum(img_a)
    area_b = np.sum(img_b_rot)
    if area_a == 0 or area_b == 0:
        return 0.0
        
    coverage = (intersection / area_a + intersection / area_b) / 2.0
    
    # 幾何スコア（IoUとCoverageの線形結合）
    return float(0.4 * iou + 0.6 * coverage)

def build_compatibility_matrix(output_path: Path = OUTPUT_MATRIX_PATH) -> dict[str, dict[str, float]]:
    """全ひらがなペアのハイブリッド適性マトリクスを構築してJSONに保存"""
    print("ひらがな画像のレンダリング中...")
    char_images = {}
    for c in ALL_HIRAGANA:
        char_images[c] = render_char_image(c, FONT_PATH)
    
    print("幾何学的類似度 & ハイブリッド補正計算中...")
    matrix: dict[str, dict[str, float]] = {}
    
    for c1 in ALL_HIRAGANA:
        matrix[c1] = {}
        for c2 in ALL_HIRAGANA:
            geom_score = calculate_geometric_similarity(char_images[c1], char_images[c2])
            
            # ドメイン知識ルールの適用
            pair_key = (c1, c2)
            rev_pair_key = (c2, c1)
            
            rule_score = None
            if pair_key in KNOWN_SYMMETRY_PAIRS:
                rule_score = KNOWN_SYMMETRY_PAIRS[pair_key]
            elif rev_pair_key in KNOWN_SYMMETRY_PAIRS:
                rule_score = KNOWN_SYMMETRY_PAIRS[rev_pair_key]
                
            if rule_score is not None:
                # ルールスコアを強めにブレンド (70% ルール, 30% 幾何)
                final_score = 0.7 * rule_score + 0.3 * geom_score
            else:
                # 純粋幾何スコアをスケーリング (アンビグラムとしての許容度に合わせて調整)
                final_score = min(1.0, geom_score * 1.5)
                
            # 濁点・半濁点の整合性チェック
            # どちらか一方のみ濁点・半濁点がある場合はペナルティ
            has_dakuon_1 = c1 in DAKUON or c1 in HANDAKUON
            has_dakuon_2 = c2 in DAKUON or c2 in HANDAKUON
            if has_dakuon_1 != has_dakuon_2:
                final_score *= 0.75
                
            # 小文字の整合性
            has_komoji_1 = c1 in KOMOJI
            has_komoji_2 = c2 in KOMOJI
            if has_komoji_1 != has_komoji_2:
                final_score *= 0.70
                
            matrix[c1][c2] = round(float(final_score), 4)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(matrix, f, ensure_ascii=False, indent=2)
        
    print(f"適性マトリクス保存完了: {output_path} ({len(ALL_HIRAGANA)}x{len(ALL_HIRAGANA)})")
    return matrix

if __name__ == "__main__":
    build_compatibility_matrix()
