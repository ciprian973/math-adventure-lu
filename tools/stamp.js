#!/usr/bin/env node
/* Adds ?v=<content hash> to every local script and stylesheet in index.html and selftest.html.
 * Browsers (and GitHub Pages, which allows caching for 10 minutes) then load a file again exactly
 * when it has changed, and never mix an old file with new ones after an update.
 *   node tools/stamp.js        (run before each commit that changes js, css or lang files) */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
for (const page of ['index.html', 'selftest.html']) {
  const file = path.join(ROOT, page); if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8'), n = 0;
  html = html.replace(/(src|href)="([^":?#]+\.(?:js|css))(\?v=[0-9a-f]+)?"/g, (all, attr, p) => {
    const f = path.join(ROOT, p); if (!fs.existsSync(f)) return all;
    n++; return `${attr}="${p}?v=${crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 8)}"`;
  });
  fs.writeFileSync(file, html); console.log(page + ': ' + n + ' files stamped');
}
