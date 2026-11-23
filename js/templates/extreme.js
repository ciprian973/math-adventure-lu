/* =====================================================================
 * Templates — level 5 "Extreme": hard problems that need only cycle 4
 * knowledge, but patience, a drawing, trying small cases and checking.
 * One template per topic (id x_<stage>, levels: [5]); each has two or
 * three kinds of problem. Wherever possible the answer is found by
 * trying every case (enumeration), not by a formula, so the key is
 * right by construction. Text keys: t.x_<stage>.<kind>.q/h1/h2/h3/ex
 * (+ .m1/.m2 for misconception feedback).
 * Level 5 opens for a topic when it has 3 stars (game.js extremeOpen).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const T = MQ.T, { m, field, names } = T.h;
  const F = MQ.fig, Qn = (a, b) => b == null ? MQ.Q.of(a) : new MQ.Q(a, b);
  const U = (val, u) => ({ unit: u, val: MQ.Q.of(val) });
  const EUR = v => ({ money: MQ.Q.of(v) });
  const TM = mins => ({ time: mins });
  const raw = s => ({ raw: String(s) });
  const fr = (n, d) => ({ frac: new MQ.Q(n, d), n, d });
  const frq = q => fr(q.n, q.d);
  const gcd = MQ.gcd;
  const BOX = '<span class="box" aria-label="?">□</span>';

  /* register one extreme template for a stage */
  function X(stage, kinds) {
    const id = 'x_' + stage;
    // curriculum objective: the one most used by the ordinary exercises of the topic
    const cnt = {}, mts = {}; MQ.T.forStage(stage).forEach(t => { (t.objectives || []).forEach(o => cnt[o] = (cnt[o] || 0) + 1); (t.mt || []).forEach(o => mts[o] = (mts[o] || 0) + 1); });
    const top = o => Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 1);
    T.add({
      id, stage, levels: [5], objectives: top(cnt), mt: top(mts),
      kinds: Object.keys(kinds),
      gen(r) {
        const k = r.pick(Object.keys(kinds));
        const K = (s, v) => m(`t.${id}.${k}.${s}`, v);
        const ex = kinds[k](r, K); ex.kind = k; return ex;
      }
    });
  }
  /* the usual shape: prompt, 3 hints and the explanation share the vars */
  function pack(K, v, widget, answer, more = {}) {
    return Object.assign({ prompt: K('q', v), hints: [K('h1', v), K('h2', v), K('h3', v)], explain: K('ex', v), widget, answer }, more);
  }
  const one = (expect, o) => ({ type: 'input', fields: [field('a', expect, o || {})] });
  const ans = x => m('c.num', { x });
  const diag = (pairs) => vals => { const a = vals && vals.a; if (!a) return null; for (const [w, msg] of pairs) if (w != null && a.eq(MQ.Q.of(w))) return msg; return null; };
  const wrongs = (xs, right) => xs.filter(w => w != null && !MQ.Q.of(w).eq(MQ.Q.of(right))).map(w => ({ fields: { a: MQ.Q.of(w).toString().replace('/', '/') } }));
  const wrongDec = (xs, right) => xs.filter(w => w != null && !MQ.Q.of(w).eq(MQ.Q.of(right))).map(w => ({ fields: { a: decStr(MQ.Q.of(w)) } }));
  const decStr = q => { if (q.isInt()) return String(q.n); const p = q.decimalPlaces(); return p >= 0 ? (q.n / q.d).toFixed(p) : q.n + '/' + q.d; };

  /* a plain grid of rows × cols squares */
  function gridFig(cols, rows, { label = '', marks = [] } = {}) {
    const c = 38, ox = 22, oy = 22; let s = '';   // margins so that the letters S and F are never cut off
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += `<rect class="cell sq" x="${ox + i * c}" y="${oy + j * c}" width="${c}" height="${c}"/>`;
    marks.forEach(mk => s += `<circle class="pt" cx="${ox + mk.x * c}" cy="${oy + (rows - mk.y) * c}" r="7"/><text class="tx b" x="${ox + mk.x * c + (mk.dx || 10)}" y="${oy + (rows - mk.y) * c + (mk.dy || -10)}" text-anchor="middle">${mk.t}</text>`);
    return F.svg(cols * c + 2 * ox + 14, rows * c + 2 * oy + 18, s, label, 'grid');
  }

  /* ================================================================= */
  /*  NUMBERS AND OPERATIONS                                            */
  /* ================================================================= */
  X('no_big', {
    /* the largest number with different digits whose digit sum is S */
    maxdig(r, K) {
      const S = r.int(16, 40); let best = null;
      for (let mask = 1; mask < 1024; mask++) {
        const ds = []; let sum = 0; for (let d = 9; d >= 0; d--) if (mask & (1 << d)) { ds.push(d); sum += d; }
        if (sum !== S || ds[0] === 0) continue;
        const str = ds.join(''); if (!best || str.length > best.length || (str.length === best.length && str > best)) best = str;
      }
      const k = best.length, t = k * (k - 1) / 2, x = +best;
      const g = []; let rest = S; for (let d = 9; d >= 0 && rest > 0; d--) if (d <= rest) { g.push(d); rest -= d; }
      const greedy = rest === 0 ? +g.join('') : null;
      const v = { s: S, k, km: k - 1, t, dd: S - t, dg: raw(best.split('').join(', ')), x };
      return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([greedy], x), diagnose: diag([[greedy, K('m1', { g: greedy })]]),
        selfCheck: () => new Set(best).size === best.length && best.split('').reduce((a, c) => a + +c, 0) === S });
    },
    /* how many three-digit numbers have digit sum S */
    count3(r, K) {
      const S = r.int(5, 24); const per = []; let x = 0, x0 = 0;
      for (let a = 0; a <= 9; a++) { let c = 0; for (let b = 0; b <= 9; b++) for (let u = 0; u <= 9; u++) if (a + b + u === S) c++; x0 += c; if (a >= 1 && c) { per.push(a + ' → ' + c); x += c; } }
      const v = { s: S, l: raw(per.join(' ; ')), x };
      return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([x0], x), diagnose: diag([[x0 !== x ? x0 : null, K('m1', v)]]) });
    }
  });

  X('no_dec', {
    /* moving the decimal comma one place to the right adds D */
    shift(r, K) {
      const places = r.pick([1, 2]); let xi; do { xi = places === 1 ? r.int(12, 999) : r.int(105, 9999); } while (xi % 10 === 0);
      const x = MQ.Q.dec(xi, places), d = x.mul(9), y = x.mul(10);
      const v = { d, x, y };
      return pack(K, v, one(x), ans(x), { wrong: wrongDec([d.div(10), d], x), diagnose: diag([[d.div(10), K('m1', v)], [d, K('m1', v)]]) });
    },
    /* multiplied by w instead of dividing by dv */
    mixup(r, K) {
      const w = r.pick([10, 100]), dv = r.pick([10, 100]); let n; do { n = r.int(105, 9999); } while (n % 10 === 0);
      const R = n * w, x = Qn(n, dv), n0 = n;
      const v = { w, dv, r: R, n: n0, x };
      return pack(K, v, one(x), ans(x), { wrong: wrongDec([Qn(R, dv), Qn(n0)], x), diagnose: diag([[Qn(R, dv), K('m1', v)], [Qn(n0), K('m2', v)]]) });
    }
  });

  const FRACS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6]];
  X('no_frac', {
    /* spent a of the money, then b of the rest, r euros left: how much at the start */
    backwards(r, K) {
      for (;;) {
        const [p1, q1] = r.pick(FRACS), [p2, q2] = r.pick(FRACS), k = r.int(1, 12), Tt = q1 * q2 * k;
        if (Tt < 30 || Tt > 600) continue;
        const mid = Tt / q1 * (q1 - p1), left = mid / q2 * (q2 - p2);
        const v = { n: names(r, 1)[0], a: fr(p1, q1), b: fr(p2, q2), r: left, ca: fr(q1 - p1, q1), cb: fr(q2 - p2, q2), mm: mid, x: Tt };
        const rest = Qn(1).sub(Qn(p1, q1)).sub(Qn(p2, q2)); const w1 = rest.n > 0 ? Qn(left).div(rest) : null;
        return pack(K, v, one(Qn(Tt), { unit: '€' }), m('c.eur', { x: EUR(Tt) }), { wrong: wrongs([w1 && w1.isInt() ? w1 : null], Tt), diagnose: diag([[w1, K('m1', v)]]) });
      }
    },
    /* a chocolate: three children eat a fraction of what is left each */
    eaten(r, K) {
      for (;;) {
        const fs = [r.pick(FRACS), r.pick(FRACS), r.pick(FRACS)]; const L = fs.reduce((a, [, q]) => a * q, 1);
        if (L > 120) continue;
        const r1 = L - L / fs[0][1] * fs[0][0], b1 = r1 / fs[1][1] * fs[1][0], r2 = r1 - b1, c1 = r2 / fs[2][1] * fs[2][0], r3 = r2 - c1;
        if (r3 <= 0) continue;
        const x = Qn(r3, L); const [na, nb, nc] = names(r, 3);
        const naive = Qn(1).sub(Qn(fs[0][0], fs[0][1])).sub(Qn(fs[1][0], fs[1][1])).sub(Qn(fs[2][0], fs[2][1]));
        const v = { na, nb, nc, a: fr(...fs[0]), b: fr(...fs[1]), c: fr(...fs[2]), l: L, a1: L - r1, r1, b1, r2, c1, r3, x: frq(x) };
        return pack(K, v, one(x, { form: 'fraction' }), ans(frq(x)), { wrong: naive.n > 0 && !naive.eq(x) ? [{ fields: { a: naive.n + '/' + naive.d } }] : [], diagnose: diag([[naive.n > 0 ? naive : null, K('m1', v)]]) });
      }
    }
  });

  X('no_equiv', {
    /* how many fractions n/D lie strictly between a/b and c/d */
    between(r, K) {
      for (;;) {
        const [a, b] = r.pick(FRACS), [c, d] = r.pick(FRACS);
        if (!(a * d < c * b)) continue;
        const D = r.int(10, 40); if (D === b || D === d) continue;
        let lo = null, hi = null, x = 0; for (let n = 1; n < D; n++) if (n * b > a * D && n * d < c * D) { x++; if (lo == null) lo = n; hi = n; }
        if (x < 2 || x > 14) continue;
        const e = (a * D % b === 0 ? 1 : 0) + (c * D % d === 0 ? 1 : 0);
        const v = { f1: fr(a, b), f2: fr(c, d), dd: D, a, b, c, d, p1: a * D, p2: c * D, lo, hi, x };
        return pack(K, v, one(Qn(x)), ans(x), { wrong: e ? wrongs([x + e], x) : [], diagnose: diag([[e ? x + e : null, K('m1', v)]]) });
      }
    },
    /* the fraction equal to p/q whose numerator + denominator is S */
    sum(r, K) {
      const [p, q] = r.pick(FRACS.concat([[2, 7], [3, 7], [3, 8], [5, 8], [2, 9], [4, 9]])), k = r.int(3, 12), S = (p + q) * k;
      const v = { f: fr(p, q), p, q, pq: p + q, s: S, k, n: p * k, d: q * k, x: fr(p * k, q * k) };
      // checked by hand: an equal fraction whose numerator + denominator is not S gets its own message,
      // without telling which denominator is wanted (that would give the answer away)
      const w = one(Qn(p, q), { form: 'fraction' });
      w.custom = (resp, lang) => { const a = MQ.parseAnswer((resp.fields || {}).a, lang);
        if (!a.ok) return { correct: false, fb: m('fb.notNumber'), formal: true };
        if (!a.value.eq(Qn(p, q))) return { correct: false, fb: null };
        if (a.form !== 'fraction' || a.num == null) return { correct: false, fb: m('fb.wantFraction'), formal: true };
        return a.num + a.den === S ? { correct: true } : { correct: false, fb: K('m2', v) }; };
      w.canonical = () => ({ fields: { a: (p * k) + '/' + (q * k) } });
      return pack(K, v, w, ans(fr(p * k, q * k)), { wrong: [{ fields: { a: p + '/' + q } }, { fields: { a: (2 * p) + '/' + (2 * q) } }] });
    }
  });

  X('no_calc', {
    /* an addition or multiplication with hidden digits; exactly one way to fill them */
    digits(r, K) {
      for (let guard = 0; ; guard++) {
        const op = r.pick(['+', '+', '*']);
        let a, b; if (op === '+') { a = r.int(1000, 8999); b = r.int(1000, 9999 - a); } else { a = r.int(102, 999); b = r.int(3, 9); }
        const c = op === '+' ? a + b : a * b;
        const parts = [String(a), String(b), String(c)];
        const slots = []; parts.forEach((s, pi) => { for (let i = 0; i < s.length; i++) if (!(op === '*' && pi === 1)) slots.push([pi, i]); });
        const h = op === '+' ? r.pick([3, 4]) : 3; const hid = r.sample(slots, h);
        const ask = op === '+' ? 1 : 0;                                   // the number asked for
        if (!hid.some(([pi]) => pi === ask)) continue;
        // try every way to fill the boxes
        let sols = 0, sol = null;
        for (let f = 0; f < 10 ** h; f++) {
          const ps = parts.map(s => s.split('')); let t = f, okLead = true;
          hid.forEach(([pi, i]) => { const dgt = t % 10; t = Math.floor(t / 10); ps[pi][i] = String(dgt); if (i === 0 && dgt === 0) okLead = false; });
          if (!okLead) continue;
          const [A, B, C] = ps.map(x => +x.join(''));
          if ((op === '+' ? A + B : A * B) === C) { sols++; sol = [A, B, C]; if (sols > 1) break; }
        }
        if (sols !== 1) continue;
        const show = parts.map((s, pi) => s.split('').map((ch, i) => hid.some(([p, j]) => p === pi && j === i) ? BOX : ch).join(''));
        const e = { html: () => `<span class="xcalc">${show[0]} ${op === '+' ? '+' : MQ.i18n.mulSign} ${show[1]} = ${show[2]}</span>` };
        const x = sol[ask];
        const v = { e, full: { k: 'c.calcLine', v: { e: { expr: [sol[0], op, sol[1]] }, x: sol[2] } }, x };
        return Object.assign(pack(K, v, one(Qn(x)), ans(x)), { prompt: K(op === '+' ? 'q' : 'qm', v), selfCheck: () => (op === '+' ? sol[0] + sol[1] : sol[0] * sol[1]) === sol[2] });
      }
    },
    /* five digits, each once: the largest product of a 3-digit and a 2-digit number */
    maxprod(r, K) {
      for (;;) {
        const ds = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5).sort((p, q) => q - p);
        let best = -1, ba = 0, bb = 0;
        const perm = (arr, pre) => { if (!arr.length) { const A = pre[0] * 100 + pre[1] * 10 + pre[2], B = pre[3] * 10 + pre[4]; if (A * B > best) { best = A * B; ba = A; bb = B; } return; } arr.forEach((d, i) => perm(arr.slice(0, i).concat(arr.slice(i + 1)), pre.concat(d))); };
        perm(ds, []);
        const gA = ds[0] * 100 + ds[1] * 10 + ds[2], gB = ds[3] * 10 + ds[4], g = gA * gB;
        if (g === best) continue;
        const v = { l: raw(ds.slice().sort((p, q) => p - q).join(', ')), a: ba, b: bb, x: best, ga: gA, gb: gB, g };
        return pack(K, v, one(Qn(best)), ans(best), { wrong: wrongs([g], best), diagnose: diag([[g, K('m1', v)]]) });
      }
    }
  });

  /* evaluate a little tree; null if a step goes below zero */
  function evalTree(t) {
    if (typeof t === 'number') return t;
    const a = evalTree(t[1]), b = evalTree(t[2]); if (a == null || b == null) return null;
    const v = t[0] === '+' ? a + b : t[0] === '-' ? a - b : a * b; return v < 0 ? null : v;
  }
  function treeTokens(t, top) {
    if (typeof t === 'number') return [t];
    const inner = treeTokens(t[1]).concat([t[0]], treeTokens(t[2]));
    return top ? inner : ['('].concat(inner, [')']);
  }
  X('no_ops', {
    /* put brackets to get the largest result */
    brackets(r, K) {
      for (;;) {
        const n = [r.int(2, 9), r.int(2, 9), r.int(2, 9), r.int(2, 9)];
        const o = r.shuffle(['+', '*', r.pick(['+', '-', '*'])]);
        if (!o.includes('+') || !o.includes('*')) continue;
        const [a, b, c, d] = n, [o1, o2, o3] = o;
        const trees = [[o3, [o2, [o1, a, b], c], d], [o3, [o1, a, [o2, b, c]], d], [o2, [o1, a, b], [o3, c, d]], [o1, a, [o3, [o2, b, c], d]], [o1, a, [o2, b, [o3, c, d]]]];
        const plain = [a, o1, b, o2, c, o3, d], v0 = MQ.evalExpr(plain);
        if (v0.n < 0) continue;
        let best = null, bt = null; trees.forEach(t => { const val = evalTree(t); if (val != null && (best == null || val > best)) { best = val; bt = t; } });
        if (best == null || best <= v0.toNumber()) continue;
        const v = { e: { expr: plain }, v0, best: { expr: treeTokens(bt, true) }, x: best };
        return pack(K, v, one(Qn(best)), ans(best), { wrong: wrongs([v0], best), diagnose: diag([[v0, K('m1', v)]]), selfCheck: () => MQ.evalExpr(treeTokens(bt, true)).eq(Qn(best)) });
      }
    },
    /* think of a number: × a, + b, : c, − d gives R; find the number */
    reverse(r, K) {
      for (;;) {
        const x = r.int(5, 60), a = r.int(2, 9), c = r.int(2, 6);
        const bs = []; for (let b = 1; b <= 30; b++) if ((a * x + b) % c === 0) bs.push(b);
        if (!bs.length) continue; const b = r.pick(bs), y = (a * x + b) / c; if (y < 3) continue;
        const d = r.int(1, y - 1), R = y - d;
        const v = { a, b, c, d, r: R, s1: R + d, s2: (R + d) * c, s3: (R + d) * c - b, x };
        const w = (R - d) * c; const w1 = (w - b) % a === 0 && w > b ? (w - b) / a : null;
        return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([w1], x) });
      }
    }
  });

  X('no_check', {
    /* which result can be right, without doing the whole multiplication */
    plaus(r, K) {
      for (;;) {
        const a = 9 * r.int(12, 111), b = r.int(13, 98), P = a * b, len = String(P).length;
        let B = P + 9; if (String(B).length !== len) B = P - 9;
        const k = r.int(1, 8), A = P + 10 * k; if (String(A).length !== len) continue;
        const C = P + 9 * 10 ** len;
        const sum = n => String(n).split('').reduce((s, c) => s + +c, 0);
        if (sum(A) % 9 === 0 || sum(B) % 9 !== 0 || (B % 10) === (P % 10) || (C % 10) !== (P % 10)) continue;
        const ar = Math.round(a / 100) * 100 || 100, br = Math.round(b / 10) * 10;
        const v = { a, b, la: a % 10, lb: b % 10, ld: (a * b) % 10, ar, br, est: ar * br, sa: sum(a), x: P, w1: B, w2: C, w3: A };
        const opts = [{ msg: ans(P), correct: true }, { msg: ans(B), why: K('wl', v) }, { msg: ans(C), why: K('we', v) }, { msg: ans(A), why: K('w9', Object.assign({ sx: sum(A) }, v)) }];
        return pack(K, v, { type: 'mc', options: r.shuffle(opts.map(o => ({ label: o.msg, correct: !!o.correct, why: o.why || null }))) }, ans(P));
      }
    },
    /* a long calculation with brackets: order of operations */
    nested(r, K) {
      for (;;) {
        const D = r.int(2, 6), E = r.int(2, 6), e1 = r.int(1, 6), C = D * E + e1, B = r.int(2, 9), A = B * e1 + r.int(5, 60);
        const H = r.int(2, 5), I = r.int(2, 5), G = r.int(1, 9), den = r.int(2, 9), J = G + H * I - den; if (J < 1) continue;
        const q = r.int(2, 12), Fv = den * q, x = A - B * e1 + q;
        const tk = [A, '-', B, '*', '(', C, '-', D, '*', E, ')', '+', Fv, '/', '(', G, '+', H, '*', I, '-', J, ')'];
        if (!MQ.evalExpr(tk).eq(Qn(x))) continue;
        // the same, but always from left to right (ignoring that × and : go first)
        const l2r = (() => { const p1 = (C - D) * E, p2 = (G + H) * I - J; if (p1 < 0 || p2 <= 0) return null; const s = (((A - B) * p1) + Fv); if (A - B < 0 || s % p2) return null; return s / p2; })();
        const v = { t: { expr: tk }, a: A, b: B, c: C, d: D, ee: E, g: G, hh: H, ii: I, j: J, f: Fv, p1: e1, p2: den, bp: B * e1, q, x };
        return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([l2r], x), diagnose: diag([[l2r != null && l2r !== x ? l2r : null, K('m1', v)]]) });
      }
    }
  });

  X('no_struct', {
    /* the smallest number with given remainders */
    remainders(r, K) {
      for (;;) {
        const nm = r.pick([2, 3, 3]); const ms = r.sample([3, 4, 5, 6, 7, 8, 9], nm).sort((p, q) => p - q);
        const rs = ms.map(mo => r.int(1, mo - 1));
        let x = null; for (let n = 1; n <= 600; n++) if (ms.every((mo, i) => n % mo === rs[i])) { x = n; break; }
        if (x == null || x < 12) continue;
        const v = { m1: ms[0], r1: rs[0], m2: ms[1], r2: rs[1], m3: ms[2], r3: rs[2], x,
          chk: { list: ms.map(mo => ({ k: 'c.divrest', v: { a: x, b: mo, q: Math.floor(x / mo), r: x % mo } })), sep: ' ; ' } };
        return Object.assign(pack(K, v, one(Qn(x)), ans(x)), { prompt: K(nm === 2 ? 'q2' : 'q', v) });
      }
    },
    /* how many numbers up to N are divisible by a or by b */
    orcount(r, K) {
      for (;;) {
        const a = r.int(2, 9), b = r.int(2, 9); if (a >= b || b % a === 0) continue;
        const N = r.int(60, 300), l = a * b / gcd(a, b); if (l > N / 2) continue;
        let x = 0; for (let n = 1; n <= N; n++) if (n % a === 0 || n % b === 0) x++;
        const na = Math.floor(N / a), nb = Math.floor(N / b), nl = Math.floor(N / l);
        const v = { n: N, a, b, l, na, nb, nl, x };
        return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([na + nb], x), diagnose: diag([[na + nb, K('m1', v)]]), selfCheck: () => na + nb - nl === x });
      }
    },
    /* how many divisors */
    divisors(r, K) {
      for (;;) {
        const N = r.int(24, 240); const ds = []; for (let d = 1; d <= N; d++) if (N % d === 0) ds.push(d);
        if (ds.length < 8) continue;
        const v = { n: N, l: raw(ds.join(', ')), x: ds.length };
        return pack(K, v, one(Qn(ds.length)), ans(ds.length), { wrong: wrongs([ds.length - 2], ds.length), diagnose: diag([[ds.length - 2, K('m1', v)]]) });
      }
    }
  });

  X('no_data', {
    /* two buses with different intervals: when do they leave together */
    buses(r, K) {
      for (;;) {
        const P = [12, 15, 18, 20, 24, 25, 30, 35, 40, 45];
        const p = r.pick(P), q = r.pick(P); if (p === q) continue;
        const t1 = 6 * 60 + r.int(0, 11) * 5, t2 = 6 * 60 + r.int(0, 11) * 5; if (t1 === t2) continue;
        const s1 = new Set(); for (let t = t1; t <= 22 * 60; t += p) s1.add(t);
        let x = null; for (let t = t2; t <= 22 * 60; t += q) if (s1.has(t)) { x = t; break; }
        if (x == null || x === t1 || x === t2 || x > 18 * 60) continue;
        const L1 = [], L2 = []; for (let t = t1; t <= x; t += p) L1.push(TM(t)); for (let t = t2; t <= x; t += q) L2.push(TM(t));
        if (L1.length > 14 || L2.length > 14) continue;
        const v = { t1: TM(t1), t2: TM(t2), p, q, l1: { list: L1, sep: ', ' }, l2: { list: L2, sep: ', ' }, x: TM(x) };
        return pack(K, v, one(x, { kind: 'time' }), m('c.time', { t: TM(x) }));
      }
    },
    /* notebooks and pens: find the price of one pen */
    pens(r, K) {
      for (;;) {
        const n = r.int(16, 70) * 5, p = r.int(9, 50) * 5, a = r.int(3, 6), b = r.int(2, 5), c = r.int(2, 4); if (a === b) continue;
        const pa = a * n, pb = b * n + c * p;
        const e = cents => EUR(MQ.Q.dec(cents, 2));
        const v = { a, b, c, pa: e(pa), pb: e(pb), one: e(n), bn: e(b * n), rest: e(c * p), x: e(p) };
        return pack(K, v, one(MQ.Q.dec(p, 2), { unit: '€' }), m('c.eur', { x: e(p) }));
      }
    }
  });

  /* ================================================================= */
  /*  SPACE AND SHAPES                                                  */
  /* ================================================================= */
  X('ef_coord', {
    /* area of a slanted triangle on the grid: rectangle minus three corners */
    tri(r, K) {
      const w = r.int(4, 9), h = r.int(4, 8), ox = r.int(0, 10 - w), oy = r.int(0, 10 - h), bx = r.int(1, w - 1), cy = r.int(1, h - 1);
      const flip = r.chance(0.5), X0 = x => flip ? ox + w - (x - ox) : x;
      const A = [X0(ox), oy], B = [X0(ox + bx), oy + h], C = [X0(ox + w), oy + cy];
      const R = w * h, t1 = Qn(bx * h, 2), t2 = Qn(w * cy, 2), t3 = Qn((w - bx) * (h - cy), 2), s = t1.add(t2).add(t3), x = Qn(R).sub(s);
      const shoe = Qn(Math.abs(A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])), 2);
      const fig = F.coord(10, 10, { polygons: [{ pts: [A, B, C] }], points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }, { x: C[0], y: C[1], label: 'C' }] });
      // the explanation draws what it talks about: the rectangle (dashed) and the three corner triangles, each with its area
      const P1 = [X0(ox), oy + h], P2 = [X0(ox + w), oy], P3 = [X0(ox + w), oy + h];
      const corners = [[A, B, P1, t1], [A, C, P2, t2], [B, C, P3, t3]];
      const exFig = { html: lang => F.coord(10, 10, {
        cell: 24, label: '',
        polygons: [{ pts: [[ox, oy], [ox + w, oy], [ox + w, oy + h], [ox, oy + h]], cls: 'frame' }]
          .concat(corners.map(([p, q, o], i) => ({ pts: [p, q, o], cls: 'corner c' + (i + 1) }))).concat([{ pts: [A, B, C] }]),
        texts: corners.filter(c => c[3].gt(1)).map(([p, q, o, t]) => ({ x: (p[0] + q[0] + o[0]) / 3, y: (p[1] + q[1] + o[1]) / 3 - 0.25, t: MQ.fmtNum(t, lang), cls: 'b sm' })),
        points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }, { x: C[0], y: C[1], label: 'C' }] }) };
      const half = (p, q, t) => m('t.x_ef_coord.tri.half', { p, q, t });
      const v = { a: { k: 'c.coordNamed', v: { n: 'A', x: A[0], y: A[1] } }, b: { k: 'c.coordNamed', v: { n: 'B', x: B[0], y: B[1] } }, c: { k: 'c.coordNamed', v: { n: 'C', x: C[0], y: C[1] } }, w, h, rr: R, t1, t2, t3, s, x,
        x1: ox, x2: ox + w, y1: oy, y2: oy + h, e1: half(bx, h, t1), e2: half(w, cy, t2), e3: half(w - bx, h - cy, t3), f: exFig };
      return pack(K, v, one(x), ans(x), { figure: fig, wrong: wrongDec([Qn(R, 2)], x), diagnose: diag([[Qn(R, 2), K('m1', v)]]), selfCheck: () => shoe.eq(x) });
    },
    /* map scale, then a bike ride */
    scale(r, K) {
      for (;;) {
        const S = r.pick([20000, 25000, 50000]), per = 100000 / S;          // cm on the map for 1 km
        const km = r.int(3, 15), d = km * per; if (!Number.isInteger(d)) continue;
        const k = r.pick([2, 3, 4, 5]), mm = r.pick([6, 8, 10, 12, 15]); if (km % k) continue;
        const v = { s: S, d, km, k, mm, n: km / k, x: km / k * mm, per };
        return pack(K, v, one(Qn(v.x), { unit: 'min' }), m('c.min', { x: v.x }));
      }
    }
  });

  X('ef_angles', {
    /* the angle between the hands of a clock */
    clock(r, K) {
      const hh = r.int(1, 12), mm = r.int(1, 29) * 2;
      const mi = 6 * mm, ho = (30 * hh + mm / 2) % 360; let x = Math.abs(ho - mi); if (x > 180) x = 360 - x;
      let w = Math.abs((30 * hh) % 360 - mi); if (w > 180) w = 360 - w;
      const v = { t: raw(hh + ':' + String(mm).padStart(2, '0')), h: hh % 12, mm, mi, ho, df: Math.abs(ho - mi), x };
      return pack(K, v, one(Qn(x)), m('c.deg', { x }), { explain: K(v.df > 180 ? 'ex2' : 'ex', v), figure: F.clock(hh % 12, mm), wrong: wrongs([w], x), diagnose: diag([[w !== x ? w : null, K('m1', v)]]) });
    },
    /* three angles on a straight line */
    line(r, K) {
      for (;;) {
        const k = r.pick([2, 3]), a = r.int(10, 40), d = 180 - (2 * k + 1) * a; if (d < 5 || d > 60) continue;
        const v = { k, d, n: 2 * k + 1, a, b: k * a, x: k * a + d, s: 180 - d };
        return pack(K, v, one(Qn(v.x)), m('c.deg', { x: v.x }));
      }
    }
  });

  X('ef_shapes', {
    /* all the squares in a grid */
    squares(r, K) {
      const a = r.int(3, 5), b = r.int(a, 6); const per = []; let x = 0;
      for (let s = 1; s <= a; s++) { const c = (a - s + 1) * (b - s + 1); per.push(s + '×' + s + ' → ' + c); x += c; }
      const v = { a, b, l: raw(per.join(' ; ')), x, ab: a * b };
      return pack(K, v, one(Qn(x)), ans(x), { figure: gridFig(b, a), wrong: wrongs([a * b], x), diagnose: diag([[a * b, K('m1', v)]]) });
    },
    /* all the rectangles in a grid (squares count too) */
    rects(r, K) {
      const a = r.int(2, 4), b = r.int(2, 5); const pv = (b + 1) * b / 2, ph = (a + 1) * a / 2, x = pv * ph;
      const v = { a, b, v: b + 1, hh: a + 1, pv, ph, x };
      return pack(K, v, one(Qn(x)), ans(x), { figure: gridFig(b, a), wrong: wrongs([a * b], x), diagnose: diag([[a * b, K('m1', v)]]) });
    }
  });

  X('ef_solids', {
    /* a painted cube cut into small cubes */
    paint(r, K) {
      const n = r.int(3, 7), k = r.pick([0, 1, 1, 2, 2, 3]), i = n - 2;
      const x = [i * i * i, 6 * i * i, 12 * i, 8][k], w = [null, 6 * n * n, 12 * n, null][k];
      const v = { n, i, n3: n * n * n, x, k };
      return { prompt: K('q' + k, v), hints: [K('h1', v), K('h2_' + k, v), K('h3', v)], explain: K('ex' + k, v), widget: one(Qn(x)), answer: ans(x), figure: `<div class="painted">${F.cuboidCubes(n, n, n, { s: Math.max(11, 30 - 3 * n) })}</div>`,   // the real n × n × n cube, painted red
        wrong: wrongs([w], x), diagnose: diag([[w, K('m1', v)]]), selfCheck: () => i ** 3 + 6 * i * i + 12 * i + 8 === n ** 3 };
    },
    /* a prism with f faces: how many edges */
    prism(r, K) {
      const n = r.int(5, 12), f = n + 2, x = 3 * n;
      const v = { f, n, x, vv: 2 * n };
      return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([3 * f], x), diagnose: diag([[3 * f, K('m1', v)]]) });
    },
    /* a pyramid with e edges: how many faces */
    pyramid(r, K) {
      const n = r.int(5, 14), e = 2 * n, x = n + 1;
      const v = { e, n, x };
      return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([n], x), diagnose: diag([[n, K('m1', v)]]) });
    }
  });

  X('ef_sym', {
    /* reflect a point in a vertical line, then in a horizontal line */
    reflect(r, K) {
      for (;;) {
        const x = r.int(0, 12), y = r.int(0, 12), a = r.int(2, 10), b = r.int(2, 10); if (x === a || y === b) continue;
        const x1 = 2 * a - x, y1 = 2 * b - y; if (x1 < 0 || x1 > 12 || y1 < 0 || y1 > 12) continue;
        const fig = F.coord(12, 12, { segments: [[a, 0, a, 12, 'ln a'], [0, b, 12, b, 'ln a']], points: [{ x, y, label: 'A' }], texts: [{ x: a + 0.6, y: 12.4, t: 'x = ' + a, cls: 'sm b' }, { x: 11.2, y: b + 0.45, t: 'y = ' + b, cls: 'sm b' }] });
        const v = { x, y, a, b, dx: Math.abs(x - a), x1, dy: Math.abs(y - b), y1 };
        return pack(K, v, { type: 'input', fields: [field('x', Qn(x1), { label: m('w.x') }), field('y', Qn(y1), { label: m('w.y') })] }, m('c.coord', { x: x1, y: y1 }), { figure: fig, wrong: [{ fields: { x: String(x1), y: String(y) } }] });
      }
    },
    /* times that read the same backwards on a 24-hour clock */
    palin(r, K) {
      for (;;) {
        const h1 = r.int(0, 18), h2 = r.int(h1 + 3, 23);
        const L = []; for (let t = h1 * 60; t <= h2 * 60 + 59; t++) { const s = String(Math.floor(t / 60)).padStart(2, '0') + String(t % 60).padStart(2, '0'); if (s === s.split('').reverse().join('')) L.push(TM(t)); }
        if (L.length < 3 || L.length > 10) continue;
        const v = { t1: TM(h1 * 60), t2: TM(h2 * 60 + 59), l: { list: L, sep: ', ' }, x: L.length };
        return pack(K, v, one(Qn(L.length)), ans(L.length));
      }
    }
  });

  /* a garden with a path all around it */
  function pathFig(a, b, c) {
    // drawn to scale (the path a little wider when it is very thin, so that it stays visible)
    const sc = Math.min(14, 220 / (a + 2 * c)), pad = Math.max(c * sc, 5), W = a * sc + 2 * pad, H = b * sc + 2 * pad;
    return F.svg(W + 20, H + 20, `<rect class="face2" x="10" y="10" width="${W}" height="${H}"/><rect class="face1" x="${10 + pad}" y="${10 + pad}" width="${a * sc}" height="${b * sc}"/>`, '', 'path');
  }
  X('ef_area', {
    path(r, K) {
      // the length is the longer side
      const a = r.int(6, 20), b = r.int(4, Math.min(15, a - 1)), c = r.pick([Qn(1), Qn(2), Qn(1, 2), Qn(3, 2)]);
      const A = Qn(a).add(c.mul(2)), B = Qn(b).add(c.mul(2)), big = A.mul(B), x = big.sub(Qn(a * b)), w = c.mul(2 * (a + b));
      const v = { a, b, c, aa: A, bb: B, big, g: a * b, x: U(x, 'm2'), xv: x };
      return pack(K, v, one(x, { unit: 'm2' }), m('c.unitv', { x: U(x, 'm2') }), { figure: pathFig(a, b, c.toNumber()), wrong: wrongDec([w], x), diagnose: diag([[w, K('m1', v)]]) });
    },
    /* the largest area for a given perimeter (whole metres) */
    maxarea(r, K) {
      const s = r.int(10, 30), P = 2 * s; let x = 0, L = 0, W = 0; for (let l = 1; l < s; l++) if (l * (s - l) > x) { x = l * (s - l); L = Math.max(l, s - l); W = Math.min(l, s - l); }
      const w = s % 2 ? Qn(s * s, 4) : null;
      const v = { p: P, s, l: L, w: W, x };
      return pack(K, v, one(Qn(x), { unit: 'm2' }), m('c.unitv', { x: U(x, 'm2') }), { wrong: wrongDec([w], x), diagnose: diag([[w, K('m1', v)]]) });
    },
    /* perimeter and "the length is k times the width" */
    ratio(r, K) {
      const k = r.int(2, 5), w = r.int(3, 12), P = 2 * (k + 1) * w, x = k * w * w, sq = Qn(P * P, 16);
      const v = { p: P, k, n: 2 * (k + 1), w, l: k * w, x };
      return pack(K, v, one(Qn(x), { unit: 'm2' }), m('c.unitv', { x: U(x, 'm2') }), { wrong: wrongDec([sq], x), diagnose: diag([[sq, K('m1', v)]]) });
    }
  });

  X('ef_volume', {
    /* a stone in an aquarium */
    stone(r, K) {
      for (;;) {
        const L = r.int(6, 16) * 5, W = r.int(4, 8) * 5, d = r.int(2, 15); const V = Qn(L * W * d, 10); if (!V.isInt()) continue;
        const v = { l: L, w: W, d, dc: Qn(d, 10), x: V };
        return pack(K, v, one(V, { unit: 'cm3' }), m('c.unitv', { x: U(V, 'cm3') }), { wrong: wrongs([L * W * d], V), diagnose: diag([[L * W * d, K('m1', v)]]) });
      }
    },
    /* whole cubes in a box whose sides are not multiples of the cube */
    fit(r, K) {
      for (;;) {
        const e = r.pick([2, 3, 4]), a = r.int(7, 30), b = r.int(7, 25), c = r.int(5, 20);
        const fa = Math.floor(a / e), fb = Math.floor(b / e), fc = Math.floor(c / e), x = fa * fb * fc, w = Math.floor(a * b * c / (e ** 3));
        if (w === x) continue;
        const v = { e, a, b, c, fa, fb, fc, x, vol: a * b * c, ve: e ** 3, w };
        return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([w], x), diagnose: diag([[w, K('m1', v)]]) });
      }
    }
  });

  /* ================================================================= */
  /*  MEASURES                                                          */
  /* ================================================================= */
  X('gm_length', {
    /* the snail on the pole */
    snail(r, K) {
      for (;;) {
        const N = r.int(10, 30), u = r.int(3, 7), d = r.int(1, u - 1), net = u - d; if (N <= u + net) continue;
        let D = 1, hgt = 0; while (hgt + u < N) { hgt += net; D++; }
        const w = Math.ceil(N / net);
        const v = { n: N, u, d, net, k: D - 1, hh: hgt, x: D };
        return pack(K, v, one(Qn(D)), m('t.x_gm_length.snail.a', { x: D }), { wrong: wrongs([w], D), diagnose: diag([[w !== D ? w : null, K('m1', v)]]) });
      }
    },
    /* posts all around a rectangular field */
    posts(r, K) {
      const d = r.pick([Qn(2), Qn(5, 2), Qn(3), Qn(4), Qn(5)]), i = r.int(3, 18), j = r.int(2, 12);
      const a = d.mul(i), b = d.mul(j), P = a.add(b).mul(2), x = 2 * (i + j);
      const v = { a, b, d, p: P, x };
      return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongs([x + 4], x), diagnose: diag([[x + 4, K('m1', v)]]) });
    }
  });

  X('gm_masscap', {
    /* a jar of honey: full, then partly empty */
    jar(r, K) {
      const f = r.pick([[1, 2], [1, 4], [3, 4]]), J = r.int(15, 45) * 10, H = r.int(10, 30) * 40;
      const A = J + H, B = J + H * f[0] / f[1], diff = A - B;
      const w = f[0] === 1 && f[1] === 2 ? A / 2 : 2 * B - A;
      const v = { a: A, b: B, f: fr(...f), cf: fr(f[1] - f[0], f[1]), dd: diff, hh: H, x: J };
      return pack(K, v, one(Qn(J), { unit: 'g' }), m('c.unitv', { x: U(J, 'g') }), { wrong: wrongs([w > 0 ? w : null], J), diagnose: diag([[w, K('m1', v)]]) });
    },
    /* an apple and a pear */
    fruit(r, K) {
      const ap = r.int(12, 22) * 10, pe = r.int(15, 30) * 10, k = r.int(1, 3);
      const X1 = ap + pe, Y = (k + 1) * ap + pe;
      const v = { x1: X1, y: Y, k, k1: k + 1, dd: Y - X1, ap, x: pe };
      return pack(K, v, one(Qn(pe), { unit: 'g' }), m('c.unitv', { x: U(pe, 'g') }), { wrong: wrongs([ap, Y - X1], pe), diagnose: diag([[ap, K('m1', v)]]) });
    }
  });

  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  X('gm_time', {
    /* a clock that is slow (or fast) by k minutes an hour */
    clock(r, K) {
      const k = r.int(1, 6), t0 = r.int(7, 10) * 60, hrs = r.int(3, 12), t1 = t0 + 60 * hrs, fast = r.chance(0.5), x = fast ? t1 + k * hrs : t1 - k * hrs;
      const v = { k, t0: TM(t0), t1: TM(t1), h: hrs, tot: k * hrs, x: TM(x) };
      const w = fast ? t1 - k * hrs : t1 + k * hrs;
      return Object.assign(pack(K, v, one(x, { kind: 'time' }), m('c.time', { t: TM(x) }), { wrong: [{ fields: { a: MQ.fmtTime(w) } }] }), { prompt: K(fast ? 'qf' : 'q', v), explain: K(fast ? 'exf' : 'ex', v) });
    },
    /* which day of the week */
    weekday(r, K) {
      const d0 = r.int(0, 6), mo = r.int(2, 12), dd = r.int(1, MDAYS[mo - 1]);
      let n = dd - 1; for (let i = 0; i < mo - 1; i++) n += MDAYS[i];
      const q = Math.floor(n / 7), rr = n % 7, xi = (d0 + rr) % 7;
      const v = { d0: { k: 'day.' + DAYS[d0] }, dd, mo: { k: 'month.' + mo }, n, q, rr, x: { k: 'day.' + DAYS[xi] } };
      return pack(K, v, { type: 'mc', options: DAYS.map((d, i) => ({ label: m('day.' + d), correct: i === xi, why: null })) }, m('day.' + DAYS[xi]));
    }
  });

  X('gm_money', {
    /* in how many ways can you pay X € with 1 €, 2 € and 5 € coins */
    ways(r, K) {
      const Xe = r.int(8, 20); const per = []; let x = 0;
      for (let f = 0; f * 5 <= Xe; f++) { const c = Math.floor((Xe - 5 * f) / 2) + 1; per.push(f + ' × 5 € → ' + c); x += c; }
      const v = { e: Xe, l: raw(per.join(' ; ')), x };
      return pack(K, v, one(Qn(x)), ans(x));
    },
    /* p loaves cost as much as q croissants */
    swap(r, K) {
      for (;;) {
        const p = r.int(2, 4), q = r.int(p + 1, p + 4); if (gcd(p, q) !== 1) continue;
        const u = r.int(3, 9) * 5, C = p * u, j = r.int(1, 2), mm = p * j, nn = r.int(1, 6), tot = q * j + nn, Tc = tot * C;
        const e = c => EUR(MQ.Q.dec(c, 2));
        const v = { p, q, m: mm, nn, t: e(Tc), eq: q * j, tot, x: e(C) };
        return pack(K, v, one(MQ.Q.dec(C, 2), { unit: '€' }), m('c.eur', { x: e(C) }));
      }
    }
  });

  X('gm_units', {
    /* folding a sheet of paper */
    fold(r, K) {
      const n = r.int(4, 7), s = 2 ** n, x = MQ.Q.dec(s, 1), w = MQ.Q.dec(2 * n, 1);
      const v = { n, s, x };
      return pack(K, v, one(x, { unit: 'mm' }), m('c.unitv', { x: U(x, 'mm') }), { wrong: wrongDec([w], x), diagnose: diag([[w, K('m1', v)]]) });
    },
    /* a tap filling a bath, cl per second */
    tap(r, K) {
      for (;;) {
        const vcl = r.pick([5, 8, 10, 12, 15, 20, 25]), mins = r.int(3, 30), L = vcl * 60 * mins / 100;
        if (!Number.isInteger(L) || L < 60 || L > 300) continue;
        const v = { v: vcl, l: L, pm: vcl * 60, pl: Qn(vcl * 60, 100), x: mins };
        return pack(K, v, one(Qn(mins), { unit: 'min' }), m('c.min', { x: mins }), { wrong: wrongs([Qn(L, vcl)], mins) });
      }
    },
    /* tiles on a floor */
    tiles(r, K) {
      for (;;) {
        const s = r.pick([20, 25, 40, 50]), a = r.int(2, 6), b = r.int(2, 6); if ((100 * a) % s || (100 * b) % s) continue;
        const na = 100 * a / s, nb = 100 * b / s, x = na * nb, w = Qn(a * b * 100, s);
        const v = { s, a, b, na, nb, x, ab: a * b };
        return pack(K, v, one(Qn(x)), ans(x), { wrong: wrongDec([w], x), diagnose: diag([[w, K('m1', v)]]) });
      }
    }
  });

  X('gm_data', {
    /* the class average from the boys' and the girls' averages */
    wmean(r, K) {
      for (;;) {
        const nb = r.int(6, 15), nf = r.int(6, 15), mb = r.int(130, 150), mf = r.int(130, 150); if (nb === nf || mb === mf) continue;
        const x = Qn(nb * mb + nf * mf, nb + nf); if (!(x.decimalPlaces() >= 0 && x.decimalPlaces() <= 1)) continue;
        const w = Qn(mb + mf, 2);
        const v = { nb, nf, mb, mf, sb: nb * mb, sf: nf * mf, n: nb + nf, s: nb * mb + nf * mf, x };
        return pack(K, v, one(x, { unit: 'cm' }), m('c.unitv', { x: U(x, 'cm') }), { wrong: wrongDec([w], x), diagnose: diag([[w, K('m1', v)]]) });
      }
    },
    /* one score was removed: which */
    removed(r, K) {
      for (;;) {
        const M = r.int(10, 18), M2 = r.int(8, 19), R = 5 * M - 4 * M2; if (R < 1 || R > 20 || M2 === M) continue;
        const v = { m: M, m2: M2, s5: 5 * M, s4: 4 * M2, x: R };
        return pack(K, v, one(Qn(R)), ans(R), { wrong: wrongs([Math.abs(M - M2)], R), diagnose: diag([[Math.abs(M - M2), K('m1', v)]]) });
      }
    }
  });

  /* ================================================================= */
  /*  PROBLEM SOLVING                                                   */
  /* ================================================================= */
  X('rp_analyse', {
    /* father and son: k times now, j times in n years */
    ages(r, K) {
      for (;;) {
        const k = r.int(3, 6), j = r.int(2, k - 1), n = r.int(2, 20), num = n * (j - 1), den = k - j; if (num % den) continue;
        const s = num / den, f = k * s; if (s < 3 || s > 15 || f < 25 || f > 55) continue;
        const v = { k, j, n, x: s, f, s2: s + n, f2: f + n };
        return pack(K, v, one(Qn(s)), m('t.x_rp_analyse.ages.a', { x: s }));
      }
    },
    /* three children and their marbles */
    three(r, K) {
      const [a, b, c] = names(r, 3), k = r.int(2, 4), B = r.int(8, 40), d = r.int(3, 20), S = (B + d) + B + k * B;
      const v = { a, b, c, k, d, s: S, n: k + 2, sd: S - d, bb: B, aa: B + d, x: k * B };
      return pack(K, v, one(Qn(k * B)), ans(k * B), { wrong: wrongs([B], k * B), diagnose: diag([[B, K('m1', v)]]) });
    }
  });

  X('rp_solve', {
    /* hens and rabbits: heads and legs */
    legs(r, K) {
      const H = r.int(10, 40), R = r.int(2, H - 2), P = 2 * H + 2 * R;
      const v = { h: H, p: P, hh: 2 * H, dd: P - 2 * H, x: R, g: H - R };
      return pack(K, v, one(Qn(R)), ans(R), { wrong: wrongs([H - R, Qn(P, 4)], R), diagnose: diag([[H - R, K('m1', v)], [Qn(P, 4), K('m2', v)]]) });
    },
    /* handshakes */
    hands(r, K) {
      const n = r.int(5, 20), X1 = n * (n - 1) / 2;
      let w = null; for (let t = 2; t < 60; t++) if (t * (t - 1) === X1) w = t;
      const v = { x1: X1, x2: 2 * X1, x: n, n1: n - 1 };
      return pack(K, v, one(Qn(n)), ans(n), { wrong: wrongs([w], n), diagnose: diag([[w, K('m1', v)]]) });
    }
  });

  X('rp_prop', {
    /* c cats catch m mice in t minutes */
    cats(r, K) {
      for (;;) {
        const c = r.int(2, 6), u = r.int(1, 3), t = r.pick([3, 4, 5, 6, 10]), mm = c * u, w2 = r.int(2, 6), Y = t * w2, cats = r.int(2, 9), Xm = cats * u * w2;
        if (cats === c || Xm > 200) continue;
        const naive = Qn(Xm * c, mm);
        const v = { c, m: mm, t, xm: Xm, y: Y, u, uw: u * w2, x: cats };
        return pack(K, v, one(Qn(cats)), ans(cats), { wrong: wrongs([naive], cats), diagnose: diag([[naive, K('m1', v)]]) });
      }
    },
    /* n taps fill a pool in h hours; how long with k taps */
    taps(r, K) {
      for (;;) {
        const n = r.int(2, 6), h = r.int(2, 12), k = r.int(2, 8); if (k === n || (n * h) % k) continue;
        const x = n * h / k, w = Qn(h * k, n);
        const v = { n, h, k, nh: n * h, x };
        return pack(K, v, one(Qn(x)), m('t.x_rp_prop.taps.a', { x }), { wrong: wrongDec([w], x), diagnose: diag([[w, K('m1', v)]]) });
      }
    }
  });

  X('rp_open', {
    /* shortest paths along the streets of a grid */
    paths(r, K) {
      const a = r.int(2, 5), b = r.int(2, 5);
      const tb = Array.from({ length: a + 1 }, () => Array(b + 1).fill(1));
      for (let i = 1; i <= a; i++) for (let j = 1; j <= b; j++) tb[i][j] = tb[i - 1][j] + tb[i][j - 1];
      const x = tb[a][b];
      const v = { a, b, x, ab: a * b };
      return pack(K, v, one(Qn(x)), ans(x), { figure: gridFig(b, a, { marks: [{ x: 0, y: 0, t: 'S', dx: -2, dy: 26 }, { x: b, y: a, t: 'F', dx: 14, dy: -8 }] }), wrong: wrongs([a * b, a + b], x), diagnose: diag([[a * b, K('m1', v)]]) });
    },
    /* a sequence: × a + b */
    seqmul(r, K) {
      for (;;) {
        const s0 = r.int(1, 6), a = r.int(2, 3), b = r.int(0, 4), k = r.int(6, 8); if (a === 2 && b === 0 && s0 === 1) continue;
        const t = [s0]; while (t.length < k) t.push(t[t.length - 1] * a + b);
        if (t[k - 1] > 50000) continue;
        const v = { l: raw(t.slice(0, 4).join(', ')), k, a, b, all: raw(t.join(', ')), x: t[k - 1] };
        return Object.assign(pack(K, v, one(Qn(t[k - 1])), ans(t[k - 1])), { hints: [K('h1', v), K(b ? 'h2' : 'h2b', v), K('h3', v)] });
      }
    },
    /* a sequence whose differences grow */
    seqdiff(r, K) {
      const s0 = r.int(2, 10), d0 = r.int(1, 5), dd = r.int(2, 4), k = r.int(8, 10);
      const t = [s0]; for (let i = 0; t.length < k; i++) t.push(t[t.length - 1] + d0 + i * dd);
      const v = { l: raw(t.slice(0, 5).join(', ')), k, d0, dd, all: raw(t.join(', ')), x: t[k - 1] };
      return pack(K, v, one(Qn(t[k - 1])), ans(t[k - 1]));
    }
  });

  /* what a girl and a boy of the family say */
  const GIRL = [
    (g, b) => b === g - 1, (g, b, k) => g >= 2 && b === k * (g - 1), (g, b, k, d) => b === g - 1 + d];
  const BOY = [
    (g, b) => g === b - 1, (g, b, k) => b >= 2 && g === k * (b - 1), (g, b, k, d) => g === b - 1 + d];
  X('rp_check', {
    siblings(r, K) {
      for (;;) {
        const gi = r.int(0, 2), bi = r.int(0, 2), k = r.int(2, 3), d = r.int(1, 3), k2 = r.int(2, 3), d2 = r.int(1, 3);
        if (gi === 0 && bi === 0) continue;
        const sols = [];
        for (let g = 1; g <= 15; g++) for (let b = 1; b <= 15; b++) if (GIRL[gi](g, b, k, d) && BOY[bi](g, b, k2, d2)) sols.push([g, b]);
        if (sols.length !== 1) continue;
        const [g, b] = sols[0]; if (g + b > 15) continue;
        const v = { gs: K('g' + gi, { k, d }), bs: K('b' + bi, { k: k2, d: d2 }), g, b, g1: g - 1, b1: b - 1, x: g + b };
        return pack(K, v, one(Qn(g + b)), ans(g + b));
      }
    },
    /* who broke the vase: only one tells the truth / only one lies */
    liar(r, K) {
      for (;;) {
        const kids = names(r, 3), forms = ['is', 'not', 'notme', 'is', 'not'];
        const st = kids.map((who, i) => { const f = r.pick(forms); const other = r.pick(kids.filter((_, j) => j !== i)); return { who: i, f, o: kids.indexOf(other) }; });
        const truth = (s, c) => s.f === 'is' ? c === s.o : s.f === 'not' ? c !== s.o : c !== s.who;
        const T1 = r.pick([1, 2]);                                     // 1: only one tells the truth; 2: only one lies
        const counts = kids.map((_, c) => st.filter(s => truth(s, c)).length);
        const fits = counts.map((n, c) => n === T1 ? c : -1).filter(c => c >= 0);
        if (fits.length !== 1) continue;
        const xi = fits[0];
        const lines = st.map(s => ({ k: 't.x_rp_check.liar.says', v: { n: kids[s.who], s: { k: 't.x_rp_check.liar.' + s.f, v: { x: kids[s.o] } } } }));
        const v = { l: { list: lines, sep: '<br>' }, rule: K(T1 === 1 ? 'r1' : 'r2'), c: raw(kids.map((n, i) => n + ' → ' + counts[i]).join(' ; ')), t: T1, x: kids[xi] };
        return pack(K, v, { type: 'mc', options: kids.map((n, i) => ({ label: m('c.words', { w: n }), correct: i === xi, why: null })) }, m('c.words', { w: kids[xi] }));
      }
    }
  });

  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
