import asyncio
import json
import logging
import sys
import time
from typing import Any, Optional
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# コンソールロギング設定 (時刻・プレフィックス付き)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ambigram")

from search.finder import AmbigramFinder
from generators.vector_engine import VectorAmbigramEngine
from generators.bitmap_engine import BitmapAmbigramEngine
from generators.gemini_engine import GeminiAmbigramEngine
from generators.morphology_engine import MorphologyAmbigramEngine
from generators.skeleton_engine import SkeletonAmbigramEngine
from generators.font_manager import font_manager
from evaluation.recognizer import char_recognizer

app = FastAPI(
    title="Ambigram Maker API",
    description="ひらがな自己対称型180度回転アンビグラム自動生成API",
    version="1.0.0",
)

# CORS設定 (Viteローカルサーバー等からのアクセス許可)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 各種エンジンのシングルトン初期化
finder = AmbigramFinder()
vector_engine = VectorAmbigramEngine()
bitmap_engine = BitmapAmbigramEngine()
gemini_engine = GeminiAmbigramEngine()
morphology_engine = MorphologyAmbigramEngine()
skeleton_engine = SkeletonAmbigramEngine()

class EvaluateRequest(BaseModel):
    word: str

class EvalOffsetsRequest(BaseModel):
    word: str
    font: Optional[str] = "zen_maru"
    offsets: list[list[int]]

class ReadabilityRequest(BaseModel):
    word: str
    font: Optional[str] = "zen_maru"
    custom_offsets: Optional[list[list[int]]] = None
    engine: Optional[str] = "skeleton"

class GenerateRequest(BaseModel):
    word: str
    engine: str = "all"  # "vector", "morphology", "skeleton", "bitmap", "gemini", "all"
    font: Optional[str] = "auto"  # "auto", "zen_maru", "dela", "mplus", "klee", "shippori"
    custom_offsets: Optional[list[list[int]]] = None  # 手動XYシフトオフセット [[dx, dy], ...]
    # ベクター用パラメータ
    blend_ratio: Optional[float] = 0.5
    stroke_width: Optional[float] = 0.0
    highlight_mode: Optional[bool] = False
    # 手法A (論理積モルフォロジー) 用パラメータ
    dilation_size: Optional[int] = 11
    # 手法B (スケルトン平均化) 用パラメータ
    stroke_thickness: Optional[int] = 15
    brush_style: Optional[str] = "calligraphic"  # "calligraphic" (毛筆楕円ブラシ) または "uniform" (均一円形)
    stroke_modulation: Optional[bool] = True  # 井上・高橋(2020)§5に基づくストローク太さ変調
    # 手法A/B 共通パラメータ
    diff_blend: Optional[float] = 0.35
    pre_bold: Optional[int] = 4  # 事前太らせ量 (近接縦棒の結合力強化)
    enable_snap: Optional[bool] = True  # 近接ストローク吸引・局所非剛体変形 (Issue #1, #2)
    # ビットマップ用パラメータ
    blend_weight: Optional[float] = 0.65
    smoothness: Optional[int] = 7
    threshold_val: Optional[int] = 110
    # Gemini API用パラメータ
    api_key: Optional[str] = None
    style_prompt: Optional[str] = "minimalist black calligraphy on pure white background, sharp vector aesthetic"

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Ambigram Maker API is running"}

@app.get("/api/fonts")
def get_available_fonts():
    """利用可能なフォント一覧とメタデータを返却"""
    fonts = font_manager.get_available_fonts()
    logger.info(f"フォント一覧取得: {len(fonts)}件の日本語フォントを提供")
    return {"fonts": fonts}

@app.get("/api/words/fonts-eval")
def evaluate_word_fonts(word: str = Query(...)):
    """指定単語に対する各フォントの幾何スコアと最適フォントを評価"""
    if not word:
        raise HTTPException(status_code=400, detail="単語を指定してください")
    t0 = time.time()
    logger.info(f"フォント評価開始: 単語='{word}'")
    eval_res = finder.evaluate_word(word)
    target_word = eval_res.get("target_text") or word
    font_eval = font_manager.evaluate_word_fonts(target_word)
    elapsed = time.time() - t0
    logger.info(
        f"フォント評価完了: 単語='{word}' (対象表記='{target_word}') -> "
        f"最適フォント='{font_eval['best_font_name']}' "
        f"(所要時間: {elapsed:.3f}s)"
    )
    return {
        "word": word,
        "target_text": target_word,
        "reading": eval_res.get("reading", word),
        "best_font_id": font_eval["best_font_id"],
        "best_font_name": font_eval["best_font_name"],
        "font_scores": font_eval["font_scores"],
    }

