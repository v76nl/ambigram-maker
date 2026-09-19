from pathlib import Path
from typing import Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from search.finder import AmbigramFinder
from generators.vector_engine import VectorAmbigramEngine
from generators.bitmap_engine import BitmapAmbigramEngine
from generators.gemini_engine import GeminiAmbigramEngine

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

class EvaluateRequest(BaseModel):
    word: str

class GenerateRequest(BaseModel):
    word: str
    engine: str = "all"  # "vector", "bitmap", "gemini", "all"
    # ベクター用パラメータ
    blend_ratio: Optional[float] = 0.5
    stroke_width: Optional[float] = 0.0
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

@app.get("/api/words/search")
def search_words(
    min_length: int = Query(2, ge=1, le=10),
    max_length: int = Query(6, ge=1, le=10),
    common_only: bool = Query(True),
    min_score: float = Query(0.5, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=200),
    query: str = Query(""),
):
    """自己対称アンビグラム適性単語を検索・ランキング"""
    results = finder.search(
        min_length=min_length,
        max_length=max_length,
        common_only=common_only,
        min_score=min_score,
        limit=limit,
        query=query,
    )
    return {"count": len(results), "words": results}

@app.post("/api/words/evaluate")
def evaluate_word(req: EvaluateRequest):
    """指定された任意のひらがな単語の適性を評価"""
    if not req.word:
        raise HTTPException(status_code=400, detail="単語を指定してください")
    result = finder.evaluate_word(req.word)
    return result

@app.post("/api/generate")
def generate_ambigram(req: GenerateRequest):
    """指定した単語のアンビグラムを生成"""
    if not req.word:
        raise HTTPException(status_code=400, detail="単語を指定してください")

    results: dict[str, Any] = {}

    if req.engine in ("vector", "all"):
        results["vector"] = vector_engine.generate(
            req.word,
            blend_ratio=req.blend_ratio or 0.5,
            stroke_width=req.stroke_width or 0.0,
        )

    if req.engine in ("bitmap", "all"):
        results["bitmap"] = bitmap_engine.generate(
            req.word,
            blend_weight=req.blend_weight or 0.65,
            smoothness=req.smoothness or 7,
            threshold_val=req.threshold_val or 110,
        )

    if req.engine in ("gemini", "all"):
        results["gemini"] = gemini_engine.generate(
            req.word,
            api_key=req.api_key,
            style_prompt=req.style_prompt or "minimalist black calligraphy on pure white background, sharp vector aesthetic",
        )

    return {
        "word": req.word,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
