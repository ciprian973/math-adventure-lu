/* =====================================================================
 * Templates — Nombres et opérations (2/2): written calculation, decimal
 * and fraction operations, estimation, checking, equations, expressions,
 * divisibility, properties, sequences, tables & graphs.
 * Stages: no_calc, no_ops, no_check, no_struct, no_data.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const T = MQ.T, { Q, m, num, frac, fr, field, mcValues, mcMsgs, names } = T.h;
  const E = (...tk) => ({ expr: tk });
  const sOp = op => ({ html: () => op === '*' ? MQ.i18n.mulSign : op === '/' ? MQ.i18n.divSign : op === '-' ? '−' : '+' });

  /* column layout on squared paper (HTML) */
  function columns(rows, op, lang, result = null) {
    const strs = rows.map(x => MQ.fmtNum(x, lang).replace(/\./g, '').replace(/,/g, lang === 'en' ? '' : ','));
    const w = Math.max(...strs.map(s => s.length), result ? result.length : 0) + 1;
    const sym = op === '*' ? MQ.i18n.mulSign : op === '-' ? '−' : '+';
    let html = '<table class="columns">';
    strs.forEach((s, i) => {
      const cells = s.padStart(w, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`);
      if (i === strs.length - 1) cells[0] = `<td class="op">${sym}</td>`;
      html += `<tr class="${i === strs.length - 1 ? 'last' : ''}">${cells.join('')}</tr>`;
    });
    html += `<tr class="res">${Array(w).fill('<td>?</td>').join('').replace(/\?/g, '')}</tr></table>`;
    return html;
  }
  const noCarryAdd = (a, b) => { const A = String(a), B = String(b), n = Math.max(A.length, B.length); let s = ''; for (let i = 0; i < n; i++) { const x = +(A[A.length - 1 - i] || 0), y = +(B[B.length - 1 - i] || 0); s = ((x + y) % 10) + s; } return +s; };
  const smallFromBig = (a, b) => { const A = String(a), B = String(b).padStart(String(a).length, '0'); let s = ''; for (let i = 0; i < A.length; i++) s += Math.abs(+A[i] - +B[i]); return +s; };

  /* ---------------- written_op ---------------- */
  T.add({
    id: 'written_op', stage: 'no_calc', objectives: ['NO.2.1', 'NO.C9', 'NO.C8'], mt: [],
    gen(r, L) {
      let a, b, op, res, mis = null, misKey = null;
      if (L === 1) { a = r.int(1000, 89999); b = r.int(1000, 9999); op = '+'; res = a + b; mis = noCarryAdd(a, b); misKey = 't.written_op.m.carry'; }
      else if (L === 2) { a = r.int(20000, 99999); b = r.int(1000, a - 1000); op = '-'; res = a - b; mis = smallFromBig(a, b); misKey = 't.written_op.m.borrow'; }
      else if (L === 3) { a = r.int(101, 999); b = r.int(12, 99); op = '*'; res = a * b; mis = a * (b % 10) + a * Math.floor(b / 10); misKey = 't.written_op.m.shift'; }
      else { a = r.int(1001, 9999); b = r.int(12, 999); op = '*'; res = a * b; const bs = String(b); mis = bs.split('').reduce((acc, dg) => acc + a * +dg, 0); misKey = 't.written_op.m.shift'; }
      if (mis === res) mis = null;
      return {
        prompt: m('t.written_op.q'), figure: lang => columns([a, b], op, lang),
        widget: { type: 'input', fields: [field('a', new MQ.Q(res))] },
        diagnose: v => v.a && mis != null && v.a.eq(mis) ? m(misKey) : (v.a && op === '*' && v.a.eq(a * (b % 10)) ? m('t.written_op.m.partial') : null),
        answer: m('c.num', { x: res }), explain: m('t.written_op.ex' + (op === '*' ? 'Mul' : op === '-' ? 'Sub' : 'Add'), { a, b, x: res, u: b % 10, t: b - b % 10, p1: a * (b % 10), p2: a * (b - b % 10) }),
        wrong: mis != null ? [{ fields: { a: String(mis) } }] : [],
        ranges: [['res', res, 0, 99999999]]
      };
    }
  });

  /* ---------------- euclid (division euclidienne) ---------------- */
  T.add({
    id: 'euclid', stage: 'no_calc', objectives: ['NO.C6', 'NO.C7', 'NO.2.1'], mt: ['MT.27'],
    gen(r, L) {
      if (L === 4) {
        let d, D, q, g = 0;
        do { d = r.int(11, 99); const k = r.int(1001, 9999); q = MQ.Q.dec(k, 2); D = q.mul(d); g++; } while ((!D.isInt() || D.toNumber() < 1000 || D.toNumber() > 9999 || q.isInt() || q.mul(10).isInt() && r.chance(0.5)) && g < 5000);
        if (!D.isInt()) { d = 25; D = new MQ.Q(1234); q = D.div(d); }
        const Dn = D.toNumber(), qi = Math.floor(Dn / d), rem = Dn - qi * d;
        return {
          prompt: m('t.euclid.q4', { a: Dn, b: d }),
          widget: { type: 'input', fields: [field('q', q)] },
          diagnose: v => v.q && v.q.eq(MQ.Q.of(qi + '.' + rem)) ? m('t.euclid.m.remainderAsDecimal') : null,
          answer: m('c.num', { x: q }), explain: m('t.euclid.ex4', { a: Dn, b: d, q: qi, r: rem, x: q }),
          wrong: [{ fields: { q: qi + ',' + rem } }],
          ranges: [['dividend', Dn, 1000, 9999], ['divisor', d, 10, 99], ['places', q.decimalPlaces(), 1, 2]]
        };
      }
      let a, d;
      if (L === 1) { d = r.int(3, 9); a = r.int(d * 3, 99); }
      else if (L === 2) { d = r.int(3, 9); a = r.int(100, 9999); }
      else { d = r.int(11, 99); a = r.int(1000, 9999); }
      const q = Math.floor(a / d), rem = a % d;
      if (rem === 0) return this.gen(r, L);
      return {
        prompt: m('t.euclid.q', { a, b: d }),
        widget: { type: 'input', fields: [field('q', new MQ.Q(q), { label: m('w.quotient') }), field('r', new MQ.Q(rem), { label: m('w.remainder') })] },
        diagnose: v => { if (v.r && v.r.toNumber() >= d) return m('t.euclid.m.remainderTooBig', { b: d }); if (v.q && v.r && !v.q.mul(d).add(v.r).eq(a)) return m('t.euclid.m.check', { b: d, a }); return null; },
        answer: m('t.euclid.ans', { q, r: rem }), explain: m('t.euclid.ex', { a, b: d, q, r: rem, p: q * d }),
        wrong: [{ fields: { q: String(q - 1), r: String(rem + d) } }],
        ranges: [['remainder', rem, 1, d - 1]]
      };
    }
  });

  /* ---------------- mistake_calc (trouver l'erreur) ---------------- */
  T.add({
    id: 'mistake_calc', stage: 'no_calc', objectives: ['NO.2.4', 'NO.2.1', 'GC.2'], mt: [],
    gen(r, L) {
      const a = r.int(L <= 2 ? 23 : 123, L <= 2 ? 98 : 987), b = r.int(13, 89);
      const u = b % 10, t = b - u;
      if (u === 0) return this.gen(r, L);
      const p1 = a * u, p2 = a * t, y = a * b;
      const wrongStep = r.int(0, 2);
      // the carry from the units: (units digit of a) × u = 10·c + rest
      const du = a % 10, pu = du * u, c = Math.floor(pu / 10);
      if (wrongStep === 0 && c === 0) return this.gen(r, L);       // no carry to forget: pick another calculation
      const err = wrongStep === 0 ? p1 - 10 * c                    // forgotten carry
        : wrongStep === 1 ? p2 / 10                                // forgotten 0 (multiplying by tens)
          : y + 100 * r.pick([1, -1]);                             // addition mistake
      const shown = [p1, p2, y]; shown[wrongStep] = err;
      if (wrongStep < 2) shown[2] = shown[0] + shown[1];           // the addition is done correctly with the numbers written
      const lines = [
        m('t.mistake_calc.step', { e: E(a, '*', u), x: shown[0] }),
        m('t.mistake_calc.step', { e: E(a, '*', t), x: shown[1] }),
        m('t.mistake_calc.step', { e: E(shown[0], '+', shown[1]), x: shown[2] })
      ];
      const fixVal = [p1, p2, y][wrongStep];
      const v = { a, u, t, x: fixVal, w: err, y, p: p1, s: p2, d: du, pu, r: pu % 10, c, e: E(a, '*', b) };
      return {
        prompt: m('t.mistake_calc.q', { n: names(r, 1)[0], e: E(a, '*', b) }), hintVars: {},
        widget: { type: 'mistake', steps: lines, wrongStep, fields: [field('fix', new MQ.Q(fixVal), { label: m('t.mistake_calc.fix') })],
          stepFb: wrongStep < 2 ? { 2: m('t.mistake_calc.m.sumOk') } : {} },
        answer: m('t.mistake_calc.ans', { i: wrongStep + 1, x: fixVal, y, e: E(a, '*', b) }),
        explain: m('t.mistake_calc.ex' + wrongStep, v),
        diagnose: vv => vv.fix && wrongStep < 2 && vv.fix.eq(y) ? m('t.mistake_calc.m.lineOnly') : null,
        wrong: [{ step: (wrongStep + 1) % 3, fields: { fix: '1' } }].concat(wrongStep < 2 ? [{ step: 2, fields: { fix: String(y) } }] : [])
      };
    }
  });

  /* ---------------- dec_addsub ---------------- */
  T.add({
    id: 'dec_addsub', stage: 'no_ops', objectives: ['NO.2.2', 'NO.C1'], mt: [],
    gen(r, L) {
      let a, b, op = '+';
      if (L === 1) { a = MQ.Q.dec(r.int(11, 999), 1); b = MQ.Q.dec(r.int(11, 999), 1); }
      else if (L === 2) { a = MQ.Q.dec(r.int(11, 99), 1); b = MQ.Q.dec(r.int(101, 999), 2); if (r.chance(0.5)) [a, b] = [b, a]; }
      else if (L === 3) { a = new MQ.Q(r.int(3, 40)); b = MQ.Q.dec(r.int(101, a.toNumber() * 100 - 1), 2); op = '-'; }
      else { a = MQ.Q.dec(r.int(1001, 9999), 2); b = MQ.Q.dec(r.int(101, 999), 3); op = r.pick(['+', '-']); if (op === '-' && b.gt(a)) [a, b] = [b, a]; }
      const res = op === '+' ? a.add(b) : a.sub(b);
      // misconception: align digits to the right (ignore the comma)
      const da = a.decimalPlaces(), db = b.decimalPlaces();
      let mis = null;
      if (da !== db) { const ia = a.mul(Math.pow(10, da)).toNumber(), ib = b.mul(Math.pow(10, db)).toNumber(), p = Math.max(da, db); const v = op === '+' ? ia + ib : ia - ib; if (v > 0) mis = MQ.Q.dec(v, p); }
      return {
        prompt: m('c.calc', { e: E(a, op, b) }),
        widget: { type: 'input', fields: [field('a', res)] },
        diagnose: v => v.a && mis && v.a.eq(mis) && !mis.eq(res) ? m('t.dec_addsub.m.align') : null,
        answer: m('c.num', { x: res }), explain: m('t.dec_addsub.ex', { a, b, x: res }),
        wrong: mis && !mis.eq(res) ? [{ fields: { a: mis.toDecimalString() } }] : [],
        ranges: [['res', res.toNumber(), 0, 100000]]
      };
    }
  });

  /* ---------------- dec_mul ---------------- */
  T.add({
    id: 'dec_mul', stage: 'no_ops', objectives: ['NO.2.2', 'NO.3.2'], mt: [],
    gen(r, L) {
      let a, b, op = '*';
      if (L === 1) { a = MQ.Q.dec(r.int(11, 99), 1); b = new MQ.Q(r.int(2, 9)); }
      else if (L === 2) { a = MQ.Q.dec(r.int(101, 999), 2); b = new MQ.Q(r.int(11, 49)); }
      else if (L === 3) { a = MQ.Q.dec(r.int(11, 99), 1); b = MQ.Q.dec(r.int(11, 99), 1); }
      else { op = '/'; b = new MQ.Q(r.pick([2, 3, 4, 5, 6, 8])); const q = MQ.Q.dec(r.int(11, 999), r.pick([1, 2])); a = q.mul(b); if (a.decimalPlaces() > 2) return this.gen(r, L); }
      const res = op === '*' ? a.mul(b) : a.div(b);
      const off = [res.mul(10), res.div(10), res.mul(100), res.div(100)];
      return {
        prompt: m('c.calc', { e: E(a, op, b) }),
        widget: { type: 'input', fields: [field('a', res)] },
        diagnose: v => v.a && off.some(o => o.eq(v.a)) ? m('t.dec_mul.m.places') : null,
        answer: m('c.num', { x: res }), explain: m(op === '*' ? 't.dec_mul.ex' : 't.dec_mul.exDiv', { a, b, x: res, n: a.decimalPlaces() + b.decimalPlaces(), ai: a.mul(Math.pow(10, a.decimalPlaces())), bi: b.mul(Math.pow(10, b.decimalPlaces())), pi: a.mul(Math.pow(10, a.decimalPlaces())).mul(b.mul(Math.pow(10, b.decimalPlaces()))) }),
        wrong: [{ fields: { a: res.mul(10).toDecimalString() } }],
        ranges: [['places', res.decimalPlaces(), 0, 3]]
      };
    }
  });

  /* ---------------- frac_addsub ---------------- */
  T.add({
    id: 'frac_addsub', stage: 'no_ops', objectives: ['NO.2.2', 'NO.C4', 'NO.1.3'], mt: ['MT.24'],
    gen(r, L) {
      let b, d, a, c, op = '+';
      if (L === 1) { b = d = r.int(3, 12); a = r.int(1, b - 1); c = r.int(1, b - a); if (c < 1) c = 1; }
      else if (L === 2) { b = d = r.int(4, 12); a = r.int(2, b); c = r.int(1, a - 1); op = '-'; }
      else if (L === 3) { b = r.pick([2, 3, 4, 5]); d = b * r.pick([2, 3]); a = r.int(1, b - 1); c = r.int(1, d - 1); op = r.pick(['+', '-']); }
      else { [b, d] = r.pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [6, 8], [4, 10]]); a = r.int(1, b - 1); c = r.int(1, d - 1); op = r.pick(['+', '-']); if (r.chance(0.5)) [a, b, c, d] = [c, d, a, b]; }
      let A = new MQ.Q(a, b), C = new MQ.Q(c, d);
      if (op === '-' && A.lt(C)) { [a, b, c, d] = [c, d, a, b]; [A, C] = [C, A]; }
      const res = op === '+' ? A.add(C) : A.sub(C);
      if (res.n === 0) return this.gen(r, L);
      const mis = op === '+' ? new MQ.Q(a + c, b + d) : (b !== d && a - c > 0 && b - d !== 0 ? new MQ.Q(Math.abs(a - c), Math.abs(b - d) || 1) : null);
      const cm = MQ.lcm(b, d);
      return {
        prompt: m('t.frac_addsub.q', { e: { list: [fr(a, b), { raw: op === '+' ? '+' : '−' }, fr(c, d)], sep: ' ' } }),
        widget: { type: 'input', fields: [field('a', res)] },
        diagnose: v => v.a && mis && v.a.eq(mis) && !mis.eq(res) ? m('t.frac_addsub.m.addAll') : (v.a && b !== d && v.a.eq(new MQ.Q(op === '+' ? a + c : Math.max(a - c, 0), cm)) && !res.eq(new MQ.Q(op === '+' ? a + c : a - c, cm)) ? m('t.frac_addsub.m.numOnly') : null),
        answer: m('c.num', { x: fr(res.n, res.d) }),
        explain: m(b === d ? 't.frac_addsub.exSame' : 't.frac_addsub.exDiff', { a: fr(a, b), c: fr(c, d), a2: fr(a * cm / b, cm), c2: fr(c * cm / d, cm), x: fr(res.n, res.d), cm, op: { raw: op === '+' ? '+' : '−' }, s: fr(op === '+' ? a * cm / b + c * cm / d : a * cm / b - c * cm / d, cm) }),
        wrong: mis && !mis.eq(res) ? [{ fields: { a: mis.n + '/' + mis.d } }] : []
      };
    }
  });

  /* ---------------- frac_mul ---------------- */
  T.add({
    id: 'frac_mul', stage: 'no_ops', objectives: ['NO.2.2', 'NO.C4'], mt: ['MT.25', 'MT.26'],
    gen(r, L) {
      const b = r.int(2, 9), a = r.int(1, b - 1);
      if (L === 1) {
        const n = r.int(2, 6); const res = new MQ.Q(n * a, b);
        return {
          prompt: m('t.frac_mul.q', { e: { list: [n, { html: () => MQ.i18n.mulSign }, fr(a, b)], sep: ' ' } }),
          widget: { type: 'input', fields: [field('a', res)] },
          diagnose: v => v.a && v.a.eq(new MQ.Q(n * a, n * b)) ? m('t.frac_mul.m.both') : null,
          answer: m('c.num', { x: fr(n * a, b) }), explain: m('t.frac_mul.ex1', { n, a: fr(a, b), x: fr(n * a, b), s: { list: Array(n).fill(fr(a, b)), sep: ' + ' } }),
          wrong: [{ fields: { a: (n * a) + '/' + (n * b) } }]
        };
      }
      if (L === 2) {
        const q = r.int(2, 12) * b; const res = new MQ.Q(q * a, b);
        const ctx = r.pick(['eur', 'pupils', 'km']);
        return {
          prompt: m('t.frac_mul.q2' + ctx, { a: fr(a, b), q }),
          widget: { type: 'input', fields: [field('a', res, ctx === 'eur' ? { unit: '€' } : ctx === 'km' ? { unit: 'km' } : {})] },
          diagnose: v => v.a && v.a.eq(q / b) && a !== 1 ? m('t.frac_mul.m.unitOnly', { u: fr(1, b) }) : null,
          answer: m('c.num', { x: res }), explain: m('t.frac_mul.ex2', { a: fr(a, b), q, u: q / b, x: res, n: a }),
          wrong: a !== 1 ? [{ fields: { a: String(q / b) } }] : []
        };
      }
      if (L === 3) {
        const d = r.int(2, 9), c = r.int(1, d - 1); const res = new MQ.Q(a * c, b * d);
        return {
          prompt: m('t.frac_mul.q', { e: { list: [fr(a, b), { html: () => MQ.i18n.mulSign }, fr(c, d)], sep: ' ' } }),
          widget: { type: 'input', fields: [field('a', res)] },
          diagnose: v => v.a && v.a.eq(new MQ.Q(a * c, b)) ? m('t.frac_mul.m.denKept') : null,
          answer: m('c.num', { x: fr(a * c, b * d) }), explain: m('t.frac_mul.ex3', { a: fr(a, b), c: fr(c, d), x: fr(a * c, b * d) })
        };
      }
      // L4: missing numerator  □/b × c/d = target
      const d = r.int(2, 6), c = r.int(1, d - 1), x = r.int(1, b - 1); const target = new MQ.Q(x * c, b * d);
      return {
        prompt: m('t.frac_mul.q4', { b, c: fr(c, d), t: fr(x * c, b * d) }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(x))] },
        answer: m('c.num', { x }), explain: m('t.frac_mul.ex4', { b, c: fr(c, d), t: fr(x * c, b * d), x, p: x * c, q: b * d })
      };
    }
  });

  /* ---------------- verbalize (vocabulaire des opérations) ---------------- */
  T.add({
    id: 'verbalize', stage: 'no_ops', objectives: ['NO.2.2', 'NO.C8', 'NO.C7', 'GC.3'], mt: [],
    gen(r, L) {
      const ops = [['+', 'w.sum'], ['-', 'w.difference'], ['*', 'w.product'], ['/', 'w.quotient']];
      if (L === 1) {
        const [op, key] = r.pick(ops); const a = r.int(12, 60), b = r.int(2, 9);
        return {
          prompt: m('t.verbalize.q1', { e: E(a, op, b) }),
          widget: { type: 'mc', options: r.shuffle(ops.map(([o, k]) => ({ label: m(k), correct: k === key }))) },
          answer: m(key), explain: m('t.verbalize.ex1', { w: m(key), e: E(a, op, b) })
        };
      }
      if (L === 2 || L === 3) {
        const a = r.int(L === 2 ? 10 : 20, 40), b = r.int(2, 9), c = r.int(2, 9);
        // phrase for one expression; options: 4 expressions
        const forms = L === 2
          ? [{ k: 't.verbalize.p.sum', e: [a, '+', b] }, { k: 't.verbalize.p.diff', e: [a, '-', b] }, { k: 't.verbalize.p.prod', e: [a, '*', b] }, { k: 't.verbalize.p.quot', e: [a, '/', b] }]
          : [{ k: 't.verbalize.p.prodOfSum', e: [a, '*', '(', b, '+', c, ')'] }, { k: 't.verbalize.p.sumOfProd', e: [a, '*', b, '+', c] }, { k: 't.verbalize.p.diffOfProd', e: ['(', a, '-', b, ')', '*', c] }, { k: 't.verbalize.p.quotOfSum', e: ['(', a, '+', b, ')', '/', c] }];
        const pick = r.int(0, 3);
        return {
          prompt: m('t.verbalize.q2', { p: m(forms[pick].k, { a, b, c }) }),
          widget: { type: 'mc', options: r.shuffle(forms.map((f, i) => ({ label: m('c.expr', { e: E(...f.e) }), correct: i === pick }))) },
          answer: m('c.expr', { e: E(...forms[pick].e) }), explain: m('t.verbalize.ex2')
        };
      }
      const b = r.int(3, 9), q = r.int(5, 15), rem = r.int(1, b - 1), a = b * q + rem;
      return {
        prompt: m('t.verbalize.q4', { a, b, q, r: rem }),
        widget: { type: 'match', left: [m('w.dividend'), m('w.divisor'), m('w.quotient'), m('w.remainder')], right: [num(a), num(b), num(q), num(rem)] },
        answer: m('c.matchAnswer'), explain: m('t.verbalize.ex4', { a, b, q, r: rem })
      };
    }
  });

  /* ---------------- estimate ---------------- */
  T.add({
    id: 'estimate', stage: 'no_check', objectives: ['NO.2.3', 'NO.C11'], mt: ['MT.18'],
    gen(r, L) {
      let a, b, op, est, ra, rb;
      const round = (x, p) => Math.round(x / p) * p;
      if (L === 1) { a = r.int(1100, 8900); b = r.int(1100, 8900); op = '+'; ra = round(a, 1000); rb = round(b, 1000); est = ra + rb; }
      else if (L === 2) { a = r.int(5100, 9800); b = r.int(1100, 4900); op = '-'; ra = round(a, 1000); rb = round(b, 1000); est = ra - rb; }
      else if (L === 3) { a = r.int(21, 98); b = r.int(21, 98); op = '*'; ra = round(a, 10); rb = round(b, 10); est = ra * rb; }
      else { a = MQ.Q.dec(r.int(105, 995), 1); b = MQ.Q.dec(r.int(21, 98), 1); op = '*'; ra = Math.round(a.toNumber()); rb = Math.round(b.toNumber()); est = ra * rb; }
      if (est <= 0) return this.gen(r, L);
      const exact = MQ.evalExpr([a, op, b]);
      const opts = mcValues(r, new MQ.Q(est), [{ v: new MQ.Q(est * 10), why: 't.estimate.m.magnitude' }, { v: new MQ.Q(est / 10 === Math.round(est / 10) ? est / 10 : est * 100), why: 't.estimate.m.magnitude' }, { v: new MQ.Q(op === '*' ? ra + rb : op === '+' ? Math.abs(ra - rb) || est * 2 : ra + rb), why: 't.estimate.m.operation' }], { fill: () => new MQ.Q(est * r.pick([2, 3, 100])) });
      return {
        prompt: m('t.estimate.q', { e: E(a, op, b) }),
        widget: { type: 'mc', options: opts },
        answer: m('c.num', { x: est }), explain: m('t.estimate.ex', { e: E(a, op, b), f: E(ra, op, rb), x: est, y: exact })
      };
    }
  });

  /* ---------------- plausible (vérifier un résultat) ---------------- */
  T.add({
    id: 'plausible', stage: 'no_check', objectives: ['NO.2.4', 'RP.3.4', 'GC.2'], mt: [],
    gen(r, L) {
      const kind = r.pick(['ok', 'mag', 'last']);
      let a, b, op;
      if (L <= 2) { a = r.int(12, 99); b = r.int(12, 99); op = '*'; }
      else if (L === 3) { a = r.int(101, 999); b = r.int(12, 89); op = '*'; }
      else { a = MQ.Q.dec(r.int(11, 99), 1); b = new MQ.Q(r.int(11, 49)); op = '*'; }
      const exact = MQ.Q.of(a).mul(b);
      let claimed = exact;
      if (kind === 'mag') claimed = r.chance(0.5) ? exact.mul(10) : exact.div(10);
      if (kind === 'last') { const lastOk = exact.mul(Math.pow(10, exact.decimalPlaces())).toNumber() % 10; const delta = r.pick([1, 2, 3, 4]) * (lastOk >= 5 ? -1 : 1); claimed = exact.add(new MQ.Q(delta, Math.pow(10, exact.decimalPlaces()))); }
      const reasons = [
        { label: m('t.plausible.r.mag'), correct: kind === 'mag' },
        { label: m('t.plausible.r.last'), correct: kind === 'last' },
        { label: m('t.plausible.r.inverse'), correct: kind === 'ok' },
        { label: m('t.plausible.r.looks'), correct: false }
      ];
      const ua = MQ.Q.of(a).mul(Math.pow(10, MQ.Q.of(a).decimalPlaces())).toNumber() % 10, ub = MQ.Q.of(b).toNumber() % 10;
      return {
        prompt: m('t.plausible.q', { n: names(r, 1)[0], e: E(a, op, b), x: claimed }),
        widget: { type: 'tf', truth: kind === 'ok', reasons: r.shuffle(reasons), wrongFb: m('t.plausible.m.check') },
        answer: m(kind === 'ok' ? 'c.true' : 'c.false'),
        explain: m('t.plausible.ex.' + kind, { e: E(a, op, b), x: claimed, y: exact, ua, ub, u: (ua * ub) % 10, est: (() => { const rs = q => { const v = MQ.Q.of(q).toNumber(); const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.round(v / p) * p; }; return rs(a) * rs(b); })() })
      };
    }
  });

  /* ---------------- missing (équations à un nombre inconnu) ---------------- */
  T.add({
    id: 'missing', stage: 'no_check', objectives: ['NO.2.5'], mt: ['MT.73', 'MT.84'],
    gen(r, L) {
      let tokens, x, mis = null;
      const B = '□';
      if (L === 1) {
        x = new MQ.Q(r.int(100, 9999)); const a = new MQ.Q(r.int(100, 9999)); const form = r.int(0, 2);
        if (form === 0) { tokens = [B, '+', a, '=', x.add(a)]; mis = x.add(a).add(a); }
        else if (form === 1) { tokens = [a.add(x), '-', B, '=', a]; mis = a.add(x).add(a); }
        else { const big = x.add(a); tokens = [B, '-', a, '=', x]; x = big; mis = x.sub(a).sub(a); }
      }
      else if (L === 2) { const a = new MQ.Q(r.int(3, 25)); x = new MQ.Q(r.int(3, 99)); if (r.chance(0.5)) { tokens = [B, '*', a, '=', x.mul(a)]; mis = x.mul(a).mul(a); } else { tokens = [x.mul(a), '/', B, '=', a]; mis = x.mul(a).mul(a); } }
      else if (L === 3) { const a = MQ.Q.dec(r.int(11, 999), r.pick([1, 2])); x = MQ.Q.dec(r.int(11, 999), r.pick([1, 2])); tokens = r.chance(0.5) ? [B, '+', a, '=', x.add(a)] : [x.add(a), '-', B, '=', a]; mis = x.add(a).add(a); }
      else { const a = new MQ.Q(r.int(2, 9)), b = new MQ.Q(r.int(2, 30)); x = new MQ.Q(r.int(2, 20)); const c = x.mul(a).add(b); tokens = [a, '*', B, '+', b, '=', c]; mis = c.add(b).div(a); }
      const lhs = tokens.slice(0, tokens.indexOf('=')), rhs = tokens[tokens.length - 1];
      // solve exactly: lhs is linear in □
      let sol;
      if (lhs[1] === '/' && lhs[2] === B) sol = MQ.Q.of(lhs[0]).div(rhs);          // a : □ = b  →  □ = a : b
      else { const v0 = MQ.evalExpr(lhs.map(t => t === B ? new MQ.Q(0) : t)), v1 = MQ.evalExpr(lhs.map(t => t === B ? new MQ.Q(1) : t)); sol = MQ.Q.of(rhs).sub(v0).div(v1.sub(v0)); }
      if (!MQ.evalExpr(lhs.map(t => t === B ? sol : t)).eq(rhs)) throw new Error('missing: unsolved');
      return {
        prompt: m('t.missing.q', { e: { expr: tokens.map(t => t === '=' ? '=' : t) } }),
        widget: { type: 'input', fields: [field('a', sol)] },
        diagnose: v => v.a && mis && v.a.eq(mis) && !mis.eq(sol) ? m('t.missing.m.inverse') : null,
        answer: m('c.num', { x: sol }), explain: m(L === 4 ? 't.missing.ex4' : 't.missing.ex', { e: { expr: tokens.map(t => t === B ? sol : t) }, x: sol }),
        wrong: mis && !mis.eq(sol) && mis.decimalPlaces() >= 0 && mis.n > 0 ? [{ fields: { a: mis.toDecimalString() } }] : [],
        ranges: [['solution', sol.toNumber(), 0, 1000000]]
      };
    }
  });

  /* ---------------- expression (priorités) ---------------- */
  T.add({
    id: 'expression', stage: 'no_check', objectives: ['NO.2.6'], mt: ['MT.71', 'MT.72'],
    gen(r, L) {
      let tk;
      const n = (a, b) => r.int(a, b);
      if (L === 1) tk = r.pick([[n(2, 30), '+', n(2, 9), '*', n(2, 9)], [n(30, 90), '-', n(2, 9), '*', n(2, 5)]]);
      else if (L === 2) tk = r.pick([['(', n(2, 20), '+', n(2, 20), ')', '*', n(2, 9)], [n(2, 9), '*', '(', n(20, 40), '-', n(2, 19), ')']]);
      else if (L === 3) { const d = n(2, 9), q = n(2, 9); tk = [n(3, 12), '*', n(3, 12), '-', d * q, '/', d]; }
      else { const a = MQ.Q.dec(n(11, 99), 1); tk = r.pick([[a, '+', n(2, 9), '*', '(', n(2, 9), '-', 1, ')'], ['(', a, '-', MQ.Q.dec(n(1, 9), 1), ')', '*', 4]]); }
      const val = MQ.evalExpr(tk);
      if (val.n < 0) return this.gen(r, L);
      // left-to-right misconception (ignoring priorities, parentheses kept)
      let mis = null;
      try { const flat = tk.filter(t => t !== '(' && t !== ')'); let acc = MQ.Q.of(flat[0]); for (let i = 1; i < flat.length; i += 2) acc = MQ.evalExpr([acc, flat[i], flat[i + 1]]); mis = acc; } catch (e) { mis = null; }
      return {
        prompt: m('c.calc', { e: { expr: tk } }),
        widget: { type: 'input', fields: [field('a', val)] },
        diagnose: v => v.a && mis && v.a.eq(mis) && !mis.eq(val) ? m(tk.includes('(') ? 't.expression.m.paren' : 't.expression.m.leftright') : null,
        answer: m('c.num', { x: val }), explain: m(tk.includes('(') ? 't.expression.exParen' : 't.expression.ex', { e: { expr: tk }, x: val }),
        wrong: mis && !mis.eq(val) && mis.n > 0 && mis.decimalPlaces() >= 0 ? [{ fields: { a: mis.toDecimalString() } }] : []
      };
    }
  });

  /* ---------------- program (programmes de calcul) ---------------- */
  T.add({
    id: 'program', stage: 'no_check', objectives: ['NO.2.6', 'NO.2.5'], mt: ['MT.73', 'MT.74', 'MT.75'],
    gen(r, L) {
      // build 3 operations keeping integers ≥ 0
      let start = r.int(2, 20), cur = new MQ.Q(start); const steps = [];
      const opsPool = L === 1 ? ['+', '-'] : ['+', '-', '*', '/'];
      while (steps.length < 3) {
        const op = r.pick(opsPool); let k;
        if (op === '+') k = r.int(2, 30); else if (op === '-') { if (cur.toNumber() < 4) continue; k = r.int(1, Math.min(30, cur.toNumber() - 1)); }
        else if (op === '*') k = r.int(2, 6); else { const ds = MQ.divisors(cur.toNumber()).filter(x => x > 1 && x < 10); if (!ds.length) continue; k = r.pick(ds); }
        steps.push([op, k]); cur = MQ.evalExpr([cur, op, k]);
      }
      const end = cur;
      const chain = { html: lang => [MQ.fmtNum(start, lang) === undefined ? '' : (L === 3 ? '<span class="box">□</span>' : MQ.fmtNum(start, lang))].concat(steps.map(([op, k], i) => `<span class="arrow">→</span><span class="opbox">${op === '*' ? MQ.i18n.mulSign : op === '/' ? MQ.i18n.divSign : op === '-' ? '−' : '+'} ${MQ.fmtNum(k, lang)}</span>${i === 2 && L === 4 ? '' : ''}`)).join(' ') + ` <span class="arrow">→</span> ${L === 3 || L === 4 ? MQ.fmtNum(end, lang) : '<span class="box">?</span>'}` };
      if (L === 4) {
        // missing operation: hide step 2
        const hidden = 1; const [hop, hk] = steps[hidden];
        const chain4 = { html: lang => MQ.fmtNum(start, lang) + steps.map(([op, k], i) => ` <span class="arrow">→</span> <span class="opbox">${i === hidden ? '?' : (op === '*' ? MQ.i18n.mulSign : op === '/' ? MQ.i18n.divSign : op === '-' ? '−' : '+') + ' ' + MQ.fmtNum(k, lang)}</span>`).join('') + ` <span class="arrow">→</span> ${MQ.fmtNum(end, lang)}` };
        const before = MQ.evalExpr([start, steps[0][0], steps[0][1]]);
        const runWith = (op, k) => { let v = MQ.evalExpr([before, op, k]); return MQ.evalExpr([v, steps[2][0], steps[2][1]]); };
        const cands = [[hop, hk], ['+', hk + 1], ['-', hk], ['*', 2], ['/', 2], ['+', hk * 2], ['*', hk + 1]];
        const opts = []; const seen = new Set();
        cands.forEach(([op, k]) => { const key = op + k; if (seen.has(key) || opts.length >= 4) return; let v; try { v = runWith(op, k); } catch (e) { return; } if (op !== hop || k !== hk) { if (v.eq(end)) return; } seen.add(key); opts.push({ label: { k: 'c.op', v: { o: sOp(op), x: k } }, correct: op === hop && k === hk }); });
        return {
          prompt: m('t.program.q4'), figure: { htmlFig: chain4 },
          widget: { type: 'mc', options: r.shuffle(opts) },
          answer: m('c.op', { o: sOp(hop), x: hk }), explain: m('t.program.ex4', { a: before, b: MQ.evalExpr([before, hop, hk]) })
        };
      }
      if (L === 3) {
        return {
          prompt: m('t.program.q3'), figure: { htmlFig: chain },
          widget: { type: 'input', fields: [field('a', new MQ.Q(start))] },
          answer: m('c.num', { x: start }), explain: m('t.program.ex3', { inv: { html: lang => steps.slice().reverse().map(([op, k]) => (op === '+' ? '−' : op === '-' ? '+' : op === '*' ? MQ.i18n.divSign : MQ.i18n.mulSign) + ' ' + MQ.fmtNum(k, lang)).join(', ') }, x: start })
        };
      }
      return {
        prompt: m('t.program.q'), figure: { htmlFig: chain },
        widget: { type: 'input', fields: [field('a', end)] },
        answer: m('c.num', { x: end }), explain: m('t.program.ex', { x: end })
      };
    }
  });

  /* ---------------- divisibility ---------------- */
  T.add({
    id: 'divisibility', stage: 'no_struct', objectives: ['NO.3.1', 'NO.C5'], mt: ['MT.21', 'MT.14'],
    gen(r, L) {
      const k = L === 1 ? r.pick([2, 5, 10]) : L === 2 ? r.pick([3, 4]) : L === 3 ? 9 : r.pick([6, 4, 9]);
      const maxN = L <= 2 ? 99999 : 999999;
      const items = []; const used = new Set();
      while (items.length < 6) {
        const yes = items.filter(i => i.bin === 0).length < 3;
        let n = r.int(100, maxN);
        if (yes) n = n - (n % k) || k * 101;
        else if (n % k === 0) n += 1;
        // trap: for 3/9 use numbers ending in 3/9 that are not divisible, and digit-sum near multiples
        if (used.has(n) || n < 10) continue;
        used.add(n); items.push({ label: num(n), bin: n % k === 0 ? 0 : 1, n });
      }
      return {
        prompt: m('t.divisibility.q', { k }),
        widget: { type: 'bins', bins: [m('t.divisibility.yes', { k }), m('t.divisibility.no', { k })], items: r.shuffle(items) },
        answer: m('c.binsAnswer'), explain: m('t.divisibility.ex' + k, { k })
      };
    }
  });

  /* ---------------- divisors (diviseurs, nombres premiers, multiples) ---- */
  T.add({
    id: 'divisors', stage: 'no_struct', objectives: ['NO.3.1'], mt: ['MT.6', 'MT.7', 'MT.20'],
    gen(r, L) {
      if (L === 1) {
        const n = r.pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]);
        const cands = [...Array(10).keys()].map(i => i + 1).concat([n / 2, n]).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
        return {
          prompt: m('t.divisors.q1', { n }),
          widget: { type: 'multi', options: cands.map(c => ({ label: num(c), correct: n % c === 0 })) },
          answer: m('t.divisors.ans1', { list: { list: MQ.divisors(n).map(x => ({ raw: String(x) })), sep: ', ' } }), explain: m('t.divisors.ex1', { n, pairs: { raw: MQ.divisors(n).filter(d => d * d <= n).map(d => d + ' × ' + (n / d)).join(' ; ') } })
        };
      }
      if (L === 2) {
        const nums = r.sample([...Array(49).keys()].map(i => i + 2), 7);
        return {
          prompt: m('t.divisors.q2'),
          widget: { type: 'bins', bins: [m('t.divisors.prime'), m('t.divisors.notPrime')], items: nums.map(n => ({ label: num(n), bin: MQ.isPrime(n) ? 0 : 1 })) },
          answer: m('c.binsAnswer'), explain: m('t.divisors.ex2')
        };
      }
      if (L === 3) {
        const a = r.int(2, 12), b = r.intExcept(2, 12, [a]); const l = MQ.lcm(a, b);
        return {
          prompt: m('t.divisors.q3', { a, b }),
          widget: { type: 'input', fields: [field('a', new MQ.Q(l))] },
          diagnose: v => v.a && v.a.eq(a * b) && a * b !== l ? m('t.divisors.m.product') : (v.a && v.a.toNumber() % a === 0 && v.a.toNumber() % b === 0 ? m('t.divisors.m.notLowest') : null),
          answer: m('c.num', { x: l }), explain: m('t.divisors.ex3', { a, b, l, ma: { raw: [1, 2, 3, 4, 5, 6].map(i => a * i).join(', ') }, mb: { raw: [1, 2, 3, 4, 5, 6].map(i => b * i).join(', ') } }),
          wrong: a * b !== l ? [{ fields: { a: String(a * b) } }] : []
        };
      }
      const n = r.int(12, 60); const ds = MQ.divisors(n);
      return {
        prompt: m('t.divisors.q4', { n }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(ds.length))] },
        answer: m('c.num', { x: ds.length }), explain: m('t.divisors.ex4', { n, list: { raw: ds.join(', ') }, c: ds.length })
      };
    }
  });

  /* ---------------- smart_calc (propriétés) ---------------- */
  T.add({
    id: 'smart_calc', stage: 'no_struct', objectives: ['NO.3.3', 'NO.C10'], mt: ['MT.17', 'MT.19', 'MT.22', 'MT.79', 'MT.80', 'MT.81'],
    gen(r, L) {
      if (L === 1) {
        const a = r.int(11, 89); let c = (Math.ceil(a / 10) * 10 + r.pick([0, 10, 20])) - a + r.pick([0, 100]); if (c <= 0) c += 10; const b = r.int(13, 87);
        const tk = r.chance(0.5) ? [a, '+', b, '+', c] : [25, '*', r.int(3, 19), '*', 4];
        const val = MQ.evalExpr(tk);
        return { prompt: m('t.smart_calc.q1', { e: { expr: tk } }), widget: { type: 'input', fields: [field('a', val)] }, answer: m('c.num', { x: val }), explain: m(tk[1] === '+' ? 't.smart_calc.ex1a' : 't.smart_calc.ex1b', { e: { expr: tk }, x: val, s: (tk[1] === '+' ? tk[0] + tk[4] : 100) }) };
      }
      if (L === 2) {
        const a = r.int(2, 30), b = r.int(2, 30), c = r.int(2, 30);
        const props = [
          { k: 'w.commutativity', l: [a, '+', b], rr: [b, '+', a] },
          { k: 'w.associativity', l: ['(', a, '*', b, ')', '*', c], rr: [a, '*', '(', b, '*', c, ')'] },
          { k: 'w.distributivity', l: [a, '*', '(', b, '+', c, ')'], rr: [a, '*', b, '+', a, '*', c] }
        ];
        const pick = r.int(0, 2), P = props[pick];
        return {
          prompt: m('t.smart_calc.q2', { e: { expr: P.l.concat(['=']).concat(P.rr) } }),
          widget: { type: 'mc', options: r.shuffle(props.map((p, i) => ({ label: m(p.k), correct: i === pick }))) },
          answer: m(P.k), explain: m('t.smart_calc.ex2.' + pick)
        };
      }
      if (L === 3) {
        const k = r.int(12, 49), nearby = r.pick([99, 101, 98, 49, 51]);
        const base = Math.round(nearby / 50) * 50, diff = nearby - base;
        const val = nearby * k;
        const right = diff > 0 ? [base, '*', k, '+', diff, '*', k] : [base, '*', k, '-', -diff, '*', k];
        const w1 = diff > 0 ? [base, '*', k, '+', diff] : [base, '*', k, '-', -diff];
        const w2 = [base, '+', diff > 0 ? diff : -diff, '*', k];
        const w3 = [nearby, '*', 10, '+', k];
        return {
          prompt: m('t.smart_calc.q3', { e: E(nearby, '*', k) }),
          widget: { type: 'mc', options: r.shuffle([{ label: m('c.expr', { e: { expr: right } }), correct: true }, { label: m('c.expr', { e: { expr: w1 } }), correct: false, why: m('t.smart_calc.m.distribute') }, { label: m('c.expr', { e: { expr: w2 } }), correct: false }, { label: m('c.expr', { e: { expr: w3 } }), correct: false }]) },
          answer: m('c.expr', { e: { expr: right.concat(['=', val]) } }), explain: m('t.smart_calc.ex3', { e: { expr: right }, x: val })
        };
      }
      const a = MQ.Q.dec(r.int(1, 9) * 10 + 5, 1), b = r.pick([4, 8, 6, 12]);
      const val = a.mul(b); const ip = Math.floor(a.toNumber());
      return {
        prompt: m('t.smart_calc.q4', { e: E(a, '*', b) }),
        widget: { type: 'input', fields: [field('a', val)] },
        answer: m('c.num', { x: val }), explain: m('t.smart_calc.ex4', { e: { expr: [ip, '*', b, '+', new MQ.Q(1, 2), '*', b] }, a: ip * b, b: b / 2, x: val })
      };
    }
  });

  /* ---------------- sequence (suites) ---------------- */
  T.add({
    id: 'sequence', stage: 'no_struct', objectives: ['NO.3.3', 'NO.4.2', 'EF.3.1'], mt: ['MT.78', 'MT.76', 'MT.77', 'MT.83'],
    gen(r, L) {
      if (L === 4) {
        const a = r.int(1, 3), b = r.int(2, 4), N = r.pick([10, 12, 15, 20]);
        const stage = n => { let s = ''; const S = 14; let x = 4; const H = b + 1; for (let k = 0; k < a; k++) s += `<rect class="face2" x="${x}" y="${4 + (H - 1) * S}" width="${S}" height="${S}"/>`, x += S; for (let c = 0; c < n; c++) { for (let z = 0; z < b; z++) s += `<rect class="face1" x="${x}" y="${4 + (H - 1 - z) * S}" width="${S}" height="${S}"/>`; x += S; } return MQ.fig.svg(x + 4, H * S + 8, s, ''); };
        return {
          prompt: m('t.sequence.q4', { N }),
          figure: { htmlFig: { html: lang => [1, 2, 3].map(n => `<figure class="stage">${stage(n)}<figcaption>${MQ.t('t.sequence.stage', { n }, lang)}</figcaption></figure>`).join('') } },
          widget: { type: 'input', fields: [field('a', new MQ.Q(a + b * N))] },
          diagnose: v => v.a && v.a.eq((a + b) * N) ? m('t.sequence.m.multiply') : null,
          answer: m('c.num', { x: a + b * N }), explain: m('t.sequence.ex4', { a, b, N, x: a + b * N, s1: a + b, s2: a + 2 * b, s3: a + 3 * b }),
          wrong: [{ fields: { a: String((a + b) * N) } }]
        };
      }
      let seq = [], rule;
      if (L === 1) { const s = r.int(1, 60), k = r.int(3, 25); for (let i = 0; i < 5; i++) seq.push(s + i * k); rule = m('t.sequence.r.add', { k }); }
      else if (L === 2) { if (r.chance(0.5)) { const s = r.int(1, 6), k = r.pick([2, 3]); for (let i = 0; i < 5; i++) seq.push(s * Math.pow(k, i)); rule = m('t.sequence.r.mul', { k }); } else { const k = r.int(4, 19), s = r.int(6 * k, 9 * k + 50); for (let i = 0; i < 5; i++) seq.push(s - i * k); rule = m('t.sequence.r.sub', { k }); } }
      else { if (r.chance(0.5)) { const s = r.int(1, 20), a = r.int(4, 12), b = r.int(1, a - 1); let v = s; seq.push(v); for (let i = 1; i < 6; i++) { v = i % 2 ? v + a : v - b; seq.push(v); } rule = m('t.sequence.r.alt', { a, b }); } else { const s = r.int(1, 20); let v = s, d = r.int(1, 3); for (let i = 0; i < 5; i++) { seq.push(v); v += d; d += 1; } rule = m('t.sequence.r.grow'); } }
      const shown = seq.slice(0, -1), next = seq[seq.length - 1];
      return {
        prompt: m('t.sequence.q', { s: { list: shown.map(x => ({ html: lang => MQ.fmtNum(x, lang) })), sep: ' ; ' } }),
        widget: { type: 'input', fields: [field('a', new MQ.Q(next))] },
        answer: m('c.num', { x: next }), explain: m('t.sequence.ex', { r: rule, x: next })
      };
    }
  });

  /* ---------------- prop_table (tableaux de proportionnalité) ------------ */
  T.add({
    id: 'prop_table', stage: 'no_data', objectives: ['NO.4.2', 'NO.4.4', 'NO.C12', 'GM.2.8'], mt: ['MT.89'],
    gen(r, L) {
      const ctx = r.pick(['rolls', 'tickets', 'apples']);
      const unitP = L <= 2 ? new MQ.Q(r.int(1, 6)) : MQ.Q.dec(r.pick([35, 45, 60, 80, 120, 125, 150, 250]), 2);
      const qs = r.sample([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20], 4).sort((a, b) => a - b);
      const prices = qs.map(q => unitP.mul(q));
      const table = (hide, override) => ({ html: lang => `<table class="ptable"><tr><th>${MQ.t('t.prop_table.h.' + ctx, {}, lang)}</th>${qs.map(q => `<td>${MQ.fmtNum(q, lang)}</td>`).join('')}</tr><tr><th>${MQ.t('t.prop_table.h.price', {}, lang)}</th>${prices.map((p, i) => `<td>${hide.includes(i) ? '<span class="box">' + String.fromCharCode(97 + hide.indexOf(i)) + '</span>' : MQ.fmtNum(override && override[i] ? override[i] : p, lang, { places: 2 })}</td>`).join('')}</tr></table>` });
      if (L === 4) {
        const prop = r.chance(0.5); const over = {}; let j = 0;
        if (!prop) { j = r.int(1, 3); over[j] = prices[j].add(r.pick([new MQ.Q(1), new MQ.Q(1, 2)])); }
        return {
          prompt: m('t.prop_table.q4'), figure: { htmlFig: table([], over) },
          widget: { type: 'tf', truth: prop, reasons: r.shuffle([{ label: m('t.prop_table.r.same'), correct: prop }, { label: m('t.prop_table.r.notSame'), correct: !prop }, { label: m('t.prop_table.r.grows'), correct: false }]), wrongFb: m('t.prop_table.m.check') },
          answer: m(prop ? 'c.true' : 'c.false'), explain: prop ? m('t.prop_table.ex4yes', { u: { money: unitP } }) : m('t.prop_table.ex4no', { u: { money: unitP }, q: qs[j] })
        };
      }
      const hide = L === 1 ? [r.int(1, 3)] : r.sample([0, 1, 2, 3], 2).sort();
      return {
        prompt: m('t.prop_table.q', { c: { k: 't.prop_table.ctx.' + ctx } }), figure: { htmlFig: table(hide) },
        widget: { type: 'input', fields: hide.map((i, j) => field(String.fromCharCode(97 + j), prices[i], { unit: '€', label: { k: 'c.boxLabel', v: { b: String.fromCharCode(97 + j) } } })) },
        diagnose: v => Object.values(v).some(x => x && hide.some(i => x.eq(prices[i].add(unitP)))) ? m('t.prop_table.m.additive') : null,
        answer: m('t.prop_table.ans', { list: { list: hide.map(i => ({ money: prices[i] })), sep: ' ; ' } }), explain: m('t.prop_table.ex', { u: { money: unitP } })
      };
    }
  });

  /* ---------------- graph_read ---------------- */
  T.add({
    id: 'graph_read', stage: 'no_data', objectives: ['NO.4.3', 'NO.C13', 'GM.2.7'], mt: ['MT.91'],
    gen(r, L) {
      if (L <= 2) {
        const cats = ['football', 'swimming', 'basket', 'dance', 'cycling'];
        const vals = cats.map(() => r.int(1, 12));
        const i = r.int(0, 4); let j = r.intExcept(0, 4, [i]); if (vals[i] === vals[j]) vals[j] = vals[i] === 12 ? 11 : vals[i] + 1;
        const fig = lang => MQ.fig.barChart(cats.map(c => MQ.t('sport.' + c, {}, lang)), vals, { max: 12, step: 2, yName: MQ.t('t.graph_read.pupils', {}, lang) });
        if (L === 1) return { prompt: m('t.graph_read.q1', { s: { k: 'sport.' + cats[i] } }), figure: fig, widget: { type: 'input', fields: [field('a', new MQ.Q(vals[i]))] }, answer: m('c.num', { x: vals[i] }), explain: m('t.graph_read.ex1') };
        const d = Math.abs(vals[i] - vals[j]);
        return { prompt: m('t.graph_read.q2', { s: { k: 'sport.' + cats[i] }, t: { k: 'sport.' + cats[j] } }), figure: fig, widget: { type: 'input', fields: [field('a', new MQ.Q(d))] }, diagnose: v => v.a && v.a.eq(vals[i] + vals[j]) ? m('t.graph_read.m.sum') : null, answer: m('c.num', { x: d }), explain: m('t.graph_read.ex2', { a: Math.max(vals[i], vals[j]), b: Math.min(vals[i], vals[j]), x: d }) };
      }
      if (L === 3) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const vals = days.map(() => r.int(2, 18) * 50);
        const i = r.int(0, 5);
        const inc = vals[i + 1] - vals[i];
        const fig = lang => MQ.fig.lineChart(days.map(d => MQ.t('day.short.' + d, {}, lang)), vals, { max: 900, step: 100, yName: MQ.t('t.graph_read.visitors', {}, lang) });
        const max = Math.max(...vals);
        if (r.chance(0.5) && vals.filter(v => v === max).length === 1) {
          const di = vals.indexOf(max);
          return { prompt: m('t.graph_read.q3max'), figure: fig, widget: { type: 'mc', options: days.map((d, k) => ({ label: m('day.' + d), correct: k === di })) }, answer: m('day.' + days[di]), explain: m('t.graph_read.ex3max') };
        }
        return { prompt: m('t.graph_read.q3', { a: { k: 'day.' + days[i] }, b: { k: 'day.' + days[i + 1] } }), figure: fig, widget: { type: 'input', fields: [field('a', new MQ.Q(Math.abs(inc)))] }, answer: m('c.num', { x: Math.abs(inc) }), explain: m(inc >= 0 ? 't.graph_read.ex3up' : 't.graph_read.ex3down', { x: Math.abs(inc), a: vals[i], b: vals[i + 1] }) };
      }
      // pie chart with simple fractions
      const sets = [[[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 4], [1, 8], [1, 8]], [[1, 4], [1, 4], [1, 4], [1, 4]], [[3, 4], [1, 8], [1, 8]], [[1, 2], [1, 2]], [[1, 4], [1, 2], [1, 8], [1, 8]]];
      const parts = r.pick(sets).map(([n, d]) => new MQ.Q(n, d));
      const total = r.pick([24, 32, 40, 48, 80, 160]);
      const i = r.int(0, parts.length - 1);
      const ans = parts[i].mul(total);
      return {
        prompt: m('t.graph_read.q4', { t: total, l: String.fromCharCode(65 + i) }), figure: MQ.fig.pieChart(parts.map(q => ({ q }))),
        widget: { type: 'input', fields: [field('a', ans)] },
        answer: m('c.num', { x: ans }), explain: m('t.graph_read.ex4', { f: fr(parts[i].n, parts[i].d), t: total, x: ans, l: String.fromCharCode(65 + i) })
      };
    }
  });

  /* ---------------- table_read (horaire de bus) ---------------- */
  T.add({
    id: 'table_read', stage: 'no_data', objectives: ['NO.4.4', 'NO.C12', 'RP.3.2', 'GM.2.7'], mt: ['MT.89'],
    gen(r, L) {
      const stops = r.pick([['Esch-sur-Alzette', 'Belval', 'Bettembourg', 'Luxembourg, Gare'], ['Ettelbruck', 'Mersch', 'Lorentzweiler', 'Luxembourg, Gare'], ['Remich', 'Mondorf-les-Bains', 'Hesperange', 'Luxembourg, Gare']]);
      const first = r.int(6 * 60, 15 * 60) - (r.int(0, 3) * 5), every = r.pick([15, 20, 30]);
      const gaps = [0, r.int(4, 9), r.int(8, 14), r.int(10, 18)]; const off = gaps.map((g, k) => gaps.slice(0, k + 1).reduce((a, b) => a + b, 0));
      const buses = [0, 1, 2, 3].map(b => off.map(o => first + b * every + o));
      const hideBus = L === 4 ? 3 : -1;
      const tbl = { html: lang => `<table class="timetable"><tr><th>${MQ.t('t.table_read.stop', {}, lang)}</th>${buses.map((_, b) => `<th>${MQ.t('t.table_read.bus', { n: b + 1 }, lang)}</th>`).join('')}</tr>${stops.map((s, k) => `<tr><th>${s}</th>${buses.map((bt, b) => `<td>${b === hideBus && k === 0 ? '<span class="box">?</span>' : MQ.fmtTime(bt[k])}</td>`).join('')}</tr>`).join('')}</table>` };
      const b = r.int(0, 2);
      if (L === 1) { const k = r.int(1, 3); return { prompt: m('t.table_read.q1', { n: b + 1, s: stops[k] }), figure: { htmlFig: tbl }, widget: { type: 'input', fields: [field('a', buses[b][k], { kind: 'time' })] }, answer: m('c.time', { t: { time: buses[b][k] } }), explain: m('t.table_read.ex1') }; }
      if (L === 2) { const dur = buses[b][3] - buses[b][0]; return { prompt: m('t.table_read.q2', { n: b + 1, a: stops[0], b: stops[3] }), figure: { htmlFig: tbl }, widget: { type: 'input', fields: [field('a', new MQ.Q(dur), { unit: 'min' })] }, answer: m('c.min', { x: dur }), explain: m('t.table_read.ex2', { a: { time: buses[b][0] }, b: { time: buses[b][3] }, x: dur }) }; }
      if (L === 3) {
        const target = buses[2][3] + r.int(1, every - 1);
        const ok = buses.filter(bt => bt[3] <= target).length - 1;
        return { prompt: m('t.table_read.q3', { a: stops[0], b: stops[3], t: { time: target } }), figure: { htmlFig: tbl }, widget: { type: 'mc', options: buses.map((_, k) => ({ label: m('t.table_read.bus', { n: k + 1 }), correct: k === ok, why: k > ok ? m('t.table_read.m.late') : null })) }, answer: m('t.table_read.bus', { n: ok + 1 }), explain: m('t.table_read.ex3', { t: { time: buses[ok][3] } }) };
      }
      return { prompt: m('t.table_read.q4', { e: every }), figure: { htmlFig: tbl }, widget: { type: 'input', fields: [field('a', buses[3][0], { kind: 'time' })] }, answer: m('c.time', { t: { time: buses[3][0] } }), explain: m('t.table_read.ex4', { e: every, a: { time: buses[2][0] }, b: { time: buses[3][0] } }) };
    }
  });

  /* ---------------- expr_vars: expressions with letters (MathemaTIC MT.82) ---------------- */
  T.add({
    id: 'expr_vars', stage: 'no_check', objectives: ['NO.2.6', 'NO.2.5'], mt: ['MT.82'],
    gen(r, L) {
      const vars = { a: r.int(2, 9), b: r.int(2, 12), c: r.int(2, 5) };
      const forms = L === 1 ? [['a', '+', 9], ['a', '*', 4], [20, '-', 'a']]
        : L === 2 ? [[3, '*', 'a', '+', 'b'], ['a', '*', 'b', '-', 'c'], ['b', '+', 2, '*', 'a']]
          : [['(', 'a', '+', 'b', ')', '*', 'c'], ['a', '*', 'b', '-', 'b', '*', 'c'], ['(', 'b', '-', 'a', ')', '*', 'c', '+', 'a']];
      let tk = r.pick(forms);
      if (L === 1) tk = tk.map(x => typeof x === 'number' ? (x === 20 ? r.int(12, 30) : r.int(2, 9)) : x);
      if (L === 2) tk = tk.map(x => typeof x === 'number' ? r.int(2, 6) : x);
      const used = [...new Set(tk.filter(x => /^[abc]$/.test(x)))];
      const sub = tk.map(x => /^[abc]$/.test(x) ? vars[x] : x);
      const show = (t, lang) => MQ.exprToString(t.map(x => /^[abc]$/.test(x) ? `<i class="var">${x}</i>` : x), lang);
      const given = { html: lang => used.map(v => `<i class="var">${v}</i> = ${vars[v]}`).join(', ') };
      if (L === 4) {
        // c × a + b = t : find one letter
        const c = r.int(2, 6), a = r.int(2, 12), b = r.int(1, 20), t = c * a + b; const findB = r.chance(0.5);
        const eq = { html: lang => show([c, '*', 'a', '+', 'b'], lang) + ' = ' + t };
        const known = { html: findB ? `<i class="var">a</i> = ${a}` : `<i class="var">b</i> = ${b}` };
        const steps = { html: lang => findB ? `${c} ${MQ.i18n.mulSign} ${a} = ${c * a}; ${t} − ${c * a} = ${b}` : `${t} − ${b} = ${c * a}; ${c * a} ${MQ.i18n.divSign} ${c} = ${a}` };
        const ans = findB ? b : a;
        return {
          prompt: m('t.expr_vars.q4', { e: eq, k: known, x: { html: findB ? '<i class="var">b</i>' : '<i class="var">a</i>' } }),
          widget: { type: 'input', fields: [field('a', new MQ.Q(ans))] },
          diagnose: v => v.a && v.a.eq(t) ? m('t.expr_vars.m.total') : (v.a && findB && v.a.eq(t + c * a) ? m('t.expr_vars.m.reverse') : null),
          answer: m('c.num', { x: ans }), explain: m('t.expr_vars.ex4', { s: steps, x: { html: findB ? '<i class="var">b</i>' : '<i class="var">a</i>' }, y: ans }),
          wrong: [{ fields: { a: String(t) } }]
        };
      }
      const val = MQ.evalExpr(sub);
      if (val.n < 0 || !val.isInt()) return this.gen(r, L);
      // left-to-right misconception
      let lr = null; try { const flat = sub.filter(x => x !== '(' && x !== ')'); let acc = MQ.Q.of(flat[0]); for (let i = 1; i < flat.length; i += 2) { const o = flat[i], y = MQ.Q.of(flat[i + 1]); acc = o === '+' ? acc.add(y) : o === '-' ? acc.sub(y) : o === '*' ? acc.mul(y) : acc.div(y); } lr = acc; } catch (x) { lr = null; }
      return {
        prompt: m('t.expr_vars.q', { v: given, e: { html: lang => show(tk, lang) } }),
        widget: { type: 'input', fields: [field('a', val)] },
        diagnose: v => v.a && lr && !lr.eq(val) && v.a.eq(lr) ? m('t.expr_vars.m.order') : null,
        answer: m('c.num', { x: val }), explain: m('t.expr_vars.ex', { s: { html: lang => MQ.exprToString(sub, lang) }, x: val }),
        wrong: lr && !lr.eq(val) && lr.n >= 0 ? [{ fields: { a: lr.toDecimalString() } }] : []
      };
    }
  });

  /* ---------------- paren_place: where do the brackets go? + nested brackets ---------------- */
  // All placements of ONE pair of brackets around 2 or more neighbouring numbers (plus "no brackets").
  const placements = (nums, ops) => {
    const plain = []; nums.forEach((x, i) => { plain.push(x); if (i < ops.length) plain.push(ops[i]); });
    const out = [{ tk: plain, none: true }];
    for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) {
      if (i === 0 && j === nums.length - 1) continue; // brackets around everything change nothing
      const tk = []; nums.forEach((x, k) => { if (k === i) tk.push('('); tk.push(x); if (k === j) tk.push(')'); if (k < ops.length) tk.push(ops[k]); });
      out.push({ tk });
    }
    return out.map(p => { try { const v = MQ.evalExpr(p.tk); return v.n >= 0 && v.isInt() ? Object.assign(p, { v }) : null; } catch (e) { return null; } }).filter(Boolean);
  };
  // innermost-first reduction, for the worked solution of nested brackets
  const reduceSteps = tk => {
    const steps = [tk.slice()]; let cur = tk.slice();
    while (cur.includes('(')) {
      let open = -1, close = -1; for (let i = 0; i < cur.length; i++) { if (cur[i] === '(') open = i; if (cur[i] === ')') { close = i; break; } }
      const val = MQ.evalExpr(cur.slice(open + 1, close)); cur = cur.slice(0, open).concat([val], cur.slice(close + 1)); steps.push(cur.slice());
    }
    if (cur.length > 1) steps.push([MQ.evalExpr(cur)]);
    return steps;
  };
  T.add({
    id: 'paren_place', stage: 'no_check', objectives: ['NO.2.6', 'GC.2'], mt: ['MT.71', 'MT.72'],
    gen(r, L) {
      const expr = tk => ({ k: 'c.expr', v: { e: { expr: tk } } });
      if (L === 4) {
        // nested brackets: calculate
        const forms = [
          () => { const c = r.int(2, 9), d = r.int(2, 9), b = c + d + r.int(2, 30); return [r.int(2, 9), '*', '(', b, '-', '(', c, '+', d, ')', ')']; },
          () => { const d = r.int(2, 9), c = d + r.int(2, 9), b = c - d + r.int(5, 40); return [b + r.int(10, 60), '-', '(', b, '-', '(', c, '-', d, ')', ')']; },
          () => { const e = r.int(2, 6), d = e + r.int(1, 6); return ['(', r.int(2, 20), '+', r.int(2, 20), ')', '*', '(', r.int(2, 9), '+', '(', d, '-', e, ')', ')']; }
        ];
        let tk, val; do { tk = r.pick(forms)(); try { val = MQ.evalExpr(tk); } catch (e) { val = null; } } while (!val || val.n < 0 || !val.isInt());
        let flat = null; try { flat = MQ.evalExpr(tk.filter(t => t !== '(' && t !== ')')); } catch (e) { flat = null; }
        const steps = reduceSteps(tk);
        return {
          prompt: m('c.calc', { e: { expr: tk } }), hintVars: {},
          widget: { type: 'input', fields: [field('a', val)] },
          diagnose: v => v.a && flat && !flat.eq(val) && v.a.eq(flat) ? m('t.paren_place.m.ignored') : null,
          answer: m('c.num', { x: val }),
          explain: m('t.paren_place.ex4', { s: { html: lang => steps.map(s => MQ.exprToString(s, lang)).join(' = ') } }),
          wrong: flat && !flat.eq(val) && flat.n >= 0 && flat.isInt() ? [{ fields: { a: String(flat.n) } }] : []
        };
      }
      const n = L === 1 ? 3 : 4;
      const opsPool = L === 1 ? [['+', '*'], ['-', '*'], ['*', '+']] : null;
      let nums, ops, pl, tries = 0;
      do {
        ops = L === 1 ? r.pick(opsPool) : Array.from({ length: 3 }, (_, i) => i === 0 ? r.pick(['*', '+', '-']) : r.pick(L === 3 ? ['+', '-', '*', '/'] : ['+', '-', '*']));
        if (!ops.some(o => o === '*' || o === '/')) ops[r.int(0, ops.length - 1)] = '*';
        nums = Array.from({ length: n }, () => r.int(2, L === 1 ? 12 : 9));
        if (ops[0] === '-') nums[0] += 20;
        pl = placements(nums, ops);
        // keep one placement per value
        const seen = new Set(); pl = pl.filter(p => { const k = p.v.toString(); if (seen.has(k)) return false; seen.add(k); return true; });
      } while ((pl.length < 2 || (L >= 2 && pl.length < 3) || !pl.some(p => !p.none)) && ++tries < 200);
      const plain = pl.find(p => p.none) || { v: MQ.evalExpr(placements(nums, ops)[0].tk) };
      let target;
      if (L === 3) target = pl.reduce((a, b) => (b.v.gt(a.v) ? b : a));
      else target = r.pick(pl.filter(p => !p.none));
      const opts = [target].concat(r.shuffle(pl.filter(p => p !== target)).slice(0, 3));
      const bare = []; nums.forEach((x, i) => { bare.push(x); if (i < ops.length) bare.push(ops[i]); });
      const options = r.shuffle(opts.map(p => ({ label: expr(p.tk), correct: p === target, none: !!p.none,
        why: p === target ? null : p.none ? m('t.paren_place.m.none', { y: p.v }) : m(L === 3 ? 't.paren_place.m.smaller' : 't.paren_place.m.other', { y: p.v, x: target.v }) })));
      return {
        prompt: m(L === 3 ? 't.paren_place.q3' : 't.paren_place.q', { e: { expr: bare }, x: target.v }), hintVars: {},
        widget: { type: 'mc', options },
        answer: expr(target.tk),
        explain: L === 3
          ? m('t.paren_place.ex3', { l: { html: lang => opts.slice().sort((a, b) => b.v.cmp(a.v)).map(p => MQ.exprToString(p.tk, lang) + ' = ' + MQ.fmtNum(p.v, lang)).join('; ') }, x: target.v })
          : m('t.paren_place.ex', { e: { expr: target.tk }, x: target.v, f: { expr: bare }, y: plain.v }),
        wrong: options.some(o => o.none && !o.correct) ? [{ choice: options.findIndex(o => o.none && !o.correct) }] : []
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
