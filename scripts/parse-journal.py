"""
Extracts the journal into src/content/journal.ts.

    pip install pymupdf
    python scripts/parse-journal.py path/to/LP_Limitless_Journal_Combined_01.pdf

Every entry is the right hand page of a spread: a heading, some framing text,
the prompts to write against, and sometimes a closing note. What separates a
prompt from ordinary prose is the ruled writing space beneath it, so the parser
classifies by the gap that follows each block rather than by wording.
"""
import json
import os
import re
import sys

import pymupdf

SMALL = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with",
    "your", "you", "it", "is", "as", "at", "but", "by", "from",
}
# A prompt is followed by room to write. Anything tighter than this is prose.
WRITING_SPACE = 42
MERGE_GAP = 6
# Labels belonging to the preview and review form on the facing page.
FORM_LABELS = {
    "PREVIEW", "REVIEW", "INTENTIONS", "SCHEDULE", "ACHIEVEMENTS", "HUDDLE",
    "ONE WIN OF YOUR DAY", "ONE THING ON YOUR MIND",
    "ONE THING YOU\u2019RE GRATEFUL FOR",
}


def sentence(text: str) -> str:
    """The book sets prompts in capitals. On screen they read better as prose."""
    if re.search(r"[a-z]", text):
        return text
    lowered = text.lower()
    return lowered[:1].upper() + lowered[1:]


def title_case(text: str) -> str:
    words = text.split()
    return " ".join(
        w.lower() if i and w.lower() in SMALL else w.lower()[:1].upper() + w.lower()[1:]
        for i, w in enumerate(words)
    )


def blocks_for(page):
    """Right hand page text, merged into paragraphs and in reading order."""
    W, H = page.rect.width, page.rect.height
    raw = []
    for x0, y0, x1, y1, text, *_ in page.get_text("blocks"):
        if x1 <= W / 2:
            continue
        text = " ".join(l.strip() for l in text.strip().split("\n") if l.strip())
        if not text or re.match(r"^ENTRY \d+ / 112$", text):
            continue
        if text.upper() in FORM_LABELS or re.match(r"^[\d.\s]+$", text):
            continue
        raw.append({"y0": y0, "y1": y1, "x0": x0, "text": text})

    raw.sort(key=lambda b: (round(b["y0"], 1), b["x0"]))

    merged = []
    for b in raw:
        if (
            merged
            and b["y0"] - merged[-1]["y1"] < MERGE_GAP
            and abs(b["x0"] - merged[-1]["x0"]) < 20
        ):
            merged[-1]["text"] += " " + b["text"]
            merged[-1]["y1"] = max(merged[-1]["y1"], b["y1"])
        else:
            merged.append(dict(b))

    for i, b in enumerate(merged):
        nxt = merged[i + 1]["y0"] if i + 1 < len(merged) else H
        b["gap"] = nxt - b["y1"]

    return merged


def has_qr(page) -> bool:
    """
    A QR code is a small square raster sitting in the top corner of the page.
    Other raster art appears further down and is not square.
    """
    W = page.rect.width
    for image in page.get_images():
        for rect in page.get_image_rects(image[0]):
            square = 0.85 <= rect.width / max(rect.height, 1) <= 1.18
            if square and rect.width < 70 and rect.y1 < 110 and rect.x0 > W * 0.5:
                return True
    return False


