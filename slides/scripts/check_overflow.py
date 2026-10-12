#!/usr/bin/env python3
"""
スライド縦方向はみ出し・溢れ自動検知スクリプト (scripts/check_overflow.py)

Marpによって生成された slides.pdf を解析し、全スライドのテキスト領域が
フッター（ページ番号）領域やスライド端を突破（はみ出し）していないかを自動検知・検証します。
"""

import sys
import os
import argparse
from pathlib import Path

# WindowsコンソールでのUnicodeEncodeError(cp932)防止
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        print("エラー: pymupdf がインストールされていません。'pip install pymupdf' を実行してください。", file=sys.stderr)
        sys.exit(2)

def check_slides(pdf_path: str, safe_bottom: float = 485.0, warning_bottom: float = 445.0, render_dir: str = None):
    if not os.path.exists(pdf_path):
        print(f"エラー: PDFファイルが見つかりません: {pdf_path}", file=sys.stderr)
        return 1

    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    page_height = doc[0].rect.height if total_pages > 0 else 540.0
    page_width = doc[0].rect.width if total_pages > 0 else 960.0

    print("\n" + "=" * 70)
    print(f"  スライド縦方向オーバーフロー自動検知スキャン: {os.path.basename(pdf_path)}")
    print(f"  全スライド数: {total_pages} ページ | スライド寸法: {page_width:.0f}x{page_height:.0f} pt")
    print(f"  安全下限閾値: {safe_bottom:.1f} pt (フッター安全マージン: {page_height - safe_bottom:.1f} pt)")
    print("=" * 70 + "\n")

    overflow_count = 0
    tight_count = 0
    results = []

    for idx, page in enumerate(doc):
        page_num = idx + 1
        blocks = page.get_text("blocks")

        content_blocks = []
        footer_blocks = []
        h1_title = ""

        for b in blocks:
            # b: (x0, y0, x1, y1, text, block_no, block_type)
            x0, y0, x1, y1, text, b_no, b_type = b
            clean_text = text.strip()
            if not clean_text:
                continue

            # フッター（右下のページ番号）の判定: x0 > 800 かつ y0 > 480 かつ 数字のみ
            if x0 > 800 and y0 > 480 and clean_text.isdigit():
                footer_blocks.append(b)
            else:
                content_blocks.append(b)
                if y0 < 120 and not h1_title:
                    h1_title = clean_text.splitlines()[0][:32]

        if not content_blocks:
            results.append((page_num, h1_title or "(空白ページ)", 0.0, page_height, "EMPTY"))
            continue

        max_y1 = max(b[3] for b in content_blocks)
        headroom = page_height - max_y1

        if max_y1 > safe_bottom:
            status = "OVERFLOW"
            overflow_count += 1
        elif max_y1 > warning_bottom:
            status = "TIGHT"
            tight_count += 1
        else:
            status = "OK"

        results.append((page_num, h1_title or "(タイトルなし)", max_y1, headroom, status))

        # 画像出力オプション（オーバーフロー時または全ページ）
        if render_dir and (status == "OVERFLOW" or render_dir == "all"):
            os.makedirs(render_dir, exist_ok=True)
            pix = page.get_pixmap(dpi=150)
            out_img = os.path.join(render_dir, f"slide_{page_num:02d}_{status.lower()}.png")
            pix.save(out_img)

    # テーブル出力
    print(f"{'Page':<6} | {'Status':<10} | {'Bottom Y':<10} | {'Headroom':<10} | {'Title'}")
    print("-" * 70)
    for page_num, title, bottom_y, headroom, status in results:
        badge = f"[{status}]"
        print(f"P{page_num:02d}    | {badge:<10} | {bottom_y:>7.1f} pt | {headroom:>7.1f} pt | {title}")

    print("\n" + "-" * 70)
    print(f" 検証結果サマリー: 全 {total_pages} スライド")
    print(f"  - OVERFLOW (フッター重複・下端はみ出し) : {overflow_count} 件")
    print(f"  - TIGHT    (行間・余白がやや詰まり気味) : {tight_count} 件")
    print(f"  - OK       (十分な余白あり・快適)       : {total_pages - overflow_count - tight_count} 件")
    print("-" * 70 + "\n")

    if overflow_count > 0:
        print(f"❌ 警告: {overflow_count} 件のスライドでオーバーフローが検知されました。", file=sys.stderr)
        return 1
    else:
        print("✅ 合格: 全スライドがセーフティゾーン内に綺麗に収まっています。")
        return 0

def main():
    parser = argparse.ArgumentParser(description="Marpスライドの自動縦溢れ・はみ出し検知スクリプト")
    parser.add_argument("pdf", nargs="?", default="slides.pdf", help="検査対象のPDFパス (デフォルト: slides.pdf)")
    parser.add_argument("--safe-bottom", type=float, default=485.0, help="許容される最大Y座標 (デフォルト: 485.0pt)")
    parser.add_argument("--warning-bottom", type=float, default=445.0, help="注意を促す最大Y座標 (デフォルト: 445.0pt)")
    parser.add_argument("--render-dir", type=str, default=None, help="画像を保存するディレクトリ")

    args = parser.parse_args()
    code = check_slides(args.pdf, safe_bottom=args.safe_bottom, warning_bottom=args.warning_bottom, render_dir=args.render_dir)
    sys.exit(code)

if __name__ == "__main__":
    main()
