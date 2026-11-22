"""PowerPoint で pptx を印刷品質の PDF に書き出す (Windows + PowerPoint が必要)。

実行: uv run --with pywin32 python poster/export_pdf.py <入力pptx> <出力pdf>
"""

from __future__ import annotations

import sys
from pathlib import Path

import win32com.client

PP_FIXED_FORMAT_TYPE_PDF = 2
PP_FIXED_FORMAT_INTENT_PRINT = 2
MSO_TRUE, MSO_FALSE = -1, 0


def main() -> None:
    source = Path(sys.argv[1]).resolve()
    target = Path(sys.argv[2]).resolve()
    app = win32com.client.gencache.EnsureDispatch("PowerPoint.Application")
    try:
        presentation = app.Presentations.Open(str(source), MSO_TRUE, MSO_FALSE, MSO_FALSE)
        try:
            # PrintRange を明示しないと pywin32 が既定値を COM へ変換できない
            presentation.ExportAsFixedFormat(
                str(target), PP_FIXED_FORMAT_TYPE_PDF, Intent=PP_FIXED_FORMAT_INTENT_PRINT, PrintRange=None
            )
        finally:
            presentation.Close()
    finally:
        app.Quit()
    print(f"exported {target}")


if __name__ == "__main__":
    main()
