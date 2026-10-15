@echo off
chcp 65001 > nul
title Ambigram Maker - Unified Test Suite
echo ========================================================
echo   日本語アンビグラム制作支援システム 一括自動テスト
echo   バックエンド (pytest) ^& フロントエンド (Vitest)
echo ========================================================
echo.

if exist "backend\.venv\Scripts\python.exe" (
    call backend\.venv\Scripts\python.exe test.py
) else (
    python test.py
)

pause
