"""
バックエンド実装コードから自動的にシンボル・Docstring・コードスニペットを抽出し、
論文・コード解読リーダー用の code_content.js を生成する同期スクリプト。
コード本体が変更されても、このスクリプトを再実行するだけでドキュメントが最新化される。
"""

import ast
import inspect
from pathlib import Path
import json

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
READER_DIR = Path(__file__).resolve().parent

# 解析対象モジュールと解説メタデータ (Why / 先行研究との結びつき)
MODULES_METADATA = [
    {
        "id": "mod-cognitive-scoring",
        "title": "文脈認知補完数理モデル & 幾何マトリクス",
        "file": "backend/generators/font_manager.py",
        "related_paper": "論文②: 井上・高橋 (2020) §6.2 表5「単語の可読性の評価」",
        "why": "「単独では読めない崩れた文字でも、単語の中に入ると87.8%読める」という人間のトップダウン認知処理を数理モデル化。ボトルネック文字のペナルティ重みを単語長と常用語フラグから適応的に減衰させる。",
        "target_functions": ["compute_word_cognitive_score"]
    },
    {
        "id": "mod-empirical-matrix",
        "title": "先行研究実証データ統合マトリクス",
        "file": "backend/scoring/matrix.py",
        "related_paper": "論文②: 井上・高橋 (2020) §6.1 表1・表2「1,081ペア被験者可読率」 / 論文⑤: 魏・山口 (2023) §2.2",
        "why": "1,081組の被験者実験で実証された「可読率1.0の鉄板ペア」と「不可読0.0ペア」をボーナス・ペナルティ辞書として統合し、未学習文字は調和平均幾何類似度でフォールバック判定する。",
        "target_functions": ["get_pair_compatibility_score", "build_compatibility_matrix"]
    },
    {
        "id": "mod-tps-snap",
        "title": "近接ストローク引力スナップ & Thin Plate Spline (TPS) 弾性変形",
        "file": "backend/generators/snap_warper.py",
        "related_paper": "論文②: 井上・高橋 (2020) §4.2「アフィン変形」の拡張・進化版",
        "why": "論文②のアフィン変換（一次変換）では「の」の中央縦棒のような非線形な近接ストロークを綺麗に一本化できない。そこでThin Plate Spline（薄板スプライン弾性変形）とベクトル引力場を導入し、自然な磁石スナップを実現した。",
        "target_classes": ["StrokeSnapWarper"],
        "target_functions": ["extract_skeleton_u8"]
    },
    {
        "id": "mod-skeleton-engine",
        "title": "骨格中心線平均化 & 45度毛筆太さ抑揚変調",
        "file": "backend/generators/skeleton_engine.py",
        "related_paper": "論文②: 井上・高橋 (2020) §3「細線化」 / §5「ストロークの太線化」",
        "why": "均一な線幅ではどちらの文字の線か脳が判別できなくなる問題を解決するため、共通対称核（両方の文字にある部分）を太く協調し、固有パーツ（片方にしかない部分）を細線化する太さ抑揚変調を実装。",
        "target_classes": ["SkeletonAmbigramEngine"]
    },
    {
        "id": "mod-onnx-recognizer",
        "title": "3,082文字対応 客観文字認識 & 双方向調和平均可読性評価",
        "file": "backend/evaluation/recognizer.py",
        "related_paper": "論文⑤: 魏・山口 (2023) §2.2「評価手法」",
        "why": "製作者の主観的思い込みを排除し、0°と180°の双方でAI文字認識モデル（JIS第1水準漢字＋仮名）が認識できる確率P(c1), P(c2)から、調和平均可読性をリアルタイム算出する。",
        "target_classes": ["CharacterRecognizer"]
    },
    {
        "id": "mod-morphology-engine",
        "title": "手法A: 論理積 ＋ モルフォロジー膨張・共通対称核抽出",
        "file": "backend/generators/morphology_engine.py",
        "related_paper": "論文②: 井上・高橋 (2020) §3「細線化」 / §5「ストロークの太線化」",
        "why": "正位置と180度回転文字のピクセル論理積 (AND) を『共通対称核』として抽出し、モルフォロジー膨張 (Dilation) と平滑化によって二重線を解消した滑らかな単一ストロークを生成する。",
        "target_classes": ["MorphologyAmbigramEngine"]
    },
    {
        "id": "mod-vector-engine",
        "title": "手法D: ベクター幾何・三次ベジェ曲線のアウトライン融合",
        "file": "backend/generators/vector_engine.py",
        "related_paper": "石崎ほか (2024)「MOjiULE / G-FITs」 / 論文② §4「アフィン変形」",
        "why": "フォントのTrueTypeベクターアウトライン（三次ベジェ曲線）を直接抽出し、正位置と180度回転文字を幾何学的に融合して無限解像度SVGを生成する。",
        "target_classes": ["VectorAmbigramEngine"],
        "target_functions": ["get_glyph_path"]
    },
    {
        "id": "mod-bitmap-engine",
        "title": "手法C: ビットマップ論理演算・エネルギー場アルファブレンド合成",
        "file": "backend/generators/bitmap_engine.py",
        "related_paper": "論文⑤: 魏・山口 (2023) §2.1「生成器モデル」",
        "why": "OpenCVとNumPyを用いて、正位置文字と180度回転文字の重なり・差分エネルギーを最適化し、滑らかな2値/グレースケールアンビグラム画像を高速生成する。",
        "target_classes": ["BitmapAmbigramEngine"]
    },
    {
        "id": "mod-dictionary-search",
        "title": "単語ペア回転探索エンジン & 語彙親密度DFS枝刈り木探索",
        "file": "backend/search/finder.py",
        "related_paper": "論文②: 井上・高橋 (2020) §4.3「アンビグラムの探索」 / §6.1「単語可読性実験」",
        "why": "数万語の日本語辞書（JMdict / 常用語カタログ）から、180度回転時に別の有意義な単語（または同語）となるペアを逆引きプレフィックス木・バックトラッキングDFS探索によって高速抽出する。",
        "target_classes": ["AmbigramFinder"]
    }
]

