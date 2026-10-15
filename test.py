"""
バックエンド (pytest) とフロントエンド (Vitest) の全テストを一括実行するスクリプト
使用法: python test.py または pnpm test
"""
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def print_header(title: str):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65 + "\n")

def run_backend_tests() -> bool:
    print_header("[1/2] バックエンド自動テスト (pytest - 31 tests)")
    cmd = ["uv", "run", "--directory", str(BACKEND_DIR), "pytest", "-v"]
    try:
        res = subprocess.run(cmd, cwd=str(BACKEND_DIR))
        return res.returncode == 0
    except Exception as e:
        print(f"[!] バックエンドテスト実行エラー: {e}")
        return False

def run_frontend_tests() -> bool:
    print_header("[2/2] フロントエンド自動テスト (Vitest - 6 tests)")
    pnpm_cmd = "pnpm.cmd" if sys.platform == "win32" else "pnpm"
    cmd = [pnpm_cmd, "--dir", str(FRONTEND_DIR), "test"]
    try:
        res = subprocess.run(cmd, cwd=str(ROOT_DIR), shell=(sys.platform == "win32"))
        return res.returncode == 0
    except Exception as e:
        print(f"[!] フロントエンドテスト実行エラー: {e}")
        return False

def main():
    t0 = time.time()
    print_header("日本語アンビグラム制作支援システム 一括自動テストスイート")

    backend_ok = run_backend_tests()
    frontend_ok = run_frontend_tests()

    elapsed = time.time() - t0

    print_header(f"テスト実行サマリー (所要時間: {elapsed:.2f}s)")
    print(f"  バックエンド (pytest):     {'[PASS] 成功' if backend_ok else '[FAIL] 失敗'}")
    print(f"  フロントエンド (Vitest):   {'[PASS] 成功' if frontend_ok else '[FAIL] 失敗'}")
    print("=" * 65 + "\n")

    if backend_ok and frontend_ok:
        print("[OK] 全自動テストが正常に通過しました！\n")
        sys.exit(0)
    else:
        print("[FAIL] 一部のテストで失敗が発生しました。\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
