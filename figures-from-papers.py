# -*- coding: utf-8 -*-
"""Uses a figure from the student's own research paper as the hero image for any
project whose Airtable `graphic_link` has died.

Stock photography was the first attempt and it was not good enough: CC0 search
returned a horse for a facial-emotion project and the CN Tower for brain cancer, and
reused the same picture across pairs of projects. The papers are a better source in
every way - the figure is the student's actual work, it is unique to the project,
Inspirit already hosts the PDF so there is no licensing question, and families would
rather see the research than a stock photo.

Selection: the largest embedded raster on any page after the first (skipping title
pages, logos and tiny decorations). If a paper has no usable raster - common for
LaTeX papers with vector charts - the page with the largest vector drawing is
rendered instead.

    python figures-from-papers.py
"""
import io, json, os, sys

import pymupdf
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, 'src', 'assets', 'images', 'project_graphics')
INDEX = os.path.join(HERE, 'image-overrides.json')
W, H = 1200, 630
MIN_W, MIN_H = 260, 170          # anything smaller is a logo or an icon
MIN_SCORE = 26                   # below this a figure looks worse than the gradient

# Scoring gets most of it right, but a few figures still read as noise at card size -
# a tiny scatter marooned in a black frame, a washed-out table. Judged by eye on the
# contact sheet these are worse than the gradient, so they are excluded by name.
REJECT = [
    'Predicting Running Injuries',
    'The Impact of the Covid-19',
    "Understanding Object Detection",
    'Stellar Classification',
]


DOMAIN_TINT = {
    'Healthcare and Biology': ((47, 49, 103), (109, 63, 122)),
    'Engineering': ((43, 58, 107), (63, 109, 138)),
    'Environment': ((36, 81, 63), (47, 109, 90)),
    'Physics': ((31, 47, 94), (74, 78, 140)),
    'Humanitarian Efforts and Social Justice': ((90, 47, 82), (138, 74, 99)),
    'Business and Finance': ((47, 74, 58), (79, 122, 82)),
    'Language and Literature': ((74, 47, 94), (109, 74, 138)),
    'Psychology': ((63, 47, 94), (94, 74, 138)),
    'Arts and Music': ((107, 47, 74), (154, 74, 99)),
}
DEFAULT_TINT = ((47, 49, 103), (85, 87, 142))


def gradient_bg(project):
    """Same subject gradient the CSS fallback uses, so the two treatments match."""
    a, b = DEFAULT_TINT
    for d in (project.get('domains') or []):
        if d in DOMAIN_TINT:
            a, b = DOMAIN_TINT[d]; break
    bg = Image.new('RGB', (W, H))
    px = bg.load()
    for y in range(H):
        t = y / float(H - 1)
        row = (int(a[0] + (b[0] - a[0]) * t),
               int(a[1] + (b[1] - a[1]) * t),
               int(a[2] + (b[2] - a[2]) * t))
        for x in range(W):
            px[x, y] = row
    return bg


