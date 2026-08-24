"""Finds the artwork on a journal entry page by looking at the pixels."""
import io
import sys

import pymupdf
from PIL import Image, ImageChops, ImageDraw

PDF = "/Users/henriballs/Henriballs Dropbox/Henri Team Folder/2025/08_LMNTARY/18_Journal/Export/PRINT/Digital/LP_Limitless_Journal_Combined_01.pdf"
SCALE = 2


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

    for _ in range(4):
        grown = rect
        for x0, y0, x1, y1, text in blocks:
            mid = (y0 + y1) / 2
            if rect.y0 - 20 <= mid <= rect.y1 + 20:
                grown = grown | pymupdf.Rect(x0, y0, x1, y1)
        if grown == rect:
            break
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
        rect = visual_rect(page)
        if not rect:
            continue
        entry = int(m.group(1))
        pad = 8
        clip = pymupdf.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad) & page.rect
        img = render(page, clip, 3)
        name = f"e{entry:03d}.webp"
        img.save(os.path.join(out_dir, name), "WEBP", quality=88, method=5)
        found[entry] = {"file": name, "w": img.size[0], "h": img.size[1]}

    json.dump(found, open(os.path.join(out_dir, "index.json"), "w"), indent=2)
    print(f"{len(found)} visuals of 112 entries")


if __name__ == "__main__":
    main()
