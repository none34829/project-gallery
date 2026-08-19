# -*- coding: utf-8 -*-
"""Loads the gallery in a real browser and reports which project images fail.

The hero image for each project is an Airtable `graphic_link` - a hotlink to a
third-party site - painted as a CSS background, which fails *silently* to a blank
box. This checks them the way a visitor's browser would: same requests, same
referer, following redirects.

    python audit_images.py                     # live site
    python audit_images.py http://localhost:8080/
"""
import collections, io, json, os, sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'https://research.inspiritai.com/'
HERE = os.path.dirname(os.path.abspath(__file__))

data = json.load(io.open(os.path.join(HERE, 'data.json'), encoding='utf-8'))
items = data if isinstance(data, list) else (data.get('projects') or list(data.values())[0])
links = [(p.get('project_title', '?'), p['graphic_link']) for p in items if p.get('graphic_link')]
print('checking %d hero images via %s' % (len(links), BASE))

results = {}
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width': 1400, 'height': 1000})
    page.goto(BASE, wait_until='domcontentloaded', timeout=90000)

    # Fetch each hero URL from inside the page so the browser sends the same
    # Referer/Origin a visitor would - hotlink protection keys off exactly that.
    results = page.evaluate("""async (urls) => {
      const out = {};
      const chunk = 12;
      for (let i = 0; i < urls.length; i += chunk) {
        await Promise.all(urls.slice(i, i + chunk).map(u => new Promise(res => {
          const img = new Image();
          const done = ok => { out[u] = ok; res(); };
          img.onload  = () => done(img.naturalWidth > 1);
          img.onerror = () => done(false);
          setTimeout(() => { if (!(u in out)) done(false); }, 12000);
          img.src = u;
        })));
      }
      return out;
    }""", [u for _, u in links])
    browser.close()

broken = [(t, u) for t, u in links if not results.get(u, False)]
ok = len(links) - len(broken)
print('\nloads fine : %d' % ok)
print('BROKEN     : %d  (%.0f%% of the gallery)' % (len(broken), 100.0 * len(broken) / len(links)))

hosts = collections.Counter(urlparse(u).netloc for _, u in broken)
print('\nbroken by host:')
for h, n in hosts.most_common(15):
    print('  %3d  %s' % (n, h))

io.open(os.path.join(HERE, '_broken_images.json'), 'w', encoding='utf-8').write(
    json.dumps([{'project': t, 'url': u} for t, u in broken], indent=1))
print('\nwrote _broken_images.json')
for t, u in broken[:15]:
    print('   %-46s %s' % (t[:46], u[:70]))
