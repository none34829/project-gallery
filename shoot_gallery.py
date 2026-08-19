# -*- coding: utf-8 -*-
"""Screenshots the gallery front page and a project page, and reports how many
hero tiles are actually showing an image vs falling back to the gradient.

    python shoot_gallery.py [base_url]
"""
import io, json, os, sys

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8099/').rstrip('/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '_shots')
if not os.path.isdir(OUT):
    os.makedirs(OUT)

with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)[:140]))
    page.goto(BASE + 'index.html', wait_until='networkidle', timeout=120000)
    page.wait_for_timeout(4000)
    page.mouse.wheel(0, 2000)
    page.wait_for_timeout(3000)

    stats = page.evaluate("""() => {
      const tiles = [...document.querySelectorAll('.projectImage')];
      let withImg = 0, gradientOnly = 0;
      tiles.forEach(t => {
        const bg = getComputedStyle(t).backgroundImage;
        if (bg.indexOf('url(') >= 0) withImg++; else gradientOnly++;
      });
      return {tiles: tiles.length, declaresImage: withImg, gradientOnly: gradientOnly,
              navItems: [...document.querySelectorAll('.navbar-nav > li')].map(
                 li => (li.querySelector('a')||{}).textContent.trim())};
    }""")

    page.screenshot(path=os.path.join(OUT, 'gallery-top.png'), clip={'x':0,'y':0,'width':1440,'height':1000})
    page.screenshot(path=os.path.join(OUT, 'gallery-full.png'), full_page=False)
    page.mouse.wheel(0, 1400); page.wait_for_timeout(2500)
    page.screenshot(path=os.path.join(OUT, 'gallery-grid.png'))

    # a project page that is known to have a dead hero
    broken_path = os.path.join(HERE, '_broken_images.json')
    data = json.load(io.open(os.path.join(HERE, 'data.json'), encoding='utf-8'))
    items = data if isinstance(data, list) else (data.get('projects') or list(data.values())[0])
    pid = None
    if os.path.exists(broken_path):
        bad = {b['url'] for b in json.load(io.open(broken_path, encoding='utf-8'))}
        for p in items:
            if p.get('graphic_link') in bad:
                pid = p['project_id']; break
    pid = pid or items[0]['project_id']
    page.goto(BASE + 'projects/' + pid + '.html', wait_until='networkidle', timeout=120000)
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(OUT, 'project-page.png'))
    browser.close()

print('hero tiles          :', stats['tiles'])
print('declare a remote img:', stats['declaresImage'])
print('gradient only       :', stats['gradientOnly'])
print('nav items           :', stats['navItems'])
print('page errors         :', errs or 'none')
print('shots in', OUT)
