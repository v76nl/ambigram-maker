"""Synchronize metadata across all paper folders in scholar_ambigram/.

Updates:
1. Each paper folder's metadata.json with actual PDF size and download status.
2. Flags for available transcript (paper_transcript_en.md) and translation (paper_translation_ja.md).
3. Root metadata_all.json aggregating all paper records sorted by ID.
"""

from __future__ import annotations

import json
from pathlib import Path


def sync_metadata() -> None:
    base_dir = Path(__file__).resolve().parent.parent / "scholar_ambigram"
    meta_all_file = base_dir / "metadata_all.json"

    subdirs = sorted([d for d in base_dir.iterdir() if d.is_dir()])
    print(f"Scanning {len(subdirs)} paper directories...")

    aggregated = []
    updated_folders = 0

    for d in subdirs:
        meta_file = d / "metadata.json"
        pdf_file = d / "paper.pdf"
        transcript_en = d / "paper_transcript_en.md"
        trans_ja = d / "paper_translation_ja.md"

        if not meta_file.exists():
            print(f"[-] Warning: {d.name} has no metadata.json. Skipping.")
            continue

        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[-] Error reading {meta_file}: {e}")
            continue

        # Check PDF state
        has_pdf = pdf_file.exists()
        pdf_size = pdf_file.stat().st_size if has_pdf else 0
        changed = False

        if meta.get("pdf_downloaded") != has_pdf:
            meta["pdf_downloaded"] = has_pdf
            changed = True

        if meta.get("pdf_size_bytes") != pdf_size:
            meta["pdf_size_bytes"] = pdf_size
            changed = True

        # Check transcript / translation state
        has_transcript = transcript_en.exists()
        has_trans_ja = trans_ja.exists()

        if meta.get("transcript_available") != has_transcript:
            meta["transcript_available"] = has_transcript
            changed = True

        if meta.get("translation_ja_available") != has_trans_ja:
            meta["translation_ja_available"] = has_trans_ja
            changed = True

        if changed:
            meta_file.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            updated_folders += 1

        aggregated.append(meta)

    # Sort aggregated by ID
    aggregated.sort(key=lambda x: x.get("id", 999))

    # Save to metadata_all.json
    meta_all_file.write_text(json.dumps(aggregated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"[+] Done. Updated {updated_folders} folder metadata.json files.")
    print(f"[+] Synced {len(aggregated)} records to {meta_all_file.name}.")


if __name__ == "__main__":
    sync_metadata()
