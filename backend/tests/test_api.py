from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_api_fonts():
    """GET /api/fonts で全9フォントが取得できるか検証"""
    res = client.get("/api/fonts")
    assert res.status_code == 200
    data = res.json()
    assert "fonts" in data
    assert len(data["fonts"]) == 9
    font_ids = [f["id"] for f in data["fonts"]]
    assert "marumonica" in font_ids
    assert "highway_gothic" not in font_ids

def test_api_search():
    """GET /api/words/search で単語検索およびランキング結果が取得できるか検証"""
    res = client.get("/api/words/search", params={"query": "日", "limit": 5})
    assert res.status_code == 200
    data = res.json()
    assert "words" in data
    assert len(data["words"]) > 0
    first = data["words"][0]
    assert "word" in first
    assert "score" in first

def test_api_generate():
    """POST /api/generate で全手法のアンビグラム画像が生成できるか検証"""
    payload = {
        "word": "日の目",
        "engine": "all",
        "font": "zen_maru",
    }
    res = client.post("/api/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    results = data["results"]
    assert isinstance(results, dict)
    assert "skeleton" in results
    assert "morphology" in results
    assert "vector" in results
    assert "bitmap" in results

def test_api_evaluate_readability():
    """POST /api/evaluate-readability で魏・山口(2023)に基づく客観的可読性・順位が取得できるか検証"""
    payload = {
        "word": "日の目",
        "font": "zen_maru",
        "custom_offsets": [[0, 0], [0, 0]],
    }
    res = client.post("/api/evaluate-readability", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "overall_readability" in data
    assert "slots" in data
    assert "model_type" in data
    assert len(data["slots"]) > 0

    first_slot = data["slots"][0]
    assert "char1" in first_slot
    assert "char2" in first_slot
    assert "prob1" in first_slot
    assert "rank1" in first_slot
    assert "is_supported1" in first_slot
    assert "status" in first_slot
    assert first_slot["status"] in ("perfect", "partial", "poor", "unsupported")
