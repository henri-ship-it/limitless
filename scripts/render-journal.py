import io, json, os, re
import pymupdf
from PIL import Image

PDF = "/Users/henriballs/Henriballs Dropbox/Henri Team Folder/2025/08_LMNTARY/18_Journal/Export/PRINT/Digital/LP_Limitless_Journal_Combined_01.pdf"
OUT = os.path.expanduser("~/Downloads/limitless-platform/public/journal")
WIDTH = 1100

doc = pymupdf.open(PDF)
entry_page, opener_page = {}, {}
total = 0

for i, page in enumerate(doc, 1):
    text = page.get_text()
    em = re.search(r"ENTRY (\d+) / 112", text)
    wm = re.search(r"^WEEK\s+(\d+)\s+\|", text, re.M)
    mm = re.search(r"^MODULE\s+\d+\s+\|\s+\w+\s*$", text, re.M)

    is_opener = bool(wm and mm)
    if not (em or is_opener):
        continue

    scale = WIDTH / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    name = f"p{i:03d}.webp"
    img.save(os.path.join(OUT, name), "WEBP", quality=82, method=5)
    total += 1

    if em:
        entry_page[int(em.group(1))] = name
    if is_opener:
        opener_page[int(wm.group(1))] = name

json.dump({"entries": entry_page, "openers": opener_page},
          open(os.path.join(OUT, "index.json"), "w"), indent=2)
print("rendered", total, "pages |", len(entry_page), "entry pages |", len(opener_page), "openers")
