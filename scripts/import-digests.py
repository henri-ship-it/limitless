"""
Turns the Notion digest page into src/content/digests.ts.

    python scripts/import-digests.py digests-raw.md

The source is one <details> block per week, holding Chris's copy verbatim.
Headings vary week to week, so the digest is stored as an ordered list of nodes
rather than forced into fixed fields. The week page walks the list.

Two things are stripped on the way through:

  - Anything to do with the module workshops. Those live on the deload week
    page, where the recording is posted, so repeating them in the digest dates
    the copy.
  - Em dashes and semicolons, per the house style in the brief.

The closing quotation of each week is lifted out into its own field, which is
where the week page quotes come from.
"""
import json
import re
import sys
from pathlib import Path

WORKSHOP = re.compile(r"workshop", re.I)
SIGN_OFF = re.compile(r"^(best|warmly|all the best|onwards|speak soon)[,.]?$|^chris[,.]?$", re.I)
QUOTE = re.compile(r'^[“"](.+?)[”"]\s*[—-]\s*(.+?)\.?$')


def style(text: str) -> str:
    """House style: no em dashes, no semicolons."""
    text = re.sub(r"\s*[—–]\s*", ", ", text)
    # A semicolon becomes a full stop, so the next word takes a capital.
    text = re.sub(r"\s*;\s*(\w)", lambda m: ". " + m.group(1).upper(), text)
    text = re.sub(r",\s*,", ",", text)
    text = re.sub(r"\s+", " ", text).strip()
    # A comma standing in for a dash before a capitalised clause reads better
    # as a full stop.
    text = re.sub(r", (It|This|That|They|You|We|Your|Not|And|But)\b", r". \1", text)
    return text


def parse_week(block: str):
    nodes = []
    quote = None
    lines = [re.sub(r"^\t", "", line.rstrip()) for line in block.split("\n")]

    pending_list: list[str] = []

    def flush():
        if pending_list:
            nodes.append({"type": "ul", "items": list(pending_list)})
            pending_list.clear()

    for raw in lines:
        line = raw.strip()
        if not line:
            continue

        if line == "---":
            flush()
            continue

        m = QUOTE.match(line)
        if m:
            flush()
            quote = {"text": style(m.group(1)), "author": m.group(2).strip().rstrip(".")}
            continue

        if SIGN_OFF.match(line):
            flush()
            continue

        heading = re.match(r"^#{2,4}\s*(.+)$", line)
        if heading:
            flush()
            nodes.append({"type": "h", "text": style(heading.group(1))})
            continue

        bold = re.match(r"^\*\*(.+?)\*\*:?$", line)
        if bold:
            flush()
            nodes.append({"type": "sub", "text": style(bold.group(1))})
            continue

        numbered = re.match(r"^\d+\.\s*\*\*(.+?)\*\*:?$", line)
        if numbered:
            flush()
            nodes.append({"type": "sub", "text": style(numbered.group(1))})
            continue

        bullet = re.match(r"^[-*]\s+(.+)$", line)
        if bullet:
            pending_list.append(style(bullet.group(1)))
            continue

        flush()
        nodes.append({"type": "p", "text": style(re.sub(r"\*\*(.+?)\*\*", r"\1", line))})

    flush()
    return nodes, quote


def strip_workshops(nodes):
    """Drop workshop headings and everything under them, plus stray mentions."""
    out = []
    skipping = False
    for node in nodes:
        if node["type"] in ("h", "sub"):
            skipping = bool(WORKSHOP.search(node["text"]))
            if skipping:
                continue
            out.append(node)
            continue

        if skipping:
            continue

        if node["type"] == "ul":
            items = [i for i in node["items"] if not WORKSHOP.search(i)]
            if items:
                out.append({"type": "ul", "items": items})
            continue

        if WORKSHOP.search(node["text"]):
            continue

        out.append(node)

    # A heading left with nothing under it is noise. A section heading followed
    # by a bold sub heading is normal, so only the empty case is dropped.
    cleaned = []
    for i, node in enumerate(out):
        rest = out[i + 1 :]
        if node["type"] == "h" and (not rest or rest[0]["type"] == "h"):
            continue
        if node["type"] == "sub" and (not rest or rest[0]["type"] in ("h", "sub")):
            continue
        cleaned.append(node)
    return cleaned


def ts_string(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "digests-raw.md")
    body = source.read_text()

    digests = []
    for block in re.findall(r"<details>(.*?)</details>", body, re.S):
        summary = re.search(r"<summary>(.*?)</summary>", block, re.S)
        if not summary:
            continue
        heading = summary.group(1)
        week = int(re.search(r"WEEK (\d+)", heading).group(1))
        if "MISSING" in heading:
            print(f"Week {week}: no copy in Notion, skipped")
            continue

        nodes, quote = parse_week(block[summary.end() :])
        nodes = strip_workshops(nodes)
        digests.append({"week": week, "nodes": nodes, "quote": quote})

    digests.sort(key=lambda d: d["week"])

    out = ['''// Generated by scripts/import-digests.py from the Notion digest page.
// Do not hand-edit: rerun the importer instead.
//
// Chris's headings differ from week to week, so a digest is an ordered list of
// nodes rather than a fixed set of fields. Workshop copy is stripped on import,
// since the workshop belongs on the deload week page where its recording lands.

export type DigestNode =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'sub'; text: string }
  | { type: 'ul'; items: string[] }

export type Digest = {
  week: number
  nodes: DigestNode[]
  quote?: { text: string; author: string }
}

export const digests: Digest[] = [''']

    for d in digests:
        out.append(f"  {{")
        out.append(f"    week: {d['week']},")
        out.append("    nodes: [")
        for node in d["nodes"]:
            if node["type"] == "ul":
                items = ", ".join(ts_string(i) for i in node["items"])
                out.append(f"      {{ type: 'ul', items: [{items}] }},")
            else:
                out.append(f"      {{ type: '{node['type']}', text: {ts_string(node['text'])} }},")
        out.append("    ],")
        if d["quote"]:
            out.append(
                "    quote: { text: %s, author: %s },"
                % (ts_string(d["quote"]["text"]), ts_string(d["quote"]["author"]))
            )
        out.append("  },")

    out.append("]")
    out.append("")
    out.append("export function getDigest(week: number): Digest | undefined {")
    out.append("  return digests.find((d) => d.week === week)")
    out.append("}")
    out.append("")

    target = Path(__file__).resolve().parent.parent / "src" / "content" / "digests.ts"
    target.write_text("\n".join(out))
    print(f"Wrote {len(digests)} digests to {target.relative_to(target.parents[2])}")
    print("Quotes found:", sum(1 for d in digests if d["quote"]))


if __name__ == "__main__":
    main()
