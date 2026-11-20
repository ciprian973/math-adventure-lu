/* =====================================================================
 * i18n.js — translation lookup and placeholder formatting.
 * Translation data lives ONLY in lang/<code>.js (one file per language,
 * JSON content inside a one-line wrapper so the app also works when
 * index.html is opened from disk with file://).
 *
 * String syntax (for teachers editing lang files):
 *   {name}                      value inserted (numbers get the right
 *                               decimal separator automatically)
 *   [[n|one:…|other:…]]         plural (categories from Intl.PluralRules:
 *                               ro uses one / few / other)
 *   {MUL} {DIV}                 the multiplication / division sign
 *                               chosen in the teacher settings (× or ·, :)
 *   <b>…</b>, <br>              simple HTML is allowed
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const DATA = root.I18N_DATA = root.I18N_DATA || {};
  const state = { lang: 'fr', mulSign: '×', divSign: ':' };

  const UNIT_DISPLAY = { m2: 'm²', dm2: 'dm²', cm2: 'cm²', mm2: 'mm²', m3: 'm³', dm3: 'dm³', cm3: 'cm³', mm3: 'mm³', ct: 'ct' };
  const unitStr = u => UNIT_DISPLAY[u] || u;

  function pluralCat(lang, n) {
    try { return new Intl.PluralRules(lang === 'lb' ? 'de' : lang).select(n); } catch (e) { return n === 1 ? 'one' : 'other'; }
  }

  /* format one placeholder value -------------------------------------- */
  function fmtVal(v, lang, plain) {
    const Q = MQ.Q;
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || v instanceof Q) return MQ.fmtNum(v, lang);
    if (Array.isArray(v)) return v.map(x => fmtVal(x, lang, plain)).join(lang === 'en' ? ', ' : ' ; ');
    if (v.k) return t(v.k, v.v || {}, lang, plain);                 // nested key
    if (v.frac) {                                                     // fraction n/d
      const q = v.frac; const n = v.n != null ? v.n : q.n, d = v.d != null ? v.d : q.d;
      if (plain) return n + '/' + d;
      const speak = MQ.numwords ? MQ.numwords.fraction(n, d, lang) : n + '/' + d;
      return '<span class="frac" role="math" aria-label="' + speak + '"><span class="fn">' + n + '</span><span class="fd">' + d + '</span></span>';
    }
    if (v.money) return MQ.fmtNum(v.money, lang, { places: 2 }) + ' €';
    if (v.unit) return MQ.fmtNum(v.val, lang, v.places != null ? { places: v.places } : {}) + ' ' + unitStr(v.unit);
    if (v.time != null) return MQ.fmtTime(v.time);
    if (v.date) return MQ.fmtDate(v.date.y, v.date.m, v.date.d);
    if (v.dur != null) return t('fmt.duration', { h: Math.floor(v.dur / 60), m: v.dur % 60 }, lang, plain);
    if (v.expr) return MQ.exprToString(v.expr, lang);
    if (v.wdec != null) return MQ.numwords.decimal(v.wdec, lang);
    if (v.wfrac) return MQ.numwords.fraction(v.wfrac[0], v.wfrac[1], lang);
    if (v.wint != null) return MQ.numwords.integer(v.wint, lang);
    if (v.html) return typeof v.html === 'function' ? v.html(lang) : v.html;
    if (v.raw != null) return v.raw;
    if (v.list) return v.list.map(x => fmtVal(x, lang, plain)).join(v.sep || '  ');
    return String(v);
  }

  function interpolate(str, vars, lang, plain) {
    str = str.replace(/\{MUL\}/g, state.mulSign).replace(/\{DIV\}/g, state.divSign);
    str = str.replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (all, name, forms) => {
      const raw = vars[name]; const n = raw instanceof MQ.Q ? raw.toNumber() : +raw;
      const cat = pluralCat(lang, n);
      const map = {}; forms.split('|').forEach(f => { const i = f.indexOf(':'); map[f.slice(0, i)] = f.slice(i + 1); });
      const form = map[cat] != null ? map[cat] : (map.other != null ? map.other : Object.values(map)[0]);
      return form.replace(/#/g, fmtVal(raw, lang, plain));
    });
    return str.replace(/\{(\w+)\}/g, (all, name) => name in vars ? fmtVal(vars[name], lang, plain) : all);
  }

  /* t(key, vars, lang?, plain?) */
  function t(key, vars = {}, lang = state.lang, plain = false) {
    const dict = DATA[lang] || {};
    let s = dict[key];
    if (s == null) { return '⟦' + key + '⟧'; }
    if (Array.isArray(s)) s = s.join('');
    return interpolate(s, vars, lang, plain);
  }
  function has(key, lang = state.lang) { return DATA[lang] && DATA[lang][key] != null; }
  /* resolve a message object {k, v} */
  function tm(msg, lang = state.lang, plain = false) {
    if (msg == null) return '';
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.map(m => tm(m, lang, plain)).join(' ');
    if (!msg.k) { const v = fmtVal(msg, lang); return plain ? stripHtml(v) : v; }
    return t(msg.k, msg.v || {}, lang, plain);
  }
  function stripHtml(html) {
    return String(html).replace(/<span class="frac"[^>]*aria-label="([^"]*)"[^>]*>.*?<\/span><\/span>/g, ' $1 ')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  Object.assign(MQ, {
    i18n: state, t, tm, has, fmtVal, stripHtml, unitStr,
    setLang(l) { if (DATA[l]) state.lang = l; },
    setSigns(mul) { state.mulSign = mul === '·' ? '·' : '×'; }
  });
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
