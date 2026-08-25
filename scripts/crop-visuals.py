"""Finds the artwork on a journal entry page by looking at the pixels."""
import io
import re
import sys

import pymupdf
from PIL import Image, ImageChops, ImageDraw

PDF = "/Users/henriballs/Henriballs Dropbox/Henri Team Folder/2025/08_LMNTARY/18_Journal/Export/PRINT/Digital/LP_Limitless_Journal_Combined_01.pdf"
SCALE = 2

# Entries whose diagram sits inside the exercise rather than above it. The
# prompt overlap test would throw these away, so it is skipped for them.
FORCE = {29, 32, 33, 43, 45, 47, 49, 57}

# Where the automatic bounds pull in text that belongs to the exercise, the
# region is given directly, in points on the right hand page.
CLIPS = {
    # Only the four support headings, not the instruction above them.
    58: (0, 96, 420, 200),
    # Only the four circles, not the question printed beside them.
    61: (0, 96, 420, 200),
    # The self-talk triangle, above the rating scale.
    29: (0, 92, 420, 338),
    # The hooked and unhooked diagrams, with their labels beside them.
    32: (0, 96, 420, 350),
    33: (0, 96, 420, 350),
    # The four kinds of support, one shaded on each entry of the chapter.
    57: (0, 96, 420, 200),
    # The stairway to optimism, which sits beside the heading on each of the
    # four steps rather than above the exercise.
    43: (150, 48, 280, 196),
    45: (150, 48, 280, 196),
    47: (150, 48, 280, 196),
    49: (150, 48, 280, 196),
}


def render(page, clip, scale):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), clip=clip, alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


def visual_rect(page):
    """
    An entry page is a heading, prompts and ruled writing lines, with the
    artwork sitting in a gap between them. Some of that artwork is drawn as
    embedded forms rather than page level paths, so it is found by rendering
    the page, painting out everything that is text or ruling, and seeing what
    ink is left.
    """
    W, H = page.rect.width, page.rect.height
    right = pymupdf.Rect(W / 2, 0, W, H)
    img = render(page, right, SCALE)
    w, h = img.size

    masked = img.copy()
    draw = ImageDraw.Draw(masked)

    for x0, y0, x1, y1, *_ in page.get_text("blocks"):
        if x1 <= right.x0:
            continue
        box = [
            (max(x0, right.x0) - right.x0) * SCALE,
            y0 * SCALE,
            (x1 - right.x0) * SCALE,
            y1 * SCALE,
        ]
        draw.rectangle(box, fill=(255, 255, 255))

    grey = masked.convert("L")
    px = grey.load()

    # Paint out the ruled writing lines: long, thin, and never solid black.
    for y in range(h):
        dark = sum(1 for x in range(0, w, 3) if px[x, y] < 245)
        if dark > (w / 3) * 0.55:
            draw.rectangle([0, y - 1, w, y + 1], fill=(255, 255, 255))

    bbox = ImageChops.difference(masked, Image.new("RGB", img.size, (255, 255, 255))).getbbox()
    if not bbox:
        return None

    bx0, by0, bx1, by1 = bbox
    if (bx1 - bx0) < w * 0.12 or (by1 - by0) < h * 0.05:
        return None

    rect = pymupdf.Rect(
        right.x0 + bx0 / SCALE, by0 / SCALE, right.x0 + bx1 / SCALE, by1 / SCALE
    )

    # Bring back any labels that belong to the artwork, such as axis names or
    # the words either end of a scale. Repeat until nothing new is pulled in,
    # so a label directly under another label is not left half cropped.
    blocks = [
        (max(x0, right.x0), y0, x1, y1, text)
        for x0, y0, x1, y1, text, *_ in page.get_text("blocks")
        if x1 > right.x0 and "ENTRY" not in text.upper()[:20]
    ]

    # Only short labels, and only once. Iterating lets the box creep down the
    # page and swallow the prompt underneath.
    grown = rect
    for x0, y0, x1, y1, text in blocks:
        if len(text.split()) > 6:
            continue
        mid = (y0 + y1) / 2
        if rect.y0 - 26 <= mid <= rect.y1 + 26:
            grown = grown | pymupdf.Rect(x0, y0, x1, y1)
    rect = grown

    rect = rect & right
    # If the detection swallowed most of the page it has found the exercise
    # itself, not a graphic sitting inside it.
    if rect.height > H * 0.8:
        return None
    return rect


def main():
    import json
    import os
    import re

    out_dir = os.path.expanduser("~/Downloads/limitless-platform/public/journal/visuals")
    os.makedirs(out_dir, exist_ok=True)
    doc = pymupdf.open(PDF)
    found = {}

    for i, page in enumerate(doc, 1):
        m = re.search(r"ENTRY (\d+) / 112", page.get_text())
        if not m:
            continue
        entry = int(m.group(1))

        # Every seventh entry closes the week. Those pages carry no artwork,
        # unless one has been named explicitly.
        if entry % 7 == 0 and entry not in CLIPS:
            continue

        W = page.rect.width
        if entry in CLIPS:
            x0, y0, x1, y1 = CLIPS[entry]
            rect = pymupdf.Rect(W / 2 + x0, y0, W / 2 + x1, y1) & page.rect
        else:
            rect = visual_rect(page)
            if not rect:
                continue

            # Some pages set their prompts as labelled boxes. Those are prompts,
            # not artwork, and the entry renders them as fields instead.
            if entry not in FORCE and overlaps_prompts(page, rect):
                continue
        pad = 8
        clip = pymupdf.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad) & page.rect
        img = render(page, clip, 3)
        name = f"e{entry:03d}.webp"
        img.save(os.path.join(out_dir, name), "WEBP", quality=88, method=5)
        found[entry] = {"file": name, "w": img.size[0], "h": img.size[1]}

    json.dump(found, open(os.path.join(out_dir, "index.json"), "w"), indent=2)
    print(f"{len(found)} visuals of 112 entries")


def overlaps_prompts(page, rect) -> bool:
    """
    True when the detected artwork is really the entry's prompt boxes.

    A prompt is a line of text with ruled writing space under it. If most of
    what was found sits on top of those, there is no graphic here.
    """
    W, H = page.rect.width, page.rect.height
    blocks = []
    for x0, y0, x1, y1, text, *_ in page.get_text("blocks"):
        text = " ".join(text.split())
        if x1 <= W / 2 or not text or re.match(r"^ENTRY \d+ / 112$", text):
            continue
        blocks.append((pymupdf.Rect(max(x0, W / 2), y0, x1, y1), text))
    blocks.sort(key=lambda b: b[0].y0)

    touched = 0
    for i, (r, text) in enumerate(blocks):
        gap = (blocks[i + 1][0].y0 if i + 1 < len(blocks) else H) - r.y1
        if gap < 42:
            continue
        # A prompt asks something. A short line with no question or colon is a
        # label inside the artwork, not a field to write in.
        if len(text.split()) <= 6 and text[-1] not in "?:":
            continue
        if not (r & rect).is_empty:
            touched += 1

    # Artwork belongs to a single prompt at most. A region spanning several is
    # the labelled boxes the member writes in, which the entry renders as
    # fields instead.
    return touched >= 2


if __name__ == "__main__":
    main()
