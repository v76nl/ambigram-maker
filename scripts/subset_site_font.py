"""解説サイトの本文の書体 (Noto Sans JP) を、サイトで使う文字だけに絞った1つの woff2 にする。

サイトの文章 (site/src/pages/index.astro) と書き出したデータ (site/src/data/site-data.json) に
出てくる文字と、ASCII の印字可能文字を残す。太さの軸は、サイトで使う 400〜700 の範囲に絞る。
文章を書き換えたら、この書き出しをやり直す。--check を付けると、足りない文字があるかだけを調べる。

実行: uv run --with fonttools --with brotli python scripts/subset_site_font.py <NotoSansJP の可変フォント (.ttf)> [--check]
"""

from __future__ import annotations

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [ROOT / "site" / "src" / "pages" / "index.astro", ROOT / "site" / "src" / "data" / "site-data.json"]
OUT = ROOT / "site" / "public" / "fonts" / "noto-sans-jp-subset.woff2"
WEIGHT_RANGE = (400, 700)


def site_text() -> set[str]:
    chars = {chr(c) for c in range(0x20, 0x7F)}
    for path in SOURCES:
        chars |= set(path.read_text(encoding="utf-8"))
    return {c for c in chars if c.isprintable() and c != "﻿"}


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    text = "".join(sorted(site_text()))

    if "--check" in sys.argv:
        cmap = TTFont(OUT)["cmap"].getBestCmap()
        missing = sorted(c for c in text if ord(c) not in cmap and not c.isspace())
        if missing:
            raise SystemExit(f"書体にない文字 {len(missing)} 字: {''.join(missing)}\n書き出しをやり直してください")
        print(f"ok: {len(text)} 字すべて収録済み")
        return

    font = TTFont(args[0], lazy=False)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = [*options.layout_features, "palt"]  # 本文は font-feature-settings: "palt" で詰める
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font = instancer.instantiateVariableFont(font, {"wght": WEIGHT_RANGE})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(OUT)
    print(f"{OUT.relative_to(ROOT)}: {len(text)} 字, {OUT.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
