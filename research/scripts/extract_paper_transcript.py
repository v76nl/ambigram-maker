"""Extract structured markdown transcript from research paper PDFs using PyMuPDF.

Usage:
    python research/scripts/extract_paper_transcript.py <paper_id_or_dirname> [--output-name <filename>]
    python research/scripts/extract_paper_transcript.py 19
    python research/scripts/extract_paper_transcript.py 20
    python research/scripts/extract_paper_transcript.py all
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        print("Error: PyMuPDF (pymupdf or fitz) is not installed.")
        sys.exit(1)


def extract_transcript(paper_dir: Path, output_filename: str = "paper_transcript_en.md", force: bool = False) -> bool:
    pdf_path = paper_dir / "paper.pdf"
    if not pdf_path.exists():
        print(f"[-] {paper_dir.name}: paper.pdf not found.")
        return False

    out_path = paper_dir / output_filename
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"[-] {paper_dir.name}: Failed to open PDF: {e}")
        return False

    total_pages = len(doc)
    extracted_text = []
    raw_total_chars = 0

    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        raw_total_chars += len(text)
        extracted_text.append(f"## Page {i + 1}\n\n{text}\n\n---\n")

    # Detect scanned image PDF (averaging < 20 characters per page)
    avg_chars_per_page = raw_total_chars / max(total_pages, 1)
    if avg_chars_per_page < 20 and not force:
        print(
            f"[-] {paper_dir.name}: Scanned image PDF detected ({total_pages} pages, only {raw_total_chars} text chars). OCR is required. Skipping transcript generation (use --force to override)."
        )
        return False

    full_content = "\n".join(extracted_text)
    out_path.write_text(full_content, encoding="utf-8")
    print(f"[+] {paper_dir.name} -> {output_filename} ({total_pages} pages, {len(full_content):,} chars)")
    return True


def find_target_dir(base_dir: Path, target: str) -> list[Path]:
    if target.lower() == "all":
        return sorted([d for d in base_dir.iterdir() if d.is_dir()])

    matches = []
    for d in base_dir.iterdir():
        if not d.is_dir():
            continue
        if d.name == target or d.name.startswith(f"{target.zfill(2)}_") or d.name.startswith(f"{target}_"):
            matches.append(d)
    return matches


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract markdown transcript from paper PDFs.")
    parser.add_argument("target", help="Paper ID (e.g. 19, 20) or directory name, or 'all'")
    parser.add_argument("--output-name", default="paper_transcript_en.md", help="Output filename")
    parser.add_argument("--force", action="store_true", help="Force output even if scanned image PDF is detected")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent / "scholar_ambigram"
    targets = find_target_dir(base_dir, args.target)

    if not targets:
        print(f"Error: Target '{args.target}' not found in {base_dir}")
        sys.exit(1)

    success_count = 0
    for t in targets:
        if extract_transcript(t, args.output_name, args.force):
            success_count += 1

    print(f"\nDone: {success_count}/{len(targets)} paper(s) processed.")


if __name__ == "__main__":
    main()
