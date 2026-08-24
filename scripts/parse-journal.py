"""
Extracts the journal into src/content/journal.ts.

    pip install pypdf
    python scripts/parse-journal.py path/to/LP_Limitless_Journal_Combined_01.pdf

The PDF is a print export, so the text layer is not in reading order and some
pages set their quotations as outlines rather than text. The parser is therefore
conservative: an entry heading it cannot identify is left as null and the week
page shows "Daily entry" instead of guessing. Quotations are not recovered at
all, they come from the digest export.
"""

import re, json

BOILER = re.compile(r"^(INTENTIONS|SCHEDULE|PREVIEW|REVIEW|ACHIEVEMENTS|DAY:|ONE THING YOU|ONE THING ON|ONE WIN OF|\d{1,2}(AM|PM)$|\d\.$)")
SMALL = {"the","a","an","and","or","of","to","in","on","for","with","your","you","it","is","as","at","but","by","from"}

def tc(s):
    words = s.split()
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        out.append(lw if (i and lw in SMALL) else (lw[0].upper() + lw[1:] if lw else lw))
    return " ".join(out)

txt = open("journal.txt").read()
pages = txt.split("===== PAGE ")[1:]
entries, quotes, openers = [], [], {}
cur_week = None

for p in pages:
    head, _, body = p.partition("=====")
    pno = int(head.strip())
    raw = [l.strip() for l in body.split("\n") if l.strip()]
    m = re.search(r"^WEEK\s+(\d+)\s+\|", body, re.M)
    if m:
        cur_week = int(m.group(1))

    leading, after, seen = [], [], False
    for l in raw:
        if BOILER.match(l):
            seen = True
            continue
        (after if seen else leading).append(l)

    if leading and all(l.upper() == l for l in leading) and 2 <= len(leading) <= 5:
        last = leading[-1]
        if 1 <= len(last.split()) <= 4 and not last[-1] in ".,":
            body_txt = " ".join(leading[:-1])
            if len(body_txt.split()) >= 4:
                quotes.append({"page": pno, "week": cur_week,
                               "text": re.sub(r"\s+", " ", body_txt).strip(),
                               "author": tc(last)})


    em = re.search(r"ENTRY (\d+) / 112", body)
    if em:
        n = int(em.group(1))
        caps, prompts = [], []
        for l in after:
            if l.startswith("ENTRY "):
                continue
            clean = re.sub(r"(PRE)?REVIEW$", "", l).strip()
            if not clean:
                continue
            if re.search(r"[a-z]", clean):
                prompts.append(re.sub(r"\s+", " ", clean))
            else:
                caps.append(clean)

        title, qtext = None, []
        used = set()
        for i, c in enumerate(caps):
            is_name = len(c.split()) <= 4 and c[-1] not in ".,"
            prior = [x for j, x in enumerate(caps[:i]) if j not in used and len(x.split()) > 3]
            if is_name and prior and sum(len(x.split()) for x in prior) >= 5:
                quotes.append({"page": pno, "week": cur_week,
                               "text": re.sub(r"\s+", " ", " ".join(prior)).strip(),
                               "author": tc(c)})
                used.update(j for j, x in enumerate(caps[:i]) if len(x.split()) > 3)
                used.add(i)
        for i, c in enumerate(caps):
            if i in used:
                continue
            if len(c.split()) <= 6 and c[-1] not in ".,":
                title = tc(c)
                break
        entries.append({"n": n, "week": cur_week, "title": title, "prompts": prompts})

for p in pages:
    head, _, body = p.partition("=====")
    m = re.search(r"^MODULE\s+(\d+)\s+\|\s+(\w+)\s*$", body, re.M)
    w = re.search(r"^WEEK\s+(\d+)\s+\|\s+(.+?)\s*$", body, re.M)
    if not (m and w):
        continue
    wn = int(w.group(1))
    lines = [l.strip() for l in body.split("\n") if l.strip()]
    rest = [l for l in lines if not re.match(r"^(MODULE|WEEK)\s+\d+\s+\|", l)]
    openers[wn] = {"week": wn, "module": int(m.group(1)), "module_name": tc(m.group(2)),
                   "chapter": tc(w.group(2).strip()), "lines": rest}

json.dump({"entries": entries, "quotes": quotes, "openers": openers},
          open("journal-parsed.json", "w"), indent=2, ensure_ascii=False)
print("entries:", len(entries), "titled:", sum(1 for e in entries if e["title"]),
      "| quotes:", len(quotes), "| openers:", len(openers))
for e in entries[:7]:
    print(" ", e["n"], "w%d" % e["week"], "|", e["title"], "|", len(e["prompts"]), "prompts")
print("QUOTES:")
for q in quotes:
    print("  w%s" % q["week"], q["text"][:65], "—", q["author"])
