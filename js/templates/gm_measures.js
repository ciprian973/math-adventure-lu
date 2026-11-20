/* =====================================================================
 * Templates — C4 Grandeurs et mesures. Stages: gm_length, gm_masscap,
 * gm_time, gm_money, gm_units, gm_data.
 * Units: km hm m dm cm mm ; t kg g ; hl l dl cl ml ; m² dm² cm² mm² ;
 * m³ dm³ cm³ mm³ (1 l = 1 dm³) ; € ct ; h min s ; days, weeks.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const T = MQ.T, { Q, m, num, frac, fr, field, mcValues, mcMsgs, names } = T.h;
  const F = MQ.fig;
  const U = (val, u, places) => ({ unit: u, val: MQ.Q.of(val), places });
  const P10 = e => e >= 0 ? new MQ.Q(Math.pow(10, e)) : new MQ.Q(1, Math.pow(10, -e));

  /* exponent of each unit relative to the family base */
  const FAM = {
    length: { m: 0, km: 3, hm: 2, dm: -1, cm: -2, mm: -3 },
    mass: { g: 0, kg: 3, t: 6 },
    capacity: { l: 0, hl: 2, dl: -1, cl: -2, ml: -3 },
    area: { m2: 0, dm2: -2, cm2: -4, mm2: -6 },
    volume: { m3: 0, dm3: -3, cm3: -6, mm3: -9 }
  };
  const ORDER = { length: ['km', 'hm', 'm', 'dm', 'cm', 'mm'], mass: ['t', 'kg', 'g'], capacity: ['hl', 'l', 'dl', 'cl', 'ml'], area: ['m2', 'dm2', 'cm2', 'mm2'], volume: ['m3', 'dm3', 'cm3', 'mm3'] };

  /* ---------------- conversions (one factory, three stages) ---------- */
  function convertGen(families) {
    return function (r, L) {
      const fam = r.pick(families); const ord = ORDER[fam], ex = FAM[fam];
      let from, to, val;
      const idx = r.int(0, ord.length - 2);
      if (L === 1) { from = ord[idx]; to = ord[idx + 1]; val = new MQ.Q(r.int(2, 99)); }
      else if (L === 2) { const j = Math.min(ord.length - 1, idx + r.int(1, 2)); [from, to] = r.chance(0.5) ? [ord[idx], ord[j]] : [ord[j], ord[idx]]; const f = P10(ex[from] - ex[to]); val = f.lt(1) ? new MQ.Q(r.int(1, 99)).div(f) : new MQ.Q(r.int(2, 99)); }
      else if (L === 3) { const j = idx + 1; [from, to] = r.chance(0.6) ? [ord[idx], ord[j]] : [ord[j], ord[idx]]; val = MQ.Q.dec(r.int(11, 999), r.int(1, 2)); }
      else {
        // mixed units: "3 m 45 cm = ? cm"  or cross-family l ↔ dm³ / cm³
        if (fam === 'volume' || fam === 'capacity') {
          const pairs = [['l', 'dm3', 0], ['dm3', 'l', 0], ['l', 'cm3', 3], ['cm3', 'l', -3], ['ml', 'cm3', 0], ['dm3', 'ml', 3]];
          const [a, b, e] = r.pick(pairs); const v = e < 0 ? new MQ.Q(r.int(5, 95) * 50) : MQ.Q.dec(r.int(5, 95), 1);
          const res = v.mul(P10(e));
          return convExercise(v, a, b, res, fam, true);
        }
        const big = ord[idx], small = ord[idx + 1]; const f = P10(ex[big] - ex[small]).toNumber();
        const A = r.int(1, 12), B = r.int(1, f - 1);
        const res = new MQ.Q(A * f + B);
        return {
          prompt: m('t.convert.qMixed', { a: U(A, big), b: U(B, small), u: { raw: MQ.unitStr(small) } }),
          widget: { type: 'input', fields: [field('a', res, { unit: small })] },
          diagnose: v => v.a && v.a.eq(A * 10 + B) && f !== 10 ? m('t.convert.m.factor', { f }) : null,
          answer: m('c.unitv', { x: U(res, small) }), explain: m('t.convert.exMixed', { a: U(A, big), f, b: B, x: U(res, small), af: A * f, u: { raw: MQ.unitStr(small) } }),
          hints: [m('t.convert.h1'), m('t.convert.h2'), m('t.convert.h3m', { f, u1: { raw: MQ.unitStr(big) }, u2: { raw: MQ.unitStr(small) } })]
        };
      }
      const res = val.mul(P10(ex[from] - ex[to]));
      if (res.decimalPlaces() > 3 || res.toNumber() > 9999999) return this.gen(r, L);
      return convExercise(val, from, to, res, fam, false);
    };
  }
  function convExercise(val, from, to, res, fam, cross) {
    const f = res.div(val); const big = f.gt(1);
    const step = fam === 'area' ? 100 : fam === 'volume' ? 1000 : 10;
    const wrongFactor = [10, 100, 1000].map(x => big ? val.mul(x) : val.div(x)).filter(x => !x.eq(res));
    return {
      prompt: m('t.convert.q', { a: U(val, from), u: { raw: MQ.unitStr(to) } }),
      widget: { type: 'input', fields: [field('a', res, { unit: to })] },
      diagnose: v => { if (!v.a) return null; if (wrongFactor.some(w => w.eq(v.a))) return m(fam === 'area' || fam === 'volume' ? 't.convert.m.areaVol' : 't.convert.m.factorGen'); if (val.div(f).eq(v.a) && !f.eq(1)) return m('t.convert.m.direction'); return null; },
      answer: m('c.unitv', { x: U(res, to) }),
      explain: m(cross ? 't.convert.exCross' : big ? 't.convert.exBig' : 't.convert.exSmall', { a: U(val, from), x: U(res, to), f: big ? f : MQ.Q.of(1).div(f), u1: { raw: MQ.unitStr(from) }, u2: { raw: MQ.unitStr(to) }, s: step }),
      hints: [m('t.convert.h1'), m(fam === 'area' ? 't.convert.h2area' : fam === 'volume' ? 't.convert.h2vol' : 't.convert.h2'), m('t.convert.h3', { f: big ? f : MQ.Q.of(1).div(f), op: { html: () => big ? MQ.i18n.mulSign : MQ.i18n.divSign } })],
      wrong: wrongFactor.slice(0, 1).filter(w => w.decimalPlaces() >= 0).map(w => ({ fields: { a: w.toDecimalString() } })),
      ranges: [['places', res.decimalPlaces(), 0, 3]]
    };
  }
  T.add({ id: 'convert_len', stage: 'gm_length', objectives: ['GM.2.2', 'EF.C13', 'GM.C1', 'GM.C7'], mt: ['MT.46'], gen: convertGen(['length']) });
  T.add({ id: 'convert_mc', stage: 'gm_masscap', objectives: ['GM.2.1', 'GM.C3', 'GM.C4', 'GM.C7'], mt: [], gen: convertGen(['mass', 'capacity']) });
  T.add({ id: 'convert_av', stage: 'gm_units', objectives: ['EF.C14', 'EF.C15', 'GM.C7'], mt: ['MT.46'], gen: convertGen(['area', 'volume']) });

  /* ---------------- compare_qty (ordering quantities) ---------------- */
  T.add({
    id: 'compare_qty', stage: 'gm_units', stages: ['gm_length'], objectives: ['GM.2.1', 'GM.C7'], mt: ['MT.47'],
    gen(r, L) {
      const fam = L === 1 ? 'length' : L === 2 ? 'mass' : L === 3 ? 'capacity' : r.pick(['area', 'volume']);
      const ord = ORDER[fam], ex = FAM[fam]; const items = []; const seen = [];
      let g = 0;
      while (items.length < 4 && g++ < 400) {
        const u = r.pick(ord.slice(0, ord.length)); let v = MQ.Q.dec(r.int(1, 9999), r.int(0, 2));
        if (v.n === 0) continue;
        const base = v.mul(P10(ex[u]));
        if (seen.some(s => s.eq(base))) continue;
        // keep values in a comparable range (within ×1000 of each other)
        if (seen.length && seen.some(s => s.div(base).toNumber() > 1000 || base.div(s).toNumber() > 1000)) continue;
        seen.push(base); items.push({ label: m('c.unitv', { x: U(v, u) }), key: base });
      }
      if (items.length < 4) return this.gen(r, L);
      return { prompt: m('c.orderAsc'), widget: { type: 'order', items: r.shuffle(items) }, answer: m('c.orderAnswer'), explain: m('t.compare_qty.ex'), hints: [m('t.compare_qty.h1'), m('t.compare_qty.h2'), m('t.compare_qty.h3')] };
    }
  });

  /* ---------------- ruler reading (to scale) ---------------- */
  T.add({
    id: 'read_ruler', stage: 'gm_length', objectives: ['EF.2.12', 'GM.2.3', 'GM.2.5', 'GM.C8'], mt: [],
    gen(r, L) {
      const start = L === 3 ? r.int(1, 4) * 10 + (r.chance(0.5) ? 0 : 5) : 0;
      const mm = L === 1 ? r.int(2, 10) * 10 : r.int(15, 100 - (start ? 30 : 0));
      const askMM = L === 4;
      const ans = askMM ? new MQ.Q(mm) : new MQ.Q(mm, 10);
      return {
        prompt: m(askMM ? 't.read_ruler.qmm' : 't.read_ruler.q'), figure: F.ruler(mm, { start, maxCm: 11 }),
        widget: { type: 'input', fields: [field('a', ans, { unit: askMM ? 'mm' : 'cm' })] },
        diagnose: v => v.a && start && v.a.eq(new MQ.Q(start + mm, askMM ? 1 : 10)) ? m('t.read_ruler.m.zero') : (v.a && !askMM && v.a.eq(mm) ? m('t.read_ruler.m.mm') : null),
        answer: m('c.unitv', { x: U(ans, askMM ? 'mm' : 'cm') }), explain: m(start ? 't.read_ruler.ex3' : 't.read_ruler.ex', { a: U(new MQ.Q(start, 10), 'cm'), b: U(new MQ.Q(start + mm, 10), 'cm'), x: U(new MQ.Q(mm, 10), 'cm'), y: mm }),
        wrong: start ? [{ fields: { a: MQ.Q.of(new MQ.Q(start + mm, 10)).toDecimalString() } }] : []
      };
    }
  });

  /* ---------------- jug and scale reading ---------------- */
  T.add({
    id: 'read_instr', stage: 'gm_masscap', objectives: ['GM.2.5', 'GM.2.3', 'GM.C8', 'GM.C3', 'GM.C4'], mt: [],
    gen(r, L) {
      if (L <= 2) {
        const max = L === 1 ? 1000 : r.pick([500, 1000, 2000]); const step = L === 1 ? 100 : max / 20; const lvl = r.int(1, max / step - 1) * step;
        const ansL = new MQ.Q(lvl, 1000);
        const inL = L === 2 && r.chance(0.5);
        return { prompt: m(inL ? 't.read_instr.qjugL' : 't.read_instr.qjug'), figure: lang => F.jug(max, lvl, step, { lang }), widget: { type: 'input', fields: [field('a', inL ? ansL : new MQ.Q(lvl), { unit: inL ? 'l' : 'ml' })] }, answer: m('c.unitv', { x: inL ? U(ansL, 'l') : U(lvl, 'ml') }), explain: m('t.read_instr.exjug', { s: step, x: U(lvl, 'ml'), y: U(ansL, 'l') }) };
      }
      const max = L === 3 ? 1000 : 2000; const step = L === 3 ? 50 : 20; const v = r.int(1, max / step - 1) * step;
      const inKg = L === 4 && r.chance(0.5);
      return { prompt: m(inKg ? 't.read_instr.qscaleKg' : 't.read_instr.qscale'), figure: lang => F.scale(max, v, step, { lang }), widget: { type: 'input', fields: [field('a', inKg ? new MQ.Q(v, 1000) : new MQ.Q(v), { unit: inKg ? 'kg' : 'g' })] }, answer: m('c.unitv', { x: inKg ? U(new MQ.Q(v, 1000), 'kg') : U(v, 'g') }), explain: m('t.read_instr.exscale', { s: step, x: U(v, 'g'), y: U(new MQ.Q(v, 1000), 'kg') }) };
    }
  });

  /* ---------------- fractional quantities (grandeurs fractionnées) ---- */
  T.add({
    id: 'frac_qty', stage: 'gm_masscap', stages: ['gm_time'], objectives: ['GM.1.1', 'GM.1.2', 'GM.2.4'], mt: [],
    gen(r, L) {
      const defs = [['h', 'min', 60], ['kg', 'g', 1000], ['l', 'ml', 1000], ['l', 'cl', 100], ['km', 'm', 1000], ['m', 'cm', 100], ['€', 'ct', 100]];
      const [big, small, f] = r.pick(L === 1 ? defs.slice(0, 3) : defs);
      const fracs = L <= 2 ? [[1, 2], [1, 4], [3, 4]] : [[1, 2], [1, 4], [3, 4], [1, 10], [1, 5], [2, 5], [3, 10]];
      let [n, d] = r.pick(fracs); if (f % d) [n, d] = [1, 2];
      if (L === 4) {
        // inverse: 750 g = ? kg (fraction or decimal accepted)
        const val = new MQ.Q(f * n, d);
        return { prompt: m('t.frac_qty.q4', { a: U(val, small), u: { raw: MQ.unitStr(big) } }), widget: { type: 'input', fields: [field('a', new MQ.Q(n, d), { unit: big })] }, answer: m('t.frac_qty.ans4', { f: fr(n, d), x: new MQ.Q(n, d), u: { raw: MQ.unitStr(big) } }), explain: m('t.frac_qty.ex4', { a: U(val, small), f: fr(n, d), x: new MQ.Q(n, d), u: { raw: MQ.unitStr(big) }, b: f }) };
      }
      const whole = L === 3 ? r.int(1, 3) : 0;
      const res = new MQ.Q(whole * f).add(new MQ.Q(f * n, d));
      const qty = whole ? { html: lang => MQ.fmtNum(whole, lang) + ' ' + MQ.fmtVal(fr(n, d), lang) + ' ' + MQ.unitStr(big) } : { html: lang => MQ.fmtVal(fr(n, d), lang) + ' ' + MQ.unitStr(big) };
      return {
        prompt: m('t.frac_qty.q', { a: qty, u: { raw: MQ.unitStr(small) } }),
        widget: { type: 'input', fields: [field('a', res, { unit: small })] },
        diagnose: v => v.a && big === 'h' && v.a.eq(new MQ.Q(whole * 100 + 100 * n / d)) ? m('t.frac_qty.m.hundred') : null,
        answer: m('c.unitv', { x: U(res, small) }), explain: m('t.frac_qty.ex', { f: fr(n, d), b: { raw: '1 ' + MQ.unitStr(big) }, c: U(f, small), x: U(res, small), d, p: f / d }),
        wrong: big === 'h' ? [{ fields: { a: String(whole * 100 + 100 * n / d) } }] : []
      };
    }
  });

  /* ---------------- time: durations (24 h) ---------------- */
  T.add({
    id: 'time_dur', stage: 'gm_time', objectives: ['GM.2.1', 'GM.C5'], mt: [],
    gen(r, L) {
      const ctx = r.pick(['bus', 'film', 'match', 'hike']);
      if (L <= 3) {
        const start = L === 1 ? r.int(7, 18) * 60 : r.int(7 * 60, 19 * 60);
        let dur = L === 1 ? r.int(1, 4) * 60 : L === 2 ? r.int(5, 50) : r.int(25, 150);
        if (L === 2 && (start % 60) + dur >= 60) dur = 59 - (start % 60) || 5;
        if (L === 2 && dur <= 0) return this.gen(r, L);
        const end = start + dur;
        return {
          prompt: m('t.time_dur.q.' + ctx, { t: { time: start }, d: { dur } }),
          widget: { type: 'input', fields: [field('a', end, { kind: 'time' })] },
          diagnose: v => v.a != null && v.a === start + Math.floor(dur / 60) * 100 + dur % 60 ? m('t.time_dur.m.hundred') : null,
          answer: m('c.time', { t: { time: end } }), explain: m('t.time_dur.ex', { t: { time: start }, d: { dur }, x: { time: end } }),
          hints: [m('t.time_dur.h1'), m('t.time_dur.h2'), m('t.time_dur.h3', { a: { time: start + Math.floor(dur / 60) * 60 } })]
        };
      }
      const a = r.int(8 * 60, 15 * 60), b = a + r.int(40, 300);
      const d = b - a;
      return {
        prompt: m('t.time_dur.q4', { a: { time: a }, b: { time: b } }),
        widget: { type: 'input', fields: [field('h', new MQ.Q(Math.floor(d / 60)), { unit: 'h' }), field('m', new MQ.Q(d % 60), { unit: 'min' })] },
        diagnose: v => v.h && v.m && v.h.toNumber() * 100 + v.m.toNumber() === (Math.floor(b / 60) * 100 + b % 60) - (Math.floor(a / 60) * 100 + a % 60) && d % 60 !== (b % 60 - a % 60) ? m('t.time_dur.m.decimalTime') : null,
        answer: m('c.dur', { d: { dur: d } }), explain: m('t.time_dur.ex4', { a: { time: a }, b: { time: b }, n: { time: Math.ceil(a / 60) * 60 }, d1: { dur: Math.ceil(a / 60) * 60 - a }, d2: { dur: b - Math.ceil(a / 60) * 60 }, x: { dur: d } }),
        hints: [m('t.time_dur.h1'), m('t.time_dur.h4'), m('t.time_dur.h5', { n: { time: Math.ceil(a / 60) * 60 } })]
      };
    }
  });

  /* ---------------- time conversions ---------------- */
  T.add({
    id: 'time_conv', stage: 'gm_time', objectives: ['GM.2.2', 'GM.C5'], mt: [],
    gen(r, L) {
      if (L === 1) { const h = r.int(2, 9); return { prompt: m('t.time_conv.q', { a: U(h, 'h'), u: { raw: 'min' } }), widget: { type: 'input', fields: [field('a', new MQ.Q(60 * h), { unit: 'min' })] }, diagnose: v => v.a && v.a.eq(100 * h) ? m('t.time_conv.m.hundred') : null, answer: m('c.unitv', { x: U(60 * h, 'min') }), explain: m('t.time_conv.ex1', { h, x: 60 * h }), wrong: [{ fields: { a: String(100 * h) } }] }; }
      if (L === 2) { const h = r.int(1, 5), mi = r.int(5, 55); return { prompt: m('t.time_conv.q2', { h, m: mi }), widget: { type: 'input', fields: [field('a', new MQ.Q(60 * h + mi), { unit: 'min' })] }, diagnose: v => v.a && v.a.eq(100 * h + mi) ? m('t.time_conv.m.hundred') : null, answer: m('c.unitv', { x: U(60 * h + mi, 'min') }), explain: m('t.time_conv.ex2', { h, m: mi, a: 60 * h, x: 60 * h + mi }), wrong: [{ fields: { a: String(100 * h + mi) } }] }; }
      if (L === 3) { const tot = r.int(70, 400); if (tot % 60 === 0) return this.gen(r, L); return { prompt: m('t.time_conv.q3', { a: U(tot, 'min') }), widget: { type: 'input', fields: [field('h', new MQ.Q(Math.floor(tot / 60)), { unit: 'h' }), field('m', new MQ.Q(tot % 60), { unit: 'min' })] }, diagnose: v => v.h && v.h.eq(Math.floor(tot / 100)) && v.m && v.m.eq(tot % 100) ? m('t.time_conv.m.hundred') : null, answer: m('c.dur', { d: { dur: tot } }), explain: m('t.time_conv.ex3', { t: tot, h: Math.floor(tot / 60), m: tot % 60, p: 60 * Math.floor(tot / 60) }) }; }
      if (r.chance(0.5)) { const mi = r.int(2, 9), s = r.int(5, 55); return { prompt: m('t.time_conv.q4s', { m: mi, s }), widget: { type: 'input', fields: [field('a', new MQ.Q(60 * mi + s), { unit: 's' })] }, answer: m('c.unitv', { x: U(60 * mi + s, 's') }), explain: m('t.time_conv.ex4s', { m: mi, s, a: 60 * mi, x: 60 * mi + s }) }; }
      const w = r.int(2, 8), d = r.int(1, 6); return { prompt: m('t.time_conv.q4d', { w, d }), widget: { type: 'input', fields: [field('a', new MQ.Q(7 * w + d))] }, answer: m('c.num', { x: 7 * w + d }), explain: m('t.time_conv.ex4d', { w, d, a: 7 * w, x: 7 * w + d }) };
    }
  });

  /* ---------------- calendar (DD.MM.YYYY) ---------------- */
  const fromIndex = i => { const dt = new Date(i * 86400000); return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }; };
  T.add({
    id: 'calendar', stage: 'gm_time', objectives: ['GM.C5', 'GM.2.5'], mt: [],
    gen(r, L) {
      const y = r.pick([2026, 2027, 2028]);
      if (L <= 3) {
        const mo = r.int(1, 12); const dim = MQ.daysInMonth(y, mo);
        const d0 = L === 1 ? r.int(1, dim) : L === 2 ? r.int(1, dim - 12) : r.int(dim - 8, dim);
        const n = L === 1 ? 1 : L === 2 ? r.int(3, 12) : r.int(10, 25);
        const res = fromIndex(MQ.dayIndex(y, mo, d0) + n);
        return {
          prompt: m(L === 1 ? 't.calendar.q1' : 't.calendar.q', { a: { date: { y, m: mo, d: d0 } }, n }),
          widget: { type: 'input', fields: [field('a', res, { kind: 'date' })] },
          answer: m('c.date', { a: { date: res } }), explain: m(res.m !== mo ? 't.calendar.exMonth' : 't.calendar.ex', { a: { date: { y, m: mo, d: d0 } }, n, x: { date: res }, dim, mo: { k: 'month.' + mo } })
        };
      }
      const a = MQ.dayIndex(y, r.int(1, 10), r.int(1, 28)); const b = a + r.int(20, 75);
      const A = fromIndex(a), B = fromIndex(b);
      return { prompt: m('t.calendar.q4', { a: { date: A }, b: { date: B } }), widget: { type: 'input', fields: [field('a', new MQ.Q(b - a))] }, answer: m('c.num', { x: b - a }), explain: m('t.calendar.ex4', { a: { date: A }, b: { date: B }, x: b - a }) };
    }
  });

  /* ---------------- clock reading → 24-hour time ---------------- */
  T.add({
    id: 'clock_read', stage: 'gm_time', objectives: ['GM.2.5', 'GM.C5'], mt: [],
    gen(r, L) {
      const h = r.int(1, 11); const mi = L === 1 ? r.pick([0, 30]) : L === 2 ? r.pick([15, 30, 45]) : L === 3 ? r.int(1, 11) * 5 : r.int(1, 59);
      const pm = r.chance(0.6);
      const t = (pm ? h + 12 : h) * 60 + mi;
      return {
        prompt: m(pm ? 't.clock_read.qpm' : 't.clock_read.qam'), figure: F.clock(h, mi),
        widget: { type: 'input', fields: [field('a', t, { kind: 'time' })] },
        diagnose: v => v.a != null && pm && v.a === h * 60 + mi ? m('t.clock_read.m.24h') : (v.a != null && v.a % 60 === (mi + 30) % 60 ? null : null),
        answer: m('c.time', { t: { time: t } }), explain: m(pm ? 't.clock_read.expm' : 't.clock_read.exam', { h, m: mi, x: { time: t } }),
        wrong: pm ? [{ fields: { a: MQ.fmtTime(h * 60 + mi) } }] : []
      };
    }
  });

  /* ---------------- money ---------------- */
  T.add({
    id: 'money', stage: 'gm_money', objectives: ['GM.C2', 'GM.2.2', 'GM.2.1'], mt: [],
    gen(r, L) {
      if (L === 1) {
        if (r.chance(0.5)) { const e = MQ.Q.dec(r.int(101, 2999), 2); return { prompt: m('t.money.q1', { a: { money: e } }), widget: { type: 'input', fields: [field('a', e.mul(100), { unit: 'ct' })] }, diagnose: v => v.a && v.a.eq(e.mul(10)) ? m('t.money.m.factor') : null, answer: m('c.unitv', { x: U(e.mul(100), 'ct') }), explain: m('t.money.ex1', { a: { money: e }, x: e.mul(100) }) }; }
        const c = r.int(105, 2999); return { prompt: m('t.money.q1b', { a: U(c, 'ct') }), widget: { type: 'input', fields: [field('a', new MQ.Q(c, 100), { unit: '€' })] }, answer: m('c.eur', { x: { money: new MQ.Q(c, 100) } }), explain: m('t.money.ex1b', { a: c, x: { money: new MQ.Q(c, 100) } }) };
      }
      if (L === 2) {
        const vals = r.sample([2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2], r.int(4, 6)).sort((a, b) => b - a);
        const tot = vals.reduce((a, b) => a + b, 0);
        return { prompt: m('t.money.q2'), figure: F.money(vals), widget: { type: 'input', fields: [field('a', new MQ.Q(tot, 100), { unit: '€' })] }, diagnose: v => v.a && v.a.eq(tot) ? m('t.money.m.cents') : null, answer: m('c.eur', { x: { money: new MQ.Q(tot, 100) } }), explain: m('t.money.ex2', { x: { money: new MQ.Q(tot, 100) } }) };
      }
      if (L === 3) {
        const price = MQ.Q.dec(r.int(120, 1890), 2); const note = [5, 10, 20, 50].find(n => n > price.toNumber() + 0.5) || 50;
        const ch = new MQ.Q(note).sub(price);
        return { prompt: m('t.money.q3', { n: names(r, 1)[0], p: { money: price }, b: { money: new MQ.Q(note) } }), widget: { type: 'input', fields: [field('a', ch, { unit: '€' })] }, answer: m('c.eur', { x: { money: ch } }), explain: m('t.money.ex3', { p: { money: price }, b: { money: new MQ.Q(note) }, x: { money: ch } }) };
      }
      // price per kg comparison
      const g1 = r.pick([250, 500, 750]), g2 = r.pick([1000, 1500, 2000].filter(x => x !== g1));
      const ppk1 = MQ.Q.dec(r.int(200, 900), 2), ppk2 = MQ.Q.dec(r.int(200, 900), 2);
      if (ppk1.eq(ppk2)) return this.gen(r, L);
      const p1 = ppk1.mul(g1).div(1000), p2 = ppk2.mul(g2).div(1000);
      if (p1.decimalPlaces() > 2 || p2.decimalPlaces() > 2) return this.gen(r, L);
      const cheaper = ppk1.lt(ppk2) ? 0 : 1;
      return { prompt: m('t.money.q4', { a: U(g1, 'g'), p: { money: p1 }, b: U(g2, 'g'), q: { money: p2 } }), widget: { type: 'mc', options: [{ label: m('t.money.packA', { a: U(g1, 'g') }), correct: cheaper === 0, why: m('t.money.m.perKg') }, { label: m('t.money.packB', { b: U(g2, 'g') }), correct: cheaper === 1, why: m('t.money.m.perKg') }] }, answer: m(cheaper === 0 ? 't.money.packA' : 't.money.packB', { a: U(g1, 'g'), b: U(g2, 'g') }), explain: m('t.money.ex4', { a: { money: ppk1 }, b: { money: ppk2 } }) };
    }
  });

  /* ---------------- units & instruments, estimation ---------------- */
  T.add({
    id: 'units_instr', stage: 'gm_units', objectives: ['GM.2.3', 'GM.1.2', 'GM.2.1', 'GM.C8'], mt: [],
    gen(r, L) {
      if (L === 1) {
        const items = [['len', 'ruler'], ['room', 'tape'], ['flour', 'scale'], ['milk', 'jug'], ['race', 'watch'], ['angle', 'protractor']];
        const [what, inst] = r.pick(items); const opts = r.shuffle([inst].concat(r.sample(items.map(i => i[1]).filter(i => i !== inst), 3)));
        return { prompt: m('t.units_instr.q1', { w: { k: 't.units_instr.what.' + what } }), widget: { type: 'mc', options: opts.map(o => ({ label: m('inst.' + o), correct: o === inst })) }, answer: m('inst.' + inst), explain: m('t.units_instr.ex1') };
      }
      if (L === 2) {
        const items = [['classroom', 'm2'], ['glass', 'cl'], ['trip', 'km'], ['apple', 'g'], ['pencil', 'cm'], ['truck', 't'], ['aquarium', 'l'], ['dice', 'cm3']];
        const [what, u] = r.pick(items); const opts = r.shuffle([u].concat(r.sample(items.map(i => i[1]).filter(x => x !== u), 3)));
        return { prompt: m('t.units_instr.q2', { w: { k: 't.units_instr.obj.' + what } }), widget: { type: 'mc', layout: 'row', options: opts.map(o => ({ label: { raw: MQ.unitStr(o) }, correct: o === u })) }, answer: { raw: MQ.unitStr(u) }, explain: m('t.units_instr.ex2') };
      }
      const sets = [
        ['bottle', [U(MQ.Q.dec(15, 1), 'l'), U(15, 'l'), U(150, 'ml'), U(MQ.Q.dec(15, 1), 'hl')]],
        ['door', [U(2, 'm'), U(20, 'm'), U(2, 'dm'), U(200, 'mm')]],
        ['schoolbag', [U(4, 'kg'), U(40, 'kg'), U(400, 'g'), U(4, 't')]],
        ['walk', [U(15, 'min'), U(15, 'h'), U(15, 's'), U(150, 'min')]],
        ['glass025', [U(MQ.Q.dec(25, 2), 'dm3'), U(25, 'dm3'), U(MQ.Q.dec(25, 2), 'm3'), U(25, 'mm3')]],
        ['bucket', [U(10, 'l'), U(10, 'ml'), U(10, 'hl'), U(100, 'l')]],
        ['bread', [U(500, 'g'), U(500, 'kg'), U(5, 'g'), U(5, 't')]],
        ['bus', [U(12, 'm'), U(12, 'km'), U(12, 'cm'), U(120, 'm')]]
      ];
      const [what, vals] = r.pick(L === 3 ? sets.slice(0, 4).concat(sets.slice(5)) : sets);
      return { prompt: m('t.units_instr.q3', { w: { k: 't.units_instr.est.' + what } }), widget: { type: 'mc', options: r.shuffle(vals.map((v, i) => ({ label: m('c.unitv', { x: v }), correct: i === 0 }))) }, answer: m('c.unitv', { x: vals[0] }), explain: m('t.units_instr.ex3.' + what) };
    }
  });

  /* ---------------- data: mean ---------------- */
  T.add({
    id: 'mean', stage: 'gm_data', objectives: ['GM.2.6', 'GM.C9', 'NO.4.3'], mt: [],
    gen(r, L) {
      const n = L === 1 ? 3 : r.int(4, 5);
      let vals, mean;
      if (L <= 2) { mean = r.int(5, 40); vals = Array.from({ length: n - 1 }, () => mean + r.int(-6, 6)); vals.push(mean * n - vals.reduce((a, b) => a + b, 0)); if (vals.some(v => v <= 0)) return this.gen(r, L); vals = r.shuffle(vals); }
      else if (L === 3) { mean = MQ.Q.dec(r.int(120, 160), 2); const arr = Array.from({ length: n - 1 }, () => MQ.Q.dec(r.int(-6, 6), 2).add(mean)); arr.push(mean.mul(n).sub(arr.reduce((a, b) => a.add(b), new MQ.Q(0)))); vals = r.shuffle(arr); }
      else { mean = r.int(10, 30); vals = Array.from({ length: n - 1 }, () => mean + r.int(-8, 8)); const missing = mean * n - vals.reduce((a, b) => a + b, 0); if (missing <= 0) return this.gen(r, L);
        return { prompt: m('t.mean.q4', { l: { list: vals.map(v => ({ html: lang => MQ.fmtNum(v, lang) })), sep: ' ; ' }, n, x: mean }), widget: { type: 'input', fields: [field('a', new MQ.Q(missing))] }, answer: m('c.num', { x: missing }), explain: m('t.mean.ex4', { n, x: mean, t: mean * n, s: vals.reduce((a, b) => a + b, 0), y: missing }) }; }
      const sum = vals.reduce((a, b) => MQ.Q.of(a).add(b), new MQ.Q(0));
      const ctx = L === 3 ? 'heights' : r.pick(['goals', 'books', 'temps']);
      return {
        prompt: m('t.mean.q.' + ctx, { l: { list: vals.map(v => ({ html: lang => MQ.fmtNum(v, lang) })), sep: ' ; ' } }),
        widget: { type: 'input', fields: [field('a', MQ.Q.of(mean), L === 3 ? { unit: 'm' } : {})] },
        diagnose: v => v.a && v.a.eq(sum) ? m('t.mean.m.sum') : null,
        answer: m('c.num', { x: mean }), explain: m('t.mean.ex', { s: sum, n, x: mean }),
        wrong: [{ fields: { a: sum.toDecimalString() } }]
      };
    }
  });

  /* ---------------- data: build a bar chart ---------------- */
  T.add({
    id: 'make_chart', stage: 'gm_data', objectives: ['GM.2.6', 'NO.C13', 'NO.4.4'], mt: ['MT.85', 'MT.92'],
    gen(r, L) {
      const cats = r.sample(['football', 'swimming', 'basket', 'dance', 'cycling'], L <= 2 ? 3 : 4);
      const max = L === 1 ? 8 : 12, step = L === 1 ? 1 : 2;
      const vals = cats.map(() => L === 1 ? r.int(1, 8) : r.int(1, 6) * 2);
      const table = { html: lang => L === 3 ? `<table class="ptable"><tr>${cats.map(c => `<th>${MQ.t('sport.' + c, {}, lang)}</th>`).join('')}</tr><tr>${vals.map(v => `<td class="tally">${'||||/ '.repeat(Math.floor(v / 5))}${'|'.repeat(v % 5)}</td>`).join('')}</tr></table>`
        : L === 4 ? `<p class="rawdata">${r.shuffle(cats.flatMap((c, i) => Array(vals[i]).fill(c))).map(c => MQ.t('sport.' + c, {}, lang)).join(', ')}</p>`
          : `<table class="ptable"><tr>${cats.map(c => `<th>${MQ.t('sport.' + c, {}, lang)}</th>`).join('')}</tr><tr>${vals.map(v => `<td>${v}</td>`).join('')}</tr></table>` };
      return {
        prompt: m(L >= 3 ? 't.make_chart.q' + L : 't.make_chart.q'), figure: { htmlFig: table },
        widget: { type: 'bars', labelsFn: lang => cats.map(c => MQ.t('sport.' + c, {}, lang)), target: vals, max, step },
        answer: m('t.make_chart.ans'), explain: m(L >= 3 ? 't.make_chart.ex3' : 't.make_chart.ex')
      };
    }
  });

  /* ---------------- data: pie charts ---------------- */
  T.add({
    id: 'pie_read', stage: 'gm_data', objectives: ['NO.4.3', 'GM.2.6', 'GM.2.7', 'NO.C3'], mt: ['MT.87', 'MT.91'],
    gen(r, L) {
      const sets = [[[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 4], [1, 8], [1, 8]], [[3, 4], [1, 4]], [[1, 4], [1, 4], [1, 2]], [[1, 2], [3, 8], [1, 8]]];
      const parts = r.pick(sets).map(([n, d]) => new MQ.Q(n, d)); const i = r.int(0, parts.length - 1);
      const fig = F.pieChart(parts.map(q => ({ q })));
      if (L === 1) { const opts = [[1, 2], [1, 4], [3, 4], [1, 8], [3, 8]].map(([n, d]) => new MQ.Q(n, d)); return { prompt: m('t.pie_read.q1', { l: String.fromCharCode(65 + i) }), figure: fig, widget: { type: 'mc', layout: 'row', options: r.shuffle(opts.filter(q => !q.eq(parts[i])).slice(0, 3).concat([parts[i]])).map(q => ({ label: frac(q.n, q.d), correct: q.eq(parts[i]) })) }, answer: m('c.num', { x: fr(parts[i].n, parts[i].d) }), explain: m('t.pie_read.ex1') }; }
      if (L === 2) return { prompt: m('t.pie_read.q2', { l: String.fromCharCode(65 + i) }), figure: fig, widget: { type: 'input', fields: [field('a', parts[i].mul(100), { unit: '%' })] }, answer: m('c.pctv', { x: parts[i].mul(100) }), explain: m('t.pie_read.ex2', { f: fr(parts[i].n, parts[i].d), x: parts[i].mul(100) }) };
      if (L === 3) { const tot = r.pick([24, 40, 80, 120, 200]); return { prompt: m('t.pie_read.q3', { t: tot, l: String.fromCharCode(65 + i) }), figure: fig, widget: { type: 'input', fields: [field('a', parts[i].mul(tot))] }, answer: m('c.num', { x: parts[i].mul(tot) }), explain: m('t.pie_read.ex3', { f: fr(parts[i].n, parts[i].d), t: tot, x: parts[i].mul(tot) }) }; }
      // which pie matches the table?
      const tot = r.pick([8, 16, 24, 40]); const counts = parts.map(q => q.mul(tot).toNumber());
      const others = r.sample(sets.filter(s => s.length === parts.length && JSON.stringify(s.map(([n, d]) => n / d)) !== JSON.stringify(parts.map(q => q.toNumber()))), 2);
      const all = r.shuffle([{ ps: parts, ok: true }].concat(others.map(s => ({ ps: s.map(([n, d]) => new MQ.Q(n, d)), ok: false }))));
      if (all.length < 2) return this.gen(r, L);
      return { prompt: m('t.pie_read.q4'), figure: { htmlFig: { html: lang => `<table class="ptable"><tr>${counts.map((_, k) => `<th>${String.fromCharCode(65 + k)}</th>`).join('')}</tr><tr>${counts.map(c => `<td>${c}</td>`).join('')}</tr></table>` } }, widget: { type: 'mc', layout: 'grid', options: all.map((o, k) => ({ label: { k: 'c.letter', v: { l: String(k + 1) } }, fig: F.pieChart(o.ps.map(q => ({ q }))), correct: o.ok })) }, answer: m('c.letter', { l: String(all.findIndex(o => o.ok) + 1) }), explain: m('t.pie_read.ex4', { t: tot }) };
    }
  });

  /* ---------------- make_line: generate data and draw a line graph (MathemaTIC MT.86) ---------------- */
  T.add({
    id: 'make_line', stage: 'gm_data', objectives: ['GM.2.6', 'NO.4.3'], mt: ['MT.86'],
    gen(r, L) {
      let labelsFn, vals, max, step, yName, tableVars = null, prompt, explain;
      if (L <= 2) {
        const n = L === 1 ? 4 : 5; const start = r.pick([8, 9, 10]);
        let t = r.int(L === 1 ? 4 : 6, 10); vals = []; for (let i = 0; i < n; i++) { vals.push(t); t = Math.max(0, Math.min(L === 1 ? 10 : 20, t + (L === 1 ? r.int(-2, 3) : 2 * r.int(-1, 3)))); }
        if (L === 2) vals = vals.map(v => v % 2 ? v + 1 : v);
        max = L === 1 ? 10 : 20; step = L === 1 ? 1 : 2; yName = '°C';
        labelsFn = () => vals.map((_, i) => (start + 2 * i) + ':00');
        prompt = m('t.make_line.q1', { n: names(r, 1)[0] });
        tableVars = lang => `<table class="ptable"><tr><th>${MQ.t('t.make_line.time', {}, lang)}</th>${labelsFn(lang).map(x => `<th>${x}</th>`).join('')}</tr><tr><th>°C</th>${vals.map(v => `<td>${v}</td>`).join('')}</tr></table>`;
        explain = m('t.make_line.ex');
      } else if (L === 3) {
        let h = r.int(1, 4) * 2; vals = []; for (let i = 0; i < 5; i++) { vals.push(h); h += 2 * r.int(1, 3); }
        if (vals[4] > 24) return this.gen(r, L);
        max = 24; step = 4; yName = 'cm';
        labelsFn = lang => vals.map((_, i) => MQ.t('t.make_line.wk', { n: i + 1 }, lang));
        prompt = m('t.make_line.q3', { n: names(r, 1)[0] });
        tableVars = lang => `<table class="ptable"><tr><th>${MQ.t('t.make_line.week', {}, lang)}</th>${labelsFn(lang).map(x => `<th>${x}</th>`).join('')}</tr><tr><th>cm</th>${vals.map(v => `<td>${v}</td>`).join('')}</tr></table>`;
        explain = m('t.make_line.ex');
      } else {
        // generate the data from a rule: a candle burns the same amount each hour
        const H = r.pick([16, 18, 20, 24]), d = r.pick([2, 3, 4]); vals = []; for (let i = 0; i <= 4; i++) vals.push(H - d * i);
        max = 24; step = 4; yName = 'cm';
        labelsFn = lang => vals.map((_, i) => MQ.t('t.make_line.hr', { n: i }, lang));
        prompt = m('t.make_line.q4', { h: H, d });
        explain = m('t.make_line.ex4', { l: { raw: vals.join(', ') } });
      }
      return {
        prompt, figure: tableVars ? { htmlFig: { html: tableVars } } : null,
        widget: { type: 'bars', line: true, labelsFn, target: vals, max, step, yName },
        answer: m('t.make_line.ans'), explain,
        ranges: vals.map((v, i) => ['v' + i, v, 0, max]),
        wrong: [{ values: vals.map(() => 0) }, { values: vals.slice().reverse() }].filter(w => w.values.some((v, i) => v !== vals[i]))
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