def parse_entry(page):
    entry = {"title": None, "intro": [], "prompts": [], "outro": [], "qr": has_qr(page)}
    items = blocks_for(page)
    if not items:
        return entry

    # The facing page's REVIEW label sometimes runs straight into the heading.
    items[0]["text"] = re.sub(r"\s*(PRE)?REVIEW$", "", items[0]["text"]).strip()

    # The heading sits directly above the exercise. Anything in capitals above
    # it is a label belonging to the artwork, which the entry shows separately.
    for i, b in enumerate(items):
        caps = not re.search(r"[a-z]", b["text"])
        nxt = items[i + 1] if i + 1 < len(items) else None
        if (
            caps
            and len(b["text"].split()) <= 8
            and b["text"][-1] not in ":?."
            and b["gap"] < 30
            and nxt
            and re.search(r"[a-z]", nxt["text"])
        ):
            entry["title"] = title_case(b["text"])
            items = items[i + 1 :]
            break

    if entry["title"] is None:
        # No prose under the heading. Fall back to the first short line in
        # capitals that sits tight against whatever follows it.
        for i, b in enumerate(items):
            caps = not re.search(r"[a-z]", b["text"])
            if caps and len(b["text"].split()) <= 8 and b["text"][-1] not in ":?." and b["gap"] < 30:
                entry["title"] = title_case(b["text"])
                items = items[i + 1 :]
                break

    seen_prompt = False
    for i, b in enumerate(items):
        text = re.sub(r"\s+", " ", b["text"]).strip()
        caps = not re.search(r"[a-z]", text)

        # A short heading in capitals directly above a prompt only restates it.
        if caps and len(text.split()) <= 5 and "?" not in text:
            nxt = items[i + 1] if i + 1 < len(items) else None
            if nxt and re.search(r"[a-z]", nxt["text"]):
                continue

        if b["gap"] >= WRITING_SPACE:
            entry["prompts"].append(sentence(text))
            seen_prompt = True
        elif seen_prompt:
            entry["outro"].append(sentence(text))
        else:
            entry["intro"].append(sentence(text))

    return entry


def ts(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def ts_list(values):
    return "[" + ", ".join(ts(v) for v in values) + "]"


def main() -> None:
    pdf = sys.argv[1]
    doc = pymupdf.open(pdf)

    entries = []
    for page in doc:
        em = re.search(r"ENTRY (\d+) / 112", page.get_text())
        if not em:
            continue
        entry = parse_entry(page)
        entry["n"] = int(em.group(1))
        # Seven entries to a week, throughout.
        entry["week"] = (entry["n"] - 1) // 7 + 1
        entries.append(entry)

    entries.sort(key=lambda e: e["n"])

    out = [
        "// Generated by scripts/parse-journal.py from the printed journal.",
        "// Do not hand-edit: rerun the parser instead.",
        "",
        "export type JournalEntry = {",
        "  n: number",
        "  week: number",
        "  title: string | null",
        "  /** Framing text that sets the exercise up. */",
        "  intro: string[]",
        "  /** The prompts to write against, in the order the book sets them. */",
        "  prompts: string[]",
        "  /** A closing note under the exercise. */",
        "  outro: string[]",
        "  /** The printed page carries a QR code here, replaced by a link. */",
        "  qr: boolean",
        "}",
        "",
        "export const journalEntries: JournalEntry[] = [",
    ]
    for e in entries:
        out.append(
            "  { n: %d, week: %d, title: %s, intro: %s, prompts: %s, outro: %s, qr: %s },"
            % (
                e["n"],
                e["week"],
                ts(e["title"]) if e["title"] else "null",
                ts_list(e["intro"]),
                ts_list(e["prompts"]),
                ts_list(e["outro"]),
                "true" if e["qr"] else "false",
            )
        )
    out += [
        "]",
        "",
        "export function entriesForWeek(week: number): JournalEntry[] {",
        "  return journalEntries.filter((e) => e.week === week)",
        "}",
        "",
        "/** The seventh entry of every week closes it. Those pages carry no artwork. */",
        "export function isHuddle(n: number): boolean {",
        "  return n % 7 === 0",
        "}",
        "",
    ]

    target = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "src", "content", "journal.ts")
    open(target, "w").write("\n".join(out))
    print(f"{len(entries)} entries")
    print("titled:", sum(1 for e in entries if e["title"]))
    print("with prompts:", sum(1 for e in entries if e["prompts"]))
    print("with intro:", sum(1 for e in entries if e["intro"]))
    print("qr codes:", [e["n"] for e in entries if e["qr"]])


if __name__ == "__main__":
    main()
