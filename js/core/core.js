/* =====================================================================
 * core.js — exact arithmetic, seeded randomness, locale-aware number
 * formatting and answer parsing. No DOM. Loaded in the browser and in
 * Node (self-test).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};

  /* ---------------- Integer helpers ---------------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function divisors(n) { const d = []; for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i); return d; }
  function isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  function digitSum(n) { return String(n).split('').reduce((s, c) => s + (+c), 0); }

  /* ---------------- Exact rationals ----------------
   * Q(n, d) is always normalised (d > 0, gcd = 1). All answer keys are
   * computed with Q so that 0,1 + 0,2 is exactly 0,3.                     */
  class Q {
    constructor(n, d = 1) {
      if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error('Q needs integers: ' + n + '/' + d);
      if (d === 0) throw new Error('Q: zero denominator');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1;
      this.n = n / g; this.d = d / g;
      if (!Number.isSafeInteger(this.n) || !Number.isSafeInteger(this.d)) throw new Error('Q overflow');
    }
    static of(x) {
      if (x instanceof Q) return x;
      if (Number.isInteger(x)) return new Q(x, 1);
      if (typeof x === 'number') return Q.fromDecimalString(String(x));
      if (typeof x === 'string') return Q.fromDecimalString(x);
      throw new Error('Q.of: bad input ' + x);
    }
    static fromDecimalString(s) {
      const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s.trim());
      if (!m) throw new Error('Q: bad decimal ' + s);
      const frac = m[3] || '';
      const den = Math.pow(10, frac.length);
      const num = parseInt((m[2] || '0') + frac, 10);
      return new Q(m[1] ? -num : num, den);
    }
    /* integer-scaled constructor: Q.dec(1234, 2) = 12,34 */
    static dec(intVal, places) { return new Q(intVal, Math.pow(10, places)); }
    add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
    div(o) { o = Q.of(o); if (o.n === 0) throw new Error('Q: division by 0'); return new Q(this.n * o.d, this.d * o.n); }
    cmp(o) { o = Q.of(o); return Math.sign(this.n * o.d - o.n * this.d); }
    eq(o) { o = Q.of(o); return this.n === o.n && this.d === o.d; }
    lt(o) { return this.cmp(o) < 0; }
    gt(o) { return this.cmp(o) > 0; }
    isInt() { return this.d === 1; }
    toNumber() { return this.n / this.d; }
    /* number of decimal places if terminating, else -1 */
    decimalPlaces() {
      let d = this.d, k = 0;
      while (d % 2 === 0) { d /= 2; }
      while (d % 5 === 0) { d /= 5; }
      if (d !== 1) return -1;
      const N = BigInt(Math.abs(this.n)), D = BigInt(this.d);
      for (let p = 0; p <= 15; p++) if ((N * 10n ** BigInt(p)) % D === 0n) return p;
      return -1;
    }
    /* canonical decimal string with '.' (only for terminating values) */
    toDecimalString() {
      const p = this.decimalPlaces();
      if (p < 0) throw new Error('non-terminating decimal ' + this.n + '/' + this.d);
      const neg = this.n < 0;
      const scaled = (BigInt(Math.abs(this.n)) * 10n ** BigInt(p)) / BigInt(this.d);
      let s = scaled.toString();
      if (p > 0) { s = s.padStart(p + 1, '0'); s = s.slice(0, -p) + '.' + s.slice(-p); }
      return (neg ? '-' : '') + s;
    }
    toString() { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; }
  }

  /* ---------------- Seeded RNG (mulberry32) ---------------- */
  function RNG(seed) {
    let s = (seed >>> 0) || 1;
    const next = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const r = {
      seed,
      next,
      int(a, b) { return a + Math.floor(next() * (b - a + 1)); },        // inclusive
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      chance(p) { return next() < p; },
      shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      sample(arr, k) { return r.shuffle(arr).slice(0, k); },
      intExcept(a, b, except) { const ex = new Set([].concat(except)); let v, guard = 0; do { v = r.int(a, b); } while (ex.has(v) && ++guard < 500); return v; }
    };
    return r;
  }

  /* ---------------- Locale conventions ----------------
   * FR / DE / LB / RO : decimal comma, '.' groups thousands (as in the
   *                     MENJE documents: 1.000.000), groups only ≥ 10 000.
   * EN                : decimal point, ',' groups thousands.              */
  const LOCALE = {
    fr: { dec: ',', grp: '.', speech: ['fr-LU', 'fr-FR', 'fr'] },
    de: { dec: ',', grp: '.', speech: ['de-LU', 'de-DE', 'de'] },
    lb: { dec: ',', grp: '.', speech: ['lb-LU', 'lb', 'de-LU', 'de-DE'] },
    ro: { dec: ',', grp: '.', speech: ['ro-RO', 'ro'] },
    en: { dec: '.', grp: ',', speech: ['en-GB', 'en-IE', 'en'] }
  };
  MQ.LANGS = ['ro', 'en', 'fr', 'de', 'lb'];

  function groupInt(intStr, grp) {
    if (intStr.length < 5) return intStr;              // 4500, not 4.500
    return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, grp);
  }
  /* format a number / Q / decimal string for display in a language.
   * opts.places: force exact number of decimals (money: 2).             */
  function fmtNum(x, lang, opts = {}) {
    const L = LOCALE[lang] || LOCALE.en;
    let s;
    if (x instanceof Q) s = x.toDecimalString();
    else if (typeof x === 'number') s = Q.of(x).toDecimalString();
    else s = String(x);
    let neg = s.startsWith('-'); if (neg) s = s.slice(1);
    let [i, f = ''] = s.split('.');
    if (opts.places != null) f = f.padEnd(opts.places, '0').slice(0, Math.max(opts.places, f.replace(/0+$/, '').length));
    const out = groupInt(i, L.grp) + (f ? L.dec + f : '');
    return (neg ? '−' : '') + out;
  }

  /* ---------------- Answer parsing ----------------
   * Returns { ok, value: Q, unit, raw } or { ok:false, reason }.
   * Accepts: spaces, either decimal separator where unambiguous,
   * thousands groups, fractions a/b, mixed numbers "1 1/2", a trailing
   * unit or %/€, a leading "=".                                         */
  const UNIT_ALIASES = {
    'mm': 'mm', 'cm': 'cm', 'dm': 'dm', 'm': 'm', 'hm': 'hm', 'km': 'km',
    'mm2': 'mm2', 'cm2': 'cm2', 'dm2': 'dm2', 'm2': 'm2', 'mm²': 'mm2', 'cm²': 'cm2', 'dm²': 'dm2', 'm²': 'm2',
    'mm3': 'mm3', 'cm3': 'cm3', 'dm3': 'dm3', 'm3': 'm3', 'mm³': 'mm3', 'cm³': 'cm3', 'dm³': 'dm3', 'm³': 'm3',
    'g': 'g', 'kg': 'kg', 't': 't',
    'ml': 'ml', 'cl': 'cl', 'dl': 'dl', 'l': 'l', 'hl': 'hl',
    's': 's', 'sec': 's', 'min': 'min', 'h': 'h',
    '€': '€', 'eur': '€', 'euro': '€', 'euros': '€', 'ct': 'ct', 'cent': 'ct', 'cents': 'ct',
    '%': '%', '°': '°', 'cm³.': 'cm3'
  };
  function normaliseNumber(str, lang) {
    const L = LOCALE[lang] || LOCALE.en;
    let s = str.replace(/[    ]/g, '').replace(/[−–]/g, '-');
    if (!/^-?[\d.,]+$/.test(s)) return null;
    const hasDot = s.includes('.'), hasComma = s.includes(',');
    const strictGroups = (t, sep) => new RegExp('^-?\\d{1,3}(\\' + sep + '\\d{3})+$').test(t);
    if (hasDot && hasComma) {
      // whichever comes last is the decimal separator
      const lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
      const dec = lastDot > lastComma ? '.' : ',', grp = dec === '.' ? ',' : '.';
      const parts = s.split(dec); if (parts.length !== 2) return null;
      if (!strictGroups(parts[0], grp) && parts[0].includes(grp)) return null;
      s = parts[0].split(grp).join('') + '.' + parts[1];
    } else if (hasDot || hasComma) {
      const sep = hasDot ? '.' : ',';
      if (sep === L.dec) {
        if (s.split(sep).length !== 2) return null;
        s = s.replace(sep, '.');
      } else {
        // the "other" separator: thousands group if strictly grouped, else decimal
        if (strictGroups(s, sep)) s = s.split(sep).join('');
        else if (s.split(sep).length === 2) s = s.replace(sep, '.');
        else return null;
      }
    }
    if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.?$/.test(s)) return null;
    if (s.endsWith('.')) s = s.slice(0, -1);
    return s;
  }
  function parseAnswer(raw, lang) {
    if (raw == null) return { ok: false, reason: 'empty' };
    let s = String(raw).trim().replace(/^=/, '').trim();
    if (!s) return { ok: false, reason: 'empty' };
    // "calculation = result": the answer is what comes after the last "=";
    // every earlier part that can be computed must have that same value
    let chain = null;
    if (s.includes('=')) {
      const segs = s.split('=').map(x => x.trim());
      s = segs.pop();
      if (!s) return { ok: false, reason: 'expression' };
      chain = segs.filter(Boolean).map(x => exprValue(x, lang)).filter(v => v != null);
    }
    if (/[×·*÷+():]/.test(s) || /[-−–]/.test(s.replace(/^[-−–]\s*/, ''))) return { ok: false, reason: 'expression' };
    const p = parseNumberAnswer(s, raw, lang);
    if (p.ok && chain && chain.some(v => !v.eq(p.value))) return { ok: false, reason: 'eqMismatch', value: p.value };
    return p;
  }

  /* value of a small written calculation ("(2 + 3) × 4", "12 : 3", "2,5 · 2")
   * — used only to check a pupil's "calculation = result"; null if unreadable */
  function exprValue(str, lang) {
    let s = String(str).replace(/[   ]/g, ' ').replace(/(\d) (?=\d{3}(?!\d))/g, '$1').replace(/(\d)\s*[xX]\s*(?=[\d(])/g, '$1×');
    const toks = [], re = /\s*(?:([\d.,]+)|([+\-−–×·*÷:\/()]))/y;
    let m; re.lastIndex = 0;
    while (re.lastIndex < s.length && (m = re.exec(s))) {
      if (m[1] != null) {
        const n = normaliseNumber(m[1], lang); if (n == null) return null;
        let q = Q.fromDecimalString(n);
        if (toks.length && toks[toks.length - 1] === 'neg') { toks.pop(); q = q.mul(-1); }
        toks.push(q);
      } else {
        const c = m[2], op = /[-−–]/.test(c) ? '-' : /[×·*]/.test(c) ? '*' : /[÷:\/]/.test(c) ? '/' : c;
        const prev = toks[toks.length - 1];
        if (op === '-' && (prev == null || prev === '(' || ['+', '-', '*', '/'].includes(prev))) toks.push('neg');
        else toks.push(op);
      }
    }
    if (/\S/.test(s.slice(re.lastIndex)) || !toks.length || toks.includes('neg')) return null;
    try { return MQ.evalExpr ? MQ.evalExpr(toks) : null; } catch (e) { return null; }
  }

  function parseNumberAnswer(s, raw, lang) {
    // trailing unit
    let unit = null;
    const um = /^(.*?)[\s]*([a-zA-Z€%°²³]+[23²³]?\.?)$/.exec(s);
    if (um && um[1] && /[\d)]$/.test(um[1].trim())) {
      const key = um[2].toLowerCase();
      if (UNIT_ALIASES[key]) { unit = UNIT_ALIASES[key]; s = um[1].trim(); }
      else return { ok: false, reason: 'unknownUnit', unitText: um[2] };
    }
    const leadEuro = /^€\s*(.*)$/.exec(s); if (leadEuro) { unit = '€'; s = leadEuro[1]; }
    // mixed number "1 1/2"
    let m = /^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
    if (m) { const d = +m[3]; if (!d) return { ok: false, reason: 'zeroDen' }; return { ok: true, value: new Q(+m[1] * d + (m[1].startsWith('-') ? -1 : 1) * +m[2], d), unit, form: 'mixed', num: +m[2], den: d, raw }; }
    m = /^(-?[\d.,\s]+)\s*\/\s*([\d.,\s]+)$/.exec(s);
    if (m) {
      const a = normaliseNumber(m[1], lang), b = normaliseNumber(m[2], lang);
      if (a == null || b == null) return { ok: false, reason: 'notNumber' };
      const qa = Q.fromDecimalString(a), qb = Q.fromDecimalString(b);
      if (qb.n === 0) return { ok: false, reason: 'zeroDen' };
      const intForm = qa.isInt() && qb.isInt();
      return { ok: true, value: qa.div(qb), unit, form: 'fraction', num: intForm ? qa.n : null, den: intForm ? qb.n : null, raw };
    }
    const n = normaliseNumber(s, lang);
    if (n == null) return { ok: false, reason: 'notNumber' };
    return { ok: true, value: Q.fromDecimalString(n), unit, form: n.includes('.') ? 'decimal' : 'integer', raw };
  }

  /* time "hh:mm" (also hh.mm, hh h mm, hhhmm) -> minutes since 00:00 */
  function parseTime(raw) {
    const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
    const m = /^(\d{1,2})(?::|\.|h|u)?(\d{2})?(?:h|uhr|auer)?$/.exec(s);
    if (!m) return null;
    const h = +m[1], mi = m[2] ? +m[2] : 0;
    if (h > 24 || mi > 59) return null;
    return h * 60 + mi;
  }
  function fmtTime(minutes) {
    const m = ((minutes % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  /* dates as DD.MM.YYYY */
  function fmtDate(y, m, d) { return String(d).padStart(2, '0') + '.' + String(m).padStart(2, '0') + '.' + y; }
  function parseDate(raw) {
    const m = /^\s*(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\s*$/.exec(String(raw || ''));
    if (!m) return null; return { d: +m[1], m: +m[2], y: +m[3] };
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function dayIndex(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / 86400000); }

  /* ---------------- tiny string hash (PIN, seeds) ---------------- */
  function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  Object.assign(MQ, { gcd, lcm, divisors, isPrime, digitSum, Q, RNG, LOCALE, fmtNum, parseAnswer, normaliseNumber, parseTime, fmtTime, fmtDate, parseDate, daysInMonth, dayIndex, hashStr, UNIT_ALIASES });
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
