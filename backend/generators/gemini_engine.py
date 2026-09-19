import base64
import os
from typing import Any
from .base import BaseAmbigramGenerator

class GeminiAmbigramEngine(BaseAmbigramGenerator):
    """
    手法3: Gemini API 画像生成 Engine
    Gemini API (Imagen 3 / 画像生成モデル) を用いて、
    プロンプト誘導によるタイポグラフィ・アンビグラムアート画像を生成する
    """
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")

    def is_available(self) -> bool:
        """APIキーが設定されているか確認"""
        return bool(self.api_key)

    def generate(
        self,
        word: str,
        api_key: str | None = None,
        style_prompt: str = "minimalist black calligraphy on pure white background, sharp vector aesthetic",
        **params
    ) -> dict[str, Any]:
        effective_key = api_key or self.api_key or os.environ.get("GEMINI_API_KEY", "")
        
        if not effective_key:
            return {
                "engine": "gemini",
                "type": "error",
                "data": "",
                "status": "api_key_required",
                "message": "Gemini APIキーが設定されていません。UIの設定または環境変数 GEMINI_API_KEY にキーを設定してください。",
                "details": {"word": word}
            }

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=effective_key)
            
            # アンビグラム生成用の詳細プロンプト
            prompt = (
                f"A Japanese typography logo that reads '{word}' in Hiragana characters. "
                f"This is a 180-degree rotational symmetry ambigram: when the image is turned upside down, "
                f"it reads the exact same Japanese word '{word}'. "
                f"Design style: {style_prompt}. "
                f"High contrast, centered typography, clear legible strokes, no extraneous text or watermarks."
            )

            result = client.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    output_mime_type="image/png",
                    aspect_ratio="1:1" if len(word) <= 2 else "16:9",
                ),
            )

            if result.generated_images:
                img_bytes = result.generated_images[0].image.image_bytes
                b64_str = base64.b64encode(img_bytes).decode("utf-8")
                return {
                    "engine": "gemini",
                    "type": "png",
                    "data": f"data:image/png;base64,{b64_str}",
                    "status": "success",
                    "details": {
                        "word": word,
                        "model": "imagen-3.0-generate-002",
                        "prompt": prompt,
                    }
                }
            else:
                return {
                    "engine": "gemini",
                    "type": "error",
                    "data": "",
                    "status": "generation_failed",
                    "message": "画像の生成に失敗しました（空のレスポンス）。",
                    "details": {"word": word}
                }

        except Exception as e:
            return {
                "engine": "gemini",
                "type": "error",
                "data": "",
                "status": "error",
                "message": f"Gemini API呼び出し中にエラーが発生しました: {str(e)}",
                "details": {"word": word}
            }