def extract_code_info(file_path: Path, target_funcs=None, target_classes=None):
    if not file_path.exists():
        return []
    
    with open(file_path, "r", encoding="utf-8") as f:
        source = f.read()
        
    tree = ast.parse(source)
    lines = source.splitlines()
    extracted = []
    
    for node in tree.body:
        if isinstance(node, ast.FunctionDef):
            if target_funcs and node.name in target_funcs:
                doc = ast.get_docstring(node) or ""
                # コードスニペット (最大30行)
                start_l = node.lineno - 1
                end_l = min(start_l + 35, getattr(node, "end_lineno", start_l + 35))
                code_snippet = "\n".join(lines[start_l:end_l])
                extracted.append({
                    "type": "function",
                    "name": node.name,
                    "docstring": doc.strip(),
                    "snippet": code_snippet,
                    "line": node.lineno
                })
        elif isinstance(node, ast.ClassDef):
            if target_classes and node.name in target_classes:
                doc = ast.get_docstring(node) or ""
                start_l = node.lineno - 1
                end_l = min(start_l + 40, getattr(node, "end_lineno", start_l + 40))
                code_snippet = "\n".join(lines[start_l:end_l])
                extracted.append({
                    "type": "class",
                    "name": node.name,
                    "docstring": doc.strip(),
                    "snippet": code_snippet,
                    "line": node.lineno
                })
                
    return extracted

def build_code_content():
    modules_output = []
    
    for meta in MODULES_METADATA:
        fpath = ROOT_DIR / meta["file"]
        symbols = extract_code_info(
            fpath, 
            target_funcs=meta.get("target_functions"),
            target_classes=meta.get("target_classes")
        )
        
        modules_output.append({
            "id": meta["id"],
            "title": meta["title"],
            "file": meta["file"],
            "related_paper": meta["related_paper"],
            "why": meta["why"],
            "symbols": symbols
        })
        
    output_js = f"""// 自動生成されたアプリ実装コード読解コンテンツ (sync_code.pyにより生成)
// ベースコードが変更されても、sync_code.pyを実行すれば自動で最新シンボル・Docstringが同期される
window.APP_CODE_MODULES = {json.dumps(modules_output, ensure_ascii=False, indent=2)};
"""
    
    out_file = READER_DIR / "code_content.js"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(output_js)
        
    print(f"[OK] {out_file} successfully generated with {len(modules_output)} modules!")

if __name__ == "__main__":
    build_code_content()