@app.post("/api/evaluate-readability")
def evaluate_readability(req: ReadabilityRequest):
    """
    魏・山口 (2023) および 井上・高橋 (2020) に基づく客観的文字認識・可読性評価
    各文字スロットについて正反両方向の認識確率と調和平均スコアを算出
    """
    word = req.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="単語を指定してください")
    
    eval_res = finder.evaluate_word(word)
    target_word = eval_res.get("target_text") or word
    n = len(target_word)
    if n == 0:
        return {"word": word, "overall_readability": 0.0, "slots": []}

    half_len = (n + 1) // 2
    font_id = req.font or "zen_maru"
    font_path = font_manager.get_font_path(font_id)
    offsets = req.custom_offsets or [[0, 0]] * half_len

    slot_evaluations = []
    harmonic_scores = []

    for i in range(half_len):
        c1 = target_word[i]
        c2 = target_word[n - 1 - i]
        shift = tuple(offsets[i]) if i < len(offsets) else (0, 0)

        # 骨格平均化スロット画像を生成して認識器に入力
        slot_img = skeleton_engine.generate_slot(
            c1, c2, size=256, font_path=font_path, shift=shift,
            brush_style="calligraphic", stroke_modulation=True, enable_snap=True
        )
        eval_slot = char_recognizer.evaluate_ambigram_slot(slot_img, c1, c2)
        eval_slot["slot_index"] = i
        slot_evaluations.append(eval_slot)
        harmonic_scores.append(eval_slot["harmonic_readability"])

    overall_readability = float(np.mean(harmonic_scores)) if harmonic_scores else 0.0

    return {
        "word": word,
        "target_text": target_word,
        "font_id": font_id,
        "overall_readability": round(overall_readability, 4),
        "slots": slot_evaluations,
    }

@app.get("/api/words/stream")
async def stream_words(
    min_length: int = Query(2, ge=1, le=10),
    max_length: int = Query(6, ge=1, le=10),
    common_only: bool = Query(True),
    min_score: float = Query(0.75, ge=0.0, le=1.0),
    limit: int = Query(100, ge=1, le=500),
    query: str = Query(""),
    include_kanji: bool = Query(True),
    include_katakana: bool = Query(True),
    include_hiragana: bool = Query(True),
):
    """
    自己対称アンビグラム適性単語をリアルタイムにSSEストリーミング配信
    探索完了を待たずに、見つかった単語から即座にクライアントへ1件ずつプッシュ配信する。
    """
    t0 = time.time()
    logger.info(
        f"単語ストリーミング開始: query='{query}', 長さ={min_length}~{max_length}, 最小スコア={min_score}, 件数上限={limit}, "
        f"常用語={common_only}, 漢字={include_kanji}, カタカナ={include_katakana}, ひらがな={include_hiragana}"
    )

    async def event_generator():
        count = 0
        try:
            for word_item in finder.stream_search(
                min_length=min_length,
                max_length=max_length,
                common_only=common_only,
                min_score=min_score,
                limit=limit,
                query=query,
                include_kanji=include_kanji,
                include_katakana=include_katakana,
                include_hiragana=include_hiragana,
            ):
                count += 1
                yield f"data: {json.dumps(word_item, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.001)  # イベントループに制御を戻す
        finally:
            elapsed = time.time() - t0
            logger.info(f"単語ストリーミング終了: 送信数={count}件 (所要時間: {elapsed:.3f}s)")
            yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@app.get("/api/words/search")
def search_words(
    min_length: int = Query(2, ge=1, le=10),
    max_length: int = Query(6, ge=1, le=10),
    common_only: bool = Query(True),
    min_score: float = Query(0.75, ge=0.0, le=1.0),
    limit: int = Query(100, ge=1, le=500),
    query: str = Query(""),
    include_kanji: bool = Query(True),
    include_katakana: bool = Query(True),
    include_hiragana: bool = Query(True),
):
    """自己対称アンビグラム適性単語を検索・ランキング"""
    t0 = time.time()
    logger.info(
        f"単語検索開始: query='{query}', 長さ={min_length}~{max_length}, "
        f"常用語={common_only}, 漢字={include_kanji}, カタカナ={include_katakana}, ひらがな={include_hiragana}"
    )
    results = finder.search(
        min_length=min_length,
        max_length=max_length,
        common_only=common_only,
        min_score=min_score,
        limit=limit,
        query=query,
        include_kanji=include_kanji,
        include_katakana=include_katakana,
        include_hiragana=include_hiragana,
    )
    elapsed = time.time() - t0
    top_word = results[0]["target_text"] if results else "該当なし"
    logger.info(
        f"単語検索完了: {len(results)}件マッチ (トップ: '{top_word}', 所要時間: {elapsed:.3f}s)"
    )
    return {"count": len(results), "words": results}

@app.post("/api/words/evaluate")
def evaluate_word(req: EvaluateRequest):
    """指定された単語の適性を本来の表記で評価"""
    if not req.word:
        raise HTTPException(status_code=400, detail="単語を指定してください")
    logger.info(f"単語評価リクエスト: '{req.word}'")
    result = finder.evaluate_word(req.word)
    logger.info(f"単語評価結果: '{req.word}' (スコア: {result.get('score', 0):.2f})")
    return result

