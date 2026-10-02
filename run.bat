@echo off
chcp 65001 > nul
title Ambigram Maker - Fullstack Dev Server
echo ========================================================
echo   ひらがな自己対称180度回転アンビグラム自動生成システム
echo   フロントエンド ^& バックエンド 一括起動
echo ========================================================
echo.

if exist "node_modules\.bin\concurrently.cmd" (
    call pnpm.cmd dev
) else if exist "backend\.venv\Scripts\python.exe" (
    call backend\.venv\Scripts\python.exe run.py
) else (
    python run.py
)

pause
