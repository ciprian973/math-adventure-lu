/* =====================================================================
 * Templates — C4 Résolution de problèmes d'arithmétique.
 * Stages: rp_analyse, rp_solve, rp_prop, rp_open, rp_check.
 * A bank of Luxembourg word-problem SCENARIOS (bakery in Esch, the
 * Schueberfouer, the bus to Luxembourg City, a football club in
 * Dudelange, a class trip to Vianden, a garden in Mamer, an aquarium,
 * a library book) is shared by the analysis, solving and checking
 * templates, so each story is written once per language (keys sc.*).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const T = MQ.T, { Q, m, num, frac, fr, field, mcValues, mcMsgs, names } = T.h;
  const F = MQ.fig;
  const U = (val, u) => ({ unit: u, val: MQ.Q.of(val) });
  const EUR = v => ({ money: MQ.Q.of(v) });
  const E = (...tk) => ({ expr: tk });
  const line = (e, x) => m('c.calcLine', { e: E(...e), x });

  /* ---- scenario bank: each returns story vars, data list, solution lines --- */
  const SC = {
    reading(r) {
      const n = names(r, 1)[0], t = r.int(12, 40) * 10, p = r.int(8, 25), d = r.int(3, 9), price = MQ.Q.dec(r.int(800, 1990), 2);
      if (p * d >= t) return SC.reading(r);
      const read = p * d, left = t - read;
      return { key: 'reading', v: { n, t, p, d, c: EUR(price) }, data: [[num(t), 1], [num(p), 1], [num(d), 1], [{ k: 'c.eur', v: { x: EUR(price) } }, 0]],
        lines: [{ e: [p, '*', d], v: read }, { e: [t, '-', read], v: left }], ans: new MQ.Q(left), fieldOpts: {}, answer: m('c.num', { x: left }) };
    },
    trip(r) {
      const n = r.int(16, 26), a = r.int(2, 4), e = r.pick([3, 4, 5, 6]), B = r.int(18, 45) * 10, km = r.int(30, 60);
      const ent = n * e, tot = ent + B;
      return { key: 'trip', v: { n, a, e: EUR(e), b: EUR(B), km }, data: [[num(n), 1], [num(a), 0], [{ k: 'c.eur', v: { x: EUR(e) } }, 1], [{ k: 'c.eur', v: { x: EUR(B) } }, 1], [{ k: 'c.unitv', v: { x: U(km, 'km') } }, 0]],
        lines: [{ e: [n, '*', e], v: ent }, { e: [ent, '+', B], v: tot }], ans: new MQ.Q(tot), fieldOpts: { unit: '€' }, answer: m('c.eur', { x: EUR(tot) }) };
    },
    bakery(r) {
      const n = names(r, 1)[0], a = r.int(3, 8), p = MQ.Q.dec(r.int(35, 75), 2), b = r.int(2, 4), q = MQ.Q.dec(r.int(110, 190), 2);
      const c1 = p.mul(a), c2 = q.mul(b), tot = c1.add(c2); const note = [10, 20].find(x => x > tot.toNumber()) || 20;
      const ch = new MQ.Q(note).sub(tot);
      return { key: 'bakery', v: { n, a, p: EUR(p), b, q: EUR(q), note: EUR(note), t: { time: 6 * 60 + 30 } }, data: [[num(a), 1], [{ k: 'c.eur', v: { x: EUR(p) } }, 1], [num(b), 1], [{ k: 'c.eur', v: { x: EUR(q) } }, 1], [{ k: 'c.eur', v: { x: EUR(note) } }, 1], [{ k: 'c.time', v: { t: { time: 390 } } }, 0]],
        lines: [{ e: [a, '*', p], v: c1 }, { e: [b, '*', q], v: c2 }, { e: [c1, '+', c2], v: tot }, { e: [note, '-', tot], v: ch }], ans: ch, fieldOpts: { unit: '€' }, answer: m('c.eur', { x: EUR(ch) }) };
    },
    fouer(r) {
      const n = names(r, 1)[0], mo = r.pick([20, 25, 30]), k = r.int(2, 4), p = MQ.Q.dec(r.pick([300, 350, 400, 450]), 2), g = MQ.Q.dec(r.pick([400, 450, 500]), 2), rides = r.int(150, 200);
      const c = p.mul(k), sp = c.add(g), left = new MQ.Q(mo).sub(sp);
      if (left.n <= 0) return SC.fouer(r);
      return { key: 'fouer', v: { n, m: EUR(mo), k, p: EUR(p), g: EUR(g), x: rides }, data: [[{ k: 'c.eur', v: { x: EUR(mo) } }, 1], [num(k), 1], [{ k: 'c.eur', v: { x: EUR(p) } }, 1], [{ k: 'c.eur', v: { x: EUR(g) } }, 1], [num(rides), 0]],
        lines: [{ e: [k, '*', p], v: c }, { e: [c, '+', g], v: sp }, { e: [mo, '-', sp], v: left }], ans: left, fieldOpts: { unit: '€' }, answer: m('c.eur', { x: EUR(left) }) };
    },
    bus(r) {
      const n = names(r, 1)[0], t1 = r.int(6 * 60, 17 * 60), d1 = r.int(18, 55), d2 = r.int(5, 20), pass = r.int(20, 60);
      const d = d1 + d2, t2 = t1 + d;
      return { key: 'bus', v: { n, t: { time: t1 }, a: d1, b: d2, s: pass }, data: [[{ k: 'c.time', v: { t: { time: t1 } } }, 1], [{ k: 'c.unitv', v: { x: U(d1, 'min') } }, 1], [{ k: 'c.unitv', v: { x: U(d2, 'min') } }, 1], [num(pass), 0]],
        lines: [{ e: [d1, '+', d2], v: d }, { msg: m('t.rp.timeLine', { a: { time: t1 }, d, x: { time: t2 } }), v: t2, kind: 'time', bad: t1 + d + 10 }], ans: t2, kind: 'time', fieldOpts: { kind: 'time' }, answer: m('c.time', { t: { time: t2 } }) };
    },
    football(r) {
      const nj = r.int(12, 22), p = r.pick([18, 22, 25, 28, 35]), nb = r.int(4, 10), q = r.pick([12, 15, 19, 24]), s = r.int(10, 30) * 10, year = r.int(1906, 1975);
      const a = nj * p, b = nb * q, tot = a + b, rest = tot - s;
      if (rest <= 0) return SC.football(r);
      return { key: 'football', v: { nj, p: EUR(p), nb, q: EUR(q), s: EUR(s), y: { raw: String(year) } }, data: [[num(nj), 1], [{ k: 'c.eur', v: { x: EUR(p) } }, 1], [num(nb), 1], [{ k: 'c.eur', v: { x: EUR(q) } }, 1], [{ k: 'c.eur', v: { x: EUR(s) } }, 1], [{ raw: String(year) }, 0]],
        lines: [{ e: [nj, '*', p], v: a }, { e: [nb, '*', q], v: b }, { e: [a, '+', b], v: tot }, { e: [tot, '-', s], v: rest }], ans: new MQ.Q(rest), fieldOpts: { unit: '€' }, answer: m('c.eur', { x: EUR(rest) }) };
    },
    garden(r) {
      const L = r.int(8, 25), W = r.int(5, 15), p = r.pick([4, 6, 8, 12, 15]), x = r.int(10, 30);
      const s = L + W, P = 2 * s, cost = P * p;
      return { key: 'garden', v: { l: U(L, 'm'), w: U(W, 'm'), p: EUR(p), x: U(x, 'm') }, data: [[{ k: 'c.unitv', v: { x: U(L, 'm') } }, 1], [{ k: 'c.unitv', v: { x: U(W, 'm') } }, 1], [{ k: 'c.eur', v: { x: EUR(p) } }, 1], [{ k: 'c.unitv', v: { x: U(x, 'm') } }, 0]],
        lines: [{ e: [L, '+', W], v: s }, { e: [2, '*', s], v: P }, { e: [P, '*', p], v: cost }], ans: new MQ.Q(cost), fieldOpts: { unit: '€' }, answer: m('c.eur', { x: EUR(cost) }) };
    },
    aquarium(r) {
      const a = r.pick([40, 50, 60, 80, 100]), b = r.pick([20, 25, 30, 40]), c = r.pick([30, 40, 50]), k = r.pick([5, 10]), fish = r.int(6, 15);
      const v = a * b * c, l = v / 1000; if (l % k) return SC.aquarium(r);
      return { key: 'aquarium', v: { a: U(a, 'cm'), b: U(b, 'cm'), c: U(c, 'cm'), k: U(k, 'l'), f: fish }, data: [[{ k: 'c.unitv', v: { x: U(a, 'cm') } }, 1], [{ k: 'c.unitv', v: { x: U(b, 'cm') } }, 1], [{ k: 'c.unitv', v: { x: U(c, 'cm') } }, 1], [{ k: 'c.unitv', v: { x: U(k, 'l') } }, 1], [num(fish), 0]],
        lines: [{ e: [a, '*', b, '*', c], v: v }, { e: [v, '/', 1000], v: l }, { e: [l, '/', k], v: l / k }], ans: new MQ.Q(l / k), fieldOpts: {}, answer: m('c.num', { x: l / k }) };
    }
  };
  const BY_LEVEL = { 1: ['reading', 'trip'], 2: ['bakery', 'fouer', 'bus'], 3: ['football', 'garden', 'fouer'], 4: ['aquarium', 'football', 'garden'] };
  const story = s => m('sc.' + s.key + '.text', s.v);

  /* ---------------- rp_goal: what is the question asking? ---------------- */
  T.add({
    id: 'rp_goal', stage: 'rp_analyse', objectives: ['RP.1.3', 'GC.4'], mt: ['MT.88'],
    gen(r, L) {
      const s = SC[r.pick(BY_LEVEL[L])](r);
      return { prompt: m('t.rp_goal.q', { s: story(s) }), widget: { type: 'mc', options: r.shuffle([0, 1, 2].map(i => ({ label: m('sc.' + s.key + '.g' + i, s.v), correct: i === 0, why: i ? m('t.rp_goal.m.other') : null }))) }, answer: m('sc.' + s.key + '.g0', s.v), explain: m('t.rp_goal.ex') };
    }
  });

  /* ---------------- rp_data: which data do we need? ---------------- */
  T.add({
    id: 'rp_data', stage: 'rp_analyse', objectives: ['RP.1.2', 'GM.2.7', 'RP.3.2'], mt: ['MT.88'],
    gen(r, L) {
      const s = SC[r.pick(BY_LEVEL[L])](r);
      return { prompt: m('t.rp_data.q', { s: story(s) }), widget: { type: 'multi', options: r.shuffle(s.data.map(([lbl, rel]) => ({ label: lbl, correct: !!rel }))), extraFb: 't.rp_data.m.extra' }, answer: m('t.rp_data.ans'), explain: m('sc.' + s.key + '.irr', s.v) };
    }
  });

  /* ---------------- rp_steps: plan the solution ---------------- */
  T.add({
    id: 'rp_steps', stage: 'rp_analyse', objectives: ['RP.1.4', 'GC.3'], mt: [],
    gen(r, L) {
      const pool = L <= 2 ? ['bakery', 'fouer', 'garden'] : ['bakery', 'football', 'garden', 'aquarium'];
      const s = SC[r.pick(pool)](r);
      const items = s.lines.map((_, i) => ({ label: m('sc.' + s.key + '.s' + (i + 1), s.v), key: i }));
      return { prompt: m('t.rp_steps.q', { s: story(s) }), widget: { type: 'order', items: r.shuffle(items) }, answer: m('c.orderAnswer'), explain: m('t.rp_steps.ex') };
    }
  });

  /* ---------------- rp_schema: choose the right diagram ---------------- */
  T.add({
    id: 'rp_schema', stage: 'rp_analyse', objectives: ['RP.1.1', 'GC.5', 'GC.4'], mt: [],
    gen(r, L) {
      const [A, B] = names(r, 2); const a = r.int(L <= 2 ? 6 : 12, L <= 2 ? 20 : 48), k = r.int(2, 4), d = r.int(5, 15), n = r.int(3, 5), t = n * r.int(4, 12);
      const kinds = ['times', 'more', 'share', 'part'];
      const kind = r.pick(kinds);
      const vv = { A, B, a, k, d, n, t, g: Math.max(1, Math.floor(t / 3)) };
      const rowFig = (rows) => rows.map(([nm, segs, total]) => `<div class="bmrow"><span class="bmname">${nm}</span>${F.barModel(segs, { total, width: 360 })}</div>`).join('');
      const figs = {
        times: rowFig([[A, [{ w: 1, text: a }]], [B, Array(k).fill({ w: 1, text: a }), '?']]),
        more: rowFig([[A, [{ w: 3, text: a }]], [B, [{ w: 3, text: a }, { w: 1, text: d, cls: 'b1' }], '?']]),
        share: rowFig([['', Array(n).fill({ w: 1, text: '?' }), String(t)]]),
        part: rowFig([['', [{ w: 2, text: String(vv.g), cls: 'b2' }, { w: 4, text: '?' }], String(t)]])
      };
      const opts = (L === 1 ? [kind, r.pick(kinds.filter(x => x !== kind))] : [kind].concat(r.sample(kinds.filter(x => x !== kind), L === 2 ? 2 : 3)));
      const sh = r.shuffle(opts);
      return { prompt: m('t.rp_schema.q', { p: m('t.rp_schema.p.' + kind, vv) }), widget: { type: 'mc', layout: 'list', options: sh.map((kk, i) => ({ label: { k: 'c.letter', v: { l: String.fromCharCode(65 + i) } }, fig: figs[kk], correct: kk === kind })) }, answer: m('c.letter', { l: String.fromCharCode(65 + sh.indexOf(kind)) }), explain: m('t.rp_schema.ex.' + kind, vv) };
    }
  });

  /* ---------------- rp_multi: solve a multi-step problem ---------------- */
  T.add({
    id: 'rp_multi', stage: 'rp_solve', objectives: ['RP.2.1', 'RP.2.3', 'RP.2.4', 'GC.1', 'GC.4', 'RP.C1'], mt: [],
    gen(r, L) {
      const s = SC[r.pick(BY_LEVEL[L])](r);
      return {
        prompt: story(s),
        widget: { type: 'input', fields: [field('a', s.ans, s.fieldOpts)] },
        answer: s.answer,
        hints: [m('t.rp_multi.h1'), m('sc.' + s.key + '.s1', s.v), m('t.rp_multi.h3', { l: { list: s.lines.slice(0, -1).map(ln => ln.msg || line(ln.e, ln.v)), sep: ' ; ' } })],
        explain: m('t.rp_multi.ex', { l: { list: s.lines.map(ln => ln.msg || line(ln.e, ln.v)), sep: '<br>' }, x: s.answer })
      };
    }
  });

  /* ---------------- rp_table: information from a price list ---------------- */
  const PRICES = { wheel: 400, bumper: 300, ghost: 350, fritters: 450, magenbrout: 300, lemonade: 250, carousel: 200 };
  T.add({
    id: 'rp_table', stage: 'rp_solve', objectives: ['RP.3.2', 'RP.2.1', 'GM.2.7', 'NO.4.4'], mt: ['MT.89'],
    gen(r, L) {
      const keys = Object.keys(PRICES);
      const tbl = { html: lang => `<table class="ptable pricelist"><caption>${MQ.t('t.rp_table.title', {}, lang)}</caption>${keys.map(k => `<tr><th>${MQ.t('fouer.' + k, {}, lang)}</th><td>${MQ.fmtNum(new MQ.Q(PRICES[k], 100), lang, { places: 2 })} €</td></tr>`).join('')}</table>` };
      const n = names(r, 1)[0];
      if (L <= 3) {
        const items = r.sample(keys, L === 1 ? 2 : 3); const qty = items.map(() => L === 1 ? 1 : r.int(1, 3));
        const tot = items.reduce((acc, k, i) => acc.add(new MQ.Q(PRICES[k] * qty[i], 100)), new MQ.Q(0));
        const list = { list: items.map((k, i) => m('t.rp_table.item', { q: qty[i], i: { k: 'fouer.' + k } })), sep: ', ' };
        if (L === 3) { const pay = 20; const ch = new MQ.Q(pay).sub(tot); if (ch.n <= 0) return this.gen(r, L); return { prompt: m('t.rp_table.q3', { n, l: list, b: EUR(pay) }), figure: { htmlFig: tbl }, widget: { type: 'input', fields: [field('a', ch, { unit: '€' })] }, answer: m('c.eur', { x: EUR(ch) }), explain: m('t.rp_table.ex3', { t: EUR(tot), b: EUR(pay), x: EUR(ch) }) }; }
        return { prompt: m('t.rp_table.q', { n, l: list }), figure: { htmlFig: tbl }, widget: { type: 'input', fields: [field('a', tot, { unit: '€' })] }, answer: m('c.eur', { x: EUR(tot) }), explain: m('t.rp_table.ex', { x: EUR(tot) }) };
      }
      const k = r.pick(['bumper', 'wheel']); const single = new MQ.Q(PRICES[k], 100); const card = new MQ.Q(r.pick([25, 30])); const rides = r.int(9, 12);
      const diff = single.mul(rides).sub(card);
      if (diff.n <= 0) return this.gen(r, L);
      return { prompt: m('t.rp_table.q4', { n, i: { k: 'fouer.' + k }, c: EUR(card), r: rides }), figure: { htmlFig: tbl }, widget: { type: 'input', fields: [field('a', diff, { unit: '€' })] }, answer: m('c.eur', { x: EUR(diff) }), explain: m('t.rp_table.ex4', { r: rides, p: EUR(single), t: EUR(single.mul(rides)), c: EUR(card), x: EUR(diff) }) };
    }
  });

  /* ---------------- rp_prop: proportionality ---------------- */
  T.add({
    id: 'rp_prop', stage: 'rp_prop', objectives: ['RP.2.6', 'NO.4.2', 'GM.2.8', 'RP.C1'], mt: ['MT.28'],
    gen(r, L) {
      if (L === 1) { const n = names(r, 1)[0], p = MQ.Q.dec(r.int(45, 250), 2), k = r.int(3, 9); return { prompt: m('t.rp_prop.q1', { n, p: EUR(p), k }), widget: { type: 'input', fields: [field('a', p.mul(k), { unit: '€' })] }, answer: m('c.eur', { x: EUR(p.mul(k)) }), explain: m('t.rp_prop.ex1', { p: EUR(p), k, x: EUR(p.mul(k)) }) }; }
      if (L === 2 || L === 3) {
        const base = 4; const g = r.pick([400, 600, 800, 1000]), e = r.pick([2, 4]);
        const target = L === 2 ? base * r.int(2, 3) : r.pick([6, 10, 2, 14]);
        const resG = new MQ.Q(g * target, base);
        return { prompt: m('t.rp_prop.q2', { n: base, g: U(g, 'g'), e, m: target }), widget: { type: 'input', fields: [field('a', resG, { unit: 'g' })] }, diagnose: v => v.a && v.a.eq(g + (target - base)) ? m('t.rp_prop.m.additive') : null, answer: m('c.unitv', { x: U(resG, 'g') }), explain: m(L === 2 ? 't.rp_prop.ex2' : 't.rp_prop.ex3', { n: base, g, m: target, u: g / base, k: target / base, x: resG }), wrong: [{ fields: { a: String(g + (target - base)) } }] };
      }
      if (r.chance(0.5)) {
        const a = r.pick([8, 10, 12, 15]), k = r.pick([2, 3, 4]), b = a * k, t = k * r.int(2, 8);
        return { prompt: m('t.rp_prop.q4g', { a, b, t }), figure: (() => { const g = (cx, cy, R, n) => { let s = `<circle class="gear" cx="${cx}" cy="${cy}" r="${R}"/>`; for (let i = 0; i < n; i++) { const an = 2 * Math.PI * i / n; s += `<circle class="tooth" cx="${cx + (R + 4) * Math.cos(an)}" cy="${cy + (R + 4) * Math.sin(an)}" r="3"/>`; } return s; }; return F.svg(330, 170, g(70, 85, 34, a) + g(70 + 34 + 8 + 70, 85, 70, Math.min(b, 60)) + F.text(70, 90, 'A', 'tx b') + F.text(252, 90, 'B', 'tx b'), ''); })(), widget: { type: 'input', fields: [field('a', new MQ.Q(t * a, b))] }, diagnose: v => v.a && v.a.eq(t * k) ? m('t.rp_prop.m.gearsInverse') : null, answer: m('c.num', { x: t * a / b }), explain: m('t.rp_prop.ex4g', { a, b, t, n: t * a, x: t * a / b }) };
      }
      const l1 = r.pick([2, 4, 5, 6]), unitP = MQ.Q.dec(r.int(6, 50) * 5, 2), p1 = unitP.mul(l1), l2 = r.intExcept(3, 12, [l1]);
      const res = unitP.mul(l2);
      return { prompt: m('t.rp_prop.q4j', { a: U(l1, 'l'), p: EUR(p1), b: U(l2, 'l') }), widget: { type: 'input', fields: [field('a', res, { unit: '€' })] }, answer: m('c.eur', { x: EUR(res) }), explain: m('t.rp_prop.ex4j', { a: l1, p: EUR(p1), u: EUR(p1.div(l1)), b: l2, x: EUR(res) }) };
    }
  });

  /* ---------------- rp_open: open problems (several solutions) ---------------- */
  T.add({
    id: 'rp_open', stage: 'rp_open', objectives: ['RP.2.2', 'RP.2.5', 'GC.1', 'GC.4', 'RP.C1'], mt: [],
    gen(r, L) {
      if (L <= 2) {
        const keys = r.sample(['wheel', 'bumper', 'ghost', 'lemonade', 'carousel', 'magenbrout'], L === 1 ? 2 : 3);
        const prices = keys.map(k => PRICES[k] / 100 === Math.floor(PRICES[k] / 100) ? PRICES[k] / 100 : null);
        const P = keys.map(k => new MQ.Q(PRICES[k], 100));
        const cnt = keys.map(() => r.int(1, 3)); const X = cnt.reduce((acc, c, i) => acc.add(P[i].mul(c)), new MQ.Q(0));
        return {
          prompt: m('t.rp_open.q' + L, { x: EUR(X), l: { list: keys.map((k, i) => m('t.rp_open.price', { i: { k: 'fouer.' + k }, p: EUR(P[i]) })), sep: ', ' } }),
          widget: { type: 'input', fields: keys.map((k, i) => field('c' + i, new MQ.Q(cnt[i]), { label: m('fouer.' + k) })),
            custom: (resp, lang) => { const vals = keys.map((_, i) => MQ.parseAnswer((resp.fields || {})['c' + i], lang)); if (vals.some(v => !v.ok)) return { correct: false, fb: m('fb.notNumber') }; if (vals.some(v => !v.value.isInt() || v.value.n < 1)) return { correct: false, fb: m('t.rp_open.m.atLeastOne') }; const tot = vals.reduce((acc, v, i) => acc.add(P[i].mul(v.value)), new MQ.Q(0)); return { correct: tot.eq(X), fb: tot.eq(X) ? null : m('t.rp_open.m.total', { t: EUR(tot), x: EUR(X) }) }; },
            canonical: () => ({ fields: Object.fromEntries(cnt.map((c, i) => ['c' + i, String(c)])) }) },
          answer: m('t.rp_open.ans', { l: { list: keys.map((k, i) => m('t.rp_table.item', { q: cnt[i], i: { k: 'fouer.' + k } })), sep: ', ' } }), explain: m('t.rp_open.ex12')
        };
      }
      const P = 2 * r.int(6, 15) * (L === 4 ? 2 : 1);
      if (L === 3) {
        return {
          prompt: m('t.rp_open.q3', { p: U(P, 'cm') }),
          widget: { type: 'input', fields: [field('l', new MQ.Q(P / 2 - 1), { unit: 'cm', label: m('w.length') }), field('w', new MQ.Q(1), { unit: 'cm', label: m('w.width') })],
            custom: (resp, lang) => { const a = MQ.parseAnswer((resp.fields || {}).l, lang), b = MQ.parseAnswer((resp.fields || {}).w, lang); if (!a.ok || !b.ok) return { correct: false, fb: m('fb.notNumber') }; if (a.value.n <= 0 || b.value.n <= 0) return { correct: false, fb: m('t.rp_open.m.positive') }; const ok = a.value.add(b.value).mul(2).eq(P); return { correct: ok, fb: ok ? null : m('t.rp_open.m.perim', { x: U(a.value.add(b.value).mul(2), 'cm') }) }; },
            canonical: () => ({ fields: { l: String(P / 2 - 1), w: '1' } }) },
          answer: m('t.rp_open.ans3', { s: P / 2 }), explain: m('t.rp_open.ex3', { p: P, s: P / 2 })
        };
      }
      const half = P / 2, count = Math.floor(half / 2), side = half / 2, maxA = Number.isInteger(side) ? side * side : Math.floor(side) * Math.ceil(side);
      return {
        prompt: m('t.rp_open.q4', { p: U(P, 'cm') }),
        widget: { type: 'input', fields: [field('n', new MQ.Q(count), { label: m('t.rp_open.count') }), field('a', new MQ.Q(maxA), { unit: 'cm2', label: m('t.rp_open.maxArea') })] },
        answer: m('t.rp_open.ans4', { n: count, a: maxA }), explain: m('t.rp_open.ex4', { s: half, n: count, l: { raw: Array.from({ length: count }, (_, i) => (i + 1) + ' × ' + (half - i - 1)).join(' ; ') }, a: maxA })
      };
    }
  });

  /* ---------------- rp_compare: compare two strategies ---------------- */
  T.add({
    id: 'rp_compare', stage: 'rp_check', objectives: ['RP.3.1', 'GC.2', 'GC.3', 'NO.3.3'], mt: [],
    gen(r, L) {
      const [A, B] = names(r, 2); const a = r.int(12, 48), b = 2 * r.int(6, 24); const p = a * b;
      const t = b - b % 10, u = b % 10;
      if (u === 0) return this.gen(r, L);
      const okA = L === 4 ? false : r.chance(0.6), okB = L === 4 ? false : (okA ? r.chance(0.5) : true);
      const errA = okA ? 0 : r.pick([10, -10, 100]), errB = okB ? 0 : r.pick([2, -2, 20]);
      const lineA = m('t.rp_compare.lineA', { e: E(a, '*', b), f: { expr: [a, '*', t, '+', a, '*', u] }, g: { expr: [a * t + errA, '+', a * u] }, x: a * b + errA });
      const lineB = m('t.rp_compare.lineB', { e: E(a, '*', b), f: { expr: ['(', a, '*', 2, ')', '*', '(', b, '/', 2, ')'] }, g: { expr: [2 * a, '*', b / 2] }, x: p + errB });
      const right = okA && okB ? 'both' : okA ? 'a' : okB ? 'b' : 'none';
      return {
        prompt: m('t.rp_compare.q', { A, B, la: lineA, lb: lineB }),
        widget: { type: 'mc', options: ['a', 'b', 'both', 'none'].map(k => ({ label: m('t.rp_compare.o.' + k, { A, B }), correct: k === right })) },
        answer: m('t.rp_compare.o.' + right, { A, B }), explain: m('t.rp_compare.ex', { A, B, x: p, ra: m(okA ? 't.rp_compare.ok' : 't.rp_compare.ko', { n: A }), rb: m(okB ? 't.rp_compare.ok' : 't.rp_compare.ko', { n: B }) })
      };
    }
  });

  /* ---------------- rp_hypo: formulate & check hypotheses on data ---------------- */
  T.add({
    id: 'rp_hypo', stage: 'rp_check', objectives: ['RP.3.3', 'RP.3.2', 'GC.2', 'NO.4.3'], mt: [],
    gen(r, L) {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const vals = days.map((d, i) => (i >= 5 ? r.int(30, 48) : r.int(12, 32)) * 100);
      const tbl = { html: lang => `<table class="ptable"><caption>${MQ.t('t.rp_hypo.caption', {}, lang)}</caption><tr>${days.map(d => `<th>${MQ.t('day.short.' + d, {}, lang)}</th>`).join('')}</tr><tr>${vals.map(v => `<td>${MQ.fmtNum(v, lang)}</td>`).join('')}</tr></table>` };
      const types = L === 1 ? ['min', 'max'] : L === 2 ? ['min', 'max', 'inc'] : ['min', 'max', 'inc', 'mean'];
      const type = r.pick(types); let truth, v = {};
      const n = names(r, 1)[0]; v.n = n;
      if (type === 'min') { const mn = Math.min(...vals); const X = r.chance(0.5) ? mn - r.int(1, 3) * 100 : mn + r.int(1, 3) * 100; v.x = X; truth = mn > X; }
      if (type === 'max') { const mx = Math.max(...vals); const i = r.chance(0.5) ? vals.indexOf(mx) : r.int(0, 6); v.d = { k: 'day.' + days[i] }; truth = vals[i] === mx && vals.filter(x => x === mx).length === 1; }
      if (type === 'inc') { truth = vals.slice(0, 5).every((x, i) => i === 0 || x > vals[i - 1]); if (!truth && r.chance(0.4)) { vals.splice(0, 5, ...vals.slice(0, 5).sort((a, b) => a - b)); truth = vals.slice(0, 5).every((x, i) => i === 0 || x > vals[i - 1]); } }
      if (type === 'mean') { const mean = new MQ.Q(vals.reduce((a, b) => a + b, 0), 7); const X = Math.round(mean.toNumber() / 100) * 100 + r.pick([-200, -100, 100, 200]); v.x = X; truth = mean.gt(X); }
      const others = types.filter(t => t !== type);
      const reasons = [{ label: m('t.rp_hypo.r.' + type), correct: true }].concat(r.sample(others, Math.min(2, others.length)).map(t => ({ label: m('t.rp_hypo.r.' + t), correct: false })));
      return { prompt: m('t.rp_hypo.q', { s: m('t.rp_hypo.s.' + type, v) }), figure: { htmlFig: tbl }, widget: { type: 'tf', truth, reasons: r.shuffle(reasons) }, answer: m(truth ? 'c.true' : 'c.false'), explain: m('t.rp_hypo.ex.' + type, { ...v, mn: Math.min(...vals), mx: Math.max(...vals), mean: new MQ.Q(vals.reduce((a, b) => a + b, 0), 7).toNumber() === Math.round(new MQ.Q(vals.reduce((a, b) => a + b, 0), 7).toNumber()) ? new MQ.Q(vals.reduce((a, b) => a + b, 0), 7) : { raw: '≈ ' + Math.round(vals.reduce((a, b) => a + b, 0) / 7) }, s: vals.reduce((a, b) => a + b, 0) }) };
    }
  });

  /* ---------------- rp_verify: find the wrong step in a solution ---------------- */
  T.add({
    id: 'rp_verify', stage: 'rp_check', objectives: ['RP.3.4', 'NO.2.4', 'GC.2'], mt: [],
    gen(r, L) {
      const pool = L <= 2 ? ['bakery', 'fouer', 'trip'] : ['football', 'garden', 'aquarium', 'bakery'];
      const s = SC[r.pick(pool)](r);
      if (s.lines.some(ln => ln.msg)) return this.gen(r, L);
      const k = r.int(0, s.lines.length - 1);
      const vals = s.lines.map(ln => MQ.Q.of(ln.v));
      const wrong = vals[k].add(r.pick([1, 10, -1, 2]) * (vals[k].isInt() ? 1 : 1)).add(vals[k].isInt() ? 0 : new MQ.Q(0));
      if (wrong.n <= 0 || wrong.eq(vals[k])) return this.gen(r, L);
      const shown = s.lines.map((ln, i) => i === k ? wrong : vals[i]);
      // recompute later lines from the shown wrong value to stay consistent
      const exprs = s.lines.map(ln => ln.e.slice());
      for (let i = k + 1; i < exprs.length; i++) { exprs[i] = exprs[i].map(tk => (tk instanceof MQ.Q || typeof tk === 'number') && vals.slice(0, i).some((v, j) => j === k && MQ.Q.of(tk).eq(v)) ? wrong : tk); shown[i] = MQ.evalExpr(exprs[i]); }
      if (shown.some(x => x.n < 0)) return this.gen(r, L);
      return {
        prompt: m('t.rp_verify.q', { s: story(s), n: names(r, 1)[0] }),
        widget: { type: 'mistake', steps: exprs.map((e, i) => line(e, shown[i])), wrongStep: k, fields: [field('fix', vals[k], { label: m('t.rp_verify.fix') })] },
        answer: m('t.rp_verify.ans', { i: k + 1, x: vals[k] }), explain: m('t.rp_verify.ex', { i: k + 1, l: line(s.lines[k].e, vals[k]), x: s.answer })
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