@app.post("/api/words/eval-offsets")
def eval_offsets(req: EvalOffsetsRequest):
    """指定された単語・フォント・手動XYシフトにおける一致率スコアを即座に再計算"""
    if not req.word:
        raise HTTPException(status_code=400, detail="単語を指定してください")
    eval_res = finder.evaluate_word(req.word)
    target_word = eval_res.get("target_text") or req.word
    custom_offsets = [tuple(o) for o in req.offsets]
    res = font_manager.evaluate_word_with_custom_offsets(
        target_word, req.font or "zen_maru", custom_offsets
    )
    return {
        "word": req.word,
        "target_text": target_word,
        "font_id": res["font_id"],
        "score": res["score"],
        "geometric_mean": res["geometric_mean"],
        "min_pair_score": res["min_pair_score"],
        "pair_scores": res["pair_scores"],
        "offsets": res["offsets"],
    }

@app.post("/api/generate")
def generate_ambigram(req: GenerateRequest):
    """指定した単語のアンビグラムを本来の表記（漢字・カタカナ・ひらがな）で生成"""
    if not req.word:
        raise HTTPException(status_code=400, detail="単語を指定してください")

    t0 = time.time()
    eval_res = finder.evaluate_word(req.word)
    # 本来の表記（漢字やカタカナ）そのものをアンビグラムの対象とする
    target_word = eval_res.get("target_text") or req.word
    font_id = req.font or "auto"

    logger.info(
        f"アンビグラム生成開始: 単語='{req.word}' (対象表記='{target_word}', 手法='{req.engine}', フォント='{font_id}', シフト={req.custom_offsets})"
    )

    results: dict[str, Any] = {}

    if req.engine in ("vector", "all"):
        te = time.time()
        logger.info(f"  [原案: ベクター合成] 実行中 (比率={req.blend_ratio}, ハイライト={req.highlight_mode})...")
        results["vector"] = vector_engine.generate(
            target_word,
            blend_ratio=req.blend_ratio or 0.5,
            stroke_width=req.stroke_width or 0.0,
            highlight_mode=req.highlight_mode or False,
            font_id=font_id,
        )
        logger.info(f"  [原案: ベクター合成] 完了 ({time.time() - te:.3f}s)")

    if req.engine in ("morphology", "all"):
        te = time.time()
        logger.info(
            f"  [手法A: 論理積＋膨張] 実行中 (膨張={req.dilation_size}px, 平滑={req.smoothness}px, "
            f"異文字保持={req.diff_blend}, 事前太らせ={req.pre_bold}px, シフト={req.custom_offsets})..."
        )
        results["morphology"] = morphology_engine.generate(
            target_word,
            dilation_size=req.dilation_size or 11,
            smoothness=req.smoothness or 7,
            diff_blend=req.diff_blend if req.diff_blend is not None else 0.35,
            pre_bold=req.pre_bold if req.pre_bold is not None else 4,
            enable_snap=req.enable_snap if req.enable_snap is not None else True,
            font_id=font_id,
            custom_offsets=req.custom_offsets,
        )
        logger.info(f"  [手法A: 論理積＋膨張] 完了 ({time.time() - te:.3f}s)")

    if req.engine in ("skeleton", "all"):
        te = time.time()
        logger.info(
            f"  [手法B: 骨格平均化] 実行中 (線幅={req.stroke_thickness}px, "
            f"異文字保持={req.diff_blend}, 事前太らせ={req.pre_bold}px, シフト={req.custom_offsets})..."
        )
        results["skeleton"] = skeleton_engine.generate(
            target_word,
            stroke_thickness=req.stroke_thickness or 15,
            diff_blend=req.diff_blend if req.diff_blend is not None else 0.35,
            pre_bold=req.pre_bold if req.pre_bold is not None else 4,
            enable_snap=req.enable_snap if req.enable_snap is not None else True,
            font_id=font_id,
            brush_style=req.brush_style or "calligraphic",
            stroke_modulation=req.stroke_modulation if req.stroke_modulation is not None else True,
            custom_offsets=req.custom_offsets,
        )
        logger.info(f"  [手法B: 骨格平均化] 完了 ({time.time() - te:.3f}s)")

    if req.engine in ("bitmap", "all"):
        te = time.time()
        logger.info(f"  [手法2: ビットマップ] 実行中 (重み={req.blend_weight}, 閾値={req.threshold_val})...")
        results["bitmap"] = bitmap_engine.generate(
            target_word,
            blend_weight=req.blend_weight or 0.65,
            smoothness=req.smoothness or 7,
            threshold_val=req.threshold_val or 110,
        )
        logger.info(f"  [手法2: ビットマップ] 完了 ({time.time() - te:.3f}s)")

    if req.engine in ("gemini", "all"):
        te = time.time()
        logger.info(f"  [手法3: Gemini AI] 実行中...")
        results["gemini"] = gemini_engine.generate(
            target_word,
            api_key=req.api_key,
            style_prompt=req.style_prompt or "minimalist black calligraphy on pure white background, sharp vector aesthetic",
        )
        logger.info(f"  [手法3: Gemini AI] 完了 ({time.time() - te:.3f}s)")

    total_elapsed = time.time() - t0
    logger.info(
        f"アンビグラム生成完了: 単語='{req.word}' 生成手法数={len(results)} (総所要時間: {total_elapsed:.3f}s)"
    )

    return {
        "word": req.word,
        "resolved_reading": target_word,
        "selected_font": font_id,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
