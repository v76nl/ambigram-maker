from abc import ABC, abstractmethod
from typing import Any

class BaseAmbigramGenerator(ABC):
    @abstractmethod
    def generate(self, word: str, **params) -> dict[str, Any]:
        """
        単語を受け取り、180度回転自己対称アンビグラムを生成する
        
        Returns:
            dict: {
                "engine": str,           # エンジン名
                "type": "svg" | "png",   # 出力形式
                "data": str,             # SVG文字列 または base64エンコード画像
                "details": dict,         # 付加情報
            }
        """
        pass
