import threading
import logging

logger = logging.getLogger("ambigram")

class GenerationManager:
    """
    アンビグラム生成および可読性評価の実行状態を管理し、
    新しい単語選択時に先行処理を即座に中断（最優先割り込み）させるマネージャー。
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._gen_cancel_event: threading.Event | None = None
        self._readability_cancel_event: threading.Event | None = None

    def start_generation(self) -> threading.Event:
        """新しい生成処理を開始し、既存の進行中処理へ中断シグナルを発行"""
        with self._lock:
            if self._gen_cancel_event is not None and not self._gen_cancel_event.is_set():
                logger.info("⚡ [割り込み] 進行中のアンビグラム生成に中断シグナルを送信しました")
                self._gen_cancel_event.set()
            event = threading.Event()
            self._gen_cancel_event = event
            return event

    def start_readability(self) -> threading.Event:
        """新しい可読性評価を開始し、既存の進行中評価へ中断シグナルを発行"""
        with self._lock:
            if self._readability_cancel_event is not None and not self._readability_cancel_event.is_set():
                logger.info("⚡ [割り込み] 進行中の可読性評価に中断シグナルを送信しました")
                self._readability_cancel_event.set()
            event = threading.Event()
            self._readability_cancel_event = event
            return event

    def cancel_all(self):
        """すべての進行中処理を即座に中断"""
        with self._lock:
            if self._gen_cancel_event is not None:
                self._gen_cancel_event.set()
            if self._readability_cancel_event is not None:
                self._readability_cancel_event.set()
            logger.info("⚡ [割り込み] 全処理の即時中断シグナルを発行しました")

gen_manager = GenerationManager()
