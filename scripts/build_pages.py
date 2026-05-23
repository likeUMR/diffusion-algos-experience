"""Build the low-risk GitHub Pages artifact for the presentation.

The script copies only the static presentation runtime plus the assets that are
actually referenced by the page. It intentionally leaves training outputs,
checkpoints, paper source archives, and the original experiment workspace alone.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRESENTATION_DIR = ROOT / "presentation"
RESULTS_DIR = ROOT / "results"
OUTPUT_DIR = ROOT / "docs"

TEXT_SUFFIXES = {".html", ".css", ".js"}
MEDIA_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}

REQUIRED_RESULT_PATTERNS = [
    "hpo_*overview.png",
    "hpo_matrix_heatmap.png",
]


def rewrite_text(text: str) -> str:
    """Normalize local paths for a site served from docs/."""
    text = text.replace("../results/", "results/")
    text = text.replace("../presentation/assets/", "assets/")
    text = text.replace("presentation/assets/", "assets/")

    # Avoid publishing large PDFs, paper tarballs, or extracted LaTeX sources.
    # The arXiv/code links remain available where the data modules define them.
    text = re.sub(
        r'^(\s*)(localPdf|localSource|localSourceTex|extractedSource):\s*["\'][^"\']+["\'],?\s*$',
        r"\1\2: null,",
        text,
        flags=re.MULTILINE,
    )
    text = re.sub(
        r'(\bpdf:\s*)["\'](?:\.\./)?(?:presentation/)?assets/papers/[^"\']+\.pdf["\'],?',
        r"\1null,",
        text,
    )
    return text


def reset_output_dir() -> None:
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    (OUTPUT_DIR / ".nojekyll").write_text("", encoding="utf-8")


def copy_text_file(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    text = src.read_text(encoding="utf-8")
    dst.write_text(rewrite_text(text), encoding="utf-8", newline="\n")


def copy_tree_runtime(relative_dir: str) -> None:
    src_root = PRESENTATION_DIR / relative_dir
    if not src_root.exists():
        return

    for src in src_root.rglob("*"):
        if not src.is_file():
            continue
        dst = OUTPUT_DIR / relative_dir / src.relative_to(src_root)
        if src.suffix.lower() in TEXT_SUFFIXES:
            copy_text_file(src, dst)
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def collect_referenced_media() -> set[str]:
    refs: set[str] = set()
    pattern = re.compile(r'["\']([^"\']+\.(?:png|jpg|jpeg|gif|webp|svg))(?:[?#][^"\']*)?["\']', re.IGNORECASE)

    for src in OUTPUT_DIR.rglob("*"):
        if not src.is_file() or src.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = src.read_text(encoding="utf-8")
        for match in pattern.finditer(text):
            ref = match.group(1).replace("\\", "/")
            if ref.startswith(("http://", "https://", "data:")):
                continue
            while ref.startswith("./"):
                ref = ref[2:]
            refs.add(ref)

    return refs


def source_for_ref(ref: str) -> Path | None:
    normalized = ref.replace("\\", "/")
    if normalized.startswith("../"):
        normalized = normalized[3:]
    if normalized.startswith("assets/"):
        return PRESENTATION_DIR / normalized
    if normalized.startswith("results/"):
        return ROOT / normalized
    return PRESENTATION_DIR / normalized


def copy_referenced_media(refs: set[str]) -> list[str]:
    missing: list[str] = []
    for ref in sorted(refs):
        src = source_for_ref(ref)
        if src is None or not src.exists():
            missing.append(ref)
            continue
        dst = OUTPUT_DIR / ref
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
    return missing


def copy_required_result_images() -> None:
    if not RESULTS_DIR.exists():
        return
    for pattern in REQUIRED_RESULT_PATTERNS:
        for src in RESULTS_DIR.glob(pattern):
            dst = OUTPUT_DIR / "results" / src.name
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def summarize_output() -> tuple[int, float]:
    files = [p for p in OUTPUT_DIR.rglob("*") if p.is_file()]
    total_bytes = sum(p.stat().st_size for p in files)
    return len(files), total_bytes / (1024 * 1024)


def main() -> None:
    if not PRESENTATION_DIR.exists():
        raise SystemExit("presentation/ directory was not found")

    reset_output_dir()
    copy_text_file(PRESENTATION_DIR / "index.html", OUTPUT_DIR / "index.html")
    copy_tree_runtime("css")
    copy_tree_runtime("js")
    copy_tree_runtime("data")

    media_refs = collect_referenced_media()
    missing = copy_referenced_media(media_refs)
    copy_required_result_images()

    file_count, size_mb = summarize_output()
    print(f"Built {OUTPUT_DIR.relative_to(ROOT)} with {file_count} files ({size_mb:.2f} MB).")
    if missing:
        print("Missing referenced media:")
        for ref in missing:
            print(f"  - {ref}")


if __name__ == "__main__":
    main()
