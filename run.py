"""
フロントエンド (Vite) とバックエンド (FastAPI) を一括起動するクロスプラットフォームスクリプト
使用法: python run.py
"""
import os
import signal
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("=" * 60)
    print("   ひらがな自己対称180度回転アンビグラム自動生成システム")
    print("   フロントエンド & バックエンド 一括起動スクリプト")
    print("=" * 60)
    print(f"[*] 作業ディレクトリ: {ROOT_DIR}")

    # バックエンド起動コマンドの決定
    venv_uvicorn_win = BACKEND_DIR / ".venv" / "Scripts" / "uvicorn.exe"
    venv_uvicorn_unix = BACKEND_DIR / ".venv" / "bin" / "uvicorn"

    if venv_uvicorn_win.exists():
        backend_cmd = [str(venv_uvicorn_win), "app:app", "--port", "8000", "--reload"]
    elif venv_uvicorn_unix.exists():
        backend_cmd = [str(venv_uvicorn_unix), "app:app", "--port", "8000", "--reload"]
    else:
        backend_cmd = ["uv", "run", "--project", "backend", "uvicorn", "app:app", "--app-dir", "backend", "--port", "8000", "--reload"]

    # フロントエンド起動コマンド (pnpm.cmd または pnpm)
    pnpm_cmd = "pnpm.cmd" if sys.platform == "win32" else "pnpm"
    frontend_cmd = [pnpm_cmd, "dev"]

    print("[+] バックエンド起動中 (ポート 8000)...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
    )

    print("[+] フロントエンド起動中 (ポート 5173)...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        shell=(sys.platform == "win32"),
    )

    print("\n[!] 終了するには Ctrl+C を押してください。\n")

    def cleanup():
        print("\n[*] サーバーを停止しています...")
        for proc, name in [(frontend_proc, "Frontend"), (backend_proc, "Backend")]:
            try:
                if sys.platform == "win32":
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
            except Exception:
                pass
        sys.exit(0)

    def signal_handler(sig, frame):
        cleanup()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
