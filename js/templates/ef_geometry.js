/* =====================================================================
 * Templates — C4 Espace et formes. Stages: ef_coord, ef_angles,
 * ef_shapes, ef_solids, ef_sym, ef_area, ef_volume.
 * Figures are drawn to scale on squared paper (1 square = 1 unit) or with
 * the virtual protractor; nets are validated by a folding algorithm.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const T = MQ.T, { Q, m, num, frac, fr, field, mcValues, mcMsgs, names } = T.h;
  const F = MQ.fig;
  const L4 = String.fromCharCode;
  const cm = (v, u = 'cm') => ({ unit: u, val: MQ.Q.of(v) });

  /* ================= cube-net folding (source of truth for nets) ====== */
  // roll a cube over the net; each cell receives the face that touches it
  function foldNet(cells) {
    const key = c => c[0] + ',' + c[1];
    const set = new Map(cells.map((c, i) => [key(c), i]));
    const faceOf = new Array(cells.length).fill(null);
    const start = { B: 0, T: 1, N: 2, S: 3, E: 4, W: 5 };
    faceOf[0] = start; const queue = [0];
    const roll = (o, dir) => dir === 'E' ? { B: o.E, E: o.T, T: o.W, W: o.B, N: o.N, S: o.S } :
      dir === 'W' ? { B: o.W, W: o.T, T: o.E, E: o.B, N: o.N, S: o.S } :
        dir === 'S' ? { B: o.S, S: o.T, T: o.N, N: o.B, E: o.E, W: o.W } : { B: o.N, N: o.T, T: o.S, S: o.B, E: o.E, W: o.W };
    while (queue.length) {
      const i = queue.shift(), [x, y] = cells[i];
      for (const [dx, dy, d] of [[1, 0, 'E'], [-1, 0, 'W'], [0, 1, 'S'], [0, -1, 'N']]) {
        const j = set.get(key([x + dx, y + dy]));
        if (j != null && faceOf[j] == null) { faceOf[j] = roll(faceOf[i], d); queue.push(j); }
      }
    }
    if (faceOf.some(f => f == null)) return null;
    const bottoms = faceOf.map(f => f.B);
    return new Set(bottoms).size === 6 ? bottoms : null;     // face index per cell, or null if it does not fold
  }
  const OPP = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4 };
  function normCells(cells) { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(c => [c[0] - mx, c[1] - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); }
  function canonShape(cells) {
    const vars = []; let cur = cells;
    for (let k = 0; k < 4; k++) { cur = cur.map(([x, y]) => [y, -x]); vars.push(normCells(cur)); vars.push(normCells(cur.map(([x, y]) => [-x, y]))); }
    return vars.map(v => JSON.stringify(v)).sort()[0];
  }
  function randomHexomino(r) {
    const cells = [[0, 0]]; const has = (x, y) => cells.some(c => c[0] === x && c[1] === y);
    while (cells.length < 6) { const c = r.pick(cells); const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); if (!has(c[0] + dx, c[1] + dy)) cells.push([c[0] + dx, c[1] + dy]); }
    return normCells(cells);
  }
  function randomNet(r, valid) {
    for (let g = 0; g < 2000; g++) { const c = randomHexomino(r); const w = Math.max(...c.map(p => p[0])), h = Math.max(...c.map(p => p[1])); if (w > 4 || h > 4) continue; if (!!foldNet(c) === valid) return c; }
    return valid ? [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] : [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]];
  }
  T.foldNet = foldNet; T.canonShape = canonShape;

  /* ================= coordinates ================= */
  T.add({
    id: 'coord_read', stage: 'ef_coord', objectives: ['EF.1.1', 'EF.C1'], mt: ['MT.61'],
    gen(r, L) {
      const W = 10, H = 8;
      const pt = () => [L === 3 ? r.pick([0, r.int(1, W)]) : r.int(1, W), L === 3 ? r.int(0, H) : r.int(1, H)];
      let A = pt(); if (A[0] === A[1]) A = [A[0], (A[1] % H) + 1 === A[0] ? A[1] : (A[1] % H) + 1];
      if (A[0] === A[1]) A[1] = A[1] === H ? 1 : A[1] + 1;
      if (L === 4) {
        let B; do { B = [r.int(0, W), r.int(0, H)]; } while ((A[0] + B[0]) % 2 || (A[1] + B[1]) % 2 || (A[0] === B[0] && A[1] === B[1]));
        const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        return {
          prompt: m('t.coord_read.q4'), figure: F.coord(W, H, { points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }], segments: [[A[0], A[1], B[0], B[1], 'ln dash']] }),
          widget: { type: 'input', fields: [field('x', new MQ.Q(M[0]), { label: m('w.x') }), field('y', new MQ.Q(M[1]), { label: m('w.y') })] },
          answer: m('c.coord', { x: M[0], y: M[1] }), explain: m('t.coord_read.ex4', { a: A[0], b: A[1], c: B[0], d: B[1], x: M[0], y: M[1] })
        };
      }
      return {
        prompt: m('t.coord_read.q'), figure: F.coord(W, H, { points: [{ x: A[0], y: A[1], label: 'A' }] }),
        widget: { type: 'input', fields: [field('x', new MQ.Q(A[0]), { label: m('w.x') }), field('y', new MQ.Q(A[1]), { label: m('w.y') })] },
        diagnose: v => v.x && v.y && v.x.eq(A[1]) && v.y.eq(A[0]) ? m('fb.swapXY') : null,
        answer: m('c.coord', { x: A[0], y: A[1] }), explain: m('t.coord_read.ex', { x: A[0], y: A[1] }),
        wrong: A[0] !== A[1] ? [{ fields: { x: String(A[1]), y: String(A[0]) } }] : []
      };
    }
  });

  T.add({
    id: 'coord_plot', stage: 'ef_coord', objectives: ['EF.1.1', 'EF.C1', 'EF.2.4'], mt: ['MT.62', 'MT.63'],
    gen(r, L) {
      const W = 10, H = 8;
      if (L <= 2) {
        const n = L; const pts = []; while (pts.length < n) { const p = [r.int(0, W), r.int(0, H)]; if (p[0] !== p[1] && !pts.some(q => (q[0] === p[0] && q[1] === p[1]) || (q[0] === p[1] && q[1] === p[0]))) pts.push(p); }
        return {
          prompt: m(n === 1 ? 't.coord_plot.q1' : 't.coord_plot.q2', { a: { raw: '(' + pts[0].join(' ; ') + ')' }, b: { raw: pts[1] ? '(' + pts[1].join(' ; ') + ')' : '' } }),
          widget: { type: 'point', w: W, h: H, max: n, targets: pts },
          answer: m('c.coord', { x: pts[0][0], y: pts[0][1] }), explain: m('t.coord_plot.ex'),
          wrong: [{ points: pts.map(p => [p[1], p[0]]) }]
        };
      }
      // L3: 4th vertex of a rectangle (axis-parallel) ; L4: 4th vertex of a parallelogram
      let A, B, C, D;
      if (L === 3) { const x0 = r.int(0, 5), y0 = r.int(0, 3), w = r.int(2, 5), h = r.int(2, 5); A = [x0, y0]; B = [x0 + w, y0]; C = [x0 + w, y0 + h]; D = [x0, y0 + h]; }
      else { const x0 = r.int(0, 3), y0 = r.int(0, 3), w = r.int(3, 5), s = r.int(1, 3), h = r.int(2, 4); A = [x0, y0]; B = [x0 + w, y0]; C = [x0 + w + s, y0 + h]; D = [x0 + s, y0 + h]; }
      if ([A, B, C, D].some(p => p[0] > W || p[1] > H)) return this.gen(r, L);
      return {
        prompt: m(L === 3 ? 't.coord_plot.q3' : 't.coord_plot.q4'),
        figure: null,
        widget: { type: 'point', w: W, h: H, max: 1, targets: [D], given: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }, { x: C[0], y: C[1], label: 'C' }], segs: [[A[0], A[1], B[0], B[1]], [B[0], B[1], C[0], C[1]]] },
        answer: m('c.coordNamed', { n: 'D', x: D[0], y: D[1] }), explain: m(L === 3 ? 't.coord_plot.ex3' : 't.coord_plot.ex4', { x: D[0], y: D[1] })
      };
    }
  });

  const PLACES = ['school', 'bakery', 'bus', 'castle', 'park', 'pool', 'stadium', 'home'];
  T.add({
    id: 'map_route', stage: 'ef_coord', objectives: ['EF.1.2', 'EF.1.3', 'EF.1.4', 'EF.C9'], mt: ['MT.70'],
    gen(r, L) {
      const W = 10, H = 8; const icons = []; const used = new Set();
      r.sample(PLACES, 6).forEach(type => { let p; do { p = [r.int(0, W), r.int(0, H)]; } while (used.has(p.join())); used.add(p.join()); icons.push({ type, x: p[0], y: p[1] }); });
      const fig = lang => F.coord(W, H, { icons: icons.map(ic => ({ ...ic, label: MQ.t('place.' + ic.type, {}, lang) })) });
      if (L === 1) {
        const ic = r.pick(icons);
        return { prompt: m('t.map_route.q1', { a: { raw: '(' + ic.x + ' ; ' + ic.y + ')' } }), figure: lang => F.coord(W, H, { icons: icons.map(i => ({ ...i })) }) + `<p class="legend">${icons.map(i => `<span>${F.svg(30, 30, F.icon(i.type, 15, 17), '')} ${MQ.t('place.' + i.type, {}, lang)}</span>`).join('')}</p>`,
          widget: { type: 'mc', options: r.shuffle(icons.slice(0, 4).concat(icons.slice(0, 4).includes(ic) ? [] : [ic]).slice(-4).map(i => ({ label: m('place.' + i.type), correct: i === ic }))) },
          answer: m('place.' + ic.type), explain: m('t.map_route.ex1') };
      }
      const from = icons[0], others = icons.slice(1);
      if (L === 2) {
        let dx, dy, g = 0; do { dx = r.int(-4, 4); dy = r.int(-4, 4); g++; } while ((dx === 0 || dy === 0 || from.x + dx < 0 || from.x + dx > W || from.y + dy < 0 || from.y + dy > H) && g < 200);
        if (g >= 200) return this.gen(r, L);
        return {
          prompt: m('t.map_route.q2', { p: { k: 'place.' + from.type }, a: Math.abs(dx), d1: { k: dx > 0 ? 'dir.east' : 'dir.west' }, b: Math.abs(dy), d2: { k: dy > 0 ? 'dir.north' : 'dir.south' } }),
          widget: { type: 'point', w: W, h: H, max: 1, targets: [[from.x + dx, from.y + dy]], iconsFn: lang => icons.map(ic => ({ ...ic, label: MQ.t('place.' + ic.type, {}, lang) })) },
          answer: m('c.coord', { x: from.x + dx, y: from.y + dy }), explain: m('t.map_route.ex2', { x: from.x + dx, y: from.y + dy })
        };
      }
      const to = r.pick(others.filter(o => o.x !== from.x && o.y !== from.y).concat(others).slice(0, 3));
      if (L === 3) {
        const sc = r.pick([20, 50, 100, 250]); const steps = Math.abs(to.x - from.x) + Math.abs(to.y - from.y); const dist = steps * sc;
        return {
          prompt: m('t.map_route.q3', { s: sc, a: { k: 'place.' + from.type }, b: { k: 'place.' + to.type } }), figure: fig,
          widget: { type: 'input', fields: [field('a', new MQ.Q(dist), { unit: 'm' })] },
          diagnose: v => v.a && v.a.eq(steps) ? m('t.map_route.m.scale', { s: sc }) : null,
          answer: m('c.unitv', { x: cm(dist, 'm') }), explain: m('t.map_route.ex3', { n: steps, s: sc, x: dist }),
          wrong: [{ fields: { a: String(steps) } }]
        };
      }
      const sc = r.pick([100, 200, 250, 500]); const d = MQ.Q.dec(r.int(12, 95), 1); const real = d.mul(sc);
      return {
        prompt: m('t.map_route.q4', { s: sc, d }),
        widget: { type: 'input', fields: [field('a', real, { unit: 'm' })] },
        diagnose: v => v.a && v.a.eq(real.div(100)) ? m('t.map_route.m.units') : null,
        answer: m('c.unitv', { x: cm(real, 'm') }), explain: m('t.map_route.ex4', { s: sc, d, x: real })
      };
    }
  });

  /* ================= angles ================= */
  const angKind = d => d < 90 ? 'acute' : d === 90 ? 'right' : d < 180 ? 'obtuse' : 'straight';
  T.add({
    id: 'angle_type', stage: 'ef_angles', objectives: ['EF.C6', 'EF.2.9'], mt: ['MT.51'],
    gen(r, L) {
      const kinds = ['acute', 'right', 'obtuse', 'straight'];
      const degOf = k => k === 'acute' ? r.int(2, 8) * 10 + r.pick([0, 5]) : k === 'right' ? 90 : k === 'obtuse' ? r.int(10, 17) * 10 + r.pick([0, 5]) : 180;
      if (L <= 2) {
        const k = r.pick(L === 1 ? ['acute', 'right', 'obtuse'] : kinds); const d = Math.min(degOf(k), k === 'obtuse' ? 175 : 180);
        return {
          prompt: m('t.angle_type.q'), figure: F.angle(d, { rot: L === 2 ? r.int(0, 8) * 10 : 0, arc: k !== 'right' || L === 1 }),
          widget: { type: 'mc', options: kinds.map(kk => ({ label: m('ang.' + kk), correct: kk === k })) },
          answer: m('ang.' + k), explain: m('t.angle_type.ex.' + k)
        };
      }
      if (L === 3) {
        const items = []; const ds = new Set();
        kinds.forEach(k => { const d = degOf(k); ds.add(d); items.push({ label: m('c.deg', { x: d }), bin: kinds.indexOf(k) }); });
        while (items.length < 7) { const k = r.pick(['acute', 'obtuse']); const d = degOf(k); if (ds.has(d)) continue; ds.add(d); items.push({ label: m('c.deg', { x: d }), bin: kinds.indexOf(k) }); }
        return { prompt: m('t.angle_type.q3'), widget: { type: 'bins', bins: kinds.map(k => m('ang.' + k)), items: r.shuffle(items) }, answer: m('c.binsAnswer'), explain: m('t.angle_type.ex3') };
      }
      const st = r.pick([['s1', false], ['s2', true], ['s3', false], ['s4', true], ['s5', false]]);
      return {
        prompt: m('t.angle_type.q4', { s: m('t.angle_type.' + st[0]) }),
        widget: { type: 'tf', truth: st[1], reasons: r.shuffle([{ label: m('t.angle_type.r.' + st[0]), correct: true }, { label: m('t.angle_type.r.wrong1'), correct: false }, { label: m('t.angle_type.r.wrong2'), correct: false }]) },
        answer: m(st[1] ? 'c.true' : 'c.false'), explain: m('t.angle_type.r.' + st[0])
      };
    }
  });

  T.add({
    id: 'angle_measure', stage: 'ef_angles', objectives: ['EF.2.9', 'GM.C6', 'GM.2.3'], mt: ['MT.52', 'MT.59'],
    gen(r, L) {
      if (L === 4) {
        if (r.chance(0.5)) {
          const total = r.pick([90, 180]), a = r.int(2, total / 10 - 2) * 10 + r.pick([0, 5]); const b = total - a;
          return { prompt: m(total === 90 ? 't.angle_measure.q4r' : 't.angle_measure.q4s', { a }), widget: { type: 'input', fields: [field('a', new MQ.Q(b), { unit: '°' })] }, answer: m('c.deg', { x: b }), explain: m('t.angle_measure.ex4', { t: total, a, x: b }) };
        }
        const a = r.int(2, 9) * 5, b = r.int(2, 18) * 5;
        return { prompt: m('t.angle_measure.q4sum', { a, b }), figure: (() => { const s = 300, cx = 150, cy = 210, R = 120; const p = d => [cx + R * Math.cos(-d * Math.PI / 180), cy + R * Math.sin(-d * Math.PI / 180)]; const [x1, y1] = p(0), [x2, y2] = p(a), [x3, y3] = p(a + b); return F.svg(s, 240, F.line(cx, cy, x1, y1, 'ln thick') + F.line(cx, cy, x2, y2, 'ln') + F.line(cx, cy, x3, y3, 'ln thick') + F.text(cx + 60 * Math.cos(-a / 2 * Math.PI / 180), cy + 60 * Math.sin(-a / 2 * Math.PI / 180), a + '°', 'tx sm b') + F.text(cx + 75 * Math.cos(-(a + b / 2) * Math.PI / 180), cy + 75 * Math.sin(-(a + b / 2) * Math.PI / 180), b + '°', 'tx sm b'), ''); })(),
          widget: { type: 'input', fields: [field('a', new MQ.Q(a + b), { unit: '°' })] }, answer: m('c.deg', { x: a + b }), explain: m('t.angle_measure.ex4sum', { a, b, x: a + b }) };
      }
      const d = L === 1 ? r.int(2, 17) * 10 : L === 2 ? r.int(3, 35) * 5 : r.int(12, 168);
      const tol = L === 3 ? 1 : 0; const alt = []; for (let k = -tol; k <= tol; k++) if (k) alt.push(new MQ.Q(d + k));
      return {
        prompt: m('t.angle_measure.q'), figure: F.angle(d, { protractor: true, arc: false, size: 360 }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(d), { unit: '°', alt })] },
        diagnose: v => v.a && v.a.eq(180 - d) && d !== 90 ? m('t.angle_measure.m.otherScale') : null,
        answer: m('c.deg', { x: d }), explain: m('t.angle_measure.ex', { x: d, k: { k: 'ang.' + angKind(d) } }),
        wrong: d !== 90 ? [{ fields: { a: String(180 - d) } }] : []
      };
    }
  });

  T.add({
    id: 'lines', stage: 'ef_angles', objectives: ['EF.C4', 'EF.C5', 'EF.2.10'], mt: ['MT.70'],
    gen(r, L) {
      const W = 10, H = 8; const dirs = [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [-1, 2], [1, 2], [2, -1], [3, 1], [-1, 3]];
      const cross = (u, v) => u[0] * v[1] - u[1] * v[0], dot = (u, v) => u[0] * v[0] + u[1] * v[1];
      if (L <= 2) {
        const want = L === 1 ? 'par' : 'perp';
        const u = r.pick(dirs); const good = want === 'par' ? dirs.filter(v => cross(u, v) === 0) : dirs.filter(v => dot(u, v) === 0);
        if (!good.length) return this.gen(r, L);
        // distractors must look clearly different: at least 20° away from a and from the perpendicular to a, and 15° from each other
        const ang = v => (Math.atan2(v[1], v[0]) * 180 / Math.PI + 180) % 180, gap = (x, y) => { const d = Math.abs(x - y) % 180; return Math.min(d, 180 - d); };
        const other = dirs.filter(v => cross(u, v) !== 0 && dot(u, v) !== 0 && gap(ang(u), ang(v)) >= 20 && gap(ang(u) + 90, ang(v)) >= 20);
        if (other.length < 2) return this.gen(r, L);
        const d1 = r.pick(other), rest = other.filter(v => gap(ang(v), ang(d1)) >= 15); if (!rest.length) return this.gen(r, L);
        const chosen = [r.pick(good), d1, r.pick(rest)];
        const labels = ['b', 'c', 'd'];
        // segments far enough from each other (no crossing, no touching) so that each one is clearly a separate line
        // exact distance between two segments (0 if they cross)
        const ptSeg = (px, py, s) => { const dx = s[2] - s[0], dy = s[3] - s[1], l2 = dx * dx + dy * dy; let t = l2 ? ((px - s[0]) * dx + (py - s[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - s[0] - t * dx, py - s[1] - t * dy); };
        const orient = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
        const segDist = (s1, s2) => { const p1 = [s1[0], s1[1]], p2 = [s1[2], s1[3]], q1 = [s2[0], s2[1]], q2 = [s2[2], s2[3]];
          if (orient(p1, p2, q1) * orient(p1, p2, q2) < 0 && orient(q1, q2, p1) * orient(q1, q2, p2) < 0) return 0;
          return Math.min(ptSeg(s1[0], s1[1], s2), ptSeg(s1[2], s1[3], s2), ptSeg(s2[0], s2[1], s1), ptSeg(s2[2], s2[3], s1)); };
        const placed = [];
        const placeSeg = v => { const k = Math.max(1, Math.floor(4 / Math.max(Math.abs(v[0]), Math.abs(v[1])))); const sx = v[0] * k, sy = v[1] * k;
          for (let g = 0; g < 400; g++) { const x = r.int(1, W - 1), y = r.int(1, H - 1); const sg = [x, y, x + sx, y + sy]; if (sg[2] < 1 || sg[2] > W - 1 || sg[3] < 1 || sg[3] > H - 1) continue; if (placed.every(o => segDist(o, sg) >= 1.4)) { placed.push(sg); return sg; } } return null; };
        const sa = placeSeg(u); const order = r.shuffle([0, 1, 2]);
        const sAll = order.map(i => placeSeg(chosen[i]));
        if (!sa || sAll.some(x => !x)) return this.gen(r, L);
        { const g = sAll[order.indexOf(0)]; if (want === 'par' && cross([g[0] - sa[0], g[1] - sa[1]], u) === 0) return this.gen(r, L); }
        // label at one end of each segment, just beyond it, away from the other segments
        const texts = [];
        const labelFor = (sg, t, cls) => { const d = [sg[2] - sg[0], sg[3] - sg[1]], n = Math.hypot(d[0], d[1]);
          const cands = [[sg[2] + d[0] / n * 0.55, sg[3] + d[1] / n * 0.55], [sg[0] - d[0] / n * 0.55, sg[1] - d[1] / n * 0.55]].filter(p => p[0] >= 0.3 && p[0] <= W - 0.1 && p[1] >= 0.3 && p[1] <= H - 0.1);
          const ok = cands.find(p => placed.every(o => o === sg || segDist(o, [p[0], p[1], p[0], p[1]]) >= 0.7) && texts.every(q => Math.hypot(q.x - p[0], q.y - p[1]) >= 0.8));
          const p = ok || cands[0] || [(sg[0] + sg[2]) / 2 + 0.4, (sg[1] + sg[3]) / 2 + 0.4]; texts.push({ x: p[0], y: p[1], t, cls }); };
        labelFor(sa, 'a', 'b lbl-a'); sAll.forEach((sg, i) => labelFor(sg, labels[i], 'b'));
        const j = order.indexOf(0), correctLabel = labels[j];
        const dirOf = sg => { let dx = sg[2] - sg[0], dy = sg[3] - sg[1]; const g = MQ.gcd(Math.abs(dx), Math.abs(dy)) || 1; dx /= g; dy /= g; if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; } return [dx, dy]; };
        const dirMsg = d => d[1] === 0 ? m('t.lines.dir.h') : d[0] === 0 ? m('t.lines.dir.v') : m(d[1] > 0 ? 't.lines.dir.up' : 't.lines.dir.down', { x: d[0], y: Math.abs(d[1]) });
        return {
          prompt: m(want === 'par' ? 't.lines.q1' : 't.lines.q2'),
          figure: F.coord(W, H, { segments: [[...sa, 'ln thick a']].concat(sAll.map(sg => [...sg, 'ln thick'])), texts }),
          widget: { type: 'mc', layout: 'row', options: labels.map(l => ({ label: { k: 'c.line', v: { l } }, correct: l === correctLabel })) },
          answer: m('c.line', { l: correctLabel }),
          explain: m(want === 'par' ? 't.lines.ex1b' : 't.lines.ex2b', { l: correctLabel, da: dirMsg(dirOf(sa)), dl: dirMsg(dirOf(sAll[j])) }),
          selfCheck: () => { const A = dirOf(sa); return sAll.every((sg, i) => { const D = dirOf(sg), rel = want === 'par' ? cross(A, D) === 0 : dot(A, D) === 0; return i === j ? rel : !rel && cross(A, D) !== 0 && dot(A, D) !== 0; }) && placed.every((x, i) => placed.every((y, k) => i === k || segDist(x, y) >= 1.4)); }
        };
      }
      // L3: place D so that (CD) ⟂ (AB) ; L4: place D so that CD ∥ AB and CD = AB
      const u = r.pick(dirs.slice(0, 8)); const A = [r.int(1, 4), r.int(1, 3)], B = [A[0] + u[0] * 2, A[1] + u[1] * 2];
      if (B[0] < 0 || B[0] > W || B[1] < 0 || B[1] > H) return this.gen(r, L);
      const C = [r.int(4, 8), r.int(3, 6)];
      if ((C[0] === A[0] && C[1] === A[1]) || (C[0] === B[0] && C[1] === B[1]) || cross([B[0] - A[0], B[1] - A[1]], [C[0] - A[0], C[1] - A[1]]) === 0) return this.gen(r, L);
      const v = [B[0] - A[0], B[1] - A[1]];
      const check = L === 3
        ? pts => { if (pts.length !== 1) return { correct: false, fb: m('fb.onePoint') }; const D = pts[0]; const w = [D[0] - C[0], D[1] - C[1]]; const ok = (w[0] || w[1]) && dot(v, w) === 0; return { correct: !!ok, fb: ok ? null : m('t.lines.m.perp') }; }
        : pts => { if (pts.length !== 1) return { correct: false, fb: m('fb.onePoint') }; const D = pts[0]; const ok = (D[0] === C[0] + v[0] && D[1] === C[1] + v[1]) || (D[0] === C[0] - v[0] && D[1] === C[1] - v[1]); return { correct: ok, fb: ok ? null : m('t.lines.m.par') }; };
      const perp = [-v[1], v[0]]; let D0 = [C[0] + perp[0], C[1] + perp[1]]; if (D0[0] < 0 || D0[0] > W || D0[1] < 0 || D0[1] > H) D0 = [C[0] - perp[0], C[1] - perp[1]];
      let D1 = [C[0] + v[0], C[1] + v[1]]; if (D1[0] < 0 || D1[0] > W || D1[1] < 0 || D1[1] > H) D1 = [C[0] - v[0], C[1] - v[1]];
      const canon = L === 3 ? D0 : D1;
      if (canon[0] < 0 || canon[0] > W || canon[1] < 0 || canon[1] > H) return this.gen(r, L);
      return {
        prompt: m(L === 3 ? 't.lines.q3' : 't.lines.q4'),
        widget: { type: 'point', w: W, h: H, max: 1, given: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }, { x: C[0], y: C[1], label: 'C' }], segs: [[A[0], A[1], B[0], B[1]]], check, canonical: () => [canon] },
        answer: m('c.coordNamed', { n: 'D', x: canon[0], y: canon[1] }), explain: m(L === 3 ? 't.lines.ex3' : 't.lines.ex4'),
        wrong: [{ points: [[C[0] + 1, C[1]]].filter(D => L === 4 || dot(v, [1, 0]) !== 0) }]
      };
    }
  });

  /* ================= triangles, quadrilaterals, circle, constructions ====== */
  const TRI = {
    equi: () => [[0, 0], [4, 0], [2, 3.4641]],
    iso: r => { const b = r.int(3, 5), h = r.int(2, 5); return [[0, 0], [b, 0], [b / 2, h]]; },
    scal: r => { const p = r.pick([[[0, 0], [5, 0], [1.5, 3]], [[0, 0], [6, 0], [4.5, 2.5]], [[0, 0], [4, 0], [5.5, 3]], [[0, 0], [5, 0], [3.8, 2.2]]]); return p; },
    right: r => { const a = r.int(2, 5); let b = r.intExcept(2, 5, [a]); return [[0, 0], [a, 0], [0, b]]; },
    rightIso: r => { const a = r.int(3, 5); return [[0, 0], [a, 0], [0, a]]; }
  };
  const triFig = (type, r) => {
    const pts = TRI[type](r);
    const ticks = type === 'equi' ? [[0, 1], [1, 1], [2, 1]] : type === 'iso' ? [[1, 2], [2, 2]] : type === 'rightIso' ? [[0, 2], [2, 2]] : [];
    const ra = type === 'right' || type === 'rightIso' ? [0] : [];
    return F.shape(pts, { ticks, rightAngles: ra, scale: 34 });
  };
  const TRI_PROPS = { equi: ['equi', 'iso'], iso: ['iso'], scal: ['scal'], right: ['right', 'scal'], rightIso: ['right', 'iso'] };
  T.add({
    id: 'tri_classify', stage: 'ef_shapes', objectives: ['EF.2.4', 'EF.C3'], mt: [],
    gen(r, L) {
      if (L === 1) {
        const type = r.pick(['equi', 'iso', 'scal']);
        return { prompt: m('t.tri_classify.q1'), figure: triFig(type, r), widget: { type: 'mc', options: ['equi', 'iso', 'scal'].map(k => ({ label: m('tri.' + k), correct: k === type })) }, answer: m('tri.' + type), explain: m('t.tri_classify.ex.' + type) };
      }
      if (L === 2 || L === 3) {
        const type = r.pick(['equi', 'iso', 'scal', 'right', 'rightIso']);
        const names = ['right', 'iso', 'scal', 'equi'];
        return { prompt: m('t.tri_classify.q2'), figure: triFig(type, r), widget: { type: 'multi', options: names.map(k => ({ label: m('tri.' + k), correct: TRI_PROPS[type].includes(k) })) }, answer: m('t.tri_classify.ans2', { l: { list: TRI_PROPS[type].map(k => m('tri.' + k)), sep: ', ' } }), explain: m('t.tri_classify.ex2.' + type) };
      }
      const st = r.pick([['s1', false], ['s2', true], ['s3', true], ['s4', false], ['s5', true]]);
      return {
        prompt: m('t.tri_classify.q4', { s: m('t.tri_classify.' + st[0]) }),
        widget: { type: 'tf', truth: st[1], reasons: r.shuffle([{ label: m('t.tri_classify.r.' + st[0]), correct: true }, { label: m('t.tri_classify.r.w1'), correct: false }, { label: m('t.tri_classify.r.w2'), correct: false }]) },
        answer: m(st[1] ? 'c.true' : 'c.false'), explain: m('t.tri_classify.r.' + st[0])
      };
    }
  });

  const QUADS = {
    square: r => r.chance(0.5) ? [[0, 0], [3, 0], [3, 3], [0, 3]] : [[0, 1], [2, 0], [3, 2], [1, 3]],
    rect: r => { const a = r.int(4, 6), b = r.int(2, 3); return [[0, 0], [a, 0], [a, b], [0, b]]; },
    rhombus: r => r.pick([[[0, 2], [2, 0], [4, 2], [2, 4]].map(p => [p[0] * 0.9, p[1] * 1.3]), [[0, 1], [2, 0], [4, 1], [2, 2]], [[0, 0], [3, 1], [4, 4], [1, 3]]]),
    para: r => { const a = r.int(4, 5), s = r.int(1, 2), h = r.int(2, 3); return [[0, 0], [a, 0], [a + s, h], [s, h]]; },
    trap: r => r.pick([[[0, 0], [6, 0], [4, 3], [1, 3]], [[0, 0], [5, 0], [5, 3], [2, 3]], [[0, 0], [6, 0], [5, 2], [2, 2]]])
  };
  const QPROPS = { square: ['square', 'rect', 'rhombus', 'para'], rect: ['rect', 'para'], rhombus: ['rhombus', 'para'], para: ['para'], trap: ['trap'] };
  const QFEAT = { square: ['f4right', 'f4equal', 'f2pairs'], rect: ['f4right', 'f2pairs'], rhombus: ['f4equal', 'f2pairs'], para: ['f2pairs'], trap: ['f1pair'] };
  T.add({
    id: 'quad_classify', stage: 'ef_shapes', objectives: ['EF.2.4', 'EF.C5'], mt: [],
    gen(r, L) {
      const type = r.pick(Object.keys(QUADS)); const pts = QUADS[type](r);
      const fig = F.shape(pts, { scale: 34, rightAngles: (type === 'square' || type === 'rect') ? [0, 1, 2, 3] : [], ticks: (type === 'square' || type === 'rhombus') ? [[0, 1], [1, 1], [2, 1], [3, 1]] : [] });
      if (L === 1) return { prompt: m('t.quad_classify.q1'), figure: fig, widget: { type: 'mc', options: Object.keys(QUADS).map(k => ({ label: m('quad.' + k), correct: k === type })) }, answer: m('quad.' + type), explain: m('t.quad_classify.ex.' + type) };
      if (L === 2) { const feats = ['f4right', 'f4equal', 'f2pairs', 'f1pair']; return { prompt: m('t.quad_classify.q2'), figure: fig, widget: { type: 'multi', options: feats.map(f => ({ label: m('t.quad_classify.' + f), correct: QFEAT[type].includes(f) })) }, answer: m('t.quad_classify.ans', { l: { list: QFEAT[type].map(f => m('t.quad_classify.' + f)), sep: ', ' } }), explain: m('t.quad_classify.ex.' + type) }; }
      if (L === 3) return { prompt: m('t.quad_classify.q3'), figure: fig, widget: { type: 'multi', options: ['square', 'rect', 'rhombus', 'para', 'trap'].map(k => ({ label: m('quad.' + k), correct: QPROPS[type].includes(k) })) }, answer: m('t.quad_classify.ans', { l: { list: QPROPS[type].map(k => m('quad.' + k)), sep: ', ' } }), explain: m('t.quad_classify.ex3') };
      const st = r.pick([['s1', true], ['s2', false], ['s3', true], ['s4', false], ['s5', true]]);
      return { prompt: m('t.quad_classify.q4', { s: m('t.quad_classify.' + st[0]) }), widget: { type: 'tf', truth: st[1], reasons: r.shuffle([{ label: m('t.quad_classify.r.' + st[0]), correct: true }, { label: m('t.quad_classify.r.w1'), correct: false }, { label: m('t.quad_classify.r.w2'), correct: false }]) }, answer: m(st[1] ? 'c.true' : 'c.false'), explain: m('t.quad_classify.r.' + st[0]) };
    }
  });

  T.add({
    id: 'circle', stage: 'ef_shapes', objectives: ['EF.C7', 'EF.2.10'], mt: [],
    gen(r, L) {
      if (L === 1) { const rr = r.int(2, 15); return { prompt: m('t.circle.q1', { r: cm(rr) }), figure: lang => F.circle(rr, { show: 'r', text1: 'r' }), widget: { type: 'input', fields: [field('a', new MQ.Q(2 * rr), { unit: 'cm' })] }, diagnose: v => v.a && v.a.eq(rr / 2) ? m('t.circle.m.half') : null, answer: m('c.unitv', { x: cm(2 * rr) }), explain: m('t.circle.ex1', { r: cm(rr), x: cm(2 * rr) }), wrong: [{ fields: { a: String(rr) } }] }; }
      if (L === 2) { const d = r.int(3, 25); const rr = new MQ.Q(d, 2); return { prompt: m('t.circle.q2', { d: cm(d) }), figure: F.circle(d, { show: 'd', text1: 'd' }), widget: { type: 'input', fields: [field('a', rr, { unit: 'cm' })] }, diagnose: v => v.a && v.a.eq(2 * d) ? m('t.circle.m.double') : null, answer: m('c.unitv', { x: cm(rr) }), explain: m('t.circle.ex2', { d: cm(d), x: cm(rr) }), wrong: [{ fields: { a: String(2 * d) } }] }; }
      if (L === 3) { const d = MQ.Q.dec(r.int(30, 160), 1); const rr = d.div(2); return { prompt: m('t.circle.q3', { d: cm(d) }), widget: { type: 'input', fields: [field('a', rr, { unit: 'cm' })] }, diagnose: v => v.a && v.a.eq(d) ? m('t.circle.m.compass') : null, answer: m('c.unitv', { x: cm(rr) }), explain: m('t.circle.ex3', { d: cm(d), x: cm(rr) }), wrong: [{ fields: { a: d.toDecimalString() } }] }; }
      const n = r.int(2, 5), rr = MQ.Q.dec(r.int(10, 40), 1); const len = rr.mul(2 * n);
      return { prompt: m('t.circle.q4', { n, r: cm(rr) }), figure: (() => { let s = ''; for (let i = 0; i < n; i++) s += `<circle class="shape" cx="${40 + i * 70}" cy="40" r="35"/>`; s += `<rect class="ln" fill="none" x="5" y="5" width="${n * 70}" height="70"/>`; return F.svg(n * 70 + 10, 80, s, ''); })(), widget: { type: 'input', fields: [field('a', len, { unit: 'cm' })] }, diagnose: v => v.a && v.a.eq(rr.mul(n)) ? m('t.circle.m.radius') : null, answer: m('c.unitv', { x: cm(len) }), explain: m('t.circle.ex4', { n, r: cm(rr), d: cm(rr.mul(2)), x: cm(len) }) };
    }
  });

  function rectCheck(set, test) {
    const cells = [...set].map(s => s.split(',').map(Number));
    if (!cells.length) return { correct: false, fb: m('fb.empty') };
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    if (w * h !== cells.length) return { correct: false, fb: m('t.construct_rect.m.notRect') };
    return test(w, h);
  }
  const rectCells = (w, h, x0 = 1, y0 = 1) => { const a = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a.push((x0 + x) + ',' + (y0 + y)); return a; };
  T.add({
    id: 'construct_rect', stage: 'ef_shapes', objectives: ['EF.2.12', 'EF.2.10', 'EF.4.2', 'EF.2.11'], mt: ['MT.39'],
    gen(r, L) {
      const cols = 12, rows = 9;
      if (L <= 2) {
        const w = L === 1 ? r.int(2, 8) : r.int(2, 7), h = L === 1 ? r.intExcept(2, 6, [w]) : w;
        return { prompt: m(L === 1 ? 't.construct_rect.q1' : 't.construct_rect.q2', { w: cm(w), h: cm(h) }), widget: { type: 'cells', cols, rows, check: set => rectCheck(set, (a, b) => ({ correct: (a === w && b === h) || (a === h && b === w), fb: m('t.construct_rect.m.dims', { a, b }) })), canonical: () => rectCells(w, h) }, answer: m('t.construct_rect.ans', { w, h }), explain: m('t.construct_rect.ex1') };
      }
      if (L === 3) {
        let w, h; do { w = r.int(2, 9); h = r.int(2, 7); } while (w === h);
        const A = w * h, P = 2 * (w + h);
        // check uniqueness of dims for (A, P)
        const sols = []; for (let a = 1; a <= cols; a++) for (let b = a; b <= rows; b++) if (a * b === A && 2 * (a + b) === P) sols.push([a, b]);
        return { prompt: m('t.construct_rect.q3', { a: A, p: P }), widget: { type: 'cells', cols, rows, check: set => rectCheck(set, (a, b) => ({ correct: a * b === A && 2 * (a + b) === P, fb: m('t.construct_rect.m.ap', { a: a * b, p: 2 * (a + b) }) })), canonical: () => rectCells(w, h) }, answer: m('t.construct_rect.ans', { w, h }), explain: m('t.construct_rect.ex3', { a: A, p: P, w, h }) };
      }
      const A = r.pick([12, 16, 18, 20, 24]);
      return { prompt: m('t.construct_rect.q4', { a: A }), widget: { type: 'cells', cols, rows, check: set => rectCheck(set, (a, b) => ({ correct: a * b === A, fb: m('t.construct_rect.m.area', { a: a * b }) })), canonical: () => rectCells(A / (A % 4 === 0 ? 4 : 3), A % 4 === 0 ? 4 : 3) }, answer: m('t.construct_rect.ans4', { a: A }), explain: m('t.construct_rect.ex4', { a: A, l: { raw: MQ.divisors(A).filter(d => d * d <= A && A / d <= 12 && d <= 9).map(d => d + ' × ' + (A / d)).join(' ; ') } }) };
    }
  });

  /* ================= solids & nets ================= */
  const SOLIDS = ['cube', 'cuboid', 'pyramid', 'prism', 'cylinder', 'cone', 'sphere'];
  const FVE = { cube: [6, 8, 12], cuboid: [6, 8, 12], pyramid: [5, 5, 8], tripyramid: [4, 4, 6], prism: [5, 6, 9], hexprism: [8, 12, 18] };
  const SOLID_CLASS = { cube: 'prism', cuboid: 'prism', prism: 'prism', hexprism: 'prism', pyramid: 'pyramid', tripyramid: 'pyramid', cylinder: 'round', cone: 'round', sphere: 'round' };
  T.add({
    id: 'solid_name', stage: 'ef_solids', objectives: ['EF.2.7', 'EF.2.3', 'EF.C2', 'EF.2.5'], mt: ['MT.49'],
    gen(r, L) {
      if (L === 1) { const s = r.pick(SOLIDS); const opts = r.shuffle([s].concat(r.sample(SOLIDS.filter(x => x !== s), 3))); return { prompt: m('t.solid_name.q1'), figure: F.solid(s), widget: { type: 'mc', options: opts.map(o => ({ label: m('solid.' + o), correct: o === s })) }, answer: m('solid.' + s), explain: m('t.solid_name.d.' + s) }; }
      if (L === 2) { const s = r.pick(SOLIDS); const opts = r.shuffle([s].concat(r.sample(SOLIDS.filter(x => x !== s && !(s === 'cube' && x === 'cuboid') && !(s === 'cuboid' && x === 'cube')), 3))); return { prompt: m('t.solid_name.q2', { d: m('t.solid_name.d.' + s) }), widget: { type: 'mc', options: opts.map(o => ({ label: m('solid.' + o), fig: F.solid(o, { size: 110 }), correct: o === s })) }, answer: m('solid.' + s), explain: m('t.solid_name.d.' + s) }; }
      const pool = ['cube', 'cuboid', 'pyramid', 'tripyramid', 'prism', 'hexprism', 'cylinder', 'cone', 'sphere'];
      const items = r.sample(pool, 6);
      if (L === 3) return { prompt: m('t.solid_name.q3'), widget: { type: 'bins', bins: [m('t.solid_name.flat'), m('t.solid_name.curved')], items: items.map(s => ({ label: { k: 'c.fig', v: { f: { html: F.solid(s, { size: 90 }) } } }, bin: SOLID_CLASS[s] === 'round' ? 1 : 0, speak: m('solid.' + (s === 'tripyramid' ? 'pyramid' : s === 'hexprism' ? 'prism' : s)) })) }, answer: m('c.binsAnswer'), explain: m('t.solid_name.ex3') };
      return { prompt: m('t.solid_name.q4'), widget: { type: 'bins', bins: [m('t.solid_name.prisms'), m('t.solid_name.pyramids'), m('t.solid_name.round')], items: items.map(s => ({ label: { k: 'c.fig', v: { f: { html: F.solid(s, { size: 90 }) } } }, bin: ['prism', 'pyramid', 'round'].indexOf(SOLID_CLASS[s]) })) }, answer: m('c.binsAnswer'), explain: m('t.solid_name.ex4') };
    }
  });

  T.add({
    id: 'solid_fve', stage: 'ef_solids', objectives: ['EF.2.3', 'EF.2.7', 'EF.C2'], mt: ['MT.50', 'MT.57'],
    gen(r, L) {
      if (L === 4) {
        const known = [['pentaprism', 7, 10, 15], ['pentapyramid', 6, 6, 10], ['hexpyramid', 7, 7, 12], ['octahedron', 8, 6, 12], ['hexprism', 8, 12, 18], ['tripyramid', 4, 4, 6]];
        const [nm, Fc, V, E] = r.pick(known);
        return { prompt: m('t.solid_fve.q4', { s: { k: 'solid.' + nm }, f: Fc, v: V }), widget: { type: 'input', fields: [field('a', new MQ.Q(E))] }, diagnose: v => v.a && v.a.eq(Fc + V) ? m('t.solid_fve.m.euler') : null, answer: m('c.num', { x: E }), explain: m('t.solid_fve.ex4', { f: Fc, v: V, e: E }), wrong: [{ fields: { a: String(Fc + V) } }] };
      }
      const s = L === 1 ? r.pick(['cube', 'cuboid']) : L === 2 ? r.pick(['pyramid', 'prism', 'tripyramid']) : 'hexprism';
      const [Fc, V, E] = FVE[s];
      return {
        prompt: m('t.solid_fve.q', { s: { k: 'solid.' + s } }), figure: F.solid(s),
        widget: { type: 'input', fields: [field('f', new MQ.Q(Fc), { label: m('w.faces') }), field('v', new MQ.Q(V), { label: m('w.vertices') }), field('e', new MQ.Q(E), { label: m('w.edges') })] },
        answer: m('t.solid_fve.ans', { f: Fc, v: V, e: E }), explain: m('t.solid_fve.ex', { s: { k: 'solid.' + s }, f: Fc, v: V, e: E })
      };
    }
  });

  T.add({
    id: 'net_cube', stage: 'ef_solids', objectives: ['EF.2.1', 'EF.2.2', 'EF.C2', 'EF.2.8'], mt: ['MT.55'],
    gen(r, L) {
      if (L === 4) {
        const net = randomNet(r, true); const faces = foldNet(net); const nums = r.shuffle([1, 2, 3, 4, 5, 6]);
        const k = r.int(0, 5); const oppFace = OPP[faces[k]]; const j = faces.indexOf(oppFace);
        const fig = (() => { let s = ''; const c = 40; net.forEach((p, i) => s += `<rect class="netface" x="${2 + p[0] * c}" y="${2 + p[1] * c}" width="${c}" height="${c}"/>` + F.text(2 + p[0] * c + c / 2, 2 + p[1] * c + c * 0.68, nums[i], 'tx b')); const mx = Math.max(...net.map(p => p[0])) + 1, my = Math.max(...net.map(p => p[1])) + 1; return F.svg(mx * c + 4, my * c + 4, s, ''); })();
        return { prompt: m('t.net_cube.q4', { n: nums[k] }), figure: fig, widget: { type: 'input', fields: [field('a', new MQ.Q(nums[j]))] }, answer: m('c.num', { x: nums[j] }), explain: m('t.net_cube.ex4', { n: nums[k], x: nums[j] }) };
      }
      const wantValid = L !== 3;
      const target = randomNet(r, wantValid); const seen = new Set([canonShape(target)]); const others = [];
      let g = 0; while (others.length < 3 && g++ < 500) { const n = randomNet(r, !wantValid); const c = canonShape(n); if (!seen.has(c)) { seen.add(c); others.push(n); } }
      const opts = r.shuffle([{ cells: target, correct: true }].concat(others.map(c => ({ cells: c, correct: false }))));
      return {
        prompt: m(wantValid ? 't.net_cube.q' : 't.net_cube.q3'),
        widget: { type: 'mc', layout: 'grid', options: opts.map((o, i) => ({ label: { k: 'c.letter', v: { l: L4(65 + i) } }, fig: F.cubeNet(o.cells), correct: o.correct, why: o.correct ? null : m(wantValid ? 't.net_cube.m.overlap' : 't.net_cube.m.valid') })) },
        answer: m('c.letter', { l: L4(65 + opts.findIndex(o => o.correct)) }), explain: m(wantValid ? 't.net_cube.ex' : 't.net_cube.ex3'),
        selfCheck: () => { const nValid = opts.filter(o => !!foldNet(o.cells)).length; return wantValid ? (nValid === 1 && !!foldNet(target)) : (nValid === 3 && !foldNet(target)); }
      };
    }
  });

  T.add({
    id: 'net_match', stage: 'ef_solids', objectives: ['EF.2.2', 'EF.2.6', 'EF.C2'], mt: ['MT.56'],
    gen(r, L) {
      const pool = L === 1 ? ['cube', 'cylinder', 'pyramid'] : L === 2 ? ['cube', 'cuboid', 'pyramid', 'cylinder'] : ['cuboid', 'pyramid', 'prism', 'cylinder', 'cone'].slice(0, L === 3 ? 4 : 5);
      const chosen = L >= 3 ? r.sample(pool, 4) : pool;
      return { prompt: m('t.net_match.q'), widget: { type: 'match', left: chosen.map(s => ({ k: 'c.fig', v: { f: { html: F.net(s) } } })), right: chosen.map(s => m('solid.' + s)), leftIsFig: true }, answer: m('c.matchAnswer'), explain: m('t.net_match.ex') };
    }
  });

  const front = hm => hm[0].map((_, x) => Math.max(...hm.map(row => row[x])));
  const side = hm => hm.map(row => Math.max(...row)).reverse();
  T.add({
    id: 'cube_build', stage: 'ef_solids', stages: ['ef_volume'], objectives: ['EF.2.8', 'EF.2.6', 'EF.1.3', 'EF.2.5'], mt: ['MT.53', 'MT.58', 'MT.60'],
    gen(r, L) {
      if (L === 1) { const a = r.int(2, 4), b = r.int(2, 3), c = r.int(1, 3); return { prompt: m('t.cube_build.q1'), figure: F.cuboidCubes(a, b, c), widget: { type: 'input', fields: [field('a', new MQ.Q(a * b * c))] }, diagnose: v => v.a && v.a.lt(a * b * c) ? m('t.cube_build.m.hidden') : null, answer: m('c.num', { x: a * b * c }), explain: m('t.cube_build.ex1', { a, b, c, x: a * b * c }) }; }
      const cols = r.int(2, 3), rows = r.int(2, 3);
      const hm = Array.from({ length: rows }, () => Array.from({ length: cols }, () => r.int(L === 2 ? 1 : 0, 3)));
      if (hm.flat().every(h => h === 0)) hm[0][0] = 1;
      const total = hm.flat().reduce((a, b) => a + b, 0);
      const plan = F.cells(cols, rows, [], { cell: 34, marks: Object.fromEntries(hm.flatMap((row, y) => row.map((h, x) => [x + ',' + y, String(h)]))) });
      const planFig = lang => `<div class="figrow">${F.cubes(hm)}<div class="plan">${plan}<div class="frontlbl">▼ ${MQ.t('w.front', {}, lang)}</div></div></div>`;
      if (L === 2) return { prompt: m('t.cube_build.q2'), figure: planFig, widget: { type: 'input', fields: [field('a', new MQ.Q(total))] }, answer: m('c.num', { x: total }), explain: m('t.cube_build.ex2', { x: total }) };
      if (L === 3) { const H = 3; const full = cols * rows * H; return { prompt: m('t.cube_build.q3', { a: cols, b: rows, c: H }), figure: planFig, widget: { type: 'input', fields: [field('a', new MQ.Q(full - total))] }, diagnose: v => v.a && v.a.eq(full) ? m('t.cube_build.m.subtract') : null, answer: m('c.num', { x: full - total }), explain: m('t.cube_build.ex3', { f: full, t: total, x: full - total, a: cols, b: rows, c: H }) }; }
      const fv = front(hm); const opts = [{ v: fv, correct: true }];
      const cands = [side(hm), fv.slice().reverse(), fv.map((h, i) => i === 0 ? Math.min(3, h + 1) : h), fv.map((h, i) => i === fv.length - 1 ? Math.max(1, h - 1) : h), hm[0].slice(), hm[rows - 1].slice()];
      cands.forEach(c => { if (opts.length < 4 && c.some(h => h > 0) && !opts.some(o => o.v.join() === c.join())) opts.push({ v: c, correct: false }); });
      while (opts.length < 3) { const c = fv.map(h => Math.max(1, Math.min(3, h + r.pick([-1, 1])))); if (!opts.some(o => o.v.join() === c.join())) opts.push({ v: c, correct: false }); }
      const sh = r.shuffle(opts);
      return { prompt: m('t.cube_build.q4'), figure: planFig, widget: { type: 'mc', layout: 'grid', options: sh.map((o, i) => ({ label: { k: 'c.letter', v: { l: L4(65 + i) } }, fig: F.view(o.v), correct: o.correct })) }, answer: m('c.letter', { l: L4(65 + sh.findIndex(o => o.correct)) }), explain: m('t.cube_build.ex4') };
    }
  });

  /* ================= symmetry & transformations ================= */
  function randomShapeCells(r, w, h, n) {
    const cells = [[r.int(0, w - 1), r.int(0, h - 1)]]; const has = (x, y) => cells.some(c => c[0] === x && c[1] === y);
    let g = 0; while (cells.length < n && g++ < 500) { const c = r.pick(cells); const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); const x = c[0] + dx, y = c[1] + dy; if (x >= 0 && x < w && y >= 0 && y < h && !has(x, y)) cells.push([x, y]); }
    return cells;
  }
  T.add({
    id: 'sym_complete', stage: 'ef_sym', objectives: ['EF.C8', 'EF.3.4', 'EF.3.5', 'EF.3.1'], mt: ['MT.65', 'MT.68'],
    gen(r, L) {
      let cols, rows, fixed, target, axis;
      const ids = cs => cs.map(c => c[0] + ',' + c[1]);
      if (L === 1 || L === 2) {
        cols = 10; rows = 8;
        if (L === 1) { const half = randomShapeCells(r, 5, rows, r.int(5, 8)); fixed = half; target = half.map(([x, y]) => [cols - 1 - x, y]); axis = { type: 'v', at: 5 }; }
        else { const half = randomShapeCells(r, cols, 4, r.int(5, 8)); fixed = half; target = half.map(([x, y]) => [x, rows - 1 - y]); axis = { type: 'h', at: 4 }; }
      } else if (L === 3) {
        cols = rows = 8; let half; do { half = randomShapeCells(r, 8, 8, r.int(5, 7)).filter(([x, y]) => x < y); } while (half.length < 3);
        fixed = half; target = half.map(([x, y]) => [y, x]); axis = { type: 'd' };
      } else {
        cols = 10; rows = 8; const q = randomShapeCells(r, 5, 4, r.int(4, 6)); fixed = q;
        target = []; q.forEach(([x, y]) => { target.push([cols - 1 - x, y], [x, rows - 1 - y], [cols - 1 - x, rows - 1 - y]); });
        axis = null;
      }
      const fixedIds = ids(fixed); const tIds = [...new Set(ids(target))].filter(id => !fixedIds.includes(id));
      return {
        prompt: m(L === 4 ? 't.sym_complete.q4' : 't.sym_complete.q'),
        widget: { type: 'cells', cols, rows, fixed: fixedIds, axis, axes: L === 4 ? [{ type: 'v', at: 5 }, { type: 'h', at: 4 }] : null, check: set => { const ok = set.size === tIds.length && tIds.every(id => set.has(id)); const missing = tIds.filter(id => !set.has(id)).length, extra = [...set].filter(id => !tIds.includes(id)).length; return { correct: ok, fb: ok ? null : m('t.sym_complete.m.diff', { a: missing, b: extra }) }; }, canonical: () => tIds },
        answer: m('t.sym_complete.ans', { n: tIds.length }), explain: m(L === 3 ? 't.sym_complete.ex3' : 't.sym_complete.ex'),
        wrong: (() => { const sh = fixedIds.map(id => { const [x, y] = id.split(',').map(Number); return (L === 1 || L === 4 ? (x + 5) + ',' + y : x + ',' + (y + 4)); }); return sh.length === tIds.length && sh.every(id => tIds.includes(id)) ? [] : [{ cells: sh }]; })()
      };
    }
  });

  T.add({
    id: 'sym_point', stage: 'ef_sym', objectives: ['EF.C8', 'EF.1.1'], mt: ['MT.64', 'MT.66', 'MT.68'],
    gen(r, L) {
      const W = 10, H = 8;
      if (L === 1) { const k = r.int(3, 7), P = [r.intExcept(Math.max(0, 2 * k - W), Math.min(W, 2 * k), [k]), r.int(0, H)]; const P2 = [2 * k - P[0], P[1]]; return { prompt: m('t.sym_point.q1', { k }), widget: { type: 'point', w: W, h: H, max: 1, targets: [P2], given: [{ x: P[0], y: P[1], label: 'A' }], segs: [[k, 0, k, H, 'axis']] }, answer: m('c.coordNamed', { n: "A'", x: P2[0], y: P2[1] }), explain: m('t.sym_point.ex1', { d: Math.abs(P[0] - k) }) }; }
      if (L === 2) { const dx = r.intExcept(-3, 4, [0]), dy = r.intExcept(-2, 3, [0]); let P; do { P = [r.int(0, W), r.int(0, H)]; } while (P[0] + dx < 0 || P[0] + dx > W || P[1] + dy < 0 || P[1] + dy > H); const S = [r.int(0, 3), 0]; return { prompt: m('t.sym_point.q2'), widget: { type: 'point', w: W, h: H, max: 1, targets: [[P[0] + dx, P[1] + dy]], given: [{ x: P[0], y: P[1], label: 'A' }], arrow: [S[0], 7, S[0] + dx, 7 + dy].map((v, i) => i % 2 ? Math.min(H, Math.max(0, v)) : v) }, answer: m('c.coordNamed', { n: "A'", x: P[0] + dx, y: P[1] + dy }), explain: m('t.sym_point.ex2', { a: Math.abs(dx), d1: { k: dx > 0 ? 'dir.right' : 'dir.left' }, b: Math.abs(dy), d2: { k: dy > 0 ? 'dir.up' : 'dir.down' } }) }; }
      if (L === 3) { const O = [r.int(3, 7), r.int(3, 5)]; let P; do { P = [r.int(0, W), r.int(0, H)]; } while ((P[0] === O[0] && P[1] === O[1]) || 2 * O[0] - P[0] < 0 || 2 * O[0] - P[0] > W || 2 * O[1] - P[1] < 0 || 2 * O[1] - P[1] > H); const P2 = [2 * O[0] - P[0], 2 * O[1] - P[1]]; return { prompt: m('t.sym_point.q3'), widget: { type: 'point', w: W, h: H, max: 1, targets: [P2], given: [{ x: P[0], y: P[1], label: 'A' }, { x: O[0], y: O[1], label: 'O', cls: 'centre' }] }, answer: m('c.coordNamed', { n: "A'", x: P2[0], y: P2[1] }), explain: m('t.sym_point.ex3') }; }
      const dx = r.intExcept(-3, 4, [0]), dy = r.intExcept(-2, 2, [0]); const tri = [[r.int(1, 3), r.int(1, 3)]]; tri.push([tri[0][0] + r.int(2, 3), tri[0][1]], [tri[0][0] + r.int(0, 2), tri[0][1] + r.int(2, 3)]);
      const img = tri.map(p => [p[0] + dx, p[1] + dy]); if (img.some(p => p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H)) return this.gen(r, L);
      return { prompt: m('t.sym_point.q4', { a: Math.abs(dx), d1: { k: dx > 0 ? 'dir.right' : 'dir.left' }, b: Math.abs(dy), d2: { k: dy > 0 ? 'dir.up' : 'dir.down' } }), widget: { type: 'point', w: W, h: H, max: 3, targets: img, given: tri.map((p, i) => ({ x: p[0], y: p[1], label: L4(65 + i) })), poly: tri }, answer: m('t.sym_point.ans4'), explain: m('t.sym_point.ex4') };
    }
  });

  const PENTA = [[0, 0], [1, 0], [1, 1], [1, 2], [2, 1]]; // asymmetric "F"-like pentomino
  T.add({
    id: 'transform_id', stage: 'ef_sym', objectives: ['EF.3.2', 'EF.C8'], mt: ['MT.64', 'MT.65', 'MT.66'],
    gen(r, L) {
      const kinds = L === 1 ? ['axial', 'translation'] : ['axial', 'central', 'translation'];
      const k = r.pick(kinds); const cols = 12, rows = 8;
      const base = PENTA.map(([x, y]) => [x + r.int(0, 2), y + r.int(1, 3)]);
      let img;
      if (k === 'axial') img = base.map(([x, y]) => [cols - 1 - x, y]);
      else if (k === 'central') img = base.map(([x, y]) => [cols - 1 - x, rows - 1 - y]);
      else { const dx = r.int(5, 8), dy = L === 4 ? r.int(-1, 0) : r.int(-1, 1); img = base.map(([x, y]) => [x + dx, y + dy]); }
      const ids = cs => cs.map(c => c[0] + ',' + c[1]);
      const fig = F.cells(cols, rows, ids(base), { cell: 26, fixed: ids(img) });
      if (L === 4 && k === 'translation') {
        const dx = img[0][0] - base[0][0], dy = img[0][1] - base[0][1];
        return { prompt: m('t.transform_id.q4'), figure: fig, widget: { type: 'input', fields: [field('x', new MQ.Q(dx), { label: m('t.transform_id.right') }), field('y', new MQ.Q(-dy), { label: m('t.transform_id.up') })] }, answer: m('t.transform_id.ans4', { x: dx, y: -dy }), explain: m('t.transform_id.ex4') };
      }
      return { prompt: m('t.transform_id.q'), figure: fig, widget: { type: 'mc', options: kinds.map(kk => ({ label: m('tr.' + kk), correct: kk === k })) }, answer: m('tr.' + k), explain: m('t.transform_id.ex.' + k) };
    }
  });

  const ROT = t => (t % 4 + 1) % 4 + (t >= 4 ? 4 : 0), REF = t => t < 4 ? t + 4 : t - 4;
  T.add({
    id: 'frieze', stage: 'ef_sym', objectives: ['EF.3.1', 'EF.3.2', 'EF.3.3'], mt: ['MT.69', 'MT.67'],
    gen(r, L) {
      let seq = [];
      if (L === 1) { const a = r.int(0, 7), b = r.intExcept(0, 7, [a]); for (let i = 0; i < 7; i++) seq.push(i % 2 ? b : a); }
      else if (L === 2) { const p = r.sample([0, 1, 2, 3, 4, 5, 6, 7], 3); for (let i = 0; i < 7; i++) seq.push(p[i % 3]); }
      else if (L === 3) { let t = r.int(0, 7); for (let i = 0; i < 7; i++) { seq.push(t); t = ROT(t); } }
      else { let t = r.int(0, 7); for (let i = 0; i < 7; i++) { seq.push(t); t = i % 2 ? ROT(t) : REF(t); } }
      const shown = seq.slice(0, 6), next = seq[6];
      const opts = r.shuffle([next].concat(r.sample([0, 1, 2, 3, 4, 5, 6, 7].filter(x => x !== next), 3)));
      return {
        prompt: m('t.frieze.q'), figure: `<div class="frieze">${shown.map(t => F.motif(t)).join('')}<div class="motif-q">?</div></div>`,
        widget: { type: 'mc', layout: 'row', options: opts.map((t, i) => ({ label: { k: 'c.letter', v: { l: L4(65 + i) } }, fig: F.motif(t), correct: t === next })) },
        answer: m('c.letter', { l: L4(65 + opts.indexOf(next)) }), explain: m('t.frieze.ex' + L)
      };
    }
  });

  /* ================= perimeter, area ================= */
  T.add({
    id: 'perim_area', stage: 'ef_area', objectives: ['EF.4.2', 'EF.C10', 'EF.C11', 'EF.4.1'], mt: ['MT.33', 'MT.34', 'MT.35', 'MT.37'],
    gen(r, L) {
      const ask = r.pick(['P', 'A']);
      if (L <= 2) {
        const w = r.int(2, L === 1 ? 8 : 25), h = L === 2 && r.chance(0.3) ? w : r.intExcept(1, L === 1 ? 6 : 20, [w]);
        const P = 2 * (w + h), A = w * h; const ans = ask === 'P' ? P : A;
        const fig = L === 1 ? F.onGrid([[0, 0], [w, 0], [w, h], [0, h]]) : lang => F.shape([[0, 0], [Math.min(w, 9), 0], [Math.min(w, 9), Math.min(h, 6)], [0, Math.min(h, 6)]].map(p => [p[0] * 1.2, p[1] * 1.2]), { scale: 28, rightAngles: [0, 1, 2, 3], padL: 64 }).replace('</svg>', `<text class="tx lbl" x="${64 + Math.min(w, 9) * 1.2 * 14}" y="16" text-anchor="middle">${MQ.fmtNum(w, lang)} cm</text><text class="tx lbl" x="58" text-anchor="end" y="${20 + Math.min(h, 6) * 1.2 * 14}" text-anchor="start">${MQ.fmtNum(h, lang)} cm</text></svg>`);
        return {
          prompt: m(L === 1 ? (ask === 'P' ? 't.perim_area.q1P' : 't.perim_area.q1A') : (ask === 'P' ? 't.perim_area.q2P' : 't.perim_area.q2A'), { w: cm(w), h: cm(h) }), figure: fig,
          widget: { type: 'input', fields: [field('a', new MQ.Q(ans), { unit: ask === 'P' ? 'cm' : 'cm2' })] },
          diagnose: v => { if (!v.a) return null; if (v.a.eq(ask === 'P' ? A : P) && A !== P) return m(ask === 'P' ? 't.perim_area.m.gaveArea' : 't.perim_area.m.gavePerim'); if (ask === 'P' && v.a.eq(w + h)) return m('t.perim_area.m.half'); return null; },
          answer: m('c.unitv', { x: cm(ans, ask === 'P' ? 'cm' : 'cm2') }), explain: m(ask === 'P' ? 't.perim_area.exP' : 't.perim_area.exA', { w, h, x: ans }),
          wrong: A !== P ? [{ fields: { a: String(ask === 'P' ? A : P) } }] : []
        };
      }
      if (L === 3) {
        const w = r.int(2, 12), h = r.intExcept(2, 15, [w]);
        if (ask === 'A') return { prompt: m('t.perim_area.q3A', { a: { unit: 'cm2', val: new MQ.Q(w * h) }, w: cm(w) }), widget: { type: 'input', fields: [field('a', new MQ.Q(h), { unit: 'cm' })] }, answer: m('c.unitv', { x: cm(h) }), explain: m('t.perim_area.ex3A', { a: w * h, w, x: h }) };
        return { prompt: m('t.perim_area.q3P', { p: cm(2 * (w + h)), w: cm(w) }), widget: { type: 'input', fields: [field('a', new MQ.Q(h), { unit: 'cm' })] }, diagnose: v => v.a && v.a.eq(2 * (w + h) - w) ? m('t.perim_area.m.twoSides') : null, answer: m('c.unitv', { x: cm(h) }), explain: m('t.perim_area.ex3P', { p: 2 * (w + h), w, s: w + h, x: h }) };
      }
      // L-shape: W×H minus a×b in the top-right corner
      const W = r.int(5, 9), H = r.int(4, 7), a = r.int(1, W - 2), b = r.int(1, H - 2);
      const pts = [[0, 0], [W - a, 0], [W - a, b], [W, b], [W, H], [0, H]];
      const P = 2 * (W + H), A = W * H - a * b; const ans = ask === 'P' ? P : A;
      return {
        prompt: m(ask === 'P' ? 't.perim_area.q4P' : 't.perim_area.q4A'),
        figure: lang => F.onGrid(pts, { sideLabels: [{ i: 0, text: MQ.fmtNum(W - a, lang) }, { i: 1, text: MQ.fmtNum(b, lang) }, { i: 2, text: MQ.fmtNum(a, lang) }, { i: 3, text: MQ.fmtNum(H - b, lang) }, { i: 4, text: MQ.fmtNum(W, lang) }, { i: 5, text: MQ.fmtNum(H, lang) }] }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(ans), { unit: ask === 'P' ? 'cm' : 'cm2' })] },
        diagnose: v => v.a && ask === 'A' && v.a.eq(W * H) ? m('t.perim_area.m.notch') : (v.a && ask === 'P' && v.a.eq(P - a - b) ? m('t.perim_area.m.missingSides') : null),
        answer: m('c.unitv', { x: cm(ans, ask === 'P' ? 'cm' : 'cm2') }), explain: m(ask === 'P' ? 't.perim_area.ex4P' : 't.perim_area.ex4A', { W, H, a, b, x: ans, big: W * H, small: a * b }),
        wrong: [{ fields: { a: String(ask === 'A' ? W * H : P - a - b) } }]
      };
    }
  });

  T.add({
    id: 'area_tri_para', stage: 'ef_area', objectives: ['EF.4.3', 'EF.C11', 'EF.4.5'], mt: ['MT.37', 'MT.41', 'MT.42'],
    gen(r, L) {
      const isTri = L === 2 || (L === 3 && r.chance(0.5));
      const b = r.int(3, 8), h = r.int(2, 6), s = r.int(1, 3);
      if (L === 4) {
        const w = r.int(4, 8), hw = r.int(2, 4), roof = r.int(2, 4);
        const A = new MQ.Q(w * hw).add(new MQ.Q(w * roof, 2));
        const pts = [[0, roof], [w / 2, 0], [w, roof], [w, roof + hw], [0, roof + hw]];
        return { prompt: m('t.area_tri_para.q4'), figure: lang => F.onGrid(pts, { gw: w + 1, gh: roof + hw + 1, dash: [[[0, roof], [w, roof]], [[w / 2, 0], [w / 2, roof]]] }), widget: { type: 'input', fields: [field('a', A, { unit: 'cm2' })] }, diagnose: v => v.a && v.a.eq(w * hw + w * roof) ? m('t.area_tri_para.m.half') : null, answer: m('c.unitv', { x: { unit: 'cm2', val: A } }), explain: m('t.area_tri_para.ex4', { w, h: hw, r: roof, a: w * hw, t: new MQ.Q(w * roof, 2), x: A }) };
      }
      const A = isTri ? new MQ.Q(b * h, 2) : new MQ.Q(b * h);
      const pts = isTri ? [[0, h], [b, h], [s, 0]] : [[0, h], [b, h], [b + s, 0], [s, 0]];
      const slant = Math.round(Math.hypot(s, h) * 10) / 10;
      const fig = L === 3
        ? lang => F.onGrid(pts, { grid: false, dash: [[[s, 0], [s, h]]], sideLabels: [{ i: 0, text: MQ.fmtNum(b, lang) + ' cm' }, { i: pts.length - 1, text: MQ.fmtNum(MQ.Q.of(String(slant)), lang) + ' cm' }], extra: `<text class="tx lbl" x="${30 + s * 30 + 6}" y="${30 + h * 15}">${MQ.fmtNum(h, lang)} cm</text>` })
        : F.onGrid(pts, { dash: [[[s, 0], [s, h]]] });
      return {
        prompt: m(isTri ? (L === 3 ? 't.area_tri_para.q3t' : 't.area_tri_para.qt') : (L === 3 ? 't.area_tri_para.q3p' : 't.area_tri_para.qp')), figure: fig,
        widget: { type: 'input', fields: [field('a', A, { unit: 'cm2' })] },
        diagnose: v => { if (!v.a) return null; if (isTri && v.a.eq(b * h)) return m('t.area_tri_para.m.half'); if (L === 3 && v.a.eq(MQ.Q.of(String(slant)).mul(b).div(isTri ? 2 : 1))) return m('t.area_tri_para.m.slant'); return null; },
        answer: m('c.unitv', { x: { unit: 'cm2', val: A } }), explain: m(isTri ? 't.area_tri_para.ext' : 't.area_tri_para.exp', { b, h, x: A, p: b * h }),
        wrong: isTri ? [{ fields: { a: String(b * h) } }] : []
      };
    }
  });

  T.add({
    id: 'area_compare', stage: 'ef_area', objectives: ['EF.4.1', 'EF.4.5'], mt: ['MT.29', 'MT.43', 'MT.44', 'MT.45'],
    gen(r, L) {
      if (L === 1) {
        const i = r.int(0, 6); const piece = F.TANGRAM[i]; const unit = r.pick(['small', 'whole']);
        const ans = unit === 'small' ? new MQ.Q(piece.area) : new MQ.Q(piece.area, 16);
        return { prompt: m(unit === 'small' ? 't.area_compare.q1s' : 't.area_compare.q1w', { p: piece.name }), figure: F.tangram([i]), widget: { type: 'input', fields: [field('a', ans)] }, answer: m('c.num', { x: unit === 'small' ? ans : fr(piece.area, 16) }), explain: m('t.area_compare.ex1', { p: piece.name, a: piece.area }) };
      }
      if (L === 2) {
        const b = r.int(3, 6), h = r.int(2, 4);
        const fig = F.onGrid([[0, h], [b, h], [r.int(0, b), 0]], { gw: b + 1, gh: h + 1, extra: '' }) + F.onGrid([[0, 0], [b, 0], [b, h], [0, h]], { gw: b + 1, gh: h + 1 });
        return { prompt: m('t.area_compare.q2'), figure: `<div class="figrow">${fig}</div>`, widget: { type: 'mc', options: [{ label: m('t.area_compare.half'), correct: true }, { label: m('t.area_compare.same'), correct: false, why: m('t.area_compare.m.same') }, { label: m('t.area_compare.double'), correct: false }, { label: m('t.area_compare.quarter'), correct: false }] }, answer: m('t.area_compare.half'), explain: m('t.area_compare.ex2') };
      }
      if (L === 3) {
        const k = r.pick([2, 3]); const what = r.pick(['A', 'P']);
        return { prompt: m(what === 'A' ? 't.area_compare.q3A' : 't.area_compare.q3P', { k }), figure: F.onGrid([[0, 0], [2 * k, 0], [2 * k, k], [0, k]], { dash: [[[2, 0], [2, k]], [[0, 1], [2 * k, 1]]].slice(0, 0) }) , widget: { type: 'input', fields: [field('a', new MQ.Q(what === 'A' ? k * k : k))] }, diagnose: v => v.a && what === 'A' && v.a.eq(k) ? m('t.area_compare.m.linear') : null, answer: m('c.num', { x: what === 'A' ? k * k : k }), explain: m(what === 'A' ? 't.area_compare.ex3A' : 't.area_compare.ex3P', { k, x: k * k }), wrong: what === 'A' ? [{ fields: { a: String(k) } }] : [] };
      }
      const given = randomShapeCells(r, 4, 4, r.int(5, 8)); const A = given.length;
      const givenIds = given.map(c => c[0] + ',' + c[1]);
      return {
        prompt: m('t.area_compare.q4', { a: A }), figure: F.cells(4, 4, givenIds, { cell: 26 }),
        widget: { type: 'cells', cols: 10, rows: 6, check: set => { const cells = [...set]; if (cells.length !== A) return { correct: false, fb: m('t.area_compare.m.count', { n: cells.length, a: A }) }; // connectivity
          const S = new Set(cells), seen = new Set([cells[0]]), st = [cells[0]]; while (st.length) { const [x, y] = st.pop().split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = (x + dx) + ',' + (y + dy); if (S.has(k) && !seen.has(k)) { seen.add(k); st.push(k); } }); }
          return { correct: seen.size === cells.length, fb: seen.size === cells.length ? null : m('t.area_compare.m.connected') }; }, canonical: () => Array.from({ length: A }, (_, i) => i + ',0').concat([]).slice(0, A) },
        answer: m('t.area_compare.ans4', { a: A }), explain: m('t.area_compare.ex4', { a: A })
      };
    }
  });

  T.add({
    id: 'formula', stage: 'ef_area', stages: ['ef_volume'], objectives: ['EF.4.5', 'EF.4.2', 'EF.4.3', 'EF.4.4'], mt: ['MT.36', 'MT.40'],
    gen(r, L) {
      const all = ['sqP', 'sqA', 'rectP', 'rectA', 'triA', 'paraA', 'cubeV', 'cuboidV'];
      if (L === 1) { const ch = r.sample(all, 4); return { prompt: m('t.formula.q1'), widget: { type: 'match', left: ch.map(k => m('t.formula.n.' + k)), right: ch.map(k => m('f.' + k)) }, answer: m('c.matchAnswer'), explain: m('t.formula.ex1') }; }
      if (L === 2) {
        const ask = r.pick(['rectP', 'rectA', 'triA', 'paraA']);
        const opts = { rectP: ['rectP', 'rectA', 'f.halfP', 'sqP'], rectA: ['rectA', 'rectP', 'triA', 'f.halfP'], triA: ['triA', 'paraA', 'rectP', 'f.triWrong'], paraA: ['paraA', 'triA', 'f.paraWrong', 'rectP'] }[ask];
        return { prompt: m('t.formula.q2', { n: m('t.formula.n.' + ask) }), widget: { type: 'mc', options: r.shuffle(opts.map(k => ({ label: m(k.startsWith('f.') ? k : 'f.' + k), correct: k === ask }))) }, answer: m('f.' + ask), explain: m('t.formula.ex.' + ask) };
      }
      if (L === 3) {
        const w = r.int(4, 12), h = r.intExcept(2, 9, [w]); const wrongStep = 1;
        return { prompt: m('t.formula.q3', { n: names(r, 1)[0], w: cm(w), h: cm(h) }), widget: { type: 'mistake', steps: [m('t.formula.s1'), m('t.formula.s2', { w, h, x: w * h }), m('t.formula.s3', { x: { unit: 'cm', val: new MQ.Q(w * h) } })], wrongStep, fields: [field('fix', new MQ.Q(2 * (w + h)), { unit: 'cm', label: m('t.formula.fix') })] }, answer: m('c.unitv', { x: cm(2 * (w + h)) }), explain: m('t.formula.ex3', { w, h, x: 2 * (w + h) }) };
      }
      const st = r.pick([['e1', true], ['e2', false], ['e3', true], ['e4', false]]);
      return { prompt: m('t.formula.q4', { s: m('t.formula.' + st[0]) }), widget: { type: 'tf', truth: st[1], reasons: r.shuffle([{ label: m('t.formula.r.' + st[0]), correct: true }, { label: m('t.formula.r.w1'), correct: false }, { label: m('t.formula.r.w2'), correct: false }]) }, answer: m(st[1] ? 'c.true' : 'c.false'), explain: m('t.formula.r.' + st[0]) };
    }
  });

  /* ================= volume & surface ================= */
  T.add({
    id: 'volume', stage: 'ef_volume', objectives: ['EF.4.4', 'EF.C12', 'EF.C15'], mt: ['MT.53'],
    gen(r, L) {
      const a = r.int(2, L === 1 ? 4 : 12), b = r.int(2, L === 1 ? 3 : 10), c = r.int(1, L === 1 ? 3 : 9);
      if (L === 1) return { prompt: m('t.volume.q1'), figure: F.cuboidCubes(a, b, c), widget: { type: 'input', fields: [field('a', new MQ.Q(a * b * c), { unit: 'cm3' })] }, answer: m('c.unitv', { x: { unit: 'cm3', val: new MQ.Q(a * b * c) } }), explain: m('t.volume.ex1', { a, b, c, x: a * b * c }) };
      if (L === 2) return { prompt: m('t.volume.q2', { a: cm(a), b: cm(b), c: cm(c) }), figure: F.solid('cuboid'), widget: { type: 'input', fields: [field('a', new MQ.Q(a * b * c), { unit: 'cm3' })] }, diagnose: v => v.a && v.a.eq(a + b + c) ? m('t.volume.m.add') : (v.a && v.a.eq(2 * (a * b + b * c + a * c)) ? m('t.volume.m.surface') : null), answer: m('c.unitv', { x: { unit: 'cm3', val: new MQ.Q(a * b * c) } }), explain: m('t.volume.ex2', { a, b, c, x: a * b * c }), wrong: a + b + c !== a * b * c ? [{ fields: { a: String(a + b + c) } }] : [] };
      if (L === 3) return { prompt: m('t.volume.q3', { v: { unit: 'cm3', val: new MQ.Q(a * b * c) }, a: cm(a), b: cm(b) }), widget: { type: 'input', fields: [field('a', new MQ.Q(c), { unit: 'cm' })] }, answer: m('c.unitv', { x: cm(c) }), explain: m('t.volume.ex3', { v: a * b * c, a, b, p: a * b, x: c }) };
      const A = r.int(3, 8) * 10, B = r.int(2, 5) * 10, C = r.int(2, 6) * 10; const lit = new MQ.Q(A * B * C, 1000);
      return { prompt: m('t.volume.q4', { a: cm(A), b: cm(B), c: cm(C) }), figure: F.solid('cuboid'), widget: { type: 'input', fields: [field('a', lit, { unit: 'l' })] }, diagnose: v => v.a && v.a.eq(A * B * C) ? m('t.volume.m.liters') : null, answer: m('c.unitv', { x: { unit: 'l', val: lit } }), explain: m('t.volume.ex4', { a: A, b: B, c: C, v: A * B * C, x: lit }), wrong: [{ fields: { a: String(A * B * C) } }] };
    }
  });

  T.add({
    id: 'surface', stage: 'ef_volume', objectives: ['EF.4.4', 'EF.C11'], mt: ['MT.54'],
    gen(r, L) {
      if (L === 1) { const a = r.int(2, 3); return { prompt: m('t.surface.q1', { a }), figure: F.cuboidCubes(a, a, a), widget: { type: 'input', fields: [field('a', new MQ.Q(6 * a * a))] }, diagnose: v => v.a && v.a.eq(3 * a * a) ? m('t.surface.m.visible') : null, answer: m('c.num', { x: 6 * a * a }), explain: m('t.surface.ex1', { a, f: a * a, x: 6 * a * a }), wrong: [{ fields: { a: String(3 * a * a) } }] }; }
      if (L === 3) { const a = r.int(2, 15); return { prompt: m('t.surface.q3', { a: cm(a) }), widget: { type: 'input', fields: [field('a', new MQ.Q(6 * a * a), { unit: 'cm2' })] }, diagnose: v => v.a && v.a.eq(a * a * a) ? m('t.surface.m.volume') : null, answer: m('c.unitv', { x: { unit: 'cm2', val: new MQ.Q(6 * a * a) } }), explain: m('t.surface.ex3', { a, f: a * a, x: 6 * a * a }) }; }
      let a, b, c, S;
      do { a = r.int(2, 12); b = r.int(2, 10); c = r.int(2, 8); S = L === 2 ? 2 * (a * b + b * c + a * c) : a * b + 2 * (a * c + b * c); } while (S === a * b * c || (L === 4 && 2 * (a * b + b * c + a * c) === a * b * c));
      return { prompt: m(L === 2 ? 't.surface.q2' : 't.surface.q4', { a: cm(a), b: cm(b), c: cm(c) }), figure: F.solid('cuboid'), widget: { type: 'input', fields: [field('a', new MQ.Q(S), { unit: 'cm2' })] }, diagnose: v => v.a && v.a.eq(a * b * c) ? m('t.surface.m.volume') : (v.a && L === 4 && v.a.eq(2 * (a * b + b * c + a * c)) ? m('t.surface.m.lid') : null), answer: m('c.unitv', { x: { unit: 'cm2', val: new MQ.Q(S) } }), explain: m(L === 2 ? 't.surface.ex2' : 't.surface.ex4', { a, b, c, ab: a * b, bc: b * c, ac: a * c, x: S }), wrong: [{ fields: { a: String(a * b * c) } }] };
    }
  });

  /* ---------------- area_estimate: irregular figures (MathemaTIC MT.38) ---------------- */
  // A smooth random "pond" on squared paper; exact area/perimeter by the shoelace formula,
  // an estimate is accepted inside a tolerance band.
  const blob = (r, R0) => {
    const n = 18, ph1 = r.int(0, 628) / 100, ph2 = r.int(0, 628) / 100, k1 = r.pick([2, 3]), a1 = r.int(12, 22) / 100, a2 = r.int(4, 10) / 100;
    const cx = 5, cy = 4;
    return Array.from({ length: n }, (_, i) => { const t = 2 * Math.PI * i / n, rr = R0 * (1 + a1 * Math.sin(k1 * t + ph1) + a2 * Math.sin(5 * t + ph2)); return [Math.round((cx + rr * Math.cos(t)) * 100) / 100, Math.round((cy + rr * 0.85 * Math.sin(t)) * 100) / 100]; });
  };
  const shoelace = pts => Math.abs(pts.reduce((acc, p, i) => { const q = pts[(i + 1) % pts.length]; return acc + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const perimOf = pts => pts.reduce((acc, p, i) => { const q = pts[(i + 1) % pts.length]; return acc + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
  T.add({
    id: 'area_estimate', stage: 'ef_area', objectives: ['EF.4.2', 'GM.2.1'], mt: ['MT.38'],
    gen(r, L) {
      const R0 = L === 1 ? r.int(160, 200) / 100 : r.int(200, 260) / 100;
      const pts = blob(r, R0); const A = shoelace(pts), P = perimOf(pts);
      if (pts.some(p => p[0] < 0.2 || p[0] > 9.8 || p[1] < 0.2 || p[1] > 7.8)) return this.gen(r, L);
      const fig = F.onGrid(pts, { gw: 10, gh: 8, cls: 'shape blob' });
      if (L === 3) {
        const cands = [Math.round(P), Math.round(P * 0.55), Math.round(P * 1.7), Math.round(A)];
        const opts = [Math.round(P)]; cands.slice(1).forEach(x => { if (opts.every(o => Math.abs(o - x) / Math.max(o, x) > 0.3)) opts.push(x); });
        if (opts.length < 3) opts.push(Math.round(P * 2.4));
        return {
          prompt: m('t.area_estimate.q3'), figure: fig,
          widget: { type: 'mc', layout: 'row', options: r.shuffle(opts.map(x => ({ label: m('t.area_estimate.opt3', { x }), correct: x === Math.round(P), why: x === Math.round(A) ? m('t.area_estimate.m.area') : m('t.area_estimate.m.far') }))) },
          answer: m('t.area_estimate.opt3', { x: Math.round(P) }), explain: m('t.area_estimate.ex3', { x: Math.round(P) })
        };
      }
      const k = L === 4 ? 4 : 1, tol = L === 1 ? 0.25 : 0.18;
      const exact = A * k, lo = Math.max(1, Math.floor(exact * (1 - tol))), hi = Math.ceil(exact * (1 + tol)), best = Math.round(exact);
      return {
        prompt: m('t.area_estimate.q' + L), figure: fig,
        widget: {
          type: 'input', fields: [field('a', new MQ.Q(best), L === 4 ? { unit: 'm2' } : {})],
          custom: (resp, lang) => {
            const p = MQ.parseAnswer((resp.fields || {}).a, lang);
            if (!p.ok) return { correct: false, fb: m('fb.notNumber') };
            const v = p.value.toNumber(); const ok = v >= lo && v <= hi;
            let fb = null; if (!ok) fb = L === 4 && Math.abs(v - A) <= A * tol ? m('t.area_estimate.m.scale') : m('t.area_estimate.m.far');
            return { correct: ok, fb };
          },
          canonical: lang => ({ fields: { a: String(best) + (L === 4 ? ' m²' : '') } })
        },
        answer: m(L === 4 ? 't.area_estimate.ans4' : 't.area_estimate.ans', { x: best }),
        explain: m(L === 4 ? 't.area_estimate.ex4' : 't.area_estimate.ex', { s: Math.round(A), x: best, lo, hi }),
        ranges: [['area', A, 4, 30]],
        wrong: [{ fields: { a: String(Math.round(exact * 2.2)) } }, { fields: { a: String(Math.max(1, Math.round(exact * 0.4))) } }].concat(L === 4 ? [{ fields: { a: String(Math.round(A)) } }] : [])
      };
    }
  });

  /* ---------------- perim_path: shortest way along the edge (MathemaTIC MT.48) ---------------- */
  T.add({
    id: 'perim_path', stage: 'ef_area', objectives: ['EF.C9', 'EF.C10', 'EF.4.2'], mt: ['MT.48'],
    gen(r, L) {
      let V;
      if (L <= 2) { const w = r.int(6, 14), h = r.intExcept(4, 9, [w]); V = [[0, 0], [w, 0], [w, h], [0, h]]; }
      else { const w = r.int(8, 14), h = r.int(6, 10), nw = r.int(2, w - 4), nh = r.int(2, h - 3); V = [[0, 0], [w, 0], [w, h - nh], [w - nw, h - nh], [w - nw, h], [0, h]]; }
      // optional point on a side (L2): split side 1 (bottom-right → top-right)
      let iA, iB;
      if (L === 1) { iA = 0; iB = 2; }
      else if (L === 2) { const h = V[2][1], c = r.int(1, h - 1); V.splice(2, 0, [V[1][0], c]); iA = 0; iB = 2; if (r.chance(0.5)) { iA = 4; } }
      else { do { iA = r.int(0, V.length - 1); iB = r.int(0, V.length - 1); } while (iA === iB || Math.abs(iA - iB) === 1 || Math.abs(iA - iB) === V.length - 1); }
      const sides = V.map((p, i) => { const q = V[(i + 1) % V.length]; return Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]); });
      const Pm = sides.reduce((a, b) => a + b, 0);
      const way = (from, to) => { const out = []; for (let i = from; i !== to; i = (i + 1) % V.length) out.push(sides[i]); return out; };
      const w1 = way(iA, iB), w2 = way(iB, iA); const d1 = w1.reduce((a, b) => a + b, 0), d2 = Pm - d1;
      if ((L >= 3 && d1 === d2)) return this.gen(r, L);
      const short = Math.min(d1, d2), long = Math.max(d1, d2), diff = long - short;
      const sum = arr => ({ raw: arr.join(' + ') });
      // drawing
      const maxX = Math.max(...V.map(p => p[0])), maxY = Math.max(...V.map(p => p[1])), sc = Math.min(300 / maxX, 200 / maxY), ox = 40, oy = 30 + maxY * sc;
      const X = p => [ox + p[0] * sc, oy - p[1] * sc];
      const cx = maxX / 2, cy = maxY / 2;
      let body = F.poly(V.map(X), 'shape'); const boxes = [];
      [[iA, 'A'], [iB, 'B']].forEach(([i, nm]) => { const [x, y] = X(V[i]); const lx = x + (V[i][0] < cx ? -16 : 16), ly = V[i][1] === 0 || V[i][1] === maxY ? y + (V[i][1] < cy ? 22 : -12) : y + 5; boxes.push([lx, ly]); body += `<circle class="pt" cx="${x}" cy="${y}" r="6"/>` + F.text(lx, ly, nm, 'tx b'); });
      V.forEach((p, i) => { const q = V[(i + 1) % V.length]; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; const horiz = p[1] === q[1]; let [tx, ty] = X([mx, my]);
        // put the label outside the figure: test a point slightly on each side
        const inside = (x, y) => { let c = false; for (let a = 0, b = V.length - 1; a < V.length; b = a++) { const [xa, ya] = V[a], [xb, yb] = V[b]; if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; } return c; };
        const place = sgn => horiz ? [tx, ty + sgn * 18 + (sgn > 0 ? 4 : 0)] : [tx + sgn * 24, ty + 5];
        const outSgn = horiz ? (inside(mx, my + 0.3) ? 1 : -1) : (inside(mx + 0.3, my) ? -1 : 1);
        const hit = ([x, y]) => boxes.some(([bx, by]) => Math.abs(bx - x) < 44 && Math.abs(by - y) < 18);
        let pos = place(outSgn); if (hit(pos)) pos = place(-outSgn);
        boxes.push(pos); body += F.text(pos[0], pos[1], sides[i] + ' m', 'tx lbl'); });

      const fig = F.svg(ox * 2 + maxX * sc, oy + 40, body, '', 'pathfig');
      const ans = L === 4 ? diff : short;
      return {
        prompt: m(L === 4 ? 't.perim_path.q4' : 't.perim_path.q', { n: names(r, 1)[0] }), figure: fig,
        widget: { type: 'input', fields: [field('a', new MQ.Q(ans), { unit: 'm' })] },
        diagnose: v => !v.a ? null : (L < 4 && d1 !== d2 && v.a.eq(long) ? m('t.perim_path.m.longer') : v.a.eq(Pm) ? m('t.perim_path.m.whole') : (L === 4 && v.a.eq(short) ? m('t.perim_path.m.diff') : null)),
        answer: m('c.unitv', { x: { unit: 'm', val: new MQ.Q(ans) } }),
        explain: d1 === d2 ? m('t.perim_path.ex1', { p: sum(w1), q: sum(w2), x: d1 }) : m(L === 4 ? 't.perim_path.ex4' : 't.perim_path.ex', { p: sum(w1), x: d1, q: sum(w2), y: d2, z: short, d: diff, l: long }),
        wrong: [{ fields: { a: Pm + ' m' } }].concat(L < 4 && d1 !== d2 ? [{ fields: { a: long + ' m' } }] : []).concat(L === 4 && short !== diff ? [{ fields: { a: short + ' m' } }] : [])
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
