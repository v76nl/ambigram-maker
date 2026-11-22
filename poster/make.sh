#!/usr/bin/env bash
# ポスターの pptx を組み立て、PowerPoint で PDF に書き出し、画像を元の解像度に戻して検査する
# 実行: bash poster/make.sh [プレビュー画像の出力先]
set -euo pipefail
cd "$(dirname "$0")/.."

name="poster/build/HCD2026winter_C04_ambigram_poster"
preview="${1:-$name.preview.png}"

uv run --project backend --with python-pptx --with qrcode --with svg.path python poster/build_poster.py
uv run --with pywin32 python -I poster/export_pdf.py "$name.pptx" "$name.powerpoint.pdf"
uv run --with pymupdf --with python-pptx python -I poster/finalize_pdf.py \
    "$name.pptx" "$name.powerpoint.pdf" "$name.pdf"
uv run --with pymupdf python -I poster/check_pdf.py "$name.pdf" "$preview"
