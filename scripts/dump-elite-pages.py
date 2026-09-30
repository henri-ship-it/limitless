"""
Dumps what is printed on each Elite page beside what the parser made of it.

    python scripts/dump-elite-pages.py

Written for review rather than for the build. The parser decides what is a
prompt and what is framing text by the size of the gap underneath it, which is
a rule that works on most pages and quietly fails on the rest. Checking that by
eye means holding the printed page and the parsed record side by side, so this
writes them side by side.

Each record is one entry: the raw text blocks in reading order with the gap
after each, and the parsed intro, prompts, outro and caption. Everything needed
to say whether the classification is right, without opening the PDF.
"""
import json
import os
import re
import sys

import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

TOTAL = 336
OUT = os.path.join(HERE, "..", ".qc")

BASE = (
    "/Users/henriballs/Henriballs Dropbox/Henri Team Folder/2025/08_LMNTARY/"
    "18_Journal/CORPORATE/06_Export"
)
VOLUMES = [os.path.join(BASE, f"Journal {v}.pdf") for v in (1, 2, 3, 4)]


def blocks_for(page):
    W, H = page.rect.width, page.rect.height
    raw = []
    for x0, y0, x1, y1, text, *_ in page.get_text("blocks"):
        if x1 <= W / 2:
            continue
        text = " ".join(l.strip() for l in text.strip().split("\n") if l.strip())
        if not text or re.match(r"^ENTRY\s*\d+\s*/\s*%d$" % TOTAL, text):
            continue
        raw.append({"y0": round(y0, 1), "y1": round(y1, 1), "x0": round(x0, 1), "text": text})
    raw.sort(key=lambda b: (round(b["y0"], 1), b["x0"]))
    for i, b in enumerate(raw):
        nxt = raw[i + 1]["y0"] if i + 1 < len(raw) else H
        b["gap_below"] = round(nxt - b["y1"], 1)
    return raw


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    parsed = {}
    src = open(os.path.join(HERE, "..", "src", "content", "elite-journal.ts")).read()
    for m in re.finditer(r"\{ n: (\d+), week: \d+, chapter: \d+, volume: \d+, (.*?) \},\n", src):
        parsed[int(m.group(1))] = m.group(2)

    records = []
    for path in VOLUMES:
        doc = pymupdf.open(path)
        for page in doc:
            m = re.search(r"ENTRY\s*(\d+)\s*/\s*%d" % TOTAL, page.get_text())
            if not m:
                continue
            n = int(m.group(1))
            records.append(
                {
                    "n": n,
                    "printed_blocks": blocks_for(page),
                    "has_images": bool(page.get_images()),
                    "parsed": parsed.get(n, ""),
                }
            )

    records.sort(key=lambda r: r["n"])
    # Four files so a reviewer can take one volume at a time without loading
    # three hundred and thirty six pages of text to look at eighty four.
    for v in range(4):
        chunk = [r for r in records if (r["n"] - 1) // 84 == v]
        with open(os.path.join(OUT, f"elite-pages-{v + 1}.json"), "w") as fh:
            json.dump(chunk, fh, indent=1, ensure_ascii=False)
        print(f"volume {v + 1}: {len(chunk)} entries -> .qc/elite-pages-{v + 1}.json")


if __name__ == "__main__":
    main()
