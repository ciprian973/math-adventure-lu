/* =====================================================================
 * figures.js — SVG figure builders. Every builder returns an SVG STRING
 * (so figures can be generated and checked in Node by the self-test).
 * Interactive parts carry class="hit" and data-* attributes; the widgets
 * in ui/widgets.js attach the behaviour.
 * Geometry is drawn to scale where the task depends on it: on squared
 * grids 1 unit = U px, on the ruler 1 cm = CM px.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const F = MQ.fig = {};
  const U = 30;          // px per grid unit
  const CM = 40;         // px per centimetre on the virtual ruler
  F.U = U; F.CM = CM;
  const r2 = x => Math.round(x * 100) / 100;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = (w, h, body, label, cls = '') =>
    `<svg class="fig ${cls}" viewBox="0 0 ${r2(w)} ${r2(h)}" width="${r2(w)}" style="max-width:100%;height:auto" role="img" aria-label="${esc(label || '')}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  F.svg = svg;
  const line = (x1, y1, x2, y2, cls = 'ln') => `<line class="${cls}" x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}"/>`;
  const text = (x, y, s, cls = 'tx', anchor = 'middle') => `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}">${s}</text>`;
  const poly = (pts, cls = 'shape') => `<polygon class="${cls}" points="${pts.map(p => r2(p[0]) + ',' + r2(p[1])).join(' ')}"/>`;
  const polyl = (pts, cls = 'ln') => `<polyline class="${cls}" fill="none" points="${pts.map(p => r2(p[0]) + ',' + r2(p[1])).join(' ')}"/>`;
  F.line = line; F.text = text; F.poly = poly;

  /* ---------------- Fractions ---------------- */
  // pie with `parts` equal sectors; shaded: array of indexes; interactive adds hit class
  F.pie = (parts, shaded = [], { size = 180, interactive = false, label = '' } = {}) => {
    const c = size / 2, r = size / 2 - 6; let b = '';
    for (let i = 0; i < parts; i++) {
      const a0 = -Math.PI / 2 + 2 * Math.PI * i / parts, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / parts;
      const big = (a1 - a0) > Math.PI ? 1 : 0;
      const p0 = [c + r * Math.cos(a0), c + r * Math.sin(a0)], p1 = [c + r * Math.cos(a1), c + r * Math.sin(a1)];
      const d = parts === 1 ? `M ${c - r} ${c} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0` : `M ${c} ${c} L ${r2(p0[0])} ${r2(p0[1])} A ${r} ${r} 0 ${big} 1 ${r2(p1[0])} ${r2(p1[1])} Z`;
      b += `<path class="cell ${shaded.includes(i) ? 'on' : ''} ${interactive ? 'hit' : ''}" data-cell="${i}" d="${d}" ${interactive ? 'tabindex="0" role="button"' : ''}/>`;
    }
    return svg(size, size, b, label);
  };
  F.bar = (parts, shaded = [], { width = 360, height = 54, interactive = false, label = '' } = {}) => {
    const w = (width - 4) / parts; let b = '';
    for (let i = 0; i < parts; i++)
      b += `<rect class="cell ${shaded.includes(i) ? 'on' : ''} ${interactive ? 'hit' : ''}" data-cell="${i}" x="${r2(2 + i * w)}" y="2" width="${r2(w)}" height="${height - 4}" ${interactive ? 'tabindex="0" role="button"' : ''}/>`;
    return svg(width, height, b, label);
  };
  // a set of round counters (fraction of a set)
  F.set = (count, shaded = [], { cols = 6, interactive = false, label = '' } = {}) => {
    const rows = Math.ceil(count / cols), s = 46; let b = '';
    for (let i = 0; i < count; i++) {
      const x = (i % cols) * s + s / 2 + 2, y = Math.floor(i / cols) * s + s / 2 + 2;
      b += `<circle class="cell dot ${shaded.includes(i) ? 'on' : ''} ${interactive ? 'hit' : ''}" data-cell="${i}" cx="${x}" cy="${y}" r="18" ${interactive ? 'tabindex="0" role="button"' : ''}/>`;
    }
    return svg(Math.min(count, cols) * s + 4, rows * s + 4, b, label);
  };
  // cols × rows grid of cells (percent grid 10×10, area grids, symmetry grids)
  F.cells = (cols, rows, on = [], { cell = 26, interactive = false, axis = null, fixed = [], label = '', marks = {} } = {}) => {
    let b = '';
    const onS = new Set(on), fixS = new Set(fixed);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const id = x + ',' + y;
      const cls = 'cell sq ' + (onS.has(id) ? 'on ' : '') + (fixS.has(id) ? 'fixed ' : '') + (interactive && !fixS.has(id) ? 'hit' : '');
      b += `<rect class="${cls}" data-cell="${id}" x="${2 + x * cell}" y="${2 + y * cell}" width="${cell}" height="${cell}" ${interactive && !fixS.has(id) ? 'tabindex="-1"' : ''}/>`;
      if (marks[id]) b += text(2 + x * cell + cell / 2, 2 + y * cell + cell * 0.68, marks[id], 'tx sm');
    }
    if (axis) {
      if (axis.type === 'v') b += line(2 + axis.at * cell, -4, 2 + axis.at * cell, rows * cell + 8, 'axis');
      if (axis.type === 'h') b += line(-4, 2 + axis.at * cell, cols * cell + 8, 2 + axis.at * cell, 'axis');
      if (axis.type === 'd') b += line(2, 2, 2 + cols * cell, 2 + rows * cell, 'axis');
      if (axis.type === 'p') b += `<circle class="centre" cx="${2 + axis.x * cell}" cy="${2 + axis.y * cell}" r="5"/>`;
    }
    return svg(cols * cell + 4, rows * cell + 4, b, label, 'cells');
  };

  /* ---------------- Number line ----------------
   * from a to b (Q), `ticks` subdivisions, labelled ticks every `labelEvery`.
   * Values given as Q; markers [{at:Q, label}] ; interactive: data-v on hit ticks */
  F.numberLine = (a, b, ticks, { labelEvery = ticks, labels = null, markers = [], interactive = false, lang = 'fr', width = 640, label = '', fracLabels = false } = {}) => {
    const Q = MQ.Q; a = Q.of(a); b = Q.of(b);
    const x0 = 30, x1 = width - 30, y = 58; let s = line(x0 - 14, y, x1 + 14, y, 'ln thick') + `<polygon class="arrow" points="${x1 + 14},${y - 6} ${x1 + 24},${y} ${x1 + 14},${y + 6}"/>`;
    const step = b.sub(a).div(ticks);
    for (let i = 0; i <= ticks; i++) {
      const v = a.add(step.mul(i)), x = x0 + (x1 - x0) * i / ticks, major = i % labelEvery === 0;
      s += line(x, y - (major ? 14 : 8), x, y + (major ? 14 : 8), major ? 'ln' : 'ln thin');
      if (major && (!labels || labels.includes(i))) s += text(x, y + 36, fracLabels && !v.isInt() ? v.n + '/' + v.d : MQ.fmtNum(v, lang), 'tx');
      if (interactive) s += `<rect class="hit tick" data-i="${i}" x="${r2(x - (x1 - x0) / ticks / 2)}" y="${y - 30}" width="${r2((x1 - x0) / ticks)}" height="60" fill="transparent"/>`;
    }
    markers.forEach(m => {
      const pos = Q.of(m.at).sub(a).div(b.sub(a)).toNumber(), x = x0 + (x1 - x0) * pos;
      s += `<g class="marker ${m.cls || ''}"><polygon points="${r2(x - 9)},${y - 34} ${r2(x + 9)},${y - 34} ${r2(x)},${y - 18}"/>${m.label ? text(x, y - 40, m.label, 'tx b') : ''}</g>`;
    });
    if (interactive) s += `<g class="usermark" style="display:none"><polygon points="0,0 0,0 0,0"/></g>`;
    return svg(width, 104, s, label, 'nline');
  };
  F.nlX = (i, ticks, width = 640) => 30 + (width - 60) * i / ticks;

  /* ---------------- Coordinate plane (first quadrant) ---------------- */
  F.coord = (w, h, { points = [], segments = [], polygons = [], interactive = false, label = '', icons = [], cell = U, axisNames = ['x', 'y'], texts = [] } = {}) => {
    const ox = 34, oy = 14 + h * cell; let s = '';
    for (let x = 0; x <= w; x++) s += line(ox + x * cell, oy, ox + x * cell, oy - h * cell, 'grid') + text(ox + x * cell, oy + 20, x, 'tx sm');
    for (let y = 0; y <= h; y++) s += line(ox, oy - y * cell, ox + w * cell, oy - y * cell, 'grid') + text(ox - 12, oy - y * cell + 5, y, 'tx sm');
    s += line(ox, oy, ox + w * cell + 14, oy, 'axis') + line(ox, oy, ox, oy - h * cell - 10, 'axis');
    s += text(ox + w * cell + 16, oy + 18, axisNames[0], 'tx sm b') + text(ox - 16, oy - h * cell - 2, axisNames[1], 'tx sm b');
    polygons.forEach(pg => s += poly(pg.pts.map(p => [ox + p[0] * cell, oy - p[1] * cell]), pg.cls || 'shape'));
    segments.forEach(sg => s += line(ox + sg[0] * cell, oy - sg[1] * cell, ox + sg[2] * cell, oy - sg[3] * cell, sg[4] || 'ln thick'));
    icons.forEach(ic => s += `<g class="icon">${F.icon(ic.type, ox + ic.x * cell, oy - ic.y * cell)}${ic.label ? text(ox + ic.x * cell, oy - ic.y * cell - 16, ic.label, 'tx sm b') : ''}</g>`);
    texts.forEach(tx => s += `<text class="tx ${tx.cls || 'b'}" x="${r2(ox + tx.x * cell)}" y="${r2(oy - tx.y * cell + 7)}" text-anchor="middle">${tx.t}</text>`);
    points.forEach(p => s += `<circle class="pt ${p.cls || ''}" cx="${ox + p.x * cell}" cy="${oy - p.y * cell}" r="6"/>` + (p.label ? text(ox + p.x * cell + 12, oy - p.y * cell - 8, p.label, 'tx b', 'start') : ''));
    if (interactive) {
      for (let x = 0; x <= w; x++) for (let y = 0; y <= h; y++)
        s += `<circle class="hit lattice" data-x="${x}" data-y="${y}" cx="${ox + x * cell}" cy="${oy - y * cell}" r="${cell * 0.45}" fill="transparent"/>`;
      s += `<g class="userpts"></g>`;
    }
    return svg(ox + w * cell + 30, oy + 30, s, label, 'coord');
  };
  F.coordXY = (x, y, h, cell = U) => [34 + x * cell, 14 + h * cell - y * cell];

  // simple map icons (original drawings)
  F.icon = (type, x, y) => {
    const c = `transform="translate(${r2(x)},${r2(y)})"`;
    switch (type) {
      case 'school': return `<g ${c}><rect class="ic1" x="-10" y="-6" width="20" height="14"/><polygon class="ic2" points="-12,-6 0,-15 12,-6"/></g>`;
      case 'bakery': return `<g ${c}><ellipse class="ic3" cx="0" cy="0" rx="11" ry="7"/><line class="ln thin" x1="-4" y1="-5" x2="-1" y2="5"/><line class="ln thin" x1="2" y1="-5" x2="5" y2="5"/></g>`;
      case 'bus': return `<g ${c}><rect class="ic4" x="-11" y="-8" width="22" height="14" rx="3"/><circle class="ic5" cx="-6" cy="7" r="3"/><circle class="ic5" cx="6" cy="7" r="3"/></g>`;
      case 'castle': return `<g ${c}><rect class="ic1" x="-10" y="-8" width="20" height="16"/><rect class="ic2" x="-12" y="-14" width="6" height="8"/><rect class="ic2" x="6" y="-14" width="6" height="8"/></g>`;
      case 'park': return `<g ${c}><circle class="ic6" cx="0" cy="-4" r="9"/><rect class="ic3" x="-2" y="3" width="4" height="7"/></g>`;
      case 'pool': return `<g ${c}><rect class="ic7" x="-11" y="-7" width="22" height="14" rx="4"/><path class="ln thin" d="M -8 0 q 4 -4 8 0 t 8 0" fill="none"/></g>`;
      case 'stadium': return `<g ${c}><ellipse class="ic6" cx="0" cy="0" rx="12" ry="8"/><circle class="ic8" cx="0" cy="0" r="3"/></g>`;
      case 'home': return `<g ${c}><rect class="ic3" x="-8" y="-4" width="16" height="12"/><polygon class="ic2" points="-11,-4 0,-13 11,-4"/></g>`;
      default: return `<circle ${c} r="8" class="ic1"/>`;
    }
  };

  /* ---------------- Polygons on squared paper ----------------
   * pts in grid units; labels on sides: [{i, text}] side i from pts[i] to pts[i+1] */
  F.onGrid = (pts, { gw = null, gh = null, sideLabels = [], cls = 'shape', grid = true, label = '', extra = '', cell = U, dash = [] } = {}) => {
    const maxX = Math.max(...pts.map(p => p[0])), maxY = Math.max(...pts.map(p => p[1]));
    gw = gw || maxX + 2; gh = gh || maxY + 2;
    const off = cell, P = p => [off + p[0] * cell, off + p[1] * cell];
    let s = '';
    if (grid) { for (let x = 0; x <= gw; x++) s += line(off + x * cell - cell, 0, off + x * cell - cell, (gh + 1) * cell, 'grid'); for (let y = 0; y <= gh + 1; y++) s += line(0, y * cell, (gw + 1) * cell, y * cell, 'grid'); }
    s += poly(pts.map(P), cls);
    dash.forEach(d => s += line(...P(d[0]), ...P(d[1]), 'ln dash'));
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    sideLabels.forEach(sl => {
      const a = pts[sl.i], bpt = pts[(sl.i + 1) % pts.length];
      const mx = (a[0] + bpt[0]) / 2, my = (a[1] + bpt[1]) / 2;
      let nx = mx - cx, ny = my - cy; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const [X, Y] = P([mx + nx * 0.55, my + ny * 0.55]);
      s += `<text class="tx lbl" x="${r2(X)}" y="${r2(Y + 6)}" text-anchor="middle">${sl.text}</text>`;
    });
    return svg((gw + 1) * cell, (gh + 1) * cell, s + extra, label, 'ongrid');
  };

  /* ---------------- Angles and protractor ---------------- */
  F.angle = (deg, { rot = 0, protractor = false, label = '', size = 320, arc = true, showDeg = false } = {}) => {
    const cx = size / 2, cy = size * 0.7, R = size * 0.42;
    const a0 = -rot * Math.PI / 180, a1 = -(rot + deg) * Math.PI / 180;
    const p = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    let s = '';
    if (protractor) {
      // protractor aligned with the first arm (rot=0 only, so reading is exact)
      s += `<path class="prot" d="M ${cx - R - 10} ${cy} A ${R + 10} ${R + 10} 0 0 1 ${cx + R + 10} ${cy} Z"/>`;
      for (let d = 0; d <= 180; d += 1) {
        const a = -d * Math.PI / 180, L = d % 10 === 0 ? 16 : d % 5 === 0 ? 11 : 6;
        s += line(cx + (R + 10) * Math.cos(a), cy + (R + 10) * Math.sin(a), cx + (R + 10 - L) * Math.cos(a), cy + (R + 10 - L) * Math.sin(a), 'ln hair');
        if (d % 10 === 0) { const q = [cx + (R - 16) * Math.cos(a), cy + (R - 16) * Math.sin(a) + 4]; s += text(q[0], q[1], d, 'tx xs'); }
      }
    }
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    if (arc) {
      const r = deg === 90 ? 0 : 34;
      if (deg === 90) {
        const u = [Math.cos(a0), Math.sin(a0)], v = [Math.cos(a1), Math.sin(a1)], k = 22;
        s += polyl([[cx + u[0] * k, cy + u[1] * k], [cx + (u[0] + v[0]) * k, cy + (u[1] + v[1]) * k], [cx + v[0] * k, cy + v[1] * k]], 'ln arc');
      } else {
        const big = deg > 180 ? 1 : 0;
        s += `<path class="ln arc" fill="none" d="M ${r2(cx + r * Math.cos(a0))} ${r2(cy + r * Math.sin(a0))} A ${r} ${r} 0 ${big} 0 ${r2(cx + r * Math.cos(a1))} ${r2(cy + r * Math.sin(a1))}"/>`;
      }
    }
    s += line(cx, cy, x0, y0, 'ln thick') + line(cx, cy, x1, y1, 'ln thick') + `<circle class="pt" cx="${cx}" cy="${cy}" r="4"/>`;
    if (showDeg) s += text(cx + 50 * Math.cos((a0 + a1) / 2), cy + 50 * Math.sin((a0 + a1) / 2) + 5, deg + '°', 'tx b');
    return svg(size, size * 0.78, s, label, 'angle');
  };

  /* ---------------- Ruler + segment (to scale: 1 cm = CM px) -------- */
  F.ruler = (mm, { start = 0, label = '', maxCm = 12 } = {}) => {
    // segment from start mm to start+mm mm; ruler 0..maxCm
    const ox = 20, w = maxCm * CM + 40; let s = `<rect class="ruler" x="${ox - 10}" y="44" width="${maxCm * CM + 20}" height="54" rx="4"/>`;
    for (let i = 0; i <= maxCm * 10; i++) {
      const x = ox + i * CM / 10, L = i % 10 === 0 ? 22 : i % 5 === 0 ? 15 : 9;
      s += line(x, 44, x, 44 + L, 'ln hair');
      if (i % 10 === 0) s += text(x, 86, i / 10, 'tx xs');
    }
    const x0 = ox + start * CM / 10, x1 = ox + (start + mm) * CM / 10;
    s += line(x0, 30, x1, 30, 'ln seg') + line(x0, 22, x0, 38, 'ln seg') + line(x1, 22, x1, 38, 'ln seg');
    s += line(x0, 30, x0, 44, 'ln dash') + line(x1, 30, x1, 44, 'ln dash');
    return svg(w, 104, s, label, 'rulerfig');
  };

  /* ---------------- Circle with radius / diameter ---------------- */
  F.circle = (r, { show = 'r', unit = 'cm', label = '', text1 = '' } = {}) => {
    const R = 80, c = 100; let s = `<circle class="shape" cx="${c}" cy="${c}" r="${R}"/><circle class="pt" cx="${c}" cy="${c}" r="4"/>`;
    if (show === 'r') s += line(c, c, c + R, c, 'ln thick') + text(c + R / 2, c - 8, text1, 'tx b');
    if (show === 'd') s += line(c - R, c, c + R, c, 'ln thick') + text(c, c - 8, text1, 'tx b');
    return svg(200, 200, s, label);
  };

  /* ---------------- Triangles / quadrilaterals for classification ---- */
  F.shape = (pts, { marks = [], rightAngles = [], label = '', scale = 30, ticks = [], padL = 20 } = {}) => {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xs), maxY = Math.max(...ys);
    const P = p => [padL + (p[0] - minX) * scale, 20 + (maxY - p[1]) * scale];
    let s = poly(pts.map(P), 'shape');
    rightAngles.forEach(i => {
      const A = pts[i], B = pts[(i + 1) % pts.length], C = pts[(i - 1 + pts.length) % pts.length];
      const u = [(B[0] - A[0]), (B[1] - A[1])], v = [(C[0] - A[0]), (C[1] - A[1])];
      const nu = Math.hypot(...u), nv = Math.hypot(...v), k = 0.5;
      const p1 = [A[0] + u[0] / nu * k, A[1] + u[1] / nu * k], p3 = [A[0] + v[0] / nv * k, A[1] + v[1] / nv * k], p2 = [p1[0] + v[0] / nv * k, p1[1] + v[1] / nv * k];
      s += polyl([P(p1), P(p2), P(p3)], 'ln thin');
    });
    // equal-side tick marks: ticks = [[sideIndex, count]]
    ticks.forEach(([i, n]) => {
      const A = P(pts[i]), B = P(pts[(i + 1) % pts.length]);
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
      const nx = -dy / L * 7, ny = dx / L * 7, tx = dx / L * 5, ty = dy / L * 5;
      for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2); s += line(mx + tx * o - nx, my + ty * o - ny, mx + tx * o + nx, my + ty * o + ny, 'ln'); }
    });
    return svg((maxX - minX) * scale + padL + 20, (maxY - minY) * scale + 40, s, label);
  };

  /* ---------------- Solids (oblique drawing) ---------------- */
  F.solid = (type, { label = '', size = 170 } = {}) => {
    const s0 = size; let s = '';
    const L = (pts, cls) => polyl(pts, cls);
    switch (type) {
      case 'cube': case 'cuboid': {
        const w = type === 'cube' ? 80 : 110, h = 80, d = type === 'cube' ? 40 : 30, x = 30, y = 60;
        s += poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 'face1') + poly([[x, y], [x + d, y - d], [x + w + d, y - d], [x + w, y]], 'face2') + poly([[x + w, y], [x + w + d, y - d], [x + w + d, y + h - d], [x + w, y + h]], 'face3');
        s += L([[x, y + h], [x + d, y + h - d], [x + w + d, y + h - d]], 'ln dash') + line(x + d, y - d, x + d, y + h - d, 'ln dash');
        break;
      }
      case 'pyramid': {
        const A = [30, 130], B = [120, 130], C = [150, 105], D = [60, 105], T = [88, 20];
        s += poly([A, B, T], 'face1') + poly([B, C, T], 'face3') + L([A, D, C], 'ln dash') + line(D[0], D[1], T[0], T[1], 'ln dash');
        break;
      }
      case 'tripyramid': {
        const A = [30, 130], B = [130, 130], C = [95, 100], T = [80, 22];
        s += poly([A, B, T], 'face1') + L([A, C, B], 'ln dash') + line(C[0], C[1], T[0], T[1], 'ln dash');
        break;
      }
      case 'prism': {
        const A = [25, 135], B = [75, 135], C = [50, 92], d = [80, -30];
        const A2 = [A[0] + d[0], A[1] + d[1]], B2 = [B[0] + d[0], B[1] + d[1]], C2 = [C[0] + d[0], C[1] + d[1]];
        s += poly([A, B, C], 'face1') + poly([B, B2, C2, C], 'face3') + poly([C, C2, A2, A], 'face2');
        s += L([A, A2, B2], 'ln dash');
        // A-A2 hidden bottom edge, A2-C2 visible top
        break;
      }
      case 'cylinder': {
        s += `<rect class="face1" x="40" y="40" width="90" height="90"/><ellipse class="face2" cx="85" cy="40" rx="45" ry="14"/>`;
        s += `<path class="face1" d="M 40 130 A 45 14 0 0 0 130 130" /><path class="ln dash" fill="none" d="M 40 130 A 45 14 0 0 1 130 130"/>`;
        s += line(40, 40, 40, 130) + line(130, 40, 130, 130);
        break;
      }
      case 'cone': {
        s += `<path class="face1" d="M 40 130 L 85 25 L 130 130 A 45 14 0 0 1 40 130 Z"/><path class="ln dash" fill="none" d="M 40 130 A 45 14 0 0 1 130 130"/>`;
        break;
      }
      case 'sphere': {
        s += `<circle class="face1" cx="85" cy="85" r="60"/><path class="ln dash" fill="none" d="M 25 85 A 60 18 0 0 1 145 85"/><path class="ln" fill="none" d="M 25 85 A 60 18 0 0 0 145 85"/>`;
        break;
      }
      case 'hexprism': {
        const hx = (cx, cy, rx, ry) => [0, 1, 2, 3, 4, 5].map(k => [cx + rx * Math.cos(Math.PI / 3 * k), cy + ry * Math.sin(Math.PI / 3 * k)]);
        const top = hx(85, 40, 50, 16), bot = hx(85, 125, 50, 16);
        s += poly([top[0], bot[0], bot[1], bot[2], bot[3], top[3], top[2], top[1]], 'face1') + poly(top, 'face2');
        [0, 1, 2, 3].forEach(k => s += line(top[k][0], top[k][1], bot[k][0], bot[k][1]));
        s += L([bot[3], bot[4], bot[5], bot[0]], 'ln dash');
        break;
      }
    }
    return svg(s0, s0 * 0.9, s, label, 'solid');
  };

  /* ---------------- Nets ---------------- */
  // cube net from list of cells [[x,y],...]
  F.cubeNet = (cells, { cell = 30, label = '', cls = '' } = {}) => {
    const mx = Math.max(...cells.map(c => c[0])) + 1, my = Math.max(...cells.map(c => c[1])) + 1;
    let s = cells.map(c => `<rect class="netface" x="${2 + c[0] * cell}" y="${2 + c[1] * cell}" width="${cell}" height="${cell}"/>`).join('');
    return svg(mx * cell + 4, my * cell + 4, s, label, 'net ' + cls);
  };
  F.net = (type, { label = '' } = {}) => {
    let s = '';
    switch (type) {
      case 'pyramid': {
        const c = 75, h = 28; // square base 50, triangles of height 45
        s += poly([[50, 50], [100, 50], [100, 100], [50, 100]], 'netface') + poly([[50, 50], [100, 50], [75, 8]], 'netface') + poly([[100, 50], [100, 100], [142, 75]], 'netface') + poly([[50, 100], [100, 100], [75, 142]], 'netface') + poly([[50, 50], [50, 100], [8, 75]], 'netface');
        return svg(150, 150, s, label, 'net');
      }
      case 'prism': {
        s += [0, 1, 2].map(i => poly([[30 + i * 50, 40], [80 + i * 50, 40], [80 + i * 50, 110], [30 + i * 50, 110]], 'netface')).join('');
        s += poly([[80, 40], [130, 40], [105, 0]], 'netface') + poly([[80, 110], [130, 110], [105, 150]], 'netface');
        return svg(190, 152, s, label, 'net');
      }
      case 'cylinder':
        s += `<rect class="netface" x="20" y="50" width="160" height="60"/><circle class="netface" cx="60" cy="27" r="23"/><circle class="netface" cx="60" cy="133" r="23"/>`;
        return svg(200, 160, s, label, 'net');
      case 'cone':
        s += `<path class="netface" d="M 90 10 L 30 110 A 70 70 0 0 0 150 110 Z"/><circle class="netface" cx="90" cy="150" r="24"/>`;
        return svg(180, 180, s, label, 'net');
      case 'cuboid': {
        const c = [[1, 0, 2, 1], [0, 1, 1, 2], [1, 1, 2, 2], [2, 1, 3, 2], [3, 1, 4, 2], [1, 2, 2, 3]];
        // widths: columns 0..4 = 30, 50, 30, 50 ; rows 0..3 = 30, 40, 30
        const X = [0, 30, 80, 110, 160], Y = [0, 30, 70, 100];
        s += c.map(([a, b, cc, d]) => `<rect class="netface" x="${2 + X[a]}" y="${2 + Y[b]}" width="${X[cc] - X[a]}" height="${Y[d] - Y[b]}"/>`).join('');
        return svg(166, 106, s, label, 'net');
      }
      case 'cube': return F.cubeNet([[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], { label });
    }
    return svg(10, 10, '', label);
  };

  /* ---------------- Cube buildings (isometric) from a height map ----
   * hm[y][x] = number of cubes stacked on cell (x,y); y=0 is the back row */
  F.cubes = (hm, { s = 26, label = '' } = {}) => {
    const rows = hm.length, cols = hm[0].length, c = Math.cos(Math.PI / 6) * s, k = s / 2;
    const P = (x, y, z) => [(x - y) * c, (x + y) * k - z * s];
    const cubesList = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) for (let z = 0; z < hm[y][x]; z++) cubesList.push([x, y, z]);
    cubesList.sort((A, B) => (A[0] + A[1] + A[2]) - (B[0] + B[1] + B[2]) || A[2] - B[2]);
    let b = '', minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    const faces = [];
    cubesList.forEach(([x, y, z]) => {
      const top = [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
      const right = [P(x + 1, y, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x + 1, y, z + 1)];
      const left = [P(x, y + 1, z), P(x + 1, y + 1, z), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
      faces.push([top, 'face2'], [right, 'face3'], [left, 'face1']);
      [...top, ...right, ...left].forEach(p => { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    });
    faces.forEach(([pts, cls]) => b += poly(pts.map(p => [p[0] - minX + 6, p[1] - minY + 6]), cls + ' cube'));
    return svg(maxX - minX + 12, maxY - minY + 12, b, label, 'cubes');
  };
  // cuboid a × b × c made of unit cubes
  F.cuboidCubes = (a, b, c, opts = {}) => F.cubes(Array.from({ length: b }, () => Array(a).fill(c)), opts);
  // a 2D view (silhouette) as list of column heights
  F.view = (heights, { s = 22, label = '' } = {}) => {
    const H = Math.max(...heights, 1); let b = '';
    heights.forEach((h, i) => { for (let z = 0; z < h; z++) b += `<rect class="face1" x="${2 + i * s}" y="${2 + (H - 1 - z) * s}" width="${s}" height="${s}"/>`; });
    b += line(0, 2 + H * s, heights.length * s + 4, 2 + H * s, 'ln');
    return svg(heights.length * s + 4, H * s + 6, b, label, 'view');
  };

  /* ---------------- Measuring instruments ---------------- */
  // analogue clock (12-hour dial; 24-h reading is asked in the prompt)
  F.clock = (h, m, { label = '', size = 180 } = {}) => {
    const c = size / 2, R = c - 8; let s = `<circle class="dial" cx="${c}" cy="${c}" r="${R}"/>`;
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, L = i % 5 === 0 ? 12 : 5; s += line(c + R * Math.sin(a), c - R * Math.cos(a), c + (R - L) * Math.sin(a), c - (R - L) * Math.cos(a), i % 5 === 0 ? 'ln' : 'ln hair'); }
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += text(c + (R - 26) * Math.sin(a), c - (R - 26) * Math.cos(a) + 6, i, 'tx'); }
    const am = m * Math.PI / 30, ah = ((h % 12) + m / 60) * Math.PI / 6;
    s += line(c, c, c + (R - 40) * Math.sin(ah), c - (R - 40) * Math.cos(ah), 'hand hh') + line(c, c, c + (R - 16) * Math.sin(am), c - (R - 16) * Math.cos(am), 'hand mh') + `<circle class="pt" cx="${c}" cy="${c}" r="5"/>`;
    return svg(size, size, s, label, 'clock');
  };
  // measuring jug: capacity max (ml), level (ml), graduation step (ml)
  F.jug = (max, level, step, { label = '', unit = 'ml', lang = 'fr' } = {}) => {
    const x = 60, y = 20, w = 110, h = 220; let s = `<rect class="water" x="${x}" y="${y + h - h * level / max}" width="${w}" height="${h * level / max}"/><rect class="glass" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
    for (let v = 0; v <= max; v += step) {
      const yy = y + h - h * v / max, major = v % (step * 2) === 0 || step * 2 > max;
      s += line(x, yy, x + (major ? 26 : 14), yy, 'ln');
      if (major) s += text(x - 6, yy + 5, MQ.fmtNum(v, lang), 'tx xs', 'end');
    }
    s += text(x + w / 2, y + h + 22, unit, 'tx sm');
    return svg(200, 270, s, label, 'jug');
  };
  // kitchen scale dial: max (g), value (g), step (g)
  F.scale = (max, value, step, { label = '', lang = 'fr' } = {}) => {
    const c = 120, R = 95; let s = `<circle class="dial" cx="${c}" cy="${c}" r="${R + 8}"/>`;
    const ang = v => -Math.PI * 0.75 + (v / max) * Math.PI * 1.5;
    for (let v = 0; v <= max; v += step) { const a = ang(v), major = v % (step * 5) === 0; s += line(c + R * Math.sin(a), c - R * Math.cos(a), c + (R - (major ? 14 : 7)) * Math.sin(a), c - (R - (major ? 14 : 7)) * Math.cos(a), major ? 'ln' : 'ln hair'); if (major && (max / (step * 5) <= 12 || v % (step * 10) === 0)) s += text(c + (R - 30) * Math.sin(a), c - (R - 30) * Math.cos(a) + 5, MQ.fmtNum(v, lang), 'tx xs'); }
    const a = ang(value); s += line(c, c, c + (R - 10) * Math.sin(a), c - (R - 10) * Math.cos(a), 'hand mh') + `<circle class="pt" cx="${c}" cy="${c}" r="6"/>` + text(c, c + 50, 'g', 'tx sm');
    return svg(240, 240, s, label, 'scalefig');
  };

  /* ---------------- Charts ---------------- */
  F.barChart = (labels, values, { max = null, step = null, label = '', interactive = false, yName = '' } = {}) => {
    max = max || Math.max(...values, 1); step = step || niceStep(max);
    const top = Math.ceil(max / step) * step, W = 70 * labels.length + 70, H = 260, ox = 56, oy = 220, sc = 190 / top;
    let s = '';
    for (let v = 0; v <= top; v += step) s += line(ox, oy - v * sc, W - 10, oy - v * sc, 'grid') + text(ox - 8, oy - v * sc + 5, v, 'tx xs', 'end');
    labels.forEach((lb, i) => {
      const x = ox + 16 + i * 70;
      s += `<rect class="barv ${interactive ? 'ibar' : ''}" data-i="${i}" x="${x}" y="${oy - values[i] * sc}" width="40" height="${values[i] * sc}"/>`;
      s += text(x + 20, oy + 20, lb, 'tx xs');
      if (interactive) for (let v = 0; v <= top; v += step / (step >= 2 && step % 2 === 0 ? 2 : 1)) s += `<rect class="hit barhit" data-i="${i}" data-v="${v}" x="${x - 10}" y="${oy - v * sc - 5}" width="60" height="10" fill="transparent"/>`;
    });
    s += line(ox, oy, W - 10, oy, 'axis') + line(ox, oy, ox, 20, 'axis') + (yName ? text(ox, 12, yName, 'tx xs b', 'start') : '');
    return svg(W, H, s, label, 'chart');
  };
  F.lineChart = (labels, values, { max = null, step = null, label = '', yName = '', interactive = false } = {}) => {
    max = max || Math.max(...values, 1); step = step || niceStep(max);
    const top = Math.ceil(max / step) * step, W = 60 * labels.length + 80, ox = 56, oy = 220, sc = 190 / top;
    let s = '';
    for (let v = 0; v <= top; v += step) s += line(ox, oy - v * sc, W - 10, oy - v * sc, 'grid') + text(ox - 8, oy - v * sc + 5, v, 'tx xs', 'end');
    const pts = values.map((v, i) => [ox + 30 + i * 60, oy - v * sc]);
    if (interactive) labels.forEach((_, i) => { s += line(ox + 30 + i * 60, oy, ox + 30 + i * 60, oy - top * sc, 'grid'); for (let v = 0; v <= top; v += step / (step >= 2 && step % 2 === 0 ? 2 : 1)) s += `<rect class="hit barhit" data-i="${i}" data-v="${v}" x="${ox + 10 + i * 60}" y="${oy - v * sc - 5}" width="40" height="10" fill="transparent"/>`; });
    s += polyl(pts, 'ln thick series') + pts.map((p, i) => `<circle class="pt${interactive ? ' ibar' : ''}" data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="${interactive ? 7 : 5}"/>`).join('');
    labels.forEach((lb, i) => s += text(ox + 30 + i * 60, oy + 20, lb, 'tx xs'));
    s += line(ox, oy, W - 10, oy, 'axis') + line(ox, oy, ox, 20, 'axis') + (yName ? text(ox, 12, yName, 'tx xs b', 'start') : '');
    return svg(W, 250, s, label, 'chart');
  };
  // pie chart with parts as fractions summing to 1 ([{q:Q, name}])
  F.pieChart = (parts, { label = '' } = {}) => {
    const c = 110, r = 100; let s = '', acc = 0;
    parts.forEach((p, i) => {
      const f = p.q.toNumber(), a0 = -Math.PI / 2 + acc * 2 * Math.PI, a1 = a0 + f * 2 * Math.PI; acc += f;
      const big = f > 0.5 ? 1 : 0;
      s += f >= 0.9999 ? `<circle class="slice s${i}" cx="${c}" cy="${c}" r="${r}"/>` :
        `<path class="slice s${i}" d="M ${c} ${c} L ${r2(c + r * Math.cos(a0))} ${r2(c + r * Math.sin(a0))} A ${r} ${r} 0 ${big} 1 ${r2(c + r * Math.cos(a1))} ${r2(c + r * Math.sin(a1))} Z"/>`;
      const am = (a0 + a1) / 2; s += text(c + r * 0.6 * Math.cos(am), c + r * 0.6 * Math.sin(am) + 5, String.fromCharCode(65 + i), 'tx b onslice');
    });
    return svg(220, 220, s, label, 'chart');
  };
  function niceStep(max) { const cands = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]; return cands.find(c => max / c <= 8) || 1000; }
  F.niceStep = niceStep;

  /* ---------------- Frieze motifs: an asymmetric "flag" ------------
   * t = transformation index 0..7 (4 rotations, 4 reflected rotations) */
  F.motif = (t, { size = 56, cls = '' } = {}) => {
    const base = [[-14, 16], [-14, -18], [12, -10], [-6, -2], [-6, 16]];
    const rot = (t % 4) * Math.PI / 2, refl = t >= 4;
    const pts = base.map(([x, y]) => { if (refl) x = -x; return [x * Math.cos(rot) - y * Math.sin(rot) + size / 2, x * Math.sin(rot) + y * Math.cos(rot) + size / 2]; });
    return svg(size, size, `<rect class="tile" x="1" y="1" width="${size - 2}" height="${size - 2}" rx="6"/>` + poly(pts, 'motif ' + cls), '', 'motif');
  };

  /* ---------------- Tangram (7 pieces in a 4×4 square) ------------- */
  F.tangram = (highlight = [], { label = '' } = {}) => {
    const S = 50; // 1 unit = 50 px, square 4×4 units
    const pieces = F.TANGRAM;
    let s = '';
    pieces.forEach((p, i) => s += poly(p.pts.map(q => [6 + q[0] * S, 6 + q[1] * S]), 'tan ' + (highlight.includes(i) ? 'on' : '')) + text(6 + p.c[0] * S, 6 + p.c[1] * S + 6, p.name, 'tx b'));
    return svg(4 * S + 12, 4 * S + 12, s, label, 'tangram');
  };
  // areas in small-triangle units (small triangle = 1): square 4×4 = 16
  F.TANGRAM = [
    { name: 'A', pts: [[0, 0], [4, 0], [2, 2]], area: 4, c: [2, 0.7] },        // large triangle
    { name: 'B', pts: [[0, 0], [2, 2], [0, 4]], area: 4, c: [0.7, 2] },        // large triangle
    { name: 'C', pts: [[4, 0], [4, 2], [3, 1]], area: 1, c: [3.65, 1] },       // small triangle
    { name: 'D', pts: [[2, 2], [3, 1], [4, 2], [3, 3]], area: 2, c: [3, 2] },  // square
    { name: 'E', pts: [[2, 2], [3, 3], [1, 3]], area: 1, c: [2, 2.7] },        // small triangle
    { name: 'F', pts: [[0, 4], [1, 3], [3, 3], [2, 4]], area: 2, c: [1.5, 3.55] }, // parallelogram
    { name: 'G', pts: [[2, 4], [4, 2], [4, 4]], area: 2, c: [3.4, 3.4] }       // medium triangle
  ];

  /* ---------------- Bar models (schemas for word problems) --------- */
  F.barModel = (segments, { total = null, label = '', width = 420 } = {}) => {
    // segments: [{w (relative), text, cls}]
    const sum = segments.reduce((a, s) => a + s.w, 0); let x = 10, s = '';
    segments.forEach((sg, i) => { const w = (width - 20) * sg.w / sum; s += `<rect class="bm ${sg.cls || 'b' + (i % 3)}" x="${r2(x)}" y="20" width="${r2(w)}" height="44"/>` + text(x + w / 2, 48, sg.text, 'tx sm b'); x += w; });
    if (total) s += `<path class="ln" fill="none" d="M 10 74 q 0 10 10 10 L ${width / 2 - 10} 84 q 10 0 10 10 q 0 -10 10 -10 L ${width - 20} 84 q 10 0 10 -10"/>` + text(width / 2, 116, total, 'tx sm b');
    return svg(width, total ? 124 : 74, s, label, 'barmodel');
  };

  /* ---------------- Money ---------------- */
  F.money = (items, { label = '', lang = 'fr' } = {}) => {
    // items: values in cents, e.g. [500, 200, 50]
    let x = 6, s = '';
    items.forEach(v => {
      if (v >= 500) { s += `<rect class="note n${v}" x="${x}" y="10" width="96" height="52" rx="6"/>` + text(x + 48, 44, (v / 100) + ' €', 'tx b'); x += 104; }
      else { const r = v >= 100 ? 22 : 18; s += `<circle class="coin c${v}" cx="${x + r}" cy="36" r="${r}"/>` + text(x + r, 41, v >= 100 ? (v / 100) + '€' : v + 'ct', 'tx xs b'); x += 2 * r + 8; }
    });
    return svg(x + 6, 72, s, label, 'money');
  };

  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
