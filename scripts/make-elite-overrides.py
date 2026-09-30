"""
Turns the reviewed corrections into src/content/elite-overrides.ts.

    python scripts/make-elite-overrides.py

The parser reads the printed page as well as a gap measurement can, and on some
pages that is not well enough. It cannot see type that has been converted to
outlines, which is how every quotation on an artwork page is set, and it reads
the space under an instruction that is followed by a diagram as room to write.

Rather than tune the heuristic until it fits all three hundred and thirty six
pages and breaks on the next export, the corrections sit on top of it, the way
the weekly journal's do. The parser stays generated and rerunnable; this file is
the record of what a human eye found wrong with it.

Reads .qc/exercise-fixes-*.json, which are review output rather than build
inputs and are not in the repository.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
QC = os.path.join(HERE, "..", ".qc")
TARGET = os.path.join(HERE, "..", "src", "content", "elite-overrides.ts")


def ts(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def ts_list(values) -> str:
    return "[" + ", ".join(ts(v) for v in values) + "]"


def main() -> None:
    # Which entries carry artwork, which decides how a quotation is handled.
    index = json.load(open(os.path.join(HERE, "..", "public", "journal", "elite-visuals", "index.json")))
    has_art = {int(k) for k in index}

    fixes = {}
    for name in ("exercise-fixes-1-168.json", "exercise-fixes-169-336.json"):
        path = os.path.join(QC, name)
        if not os.path.exists(path):
            raise SystemExit(f"missing {path}: rerun the review first")
        for item in json.load(open(path)):
            n = item["n"]
            if n in fixes:
                raise SystemExit(f"entry {n} corrected twice")
            fixes[n] = item

    out = [
        "// Corrections on top of the parsed Elite journal.",
        "//",
        "// The parser reads a page by measuring the gap under each block, which",
        "// works until it does not. Two things defeat it. Type converted to",
        "// outlines is invisible to it, and every quotation printed over artwork",
        "// is set that way, so those pages came through with the attribution as",
        "// their only text or with nothing at all. And an instruction followed by",
        "// a diagram leaves a gap the same size as room to write, so the framing",
        "// sentence was handed a box to answer it in.",
        "//",
        "// Anything here wins over the parsed page. Reviewed against the printed",
        "// PDFs entry by entry; the note on each one says what was wrong.",
        "",
        "export type EliteOverride = {",
        "  title?: string | null",
        "  intro?: string[]",
        "  prompts?: string[]",
        "  outro?: string[]",
        "  caption?: { lines: string[]; author?: string } | null",
        "}",
        "",
        "export const eliteOverrides: Record<number, EliteOverride> = {",
    ]

    for n in sorted(fixes):
        item = fixes[n]
        fix = item.get("fix", {})
        if not fix:
            continue
        note = " ".join(item.get("problem", "").split())
        flag = "" if item.get("confidence") == "high" else " [unsure]"
        out.append(f"  // {note}{flag}")
        parts = []
        if "title" in fix:
            parts.append(f"title: {ts(fix['title']) if fix['title'] else 'null'}")
        for key in ("intro", "prompts", "outro"):
            if key in fix:
                parts.append(f"{key}: {ts_list(fix[key])}")
        if "caption" in fix:
            cap = fix["caption"]
            if cap is None:
                parts.append("caption: null")
            elif n in has_art:
                # The quotation on these pages is set as outlines, which is why
                # the parser could not read it, and being outlines it is part of
                # the picture. Printing the words underneath as well would set
                # the same sentence twice on one page, so only the attribution
                # is carried and the artwork speaks for itself.
                author = cap.get("author")
                if author:
                    parts.append(f"caption: {{ lines: [], author: {ts(author)} }}")
                else:
                    parts.append("caption: null")
            else:
                author = cap.get("author")
                inner = f"lines: {ts_list(cap['lines'])}"
                if author:
                    inner += f", author: {ts(author)}"
                parts.append(f"caption: {{ {inner} }}")
        out.append(f"  {n}: {{ {', '.join(parts)} }},")

    out += [
        "}",
        "",
        "export function eliteOverrideFor(n: number): EliteOverride | undefined {",
        "  return eliteOverrides[n]",
        "}",
        "",
    ]

    with open(TARGET, "w") as fh:
        fh.write("\n".join(out))
    print(f"{len(fixes)} corrections -> src/content/elite-overrides.ts")


if __name__ == "__main__":
    main()
