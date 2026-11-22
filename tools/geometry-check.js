#!/usr/bin/env node
/* Geometry check: measures the triangles and quadrilaterals actually drawn (sides, angles, parallel sides)
 * and compares them with the options marked correct; flags drawings that are ambiguous to the eye
 * (an angle close to 90° that is not a right angle, two sides almost but not exactly equal).
 * Also checks that translation arrows match the answer and that transformed shapes stay whole.
 *   node tools/geometry-check.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'); global.window = global;
['lang/ro.js','js/core/core.js','js/core/i18n.js','js/core/numwords.js','js/core/expr.js','js/core/check.js','js/figures/figures.js','js/data/curriculum.js','js/data/map.js','js/templates/registry.js','js/templates/ef_geometry.js'].forEach(f => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }));
MQ.setLang('ro');
const polys = svg => [...String(svg).matchAll(/<polygon[^>]*points="([^"]+)"/g)].map(mm => mm[1].trim().split(/\s+/).map(p => p.split(',').map(Number)));
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ang = (p, q, r) => { const u = [q[0] - p[0], q[1] - p[1]], v = [r[0] - p[0], r[1] - p[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180 / Math.PI; };
const problems = new Set(); let n = 0;
const fig = ex => typeof ex.figure === 'function' ? ex.figure('ro') : ex.figure;
for (const L of [1, 2, 3]) for (let i = 0; i < 400; i++) {
  const ex = MQ.T.make('tri_classify', L, 7 + i * 101); const P = polys(fig(ex))[0]; if (!P) continue; n++;
  const s = [d(P[0], P[1]), d(P[1], P[2]), d(P[2], P[0])], A = [ang(P[0], P[1], P[2]), ang(P[1], P[2], P[0]), ang(P[2], P[0], P[1])];
  const eq = (a, b) => Math.abs(a - b) / Math.max(a, b) < 0.005, near = (a, b) => !eq(a, b) && Math.abs(a - b) / Math.max(a, b) < 0.105;
  const nEq = [[0, 1], [1, 2], [0, 2]].filter(([a, b]) => eq(s[a], s[b])).length;
  const truth = { equi: nEq === 3, iso: nEq >= 1, scal: nEq === 0, right: A.some(x => Math.abs(x - 90) < 0.5) };
  const opts = ex.widget.options || []; const said = {}; opts.forEach(o => { const k = MQ.tm(o.label); said[k] = o.correct; });
  const names = { equi: MQ.t('tri.equi'), iso: MQ.t('tri.iso'), scal: MQ.t('tri.scal'), right: MQ.t('tri.right') };
  for (const k in names) if (names[k] in said) { const want = L === 1 ? (k === 'equi' ? truth.equi : k === 'iso' ? truth.iso && !truth.equi : truth.scal) : truth[k]; if (said[names[k]] !== want) problems.add(`tri L${L}: option ${k} marked ${said[names[k]]}, geometry says ${want} (sides ${s.map(x => x.toFixed(2))}, angles ${A.map(x => x.toFixed(1))})`); }
  if (A.some(x => !truth.right && Math.abs(x - 90) < 10)) problems.add(`tri L${L}: angle close to 90° but not right: ${A.map(x => x.toFixed(1))}`);
  if ([[0, 1], [1, 2], [0, 2]].some(([a, b]) => near(s[a], s[b]))) problems.add(`tri L${L}: two sides almost equal: ${s.map(x => x.toFixed(2))}`);
}
for (const L of [1, 2, 3]) for (let i = 0; i < 400; i++) {
  const ex = MQ.T.make('quad_classify', L, 11 + i * 97); const P = polys(fig(ex))[0]; if (!P) continue; n++;
  const s = [0, 1, 2, 3].map(k => d(P[k], P[(k + 1) % 4])), A = [0, 1, 2, 3].map(k => ang(P[k], P[(k + 3) % 4], P[(k + 1) % 4]));
  const par = (a, b, c, e) => Math.abs((b[0] - a[0]) * (e[1] - c[1]) - (b[1] - a[1]) * (e[0] - c[0])) < 1e-6;
  const pp = (par(P[0], P[1], P[2], P[3]) ? 1 : 0) + (par(P[1], P[2], P[3], P[0]) ? 1 : 0);
  const right4 = A.every(x => Math.abs(x - 90) < 0.5), eq4 = s.every(x => Math.abs(x - s[0]) / s[0] < 0.005);
  const truth = { square: right4 && eq4, rect: right4, rhombus: eq4, para: pp === 2, trap: pp === 1 };
  const most = truth.square ? 'square' : truth.rect ? 'rect' : truth.rhombus ? 'rhombus' : truth.para ? 'para' : truth.trap ? 'trap' : '?';
  const opts = ex.widget.options || []; opts.forEach(o => { const lab = MQ.tm(o.label); const k = ['square','rect','rhombus','para','trap'].find(k => MQ.t('quad.' + k) === lab); if (!k) return; const want = L === 1 ? k === most : truth[k]; if (o.correct !== want) problems.add(`quad L${L}: ${k} marked ${o.correct}, geometry ${want}`); });
  if (L === 3) { const e = MQ.tm(ex.explain); if (!e.includes(MQ.t('quad.' + most).toLowerCase().slice(0, 5)) && !e.toLowerCase().includes(MQ.t('quad.' + most).toLowerCase().slice(0, 5))) problems.add(`quad L3 explain does not mention ${most}: ${e.slice(0, 60)}`); }
  A.forEach(x => { if (Math.abs(x - 90) > 0.5 && Math.abs(x - 90) < 8) problems.add(`quad: angle near 90°: ${A.map(x => x.toFixed(1))} (${most})`); });
}
for (let i = 0; i < 2000; i++) { const ex = MQ.T.make('sym_point', 2, i), w = ex.widget, a = w.arrow, P = w.given[0], T0 = w.targets[0];
  if (a[2] - a[0] !== T0[0] - P.x || a[3] - a[1] !== T0[1] - P.y || [a[0], a[2]].some(x => x < 0 || x > w.w) || [a[1], a[3]].some(y => y < 0 || y > w.h)) problems.add('sym_point L2: arrow does not match the answer (seed ' + i + ')'); }
for (let i = 0; i < 1000; i++) for (const L of [1, 2, 3, 4]) { const svg = String(MQ.T.make('transform_id', L, i).figure); const cls = {};
  [...svg.matchAll(/class="cell sq ([^"]*)" data-cell/g)].forEach(mm => { const k = mm[1].trim(); if (k) cls[k] = (cls[k] || 0) + 1; });
  if (Object.values(cls).join('/') !== '5/5') problems.add('transform_id L' + L + ': shapes not whole (seed ' + i + ')'); }
console.log('figures checked', n); console.log([...problems].join('\n') || 'no problems'); process.exit(problems.size ? 1 : 0);
