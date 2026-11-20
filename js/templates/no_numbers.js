/* =====================================================================
 * Templates — Nombres et opérations (1/2): numeration, decimals,
 * fractions, equivalences, percent.  Stages: no_big, no_dec, no_frac,
 * no_equiv.  All answers are computed here with exact rationals.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const T = MQ.T, { Q, m, num, frac, fr, field, mcValues, mcMsgs } = T.h;
  const P10 = p => p >= 0 ? new MQ.Q(Math.pow(10, p)) : new MQ.Q(1, Math.pow(10, -p));
  const SYM = { lt: { raw: '&lt;' }, eq: { raw: '=' }, gt: { raw: '&gt;' } };
  const symOpts = (r, cmp, whyMap = {}) => [['lt', -1], ['eq', 0], ['gt', 1]].map(([k, c]) => ({ label: { k: 'c.sym', v: { s: SYM[k] } }, correct: c === cmp, why: c !== cmp && whyMap[k] ? m(whyMap[k]) : null }));

  /* digits → Q value. digits: map place→digit */
  const fromPlaces = pl => Object.entries(pl).reduce((acc, [p, d]) => acc.add(P10(+p).mul(d)), new MQ.Q(0));

  /* place-value chart (HTML) — headers come from lang keys pv.h.<place> */
  function pvChart(places, counts, lang) {
    const th = places.map(p => `<th>${MQ.t('pv.h.' + p, {}, lang)}</th>`).join('');
    const td = places.map(p => `<td>${counts[p] == null ? '' : counts[p]}</td>`).join('');
    return `<table class="pvchart"><tr>${th}</tr><tr>${td}</tr></table>`;
  }

  /* ---------------- pv_digit ---------------- */
  T.add({
    id: 'pv_digit', stage: 'no_big', objectives: ['NO.4.1', 'NO.1.9', 'NO.C1'], mt: ['MT.16'],
    gen(r, L) {
      const intLen = L === 1 ? r.int(5, 6) : L === 2 ? r.int(7, 9) : r.int(3, 6);
      const decLen = L >= 3 ? r.int(2, 3) : 0;
      const digits = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, intLen + decLen);
      if (digits[0] === 0) { const k = digits.findIndex(d => d !== 0); [digits[0], digits[k]] = [digits[k], digits[0]]; }
      const places = {}; digits.forEach((d, i) => places[intLen - 1 - i] = d);
      const value = fromPlaces(places);
      const allP = Object.keys(places).map(Number);
      const target = L === 4 ? r.pick(allP.filter(p => p !== 0 && places[p] !== 0)) : L === 3 ? r.pick(allP.filter(p => p < 0 || r.chance(0.4))) : r.pick(allP.filter(p => p < intLen - 1));
      const d = places[target];
      if (L === 4) {
        // value of a digit (place value)
        const ans = P10(target).mul(d);
        return {
          prompt: m('t.pv_digit.q4', { d, n: value }),
          widget: { type: 'input', fields: [field('a', ans)] },
          diagnose: v => v.a && v.a.eq(d) ? m('t.pv_digit.m.digit', { d }) : (v.a && allP.some(p => p !== target && P10(p).mul(d).eq(v.a)) ? m('t.pv_digit.m.place') : null),
          answer: m('c.num', { x: ans }), explainVars: {},
          explain: m('t.pv_digit.ex4', { d, place: { k: 'pl.' + target }, x: ans }),
          wrong: [{ fields: { a: String(d) } }]
        };
      }
      const fig = L === 1 ? (lang => pvChart(allP.sort((a, b) => b - a), places, lang)) : null;
      return {
        prompt: m('t.pv_digit.q', { n: value, place: { k: 'pl.' + target } }),
        figure: fig,
        widget: { type: 'input', fields: [field('a', new MQ.Q(d))] },
        diagnose: v => {
          if (!v.a) return null;
          if (places[target + 1] != null && v.a.eq(places[target + 1])) return m('t.pv_digit.m.adjacent');
          if (places[target - 1] != null && v.a.eq(places[target - 1])) return m('t.pv_digit.m.adjacent');
          if (target < 0 && places[-target - 1] != null && v.a.eq(places[-target - 1])) return m('t.pv_digit.m.mirror');
          return null;
        },
        answer: m('c.num', { x: d }),
        explain: m('t.pv_digit.ex', { place: { k: 'pl.' + target }, d }),
        wrong: places[target + 1] != null ? [{ fields: { a: String(places[target + 1]) } }] : []
      };
    }
  });

  /* ---------------- pv_build ---------------- */
  T.add({
    id: 'pv_build', stage: 'no_big', objectives: ['NO.4.1', 'NO.C1'], mt: ['MT.16'],
    gen(r, L) {
      const pl = L === 3 ? [2, 1, 0, -1, -2, -3] : L === 1 ? [4, 3, 2, 1, 0] : [5, 4, 3, 2, 1, 0];
      const counts = {};
      pl.forEach(p => counts[p] = r.int(1, 9));
      if (L === 2 || L === 3) { const z = r.pick(pl.slice(1, -1)); counts[z] = 0; }
      let big = null;
      if (L === 4) { big = r.pick(pl.slice(1)); counts[big] = r.int(11, 19); counts[pl[0]] = r.int(1, 5); }
      const value = fromPlaces(counts);
      const concat = (() => { try { return MQ.Q.of(pl.map(p => counts[p]).join('')); } catch (e) { return null; } })();
      return {
        prompt: m(L === 4 ? 't.pv_build.q4' : 't.pv_build.q'),
        figure: lang => pvChart(pl, counts, lang),
        widget: { type: 'input', fields: [field('a', value)] },
        diagnose: v => {
          if (!v.a) return null;
          if (L === 4 && concat && v.a.eq(concat)) return m('t.pv_build.m.concat');
          if ((L === 2 || L === 3) && v.a.lt(value.div(5))) return m('t.pv_build.m.zero');
          return null;
        },
        answer: m('c.num', { x: value }),
        explain: L === 4 ? m('t.pv_build.ex4', { c: counts[big], pv: P10(big), cv: P10(big).mul(counts[big]), x: value }) : m('t.pv_build.ex', { x: value }),
        wrong: L === 4 && concat ? [{ fields: { a: concat.toString() } }] : []
      };
    }
  });

  /* ---------------- big_order ---------------- */
  T.add({
    id: 'big_order', stage: 'no_big', objectives: ['NO.1.9', 'NO.1.2'], mt: [],
    gen(r, L) {
      const vals = new Set(); let guard = 0;
      const base = L === 1 ? r.int(10000, 89999) : L === 2 ? r.int(1000000, 8999999) : L === 3 ? 999000 : r.int(10000000, 899999999);
      while (vals.size < (L >= 3 ? 5 : 4) && guard++ < 999) {
        let v;
        if (L === 1) v = base + r.int(-3, 3) * 1000 + r.int(0, 999);
        else if (L === 2) v = Math.floor(base / 10000) * 10000 + r.int(0, 9999);
        else if (L === 3) v = r.pick([r.int(990000, 999999), r.int(1000000, 1009999), r.int(99000, 99999)]);
        else v = Math.floor(base / 100000) * 100000 + r.int(0, 99999) * (r.chance(0.5) ? 1 : 10) % 1000000;
        if (v > 0) vals.add(v);
      }
      const desc = L === 4 || (L === 2 && r.chance(0.5));
      const items = [...vals].map(v => ({ label: num(v), key: v }));
      return {
        prompt: m(desc ? 'c.orderDesc' : 'c.orderAsc'),
        widget: { type: 'order', items: r.shuffle(items), desc },
        answer: m('c.orderAnswer'),
        explain: m(L === 3 ? 't.big_order.ex3' : 't.big_order.ex')
      };
    }
  });

  /* ---------------- times10 ---------------- */
  T.add({
    id: 'times10', stage: 'no_big', objectives: ['NO.3.2', 'NO.1.9', 'NO.C1'], mt: ['MT.23'],
    gen(r, L) {
      const k = r.pick([1, 2, 3]), f = Math.pow(10, k);
      let a, op;
      if (L === 1) { a = new MQ.Q(r.int(3, 999)); op = '*'; }
      else if (L === 2) { a = new MQ.Q(r.int(2, 99) * f * (r.chance(0.5) ? 1 : 10)); op = '/'; }
      else { a = MQ.Q.dec(r.int(11, 9999), r.int(1, 3)); op = r.pick(['*', '/']); if (op === '/' && a.div(f).decimalPlaces() > 3) op = '*'; }
      const res = op === '*' ? a.mul(f) : a.div(f);
      if (L === 4) {
        // find the operator: a → res, "× □" or ": □"
        return {
          prompt: m('t.times10.q4', { a, b: res, op: { html: () => op === '*' ? MQ.i18n.mulSign : MQ.i18n.divSign } }),
          widget: { type: 'input', fields: [field('a', new MQ.Q(f))] },
          diagnose: v => v.a && [10, 100, 1000].some(x => x !== f && v.a.eq(x)) ? m('t.times10.m.count') : null,
          answer: m('c.num', { x: f }),
          explain: m('t.times10.ex4', { a, b: res, f, k }),
          wrong: [{ fields: { a: String(f === 10 ? 100 : 10) } }]
        };
      }
      return {
        prompt: m('c.calc', { e: { expr: [a, op, f] } }), decimalsOnly: true,
        widget: { type: 'input', fields: [field('a', res)] },
        diagnose: v => {
          if (!v.a) return null;
          if (!a.isInt() && op === '*' && v.a.eq(a)) return m('t.times10.m.addzero');
          if ([10, 100, 1000, 10000].some(x => x !== f && (op === '*' ? a.mul(x) : a.div(x)).eq(v.a))) return m('t.times10.m.power');
          if ((op === '*' ? a.div(f) : a.mul(f)).eq(v.a)) return m('t.times10.m.direction');
          return null;
        },
        answer: m('c.num', { x: res }),
        explain: m(op === '*' ? 't.times10.exMul' : 't.times10.exDiv', { k, f, a, x: res }),
        wrong: [{ fields: { a: MQ.fmtNum((op === '*' ? a.div(f) : a.mul(f)), 'en').replace(/,/g, '') } }]
      };
    }
  });

  /* ---------------- rounding ---------------- */
  T.add({
    id: 'rounding', stage: 'no_big', objectives: ['NO.2.3', 'NO.C11'], mt: ['MT.15'],
    gen(r, L) {
      let n, to;
      if (L === 1) { n = new MQ.Q(r.int(1001, 9998)); to = r.pick([10, 100]); }
      else if (L === 2) { n = new MQ.Q(r.int(10001, 999999)); to = r.pick([1000, 100]); }
      else if (L === 3) { n = new MQ.Q(r.int(1000001, 9999999)); to = r.pick([10000, 1000]); }
      else { n = MQ.Q.dec(r.int(1001, 99999), r.pick([2, 3])); to = r.pick([new MQ.Q(1, 10), new MQ.Q(1)]); }
      to = MQ.Q.of(to);
      const q = n.div(to); const fl = Math.floor(q.toNumber() + 1e-9);
      const down = to.mul(fl), up = to.mul(fl + 1);
      const res = n.sub(down).mul(2).cmp(to) >= 0 ? up : down;
      if (res.eq(n)) return this.gen(r, L);
      const toKey = to.eq(new MQ.Q(1, 10)) ? 'rnd.tenth' : to.eq(1) ? 'rnd.unit' : 'rnd.' + to.toNumber();
      return {
        prompt: m('t.rounding.q', { n, to: { k: toKey } }),
        widget: { type: 'input', fields: [field('a', res)] },
        diagnose: v => v.a && v.a.eq(res.eq(up) ? down : up) ? m(res.eq(up) ? 't.rounding.m.trunc' : 't.rounding.m.up') : null,
        answer: m('c.num', { x: res }),
        explain: m('t.rounding.ex', { n, down, up, x: res }),
        wrong: [{ fields: { a: MQ.fmtNum(res.eq(up) ? down : up, 'en').replace(/,/g, '') } }]
      };
    }
  });

  /* ---------------- dec_count (dixièmes, centièmes, millièmes) ------- */
  T.add({
    id: 'dec_count', stage: 'no_dec', objectives: ['NO.1.7', 'NO.C1', 'NO.1.8'], mt: [],
    gen(r, L) {
      const unitKeys = { 1: 'u.tenths', 2: 'u.hundredths', 3: 'u.thousandths' };
      if (L === 1) {
        const k = r.int(1, 9); const x = new MQ.Q(k, 10);
        return { prompt: m('t.dec_count.q1', { x }), widget: { type: 'input', fields: [field('a', new MQ.Q(k))] }, answer: m('c.num', { x: k }), explain: m('t.dec_count.ex1', { x, k }) };
      }
      const p = L === 2 ? 2 : 3;
      const x = MQ.Q.dec(r.int(L === 2 ? 101 : 1001, L === 2 ? 999 : 9999), p);
      if (L === 4) {
        // conversion between notations: 4,6 = □ hundredths  OR  53 hundredths = □
        if (r.chance(0.5)) {
          const y = MQ.Q.dec(r.int(11, 99), 1), cnt = y.mul(100);
          return { prompt: m('t.dec_count.q4a', { x: y, u: { k: unitKeys[2] } }), widget: { type: 'input', fields: [field('a', cnt)] }, diagnose: v => v.a && v.a.eq(y.mul(10)) ? m('t.dec_count.m.tenthsNotHundredths') : null, answer: m('c.num', { x: cnt }), explain: m('t.dec_count.ex4a', { x: y, c: cnt, cc: { k: 'cnt.2', v: { n: cnt } } }), wrong: [{ fields: { a: y.mul(10).toString() } }] };
        }
        const c = r.int(11, 999), uP = c < 100 ? 2 : 3, y = new MQ.Q(c, Math.pow(10, uP));
        return { prompt: m('t.dec_count.q4b', { c, u: { k: unitKeys[uP] }, cu: { k: 'cnt.' + uP, v: { n: c } } }), widget: { type: 'input', fields: [field('a', y, { form: 'decimal' })] }, answer: m('c.num', { x: y }), explain: m('t.dec_count.ex4b', { c, x: y, u: { k: unitKeys[uP] }, cu: { k: 'cnt.' + uP, v: { n: c } }, g: { k: 'pl.-' + uP } }) };
      }
      const askDigit = r.chance(0.4);
      const pos = r.int(1, p);
      const scaled = x.mul(Math.pow(10, pos)); const count = new MQ.Q(Math.floor(scaled.toNumber() + 1e-9));
      const digit = new MQ.Q(Math.floor(scaled.toNumber() + 1e-9) % 10);
      const ans = askDigit ? digit : count;
      return {
        prompt: m(askDigit ? 't.dec_count.qDigit' : 't.dec_count.qCount', { x, u: { k: unitKeys[pos] }, g: { k: 'pl.-' + pos } }),
        widget: { type: 'input', fields: [field('a', ans)] },
        diagnose: v => { if (!v.a) return null; if (!askDigit && v.a.eq(digit) && !digit.eq(count)) return m('t.dec_count.m.digit'); if (askDigit && v.a.eq(count) && !digit.eq(count)) return m('t.dec_count.m.count'); return null; },
        answer: m('c.num', { x: ans }),
        explain: m(askDigit ? 't.dec_count.exDigit' : 't.dec_count.exCount', { x, u: { k: unitKeys[pos] }, c: count, d: digit, g: { k: 'pl.-' + pos }, cc: { k: 'cnt.' + pos, v: { n: count } } }),
        wrong: digit.eq(count) ? [] : [{ fields: { a: (askDigit ? count : digit).toString() } }]
      };
    }
  });

  /* ---------------- dec_compare ---------------- */
  T.add({
    id: 'dec_compare', stage: 'no_dec', objectives: ['NO.1.2', 'NO.C1'], mt: [],
    gen(r, L) {
      let a, b; const i = r.int(0, 20);
      if (L === 1) { a = MQ.Q.dec(i * 10 + r.int(1, 9), 1); b = MQ.Q.dec(i * 10 + r.int(1, 9), 1); }
      else if (L === 2) { const t = r.int(1, 8); a = MQ.Q.dec(i * 100 + t * 10 + r.int(1, 9), 2); b = MQ.Q.dec(i * 10 + t + r.int(1, 9 - t), 1); if (r.chance(0.5)) [a, b] = [b, a]; }
      else if (L === 3) { const pick = r.int(0, 2); if (pick === 0) { const t = r.int(1, 9); a = MQ.Q.dec(i * 10 + t, 1); b = a; } else if (pick === 1) { a = MQ.Q.dec(r.int(1, 9), 2); b = MQ.Q.dec(r.int(1, 9), 1); } else { a = MQ.Q.dec(i * 100 + r.int(1, 99), 2); b = MQ.Q.dec(i * 100 + r.int(1, 99), 2); } }
      else { const base = r.int(1, 9) * 100 + r.int(0, 99); a = MQ.Q.dec(base * 10 + r.int(1, 9), 3); b = MQ.Q.dec(base + r.pick([0, 1]), 2); if (r.chance(0.5)) [a, b] = [b, a]; }
      const cmp = a.cmp(b);
      // show b with trailing zero sometimes at level 3 (4,5 vs 4,50)
      const bDisp = (L === 3 && cmp === 0) ? { html: lang => MQ.fmtNum(b, lang, { places: 2 }) } : b;
      return {
        prompt: m('t.dec_compare.q', { a, b: bDisp }),
        widget: { type: 'mc', layout: 'row', options: symOpts(r, cmp, { lt: 't.dec_compare.m.length', gt: 't.dec_compare.m.length', eq: 't.dec_compare.m.eq' }) },
        answer: m('c.cmpAnswer', { a, b: bDisp, s: SYM[cmp < 0 ? 'lt' : cmp > 0 ? 'gt' : 'eq'] }),
        explain: m('t.dec_compare.ex', { a, b: bDisp })
      };
    }
  });

  /* ---------------- dec_order ---------------- */
  T.add({
    id: 'dec_order', stage: 'no_dec', objectives: ['NO.1.2', 'NO.C1'], mt: [],
    gen(r, L) {
      const n = L <= 2 ? 4 : 5, vals = new Map(); let g = 0;
      const ip = r.int(0, 9);
      while (vals.size < n && g++ < 500) {
        const places = L === 1 ? 1 : L === 2 ? r.int(1, 2) : r.int(1, 3);
        const v = L === 4 ? MQ.Q.dec(r.int(ip * 1000 + 900, ip * 1000 + 1100), 3) : MQ.Q.dec(ip * Math.pow(10, places) + r.int(1, Math.pow(10, places) - 1), places);
        vals.set(v.toString(), v);
      }
      const desc = L >= 3 && r.chance(0.5);
      return {
        prompt: m(desc ? 'c.orderDesc' : 'c.orderAsc'),
        widget: { type: 'order', items: r.shuffle([...vals.values()].map(v => ({ label: num(v), key: v }))), desc },
        answer: m('c.orderAnswer'), explain: m('t.dec_order.ex')
      };
    }
  });

  /* ---------------- dec_between (intercaler, infiniment petit) ------- */
  T.add({
    id: 'dec_between', stage: 'no_dec', objectives: ['NO.1.2', 'NO.1.9'], mt: [],
    gen(r, L) {
      let a, b;
      if (L === 1) { a = new MQ.Q(r.int(1, 30)); b = a.add(1); }
      else if (L === 2) { a = MQ.Q.dec(r.int(11, 99), 1); b = a.add(new MQ.Q(1, 10)); }
      else if (L === 3) { a = MQ.Q.dec(r.int(1, 9) * 100 - 1, 2); b = a.add(new MQ.Q(1, 100)); }
      else { a = MQ.Q.dec(r.int(101, 999), 2); b = a.add(new MQ.Q(1, 100)); }
      const mid = a.add(b).div(2);
      return {
        prompt: m(L === 4 ? 't.dec_between.q4' : 't.dec_between.q', { a, b }),
        widget: {
          type: 'input', fields: [field('a', mid)],
          custom: (resp, lang) => {
            const p = MQ.parseAnswer((resp.fields || {}).a, lang);
            if (!p.ok) return { correct: false, fb: m('fb.notNumber') };
            const ok = p.value.gt(a) && p.value.lt(b);
            return { correct: ok, fb: ok ? null : (p.value.eq(a) || p.value.eq(b) ? m('t.dec_between.m.equal') : m('t.dec_between.m.outside')) };
          },
          canonical: lang => ({ fields: { a: MQ.fmtNum(mid, lang) } })
        },
        answer: m('t.dec_between.ans', { x: mid }),
        explain: m(L >= 3 ? 't.dec_between.ex3' : 't.dec_between.ex', { a, b, x: mid }),
        wrong: [{ fields: { a: a.toDecimalString().replace('.', ',') } }]
      };
    }
  });

  /* ---------------- nl_dec (droite numérique, décimaux) ---------------- */
  T.add({
    id: 'nl_dec', stage: 'no_dec', objectives: ['NO.1.6', 'NO.C1'], mt: [],
    gen(r, L) {
      let a, b, ticks = 10, labelEvery = 10;
      if (L === 1) { a = new MQ.Q(0); b = new MQ.Q(1); labelEvery = 5; }
      else if (L === 2) { a = new MQ.Q(r.int(1, 8)); b = a.add(1); }
      else { a = MQ.Q.dec(r.int(10, 98), 1); b = a.add(new MQ.Q(1, 10)); }
      const i = r.int(1, ticks - 1); const step = b.sub(a).div(ticks); const x = a.add(step.mul(i));
      if (L === 4) {
        return {
          prompt: m('t.nl_dec.q4'),
          figure: lang => MQ.fig.numberLine(a, b, ticks, { labelEvery, lang, markers: [{ at: x, label: '?' }] }),
          widget: { type: 'input', fields: [field('a', x)] },
          diagnose: v => v.a && v.a.eq(b.sub(step.mul(i))) ? m('t.nl_dec.m.fromEnd') : null,
          answer: m('c.num', { x }), explain: m('t.nl_dec.ex', { a, b, s: step, i, x })
        };
      }
      return {
        prompt: m('t.nl_dec.q', { x }),
        widget: { type: 'numberline', a, b, ticks, labelEvery, target: i },
        diagnose: v => v.tick != null ? m('t.nl_dec.m.placed', { y: a.add(step.mul(v.tick)) }) : null,
        answer: m('c.num', { x }), explain: m('t.nl_dec.ex', { a, b, s: step, i, x }),
        wrong: [{ tick: ticks - i === i ? (i + 1) : ticks - i }]
      };
    }
  });

  /* ---------------- num_words (mots-nombres) ---------------- */
  const DENS_ALL = [3, 4, 5, 6, 8, 10, 100, 1000];
  T.add({
    id: 'num_words', stage: 'no_dec', stages: ['no_frac'], objectives: ['NO.1.5', 'NO.C1', 'NO.C2'], mt: [],
    gen(r, L) {
      if (L <= 2) {
        const d = r.pick(DENS_ALL.slice(0, L === 1 ? 6 : 8)); const n = r.intExcept(1, d === 100 ? 99 : d === 1000 ? 999 : d - 1, []);
        const ds = [{ v: [d, n] }, { v: [n, d * 10] }, { v: [n + 1, d] }, { v: [n, d + (d < 10 ? 1 : 0)] }, { v: [Math.max(1, n - 1), d] }].filter(o => o.v[0] !== o.v[1] && o.v[1] > 1 && (L === 1 || DENS_ALL.includes(o.v[1])));
        const key = v => v[0] + '/' + v[1];
        const opts = [{ v: [n, d], c: true }]; const seen = new Set([key([n, d])]);
        ds.forEach(o => { if (opts.length < 4 && !seen.has(key(o.v)) && o.v[0] > 0 && o.v[0] < 1000) { seen.add(key(o.v)); opts.push({ v: o.v }); } });
        while (opts.length < 4) { const dd = r.pick(DENS_ALL), nn = r.int(1, Math.min(dd - 1, 30)); if (!seen.has(key([nn, dd]))) { seen.add(key([nn, dd])); opts.push({ v: [nn, dd] }); } }
        const toWord = L === 2;
        const options = r.shuffle(opts.map(o => ({ correct: !!o.c, label: toWord ? { k: 'c.words', v: { w: { wfrac: o.v } } } : frac(o.v[0], o.v[1]), why: !o.c && o.v[0] === d && o.v[1] === n ? m('t.num_words.m.swap') : null })));
        return {
          prompt: toWord ? m('t.num_words.qToWord', { x: fr(n, d) }) : m('t.num_words.qFromWord', { w: { wfrac: [n, d] } }),
          widget: { type: 'mc', options }, answer: m('c.num', { x: fr(n, d) }),
          explain: m('t.num_words.exFrac', { n, d, w: { wfrac: [n, d] } })
        };
      }
      // decimals with up to 3 decimals, integer part 0–999
      const p = r.int(L === 3 ? 1 : 2, 3); const ip = r.int(0, L === 3 ? 99 : 999);
      let fpart = r.int(1, Math.pow(10, p) - 1); if (fpart % 10 === 0) fpart += 1;
      const x = MQ.Q.dec(ip * Math.pow(10, p) + fpart, p);
      const cands = [x, MQ.Q.dec(ip * Math.pow(10, p + 1) + fpart, p + 1), x.mul(10), x.div(10)];
      const opts = mcValues(r, x, cands.slice(1).filter(v => v.decimalPlaces() <= 4 && v.decimalPlaces() >= 0 && v.lt(10000)).map(v => ({ v, why: 't.num_words.m.places' })), {
        label: L === 4 ? (v => ({ k: 'c.words', v: { w: { wdec: v.toDecimalString() } } })) : num,
        fill: () => MQ.Q.dec(ip * Math.pow(10, p) + r.int(1, Math.pow(10, p) - 1), p)
      });
      return {
        prompt: L === 4 ? m('t.num_words.qToWord', { x }) : m('t.num_words.qFromWord', { w: { wdec: x.toDecimalString() } }),
        widget: { type: 'mc', options: opts }, answer: m('c.num', { x }),
        explain: m('t.num_words.exDec', { x, w: { wdec: x.toDecimalString() } })
      };
    }
  });

  /* ---------------- frac_name ---------------- */
  // bar with unequal parts (for level 4 true/false)
  function unequalBar(widths, shadedIdx) {
    const tot = widths.reduce((a, b) => a + b, 0); let x = 2, s = '';
    widths.forEach((w, i) => { const W = 356 * w / tot; s += `<rect class="cell ${i === shadedIdx ? 'on' : ''}" x="${x}" y="2" width="${W}" height="50"/>`; x += W; });
    return MQ.fig.svg(360, 54, s, '');
  }
  T.add({
    id: 'frac_name', stage: 'no_frac', objectives: ['NO.1.1', 'NO.C2'], mt: ['MT.1', 'MT.5'],
    gen(r, L) {
      if (L === 4) {
        const equal = r.chance(0.35);
        const widths = equal ? [1, 1, 1, 1] : r.pick([[1, 1, 2], [1, 2, 1], [2, 1, 1], [1, 1, 1, 3]]);
        const k = widths.length, sh = r.int(0, k - 1);
        return {
          prompt: m('t.frac_name.q4', { x: fr(1, k) }), figure: unequalBar(widths, sh),
          widget: { type: 'tf', truth: equal, reasons: r.shuffle([
            { label: m('t.frac_name.r.equalParts'), correct: equal },
            { label: m('t.frac_name.r.notEqual'), correct: !equal },
            { label: m('t.frac_name.r.countOnly', { k }), correct: false }]), wrongFb: m('t.frac_name.m.unequal') },
          answer: m(equal ? 'c.true' : 'c.false'), explain: m('t.frac_name.ex4')
        };
      }
      const d = L === 1 ? r.int(2, 6) : L === 2 ? r.int(5, 12) : r.pick([6, 8, 9, 10, 12]);
      const n = r.int(1, d - 1);
      const shaded = r.shuffle([...Array(d).keys()]).slice(0, n);
      const kind = L === 1 ? r.pick(['pie', 'bar']) : L === 2 ? 'bar' : 'set';
      const fig = kind === 'pie' ? MQ.fig.pie(d, shaded) : kind === 'bar' ? MQ.fig.bar(d, shaded.length === n ? [...Array(n).keys()] : shaded) : MQ.fig.set(d, shaded, { cols: d > 8 ? 6 : d });
      return {
        prompt: m(kind === 'set' ? 't.frac_name.qSet' : 't.frac_name.q'), figure: fig,
        widget: { type: 'input', fields: [field('a', new MQ.Q(n, d), { form: 'fraction' })] },
        diagnose: v => { if (!v.a) return null; if (n !== d - n && v.a.eq(new MQ.Q(d - n, d))) return m('t.frac_name.m.unshaded'); if (v.a.eq(new MQ.Q(n, d - n))) return m('t.frac_name.m.ratio'); return null; },
        answer: m('c.num', { x: fr(n, d) }), explain: m('t.frac_name.ex', { n, d, x: fr(n, d) }),
        wrong: n !== d - n ? [{ fields: { a: (d - n) + '/' + d } }] : []
      };
    }
  });

  /* ---------------- frac_shade ---------------- */
  T.add({
    id: 'frac_shade', stage: 'no_frac', objectives: ['NO.1.1', 'NO.C2'], mt: ['MT.4', 'MT.5'],
    gen(r, L) {
      const d = L <= 2 ? r.int(3, 8) : r.pick([2, 3, 4, 5]); const n = r.int(1, d - 1);
      const k = L <= 2 ? 1 : r.int(2, 4); const parts = d * k;
      const kind = L === 1 ? 'bar' : L === 2 ? 'pie' : L === 3 ? 'bar' : 'set';
      const g = new MQ.Q(n, d);
      return {
        prompt: m('t.frac_shade.q', { x: fr(n, d) }),
        widget: { type: 'shade', kind, parts, target: n * k, cols: kind === 'set' ? Math.min(parts, 6) : undefined },
        diagnose: v => v.count === n && k > 1 ? m('t.frac_shade.m.parts', { p: parts, d }) : null,
        answer: m('t.frac_shade.ans', { c: n * k, p: parts }), explain: m('t.frac_shade.ex', { x: fr(n, d), p: parts, d, k, c: n * k }),
        wrong: k > 1 ? [{ shaded: [...Array(n).keys()] }] : [{ shaded: [...Array(Math.min(parts, n + 1)).keys()] }]
      };
    }
  });

  /* ---------------- frac_line (fractions sur la droite) ---------------- */
  T.add({
    id: 'frac_line', stage: 'no_frac', objectives: ['NO.1.6', 'NO.1.1'], mt: ['MT.2', 'MT.3', 'MT.10'],
    gen(r, L) {
      const d = r.pick(L === 1 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 8]);
      let a = new MQ.Q(0), b = new MQ.Q(L === 2 ? 2 : 1), ticks = L === 2 ? 2 * d : L === 3 ? 2 * d : d;
      const tpu = ticks / b.toNumber();               // ticks per unit
      const i = L === 2 ? r.intExcept(d + 1, 2 * d - 1, [d]) : L === 3 ? 2 * r.int(1, d - 1) : r.int(1, ticks - 1);
      const x = new MQ.Q(i, tpu);
      const shown = L === 3 ? fr(i / 2, d) : fr(i, d);
      if (L === 4) {
        return {
          prompt: m('t.frac_line.q4'),
          figure: lang => MQ.fig.numberLine(a, b, ticks, { labelEvery: ticks, lang, markers: [{ at: x, label: '?' }] }),
          widget: { type: 'input', fields: [field('a', x, { form: 'fraction', allowInt: false })] },
          diagnose: v => v.a && v.a.eq(new MQ.Q(i, ticks + 1)) ? m('t.frac_line.m.countTicks') : null,
          answer: m('c.num', { x: fr(i, ticks) }), explain: m('t.frac_line.ex', { d: ticks, x: fr(i, ticks), i }),
          wrong: [{ fields: { a: i + '/' + (ticks + 1) } }]
        };
      }
      return {
        prompt: m('t.frac_line.q', { x: shown }),
        widget: { type: 'numberline', a, b, ticks, labelEvery: tpu, target: i, fracLabels: false },
        diagnose: v => v.tick != null && L === 3 && v.tick === i / 2 ? m('t.frac_line.m.scale') : null,
        answer: m('c.num', { x: shown }), explain: m(L === 3 ? 't.frac_line.ex3' : 't.frac_line.ex', { d: tpu, x: shown, i }),
        wrong: [{ tick: i === ticks - i ? i - 1 : ticks - i }]
      };
    }
  });

  /* ---------------- frac_compare ---------------- */
  T.add({
    id: 'frac_compare', stage: 'no_frac', objectives: ['NO.1.2'], mt: ['MT.10', 'MT.11', 'MT.12'],
    gen(r, L) {
      if (L === 4) {
        // which fraction lies between two fractions?
        const pairs = [[1, 3, 1, 2], [1, 4, 1, 2], [1, 2, 3, 4], [2, 5, 3, 5], [1, 5, 1, 3], [3, 8, 5, 8], [2, 3, 5, 6]];
        const [a, b, c, d] = r.pick(pairs); const lo = new MQ.Q(a, b), hi = new MQ.Q(c, d);
        const cand = [], seenC = new Set(); for (let den = 2; den <= 12; den++) for (let nu = 1; nu < den; nu++) { const q = new MQ.Q(nu, den); if (!seenC.has(q.toString())) { seenC.add(q.toString()); cand.push(q); } }
        const inside = cand.filter(q => q.gt(lo) && q.lt(hi)), outside = cand.filter(q => q.lt(lo) || q.gt(hi));
        const corr = r.pick(inside); const wr = r.sample(outside.filter(q => !q.eq(lo) && !q.eq(hi)), 3);
        // a "naive" distractor: between numerators/denominators
        return {
          prompt: m('t.frac_compare.q4', { a: fr(a, b), b: fr(c, d) }),
          widget: { type: 'mc', options: r.shuffle([{ label: frac(corr.n, corr.d), correct: true }].concat(wr.map(q => ({ label: frac(q.n, q.d), correct: false, why: m('t.frac_compare.m.outside') })))) },
          answer: m('c.num', { x: fr(corr.n, corr.d) }), explain: m('t.frac_compare.ex4', { a: fr(a, b), b: fr(c, d), x: fr(corr.n, corr.d) })
        };
      }
      let a, b, c, d;
      if (L === 1) { b = d = r.int(3, 12); a = r.int(1, b - 1); c = r.intExcept(1, d - 1, [a]); if (r.chance(0.15)) c = a; }
      else if (L === 2) { a = c = r.int(1, 5); b = r.int(a + 1, 12); d = r.intExcept(a + 1, 12, [b]); }
      else { b = r.pick([2, 3, 4, 5, 6]); d = b * r.pick([2, 3]); a = r.int(1, b - 1); c = r.int(1, d - 1); if (r.chance(0.5)) { [a, b, c, d] = [c, d, a, b]; } }
      const A = new MQ.Q(a, b), C = new MQ.Q(c, d), cmp = A.cmp(C);
      return {
        prompt: m('t.frac_compare.q', { a: fr(a, b), b: fr(c, d) }),
        widget: { type: 'mc', layout: 'row', options: symOpts(r, cmp, L === 2 ? { lt: 't.frac_compare.m.bigDen', gt: 't.frac_compare.m.bigDen' } : L === 3 ? { lt: 't.frac_compare.m.common', gt: 't.frac_compare.m.common', eq: 't.frac_compare.m.common' } : {}) },
        answer: m('c.cmpAnswer', { a: fr(a, b), b: fr(c, d), s: SYM[cmp < 0 ? 'lt' : cmp > 0 ? 'gt' : 'eq'] }),
        explain: (() => { const cm = MQ.lcm(b, d); return m(L === 1 ? 't.frac_compare.ex1' : L === 2 ? 't.frac_compare.ex2' : 't.frac_compare.ex3', { a: fr(a, b), b: fr(c, d), c: fr(a * cm / b, cm), e: fr(c * cm / d, cm) }); })()
      };
    }
  });

  /* ---------------- frac_order ---------------- */
  T.add({
    id: 'frac_order', stage: 'no_frac', objectives: ['NO.1.2'], mt: ['MT.11'],
    gen(r, L) {
      const vals = new Map(); let g = 0;
      const den = r.int(5, 12), nu = r.int(1, 4);
      while (vals.size < 4 && g++ < 400) {
        let n, d, isDec = false;
        if (L === 1) { d = den; n = r.int(1, d - 1); }
        else if (L === 2) { n = nu; d = r.int(n + 1, 12); }
        else if (L === 3) { d = r.pick([2, 4, 8]); n = r.int(1, d - 1); }
        else { if (r.chance(0.5)) { d = r.pick([2, 4, 5, 10]); n = r.int(1, d - 1); } else { isDec = true; d = 100; n = r.int(5, 95); } }
        const q = new MQ.Q(n, d); if ([...vals.values()].some(o => o.q.eq(q))) continue;
        vals.set(n + '/' + d, { q, label: isDec ? num(q) : frac(n, d) });
      }
      const desc = r.chance(0.5);
      return {
        prompt: m(desc ? 'c.orderDesc' : 'c.orderAsc'),
        widget: { type: 'order', items: r.shuffle([...vals.values()].map(o => ({ label: o.label, key: o.q }))), desc },
        answer: m('c.orderAnswer'), explain: m(L === 2 ? 't.frac_order.ex2' : L === 4 ? 't.frac_order.ex4' : 't.frac_order.ex')
      };
    }
  });

  /* ---------------- frac_equiv ---------------- */
  T.add({
    id: 'frac_equiv', stage: 'no_equiv', objectives: ['NO.1.3'], mt: ['MT.8', 'MT.9'],
    gen(r, L) {
      const d = r.int(2, L === 1 ? 5 : 9), n = r.int(1, d - 1), k = r.int(2, L <= 2 ? 5 : 9);
      if (MQ.gcd(n, d) !== 1) return this.gen(r, L);
      if (L === 4) {
        const k2 = r.intExcept(2, 6, [k]);
        return {
          prompt: m('t.frac_equiv.q4', { a: fr(n, d), d2: d * k, n3: n * k2 }),
          widget: { type: 'input', fields: [field('a', new MQ.Q(n * k), { label: m('t.frac_equiv.f1') }), field('b', new MQ.Q(d * k2), { label: m('t.frac_equiv.f2') })] },
          answer: m('t.frac_equiv.ans4', { a: n * k, b: d * k2 }), explain: m('t.frac_equiv.ex4', { n, d, k, k2 })
        };
      }
      const askNum = L === 1 || r.chance(0.5);
      const ans = askNum ? n * k : d * k;
      const addMis = askNum ? n + (d * k - d) : d + (n * k - n);
      return {
        prompt: m(askNum ? 't.frac_equiv.qNum' : 't.frac_equiv.qDen', { a: fr(n, d), d2: d * k, n2: n * k }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(ans))] },
        diagnose: v => v.a && v.a.eq(addMis) && addMis !== ans ? m('t.frac_equiv.m.add') : null,
        answer: m('c.num', { x: ans }), explain: m('t.frac_equiv.ex', { n, d, k, n2: n * k, d2: d * k }),
        wrong: addMis !== ans ? [{ fields: { a: String(addMis) } }] : []
      };
    }
  });

  /* ---------------- frac_simplify ---------------- */
  T.add({
    id: 'frac_simplify', stage: 'no_equiv', objectives: ['NO.1.4'], mt: [],
    gen(r, L) {
      const d0 = r.int(2, L <= 2 ? 7 : 9), n0 = r.int(1, d0 - 1);
      if (MQ.gcd(n0, d0) !== 1) return this.gen(r, L);
      const k = L === 1 ? 2 : L === 2 ? r.pick([3, 5, 10]) : L === 3 ? r.pick([4, 6, 8, 9]) : r.pick([6, 8, 12]);
      const n = n0 * k, d = d0 * k;
      const partial = (() => { for (const f of [2, 3, 5]) if (k % f === 0 && k !== f) return [n / f, d / f]; return null; })();
      return {
        prompt: m('t.frac_simplify.q', { a: fr(n, d) }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(n0, d0), { form: 'irreducible' })] },
        answer: m('c.num', { x: fr(n0, d0) }), explain: m('t.frac_simplify.ex', { a: fr(n, d), k, x: fr(n0, d0) }),
        wrong: partial ? [{ fields: { a: partial[0] + '/' + partial[1] } }, { fields: { a: n + '/' + d } }] : [{ fields: { a: n + '/' + d } }]
      };
    }
  });

  /* ---------------- multi_rep (diverses écritures) ---------------- */
  T.add({
    id: 'multi_rep', stage: 'no_equiv', objectives: ['NO.1.8', 'NO.C3'], mt: ['MT.31'],
    gen(r, L) {
      const pool = L === 1 ? [[1, 10], [3, 10], [7, 10], [9, 10], [1, 2], [2, 10]] :
        L === 2 ? [[1, 2], [3, 10], [7, 10], [1, 5], [4, 10], [9, 10]] :
          L === 3 ? [[1, 2], [1, 4], [3, 4], [1, 10], [1, 5], [3, 5]] : [[3, 4], [1, 5], [2, 5], [1, 4], [7, 20], [1, 20]];
      const chosen = []; const seen = [];
      r.shuffle(pool).forEach(p => { const q = new MQ.Q(p[0], p[1]); if (chosen.length < 4 && !seen.some(s => s.eq(q))) { seen.push(q); chosen.push(p); } });
      const right = q => {
        if (L === 1) return num(q);
        if (L === 2) return q.mul(10).isInt() ? { k: 'c.tenths', v: { n: q.mul(10) } } : num(q);
        if (L === 3) return { k: 'c.pct', v: { x: q.mul(100) } };
        return r.chance(0.5) ? { k: 'c.pct', v: { x: q.mul(100) } } : num(q);
      };
      const left = chosen.map(p => frac(p[0], p[1]));
      const rights = chosen.map(p => right(new MQ.Q(p[0], p[1])));
      return {
        prompt: m('t.multi_rep.q'), widget: { type: 'match', left, right: rights },
        answer: m('c.matchAnswer'), explain: m(L >= 3 ? 't.multi_rep.ex3' : 't.multi_rep.ex')
      };
    }
  });

  /* ---------------- percent ---------------- */
  T.add({
    id: 'percent', stage: 'no_equiv', objectives: ['NO.C3', 'NO.1.8'], mt: ['MT.13', 'MT.30', 'MT.32'],
    gen(r, L) {
      if (L === 1) {
        const p = r.int(3, 9) * 5 + r.pick([0, 1, 2, 3]);
        return { prompt: m('t.percent.q1', { p }), widget: { type: 'shade', kind: 'cells', cols: 10, rows: 10, parts: 100, target: p }, answer: m('t.percent.ans1', { p }), explain: m('t.percent.ex1', { p }) };
      }
      if (L === 2) {
        const p = r.int(5, 95); const on = r.sample([...Array(100).keys()].map(i => (i % 10) + ',' + Math.floor(i / 10)), p);
        return { prompt: m('t.percent.q2'), figure: MQ.fig.cells(10, 10, on, { cell: 22 }), widget: { type: 'input', fields: [field('a', new MQ.Q(p), { unit: '%' })] }, answer: m('c.pctv', { x: p }), explain: m('t.percent.ex2', { p }) };
      }
      if (L === 3) {
        const [p, tot] = r.pick([[50, 20], [25, 20], [75, 20], [10, 20], [20, 20], [25, 40], [75, 40], [10, 40], [30, 40], [50, 40]]);
        const cols = 10, rows = tot / 10;
        return { prompt: m('t.percent.q3', { p, t: tot }), widget: { type: 'shade', kind: 'cells', cols, rows, parts: tot, target: tot * p / 100 }, diagnose: v => v.count === p && p !== tot * p / 100 ? m('t.percent.m.count') : null, answer: m('t.percent.ans3', { c: tot * p / 100 }), explain: m('t.percent.ex3', { p, t: tot, c: tot * p / 100 }), wrong: [{ shaded: Array.from({ length: Math.min(p, tot) }, (_, i) => (i % 10) + ',' + Math.floor(i / 10)) }] };
      }
      const p = r.pick([10, 20, 25, 50, 75]); const base = r.pick([20, 40, 60, 80, 120, 200, 240]);
      const ans = new MQ.Q(base * p, 100);
      return {
        prompt: m('t.percent.q4', { p, b: { money: new MQ.Q(base) } }),
        widget: { type: 'input', fields: [field('a', ans, { unit: '€' })] },
        diagnose: v => v.a && v.a.eq(base - p) ? m('t.percent.m.subtract') : null,
        answer: m('c.eur', { x: { money: ans } }), explain: m('t.percent.ex4', { p, b: { money: new MQ.Q(base) }, x: { money: ans }, f: fr(p / MQ.gcd(p, 100), 100 / MQ.gcd(p, 100)) }),
        wrong: [{ fields: { a: String(base - p) } }]
      };
    }
  });

  /* cells shading canonical: first `target` cells in row-major order */
  T.cellIds = (cols, rows) => { const a = []; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) a.push(x + ',' + y); return a; };
})(typeof window !== 'undefined' ? window : globalThis);
