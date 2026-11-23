/* =====================================================================
 * registry.js — exercise template registry and shared helpers.
 *
 * HOW TO ADD AN EXERCISE TEMPLATE
 *   MQ.T.add({
 *     id: 'my_tpl',                 // unique; text keys are t.my_tpl.*
 *     stage: 'no_dec',              // stage id from data/map.js
 *     objectives: ['NO.1.2'],       // curriculum ids (data/curriculum.js)
 *     mt: ['MT.11'],                // MathemaTIC ids (optional)
 *     gen(r, L) { … return ex; }    // r = seeded RNG, L = level 1..4
 *     levels: [5]                   // optional; [5] = an extreme problem (level 5 only)
 *   });
 *   Then add the strings t.my_tpl.title / .q / .h1 / .h2 / .h3 / .ex
 *   to every lang/*.js file and run the self-test.
 *
 * An exercise "ex" returned by gen():
 *   prompt  {k,v}        question text            figure  svg | fn(lang)
 *   widget  {type,…}     see core/check.js        hints   [m1,m2,m3]
 *   explain {k,v}        WHY explanation          answer  {k,v} (answer text)
 *   diagnose(values)     → {k,v} misconception feedback (optional)
 *   wrong   [response]   typical wrong responses the self-test must reject
 *   ranges  [[name, value, min, max]] value-range assertions for self-test
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const list = [], byId = {};
  const T = MQ.T = {
    list, byId,
    add(def) {
      if (byId[def.id]) throw new Error('duplicate template ' + def.id);
      def.levels = def.levels || [1, 2, 3, 4];
      list.push(def); byId[def.id] = def;
      return def;
    },
    /* templates of a stage; without L only the ordinary ones (levels 1–4),
     * with L only those that have that level (L = 5: the extreme problems) */
    forStage(stage, L) { return list.filter(t => ([].concat(t.stage).includes(stage) || (t.stages || []).includes(stage)) && (L == null ? t.levels.some(x => x <= 4) : t.levels.includes(L))); },
    extreme() { return list.filter(t => t.levels.includes(5)); },
    /* generate one exercise; seed makes it reproducible */
    make(id, level, seed) {
      const def = byId[id]; const r = MQ.RNG(seed);
      const ex = def.gen(r, level);
      ex.tpl = id; ex.level = level; ex.seed = seed;
      ex.objectives = ex.objectives || def.objectives; ex.mt = def.mt || [];
      { const hv = ex.hintVars || (ex.prompt && ex.prompt.v) || {}; ex.hints = ex.hints || [m(`t.${id}.h1`, hv), m(`t.${id}.h2`, hv), m(`t.${id}.h3`, hv)]; }
      ex.explain = ex.explain || m(`t.${id}.ex`);
      const w = ex.widget;
      if (w && w.type === 'shade' && w.kind === 'cells' && !w.cellIds) w.cellIds = T.cellIds(w.cols, w.rows);
      return ex;
    }
  };

  /* ---------------- helpers ---------------- */
  const Q = (...a) => a.length === 2 ? new MQ.Q(a[0], a[1]) : MQ.Q.of(a[0]);
  function m(k, v) { return { k, v: v || {} }; }
  const num = x => ({ k: 'c.num', v: { x } });
  const frac = (n, d) => ({ k: 'c.num', v: { x: { frac: new MQ.Q(n, d), n, d } } });
  const fr = (n, d) => ({ frac: new MQ.Q(n, d), n, d });     // var value for a fraction (unreduced display)
  const unit = (val, u, places) => ({ unit: u, val: Q(val), places });
  const money = v => ({ money: Q(v) });

  /* field builder */
  const field = (id, expect, o = {}) => Object.assign({ id, expect, kind: 'num' }, o);

  /* Multiple-choice options from a correct value and distractors.
   * Values are compared exactly; duplicates and accidental correct
   * distractors are dropped; `fill` generates extra distractors.       */
  function mcValues(r, correct, distractors, { label = num, fill = null, n = 4 } = {}) {
    const key = v => v instanceof MQ.Q ? 'q' + v.toString() : (v && v.frac) ? 'q' + v.frac.toString() : JSON.stringify(v);
    const seen = new Set([key(correct)]);
    const opts = [{ label: label(correct), correct: true, value: correct }];
    for (const d of distractors) {
      if (opts.length >= n) break;
      if (d.v == null) continue;
      const k = key(d.v); if (seen.has(k)) continue;
      if (d.v instanceof MQ.Q && (d.v.n < 0)) continue;
      seen.add(k); opts.push({ label: label(d.v), correct: false, why: d.why ? m(d.why, d.wv) : null, value: d.v });
    }
    let guard = 0;
    while (opts.length < n && fill && guard++ < 200) {
      const v = fill(); const k = key(v); if (seen.has(k)) continue;
      if (v instanceof MQ.Q && v.n < 0) continue;
      seen.add(k); opts.push({ label: label(v), correct: false, value: v });
    }
    return r.shuffle(opts);
  }
  /* MC from message options [{msg, correct, why}] */
  function mcMsgs(r, items, shuffle = true) {
    const opts = items.map(it => ({ label: it.msg, correct: !!it.correct, why: it.why || null, fig: it.fig }));
    return shuffle ? r.shuffle(opts) : opts;
  }
  const NAMES = ['Lena', 'Noah', 'Emma', 'Luca', 'Mia', 'Gabriel', 'Léa', 'Ben', 'Sofia', 'Tom', 'Lara', 'Diogo', 'Yara', 'Max', 'Ana', 'Leo', 'Zoé', 'Elias', 'Nora', 'Liam'];
  const names = (r, k) => r.sample(NAMES, k);

  /* explanation helpers: a number with the digit at place p marked (p = 0 units, 1 tens, −1 tenths …),
     and a list of values joined by a sign, written with the same number of decimals if wanted */
  const markDigit = (x, p, opts = {}) => ({ html: lang => {
    const s = MQ.fmtNum(x, lang, opts), dec = MQ.fmtNum(new MQ.Q(3, 2), lang).charAt(1);
    let i = s.indexOf(dec); if (i < 0) i = s.length;
    const isD = c => c >= '0' && c <= '9';
    let j = -1;
    if (p >= 0) { let k = -1; for (let t = i - 1; t >= 0; t--) if (isD(s[t]) && ++k === p) { j = t; break; } }
    else { let k = 0; for (let t = i + 1; t < s.length; t++) if (isD(s[t]) && --k === p) { j = t; break; } }
    return j < 0 ? s : s.slice(0, j) + '<b class="mark">' + s[j] + '</b>' + s.slice(j + 1);
  } });
  const chain = (vals, sign, opts = {}) => ({ html: lang => vals.map(v => v instanceof MQ.Q || typeof v === 'number' ? MQ.fmtNum(v, lang, opts) : v && v.k ? MQ.tm(v, lang) : MQ.fmtVal(v, lang)).join(' ' + sign + ' ') });
  T.h = { Q, m, num, frac, fr, unit, money, field, mcValues, mcMsgs, names, NAMES, markDigit, chain };
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
