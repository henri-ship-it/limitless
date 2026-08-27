"""
Extracts the diagram that opens each chapter.

    python scripts/crop-chapters.py path/to/journal.pdf

Every chapter opens on a spread: the introduction and its quotation on the
left, a diagram on the right. The right hand page carries a printed spine down
its outer edge, which is trimmed off before the artwork is measured.
"""
import io
import json
import os
import re
import sys

import pymupdf
from PIL import Image, ImageChops

SCALE = 3
# The printed spine runs down the outer edge of the page.
SPINE_PT = 34


def main() -> None:
    pdf = sys.argv[1]
    out_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "journal", "chapters",
    )
    os.makedirs(out_dir, exist_ok=True)

    doc = pymupdf.open(pdf)
    found = {}

    for page in doc:
        text = page.get_text()
        if "/ 112" in text:
            continue
        m = re.search(r"WEEK\W{0,3}(\d{1,2})\s*\|", text)
        if not m:
            continue
        week = int(m.group(1))
        W, H = page.rect.width, page.rect.height

        # Measure the artwork on the right hand page, spine excluded.
        area = pymupdf.Rect(W / 2, 0, W - SPINE_PT, H)
        probe = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=area, alpha=False)
        img = Image.open(io.BytesIO(probe.tobytes("png"))).convert("RGB")
        bbox = ImageChops.difference(img, Image.new("RGB", img.size, (255, 255, 255))).getbbox()
        if not bbox:
            continue

        pad = 10
        rect = pymupdf.Rect(
            area.x0 + bbox[0] / 2 - pad,
            bbox[1] / 2 - pad,
            area.x0 + bbox[2] / 2 + pad,
            bbox[3] / 2 + pad,
        ) & area

        pix = page.get_pixmap(matrix=pymupdf.Matrix(SCALE, SCALE), clip=rect, alpha=False)
        art = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        name = f"w{week:02d}.webp"
        art.save(os.path.join(out_dir, name), "WEBP", quality=88, method=5)
        found[week] = {"file": name, "w": art.size[0], "h": art.size[1]}

    json.dump(found, open(os.path.join(out_dir, "index.json"), "w"), indent=2)
    print(f"{len(found)} chapter diagrams: weeks {sorted(found)}")


if __name__ == "__main__":
    main()
