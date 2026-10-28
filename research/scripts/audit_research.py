"""Research repository integrity audit script.
Verifies metadata, PDF files, transcripts, translations, and markdown links across all paper folders.
"""

from __future__ import annotations

import json
from pathlib import Path


def audit() -> None:
    base_dir = Path(__file__).resolve().parent.parent / "scholar_ambigram"
    if not base_dir.exists():
        print(f"Error: {base_dir} does not exist.")
        return

    subdirs = sorted([d for d in base_dir.iterdir() if d.is_dir()])
    print(f"Found {len(subdirs)} paper directories in {base_dir.name}/\n")

    summary = []
    issues = []

    for d in subdirs:
        meta_file = d / "metadata.json"
        pdf_file = d / "paper.pdf"
        details_file = d / "paper_details.md"
        transcript_en = d / "paper_transcript_en.md"
        trans_ja = d / "paper_translation_ja.md"

        meta = {}
        if meta_file.exists():
            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
            except Exception as e:
                issues.append(f"[{d.name}] Invalid JSON in metadata.json: {e}")
        else:
            issues.append(f"[{d.name}] Missing metadata.json")

        has_pdf = pdf_file.exists()
        pdf_size = pdf_file.stat().st_size if has_pdf else 0
        has_details = details_file.exists()
        has_transcript = transcript_en.exists()
        has_trans_ja = trans_ja.exists()

        # Check metadata pdf_downloaded consistency
        meta_downloaded = meta.get("pdf_downloaded", False)
        if has_pdf != meta_downloaded:
            issues.append(
                f"[{d.name}] Metadata pdf_downloaded ({meta_downloaded}) != actual file exists ({has_pdf})"
            )

        # Check for local file:/// absolute path leak in md files
        for md_file in [details_file, transcript_en, trans_ja]:
            if md_file.exists():
                content = md_file.read_text(encoding="utf-8")
                if "file:///" in content:
                    issues.append(f"[{d.name}] Absolute path 'file:///' found in {md_file.name}")

        summary.append({
            "dir": d.name,
            "id": meta.get("id"),
            "title": meta.get("title", "No Title"),
            "has_pdf": has_pdf,
            "pdf_size_kb": round(pdf_size / 1024, 1),
            "has_details": has_details,
            "has_transcript": has_transcript,
            "has_trans_ja": has_trans_ja,
        })

    # Print summary table
    print(
        f"{'Dir':<32} | {'ID':<3} | {'PDF':<5} | {'Size':<8} | {'Details':<7} | {'Transcript':<10} | {'Translation':<11} | {'Title'}"
    )
    print("-" * 115)
    for s in summary:
        pdf_mark = "OK" if s["has_pdf"] else "-"
        size_str = f"{s['pdf_size_kb']}KB" if s["has_pdf"] else "-"
        det_mark = "OK" if s["has_details"] else "-"
        tr_mark = "OK" if s["has_transcript"] else "-"
        ja_mark = "OK" if s["has_trans_ja"] else "-"
        title_disp = s["title"][:32] + "..." if len(s["title"]) > 35 else s["title"]
        print(
            f"{s['dir']:<32} | {str(s['id']):<3} | {pdf_mark:<5} | {size_str:<8} | {det_mark:<7} | {tr_mark:<10} | {ja_mark:<11} | {title_disp}"
        )

    print("\n" + "=" * 50)
    if issues:
        print(f"Audit Result: {len(issues)} issue(s) detected:")
        for iss in issues:
            print(f"  - {iss}")
    else:
        print("Audit Result: All directories, metadata, and files are consistent! No issues.")
    print("=" * 50)


if __name__ == "__main__":
    audit()