def fit(im, project):
    """Sit the figure on the project's dark gradient.

    Letterboxing onto light grey was the first attempt and it broke the card: the
    tile overlays the project title in white, which vanished against a pale
    background. A dark ground keeps that text legible and matches the gradient used
    where no figure exists.
    """
    im = im.convert('RGB')
    scale = min(W * 0.62 / im.width, H * 0.80 / im.height)
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    canvas = gradient_bg(project)
    # figure sits high; the lower third of the card carries the title and names
    canvas.paste(im, ((W - im.width) // 2, max(8, int(H * 0.34) - im.height // 2)))
    return canvas


def score(im):
    """How well does this read as a hero image at card size?

    Rejects the things that made the first pass ugly: dark code screenshots, dense
    numeric tables, bare equations and near-blank crops. Rewards charts and diagrams,
    which have colour and ink spread over the frame rather than packed into rows.
    """
    small = im.convert('RGB').resize((120, 120))
    px = list(small.getdata())
    n = float(len(px))
    lum = [0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px]
    mean_lum = sum(lum) / n
    if mean_lum < 72:            # dark code screenshot
        return -1
    if mean_lum > 248:           # effectively blank
        return -1

    # Hasler-Susstrunk colourfulness
    rg = [abs(r - g) for r, g, b in px]
    yb = [abs(0.5 * (r + g) - b) for r, g, b in px]
    def mstd(v):
        m = sum(v) / n
        return m, (sum((x - m) ** 2 for x in v) / n) ** 0.5
    mrg, srg = mstd(rg); myb, syb = mstd(yb)
    colourfulness = (srg ** 2 + syb ** 2) ** 0.5 + 0.3 * (mrg ** 2 + myb ** 2) ** 0.5

    ink = sum(1 for l in lum if l < 128) / n          # dark coverage
    if ink > 0.55:                                    # a wall of text or a black block
        return -1
    if ink < 0.012:                                   # a lone equation on white
        return -1

    # tables/text put ink in tight horizontal bands; charts spread it out
    rows = [sum(1 for x in range(120) if lum[y * 120 + x] < 150) for y in range(120)]
    busy_rows = sum(1 for r in rows if r > 12) / 120.0

    return colourfulness * 1.6 + min(ink, 0.30) * 90 + busy_rows * 22


def best_raster(doc):
    best = None
    for pno in range(min(len(doc), 14)):
        if pno == 0 and len(doc) > 1:
            continue                                   # title page
        for info in doc[pno].get_images(full=True):
            xref = info[0]
            try:
                pix = pymupdf.Pixmap(doc, xref)
                if pix.n - pix.alpha >= 4:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                im = Image.open(io.BytesIO(pix.tobytes('png'))); im.load()
            except Exception:
                continue
            if im.width < MIN_W or im.height < MIN_H:
                continue
            sc = score(im)
            if sc < MIN_SCORE:
                continue
            if best is None or sc > best[0]:
                best = (sc, im, pno + 1)
    return best


def best_vector_page(doc):
    best = None
    for pno in range(min(len(doc), 10)):
        if pno == 0 and len(doc) > 1:
            continue
        page = doc[pno]
        drawings = page.get_drawings()
        if len(drawings) < 40:                          # not a chart-heavy page
            continue
        if best is None or len(drawings) > best[0]:
            best = (len(drawings), pno)
    if best is None:
        return None
    page = doc[best[1]]
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))
    im = Image.open(io.BytesIO(pix.tobytes('png'))); im.load()
    # crop off the outer margins so the chart fills more of the card
    w, h = im.size
    im = im.crop((int(w * .08), int(h * .10), int(w * .92), int(h * .72)))
    return im, best[1] + 1


broken = json.load(io.open(os.path.join(HERE, '_broken_images.json'), encoding='utf-8'))
data = json.load(io.open(os.path.join(HERE, 'data.json'), encoding='utf-8'))
items = data if isinstance(data, list) else (data.get('projects') or list(data.values())[0])
bad = {b['url'] for b in broken}
targets = [p for p in items if p.get('graphic_link') in bad]

if not os.path.isdir(OUT_DIR):
    os.makedirs(OUT_DIR)
index = {}

ok = 0
skipped = []
for p in targets:
    title, pid = p['project_title'], p['project_id']
    rel = p.get('research_paper')
    path = os.path.join(HERE, 'src', rel) if rel else None
    if not path or not os.path.exists(path):
        skipped.append((title, 'no paper on disk')); continue
    try:
        doc = pymupdf.open(path)
    except Exception as ex:
        skipped.append((title, 'unreadable pdf')); continue
    if any(r.lower() in title.lower() for r in REJECT):
        doc.close(); skipped.append((title, 'figure judged too weak by eye')); continue
    got = best_raster(doc)
    if got:
        sc, im, page = got
        how = 'figure p%d (score %.0f)' % (page, sc)
    else:
        vec = best_vector_page(doc)
        if not vec:
            doc.close(); skipped.append((title, 'no usable figure')); continue
        im, page = vec
        if score(im) < MIN_SCORE:
            doc.close(); skipped.append((title, 'figures too plain')); continue
        how = 'chart page p%d' % page
    doc.close()
    fit(im, p).save(os.path.join(OUT_DIR, pid + '.jpg'), 'JPEG', quality=88, optimize=True)
    index[pid] = {'file': 'assets/images/project_graphics/%s.jpg' % pid,
                  'project': title, 'source': 'own research paper', 'detail': how}
    ok += 1
    print('  ok   %-46s %s' % (title[:46], how))

for t, why in skipped:
    print('  --   %-46s %s' % (t[:46], why))

io.open(INDEX, 'w', encoding='utf-8').write(json.dumps(index, indent=1, sort_keys=True))
print('\n%d hero images from papers, %d without one (they keep the subject gradient)'
      % (ok, len(skipped)))
