"""
Crops the artwork out of the Elite journal into public/journal/elite-visuals.

    pip install pymupdf pillow
    python scripts/crop-elite-visuals.py "vol1.pdf" "vol2.pdf" "vol3.pdf" "vol4.pdf"

The Elite books are the same design as the weekly one, so the detection is
crop-visuals' and is imported rather than restated: render the right hand page,
paint out everything that is text or ruling, and see what ink is left.

What is deliberately not imported is that script's CLIPS and FORCE tables. Both
are keyed by weekly entry number and were measured against weekly pages, so
applying them here would crop entry 29 of the Elite journal to the coordinates
of a diagram printed somewhere else entirely. Elite gets automatic detection
only, and anything it needs by hand is set below against its own numbers.
"""
import importlib.util
import json
import os
import re
import sys

import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("crop_visuals", os.path.join(HERE, "crop-visuals.py"))
cv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cv)

TOTAL = 336
ENTRIES_PER_WEEK = 7

# The least ink a crop may contain and still be a picture.
#
# The weekly journal rules its writing space with lines, which the detector
# paints out by finding rows that are dark most of the way across. The Elite
# books use a dot grid instead: no row is ever dark enough to be painted out, so
# every blank page survived and two hundred and fifty three "visuals" came back
# from three hundred and thirty six pages, most of them empty grids.
#
# Ink coverage separates them completely rather than approximately. A dot grid
# measures 0.20% every time, because it is the same grid on every page. Real
# artwork starts around 2% and runs past 20%. Nothing at all falls between.
MIN_INK = 0.01
INK_LEVEL = 200


def covers_text(page, clip) -> bool:
    """
    Whether the crop has swallowed printed words as well as the drawing.

    The detector finds artwork by painting out text and taking what is left, but
    the image it then saves is a plain render of that rectangle, so any words
    standing inside it come back in the picture. Where the quotation sits beside
    the drawing rather than beneath it the crop contains the quote, and printing
    the caption underneath as well would set the same sentence twice.

    Only real words count. A single label is part of the diagram.
    """
    W = page.rect.width
    for x0, y0, x1, y1, text, *_ in page.get_text("blocks"):
        if x1 <= W / 2:
            continue
        text = " ".join(text.split())
        if not text or re.match(r"^ENTRY\s*\d+\s*/\s*%d$" % TOTAL, text):
            continue
        if len(text.split()) < 3:
            continue
        block = pymupdf.Rect(max(x0, W / 2), y0, x1, y1)
        if not (block & clip).is_empty:
            return True
    return False


def ink_fraction(img) -> float:
    grey = img.convert("L")
    data = grey.getdata()
    dark = sum(1 for p in data if p < INK_LEVEL)
    return dark / max(1, len(data))

# Regions given by hand, in points on the right hand page, keyed by Elite entry.
#
# Every one of these was measured against the printed page after the automatic
# crop was checked by eye. The detector finds ink, which is the right instinct
# and the wrong answer whenever the page carries ink that is not a picture.
CLIPS: dict[int, tuple[float, float, float, float]] = {
    # The QR code sits at the top right and dragged the bounding box up with it,
    # so the crop carried the entry marker, the heading and the intro line as
    # well as the radar chart.
    1: (74, 130, 352, 407),
    # The quote is set inside the artwork and ran wider than the ink the
    # detector found, losing "THE" and half of "MIND" off the left edge.
    88: (92, 214, 330, 371),
    # The Reflective Cycle wheel, which the same three entries share. Left to
    # itself the box reached down into the prompt printed under it.
    253: (76, 97, 338, 298),
    259: (76, 97, 338, 298),
    265: (76, 97, 338, 298),
    # Diagrams that sit inside the exercise rather than above it.
    85: (99, 96, 320, 315),
    97: (20, 100, 293, 350),
    103: (127, 100, 386, 350),
}

# Entries whose diagram sits inside the exercise, where the prompt overlap test
# would otherwise throw it away.
FORCE: set[int] = {85, 97, 103}

# Pages the detector called artwork that are nothing of the kind.
#
# All of them are things the reader fills in: a checklist of values, a row of
# rating scales, a plotting grid, a QR code above three percentage boxes. They
# carry enough ink to clear the dot grid floor and none of it is a picture, and
# the entry renders those fields itself, so printing a photograph of the blank
# form above them shows the same exercise twice.
NOT_ARTWORK: set[int] = {29, 113, 137, 165, 187, 221, 281, 284, 293, 309}

OUT = os.path.join(HERE, "..", "public", "journal", "elite-visuals")
TARGET = os.path.join(HERE, "..", "src", "content", "elite-visuals.ts")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("give the journal volumes in order, volume 1 first")

    os.makedirs(OUT, exist_ok=True)
    marker = re.compile(r"ENTRY\s*(\d+)\s*/\s*%d" % TOTAL)
    found: dict[int, dict] = {}

    for path in sys.argv[1:]:
        doc = pymupdf.open(path)
        for page in doc:
            m = marker.search(page.get_text())
            if not m:
                continue
            entry = int(m.group(1))

            if entry in NOT_ARTWORK:
                continue

            # Every seventh entry closes the week. Those pages carry no artwork,
            # unless one has been named explicitly.
            if entry % ENTRIES_PER_WEEK == 0 and entry not in CLIPS:
                continue

            W = page.rect.width
            if entry in CLIPS:
                x0, y0, x1, y1 = CLIPS[entry]
                rect = pymupdf.Rect(W / 2 + x0, y0, W / 2 + x1, y1) & page.rect
            else:
                rect = cv.visual_rect(page)
                if not rect:
                    continue
                # Some pages set their prompts as labelled boxes. Those are
                # prompts, not artwork, and the entry renders them as fields.
                if entry not in FORCE and cv.overlaps_prompts(page, rect):
                    continue

            pad = 8
            clip = pymupdf.Rect(
                rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad
            ) & page.rect
            img = cv.render(page, clip, 3)
            if entry not in CLIPS and ink_fraction(img) < MIN_INK:
                continue
            name = f"e{entry:03d}.webp"
            img.save(os.path.join(OUT, name), "WEBP", quality=88, method=5)
            found[entry] = {
                "file": name,
                "w": img.size[0],
                "h": img.size[1],
                "coversText": covers_text(page, clip),
            }

    json.dump(found, open(os.path.join(OUT, "index.json"), "w"), indent=2)

    lines = [
        "// Generated by scripts/crop-elite-visuals.py. Do not hand-edit.",
        "//",
        "// The artwork from each Elite entry page, cropped away from the ruled",
        "// writing lines and the prompt boxes. Rendered on a flat ground with",
        "// multiply blending, so the white of the page drops out.",
        "",
        "import type { Visual } from './journal-visuals'",
        "",
        "/** True where the crop contains printed words as well as the drawing. */",
        "export type EliteVisual = Visual & { coversText: boolean }",
        "",
        "const eliteVisuals: Record<number, EliteVisual> = {",
    ]
    for n in sorted(found):
        v = found[n]
        lines.append(
            "  %d: { src: '/journal/elite-visuals/%s', width: %d, height: %d, coversText: %s },"
            % (n, v["file"], v["w"], v["h"], "true" if v["coversText"] else "false")
        )
    lines += [
        "}",
        "",
        "export function eliteVisualForEntry(n: number): EliteVisual | null {",
        "  return eliteVisuals[n] ?? null",
        "}",
        "",
    ]
    with open(TARGET, "w") as fh:
        fh.write("\n".join(lines))

    print(f"{len(found)} visuals of {TOTAL} entries -> src/content/elite-visuals.ts")


if __name__ == "__main__":
    main()
