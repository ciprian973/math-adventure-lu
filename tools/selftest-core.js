/* =====================================================================
 * selftest-core.js — automated checks, shared by the Node runner
 * (tools/selftest.js) and the browser page (selftest.html).
 * For every template and every level it generates N random instances
 * (default 1000) and checks:
 *   • generation never throws; structure is complete (prompt, 3 hints,
 *     explanation, answer);
 *   • the answer key: the canonical answer, typed in EACH language with
 *     that language's decimal separator, is accepted by the checker;
 *   • typical wrong answers listed by the template are rejected;
 *   • multiple choice: exactly one correct option, all options distinct
 *     in every language; order items distinct; bins/match consistent;
 *   • value ranges declared by the template (e.g. remainder < divisor);
 *   • every text renders in all 5 languages with no missing key, no
 *     unresolved {placeholder}, no "undefined"/"NaN";
 *   • template self-checks (e.g. cube nets verified by folding).
 * Global checks: same keys and same placeholders in all 5 language
 * files, number words, curriculum coverage.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ;
  const LANGS = ['ro', 'en', 'fr', 'de', 'lb'];
  const BAD = /⟦|undefined|NaN|\[object Object\]|\{[a-zA-Z]\w*\}|\[\[|\]\]/;

  function textsOf(ex, lang) {
    const out = []; const add = (what, m) => { if (m == null) return; out.push([what, typeof m === 'object' && !m.k && !Array.isArray(m) ? MQ.fmtVal(m, lang) : MQ.tm(m, lang)]); };
    add('prompt', ex.prompt); (ex.hints || []).forEach((hh, i) => add('hint' + i, hh)); add('explain', ex.explain); add('answer', ex.answer);
    const f = ex.figure; if (f) out.push(['figure', typeof f === 'function' ? f(lang) : typeof f === 'string' ? f : MQ.fmtVal(f.htmlFig, lang)]);
    const w = ex.widget;
    (w.options || []).forEach((o, i) => add('opt' + i, o.label));
    (w.fields || []).forEach((fl, i) => fl.label && add('field' + i, fl.label));
    (w.items || []).forEach((it, i) => add('item' + i, it.label));
    (w.bins || []).forEach((b, i) => add('bin' + i, b));
    (w.left || []).forEach((b, i) => add('left' + i, b)); (w.right || []).forEach((b, i) => add('right' + i, b));
    (w.steps || []).forEach((b, i) => add('step' + i, b));
    (w.reasons || []).forEach((b, i) => add('reason' + i, b.label));
    if (w.labelsFn) out.push(['labels', w.labelsFn(lang).join('|')]);
    return out;
  }

  /* grammar of counts: "1 <plural>" is wrong everywhere; Romanian needs "de" from 20 on (20 de minute, 101 minute) */
  const PLURALS = {"en": ["squares", "days", "minutes", "parts", "people", "cubes", "teeth", "stickers", "visitors", "vertices", "steps", "faces", "exercises", "children", "tenths", "rectangles", "pupils", "pages", "layers", "edges", "weeks", "teachers", "points", "litres", "jerseys", "eggs", "decimals", "croissants", "coins", "bars", "balls", "rides", "hours", "groups"], "fr": ["carreaux", "jours", "minutes", "parts", "cases", "personnes", "cubes", "tours", "autocollants", "visiteurs", "sommets", "exercices", "enfants", "dents", "élèves", "rectangles", "pages", "dixièmes", "couches", "carrés", "arêtes", "semaines", "poissons", "points", "maillots", "litres", "heures", "groupes", "barres", "ballons", "attractions", "pièces", "croissants", "faces", "étapes"], "de": ["Tage", "Tagen", "Minuten", "Teile", "Teilen", "Personen", "Kinder", "Zähne", "Schritte", "Flächen", "Ecken", "Aufgaben", "Seiten", "Schichten", "Rechtecke", "Quadrate", "Kanten", "Wochen", "Trikots", "Punkte", "Münzen", "Fische", "Fahrgeschäfte", "Eier", "Bälle", "Würfeln", "Stunden", "Gruppen"], "lb": ["Deeg", "Minutten", "Minutte", "Deeler", "Kanner", "Zänn", "Wierfelen", "Wierfele", "Persounen", "Persoune", "Flächen", "Ecken", "Aufgaben", "Säiten", "Schichten", "Rechtecker", "Quadrater", "Kanten", "Wochen", "Punkten", "Mënzen", "Eeër", "Bäll", "Visiteuren", "Visiteure", "Attraktiounen", "Trikoten", "Fielder", "Stonnen", "Gruppen"], "ro": ["pătrățele", "zecimale", "zile", "ore", "minute", "secunde", "cuburi", "fețe", "vârfuri", "muchii", "copii", "elevi", "părți", "exerciții", "cifre", "poziții", "săptămâni", "pagini", "pași", "persoane", "ture", "dinți", "litri", "abțibilduri", "bare", "grupe", "straturi", "dreptunghiuri", "unități", "pești", "chifle", "cornuri", "pasageri", "profesori", "atracții", "puncte", "șabloane", "zecimi", "ouă", "ori"]};
  const RX = {};
  const grammar = (lang, txt) => {
    if (!/\d/.test(txt)) return [];
    const out = []; const plain = MQ.stripHtml(txt);
    const re = RX[lang] || (RX[lang] = new RegExp('(^|[^\\d,.])(\\d+) (' + PLURALS[lang].join('|') + ')(?![\\wăîșțâäöüëéèêàç])', 'g')); re.lastIndex = 0; let mm;
    while ((mm = re.exec(plain))) { const n = +mm[2];
      if (n === 1 || (lang === 'fr' && n === 0)) out.push('singular needed: "' + mm[2] + ' ' + mm[3] + '"');
      if (lang === 'ro' && n > 0 && (n % 100 === 0 || n % 100 >= 20)) out.push('Romanian needs "de": "' + mm[2] + ' ' + mm[3] + '"'); }
    if (lang === 'ro') { const re2 = RX.ro2 || (RX.ro2 = new RegExp('(^|[^\\d,.])(\\d+) de (' + PLURALS.ro.join('|') + ')(?![\\wăîșțâ])', 'g')); re2.lastIndex = 0; while ((mm = re2.exec(plain))) { const n = +mm[2]; if (n % 100 > 0 && n % 100 < 20) out.push('Romanian "de" not wanted: "' + mm[0].trim() + '"'); } }
    return out;
  };
  function checkExercise(ex, errs, tag) {
    const w = ex.widget; const e = m => errs.push(tag + ': ' + m);
    if (!ex.prompt) e('no prompt'); if (!ex.hints || ex.hints.length !== 3) e('needs 3 hints'); if (!ex.explain) e('no explanation'); if (!ex.answer) e('no answer text');
    if (!w || !MQ.widgets_types.includes(w.type)) { e('unknown widget ' + (w && w.type)); return; }
    if (w.type === 'mc') { const n = w.options.filter(o => o.correct).length; if (n !== 1) e('mc has ' + n + ' correct options'); if (w.options.length < 2) e('mc needs ≥2 options'); }
    if (w.type === 'multi' && !w.options.some(o => o.correct)) e('multi has no correct option');
    if (w.type === 'order') { const ks = w.items.map(it => MQ.Q.of(it.key).toString()); if (new Set(ks).size !== ks.length) e('order keys not distinct'); }
    if (w.type === 'bins') { if (w.items.some(it => !(it.bin >= 0 && it.bin < w.bins.length))) e('bad bin index'); }
    if (w.type === 'match' && w.left.length !== w.right.length) e('match sizes differ');
    if (w.type === 'tf' && w.reasons && w.reasons.filter(r => r.correct).length !== 1) e('tf needs exactly one correct reason');
    if (w.type === 'mistake' && !(w.wrongStep >= 0 && w.wrongStep < w.steps.length)) e('mistake step out of range');
    if (ex.chainCheck && !ex.chainCheck()) e('later lines do not carry the wrong result consistently');
    if (w.type === 'numberline' && !(w.target > 0 && w.target < w.ticks)) e('numberline target at an end/outside');
    (w.fields || []).forEach(f => { if (f.kind === 'num' || !f.kind) { const q = MQ.Q.of(f.expect); if (q.n < 0) e('negative answer ' + q); if (f.form === 'decimal' && q.decimalPlaces() < 0) e('decimal answer expected but value is ' + q); if (f.form === 'decimal' && q.decimalPlaces() > 3) e('more than 3 decimals: ' + q.toDecimalString()); if (ex.decimalsOnly && q.decimalPlaces() > 3) e('more than 3 decimals: ' + q.toDecimalString()); } });
    (ex.ranges || []).forEach(([nm, v, lo, hi]) => { if (!(v >= lo && v <= hi)) e(`range ${nm}=${v} not in [${lo},${hi}]`); });
    if (ex.selfCheck && !ex.selfCheck()) e('template self-check failed');
    LANGS.forEach(lang => {
      // answer key round trip in this language
      let res; try { res = MQ.check(ex, MQ.canonical(ex, lang), lang); } catch (x) { e(lang + ' check threw ' + x.message); return; }
      if (!res.correct) e(`${lang}: canonical answer rejected (${JSON.stringify(MQ.canonical(ex, lang))})`);
      // equivalent forms of the same number must be accepted too
      if (w.type === 'input' && !w.custom) (w.fields || []).forEach(f => {
        if (f.kind && f.kind !== 'num') return; const q = MQ.Q.of(f.expect); const variants = [];
        if (!f.form || f.form === 'any') { if (!q.isInt()) variants.push(q.n + '/' + q.d); if (q.isInt() && q.n >= 1000) variants.push(String(q.n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')); if (q.decimalPlaces() > 0 && q.decimalPlaces() !== 3 && lang !== 'en') variants.push(q.toDecimalString()); }
        if (f.unit && f.unit !== '€') variants.push(MQ.canonical(ex, lang).fields[f.id] + ' ' + MQ.unitStr(f.unit));
        if (f.unit === '€') variants.push(MQ.canonical(ex, lang).fields[f.id] + ' €');
        variants.forEach(vv => { const resp = MQ.canonical(ex, lang); resp.fields[f.id] = vv; if (!MQ.check(ex, resp, lang).correct) e(`${lang}: equivalent answer rejected ${JSON.stringify(vv)} for ${q}`); });
      });
      (ex.wrong || []).forEach(wr => { try { if (MQ.check(ex, wr, lang).correct) e(`${lang}: wrong answer accepted ${JSON.stringify(wr)}`); } catch (x) { e(lang + ' wrong check threw ' + x.message); } });
      // rendering
      textsOf(ex, lang).forEach(([what, s]) => { if (typeof s !== 'string' || BAD.test(s)) e(`${lang} ${what} renders badly: ${String(s).slice(0, 160)}`); else if (what !== 'figure') grammar(lang, s).forEach(g => e(`${lang} ${what}: ${g}`)); });
      if (w.type === 'mc') { const labels = w.options.map(o => MQ.stripHtml(MQ.tm(o.label, lang)) + '|' + (o.fig || '')); if (new Set(labels).size !== labels.length) e(`${lang}: duplicate MC options ${labels.join(' / ').slice(0, 200)}`); }
    });
  }

  // keys whose wording legitimately uses different variables in some languages (grammar: genitive forms etc.)
  const PLACEHOLDER_VARIANTS = new Set(['t.dec_count.qDigit', 't.dec_count.ex4b', 't.dec_count.exCount', 't.dec_count.exDigit']);
  function placeholders(s) { return [...new Set((String(s).replace(/\{(MUL|DIV)\}/g, '').replace(/\[\[(\w+)\|/g, '{$1}').match(/\{\w+\}/g) || []))].sort().join(','); }

  function run({ n = 1000, log = console.log } = {}) {
    const t0 = Date.now(); const report = { templates: 0, instances: 0, errors: [], perTemplate: {} };
    MQ.widgets_types = ['input', 'mc', 'multi', 'order', 'bins', 'match', 'shade', 'numberline', 'point', 'cells', 'tf', 'mistake', 'bars'];
    // ---- language files
    const D = root.I18N_DATA; const base = Object.keys(D.en);
    LANGS.forEach(l => { const ks = Object.keys(D[l] || {}); base.forEach(k => { if (D[l][k] == null) report.errors.push(`lang ${l}: missing key ${k}`); else if (!PLACEHOLDER_VARIANTS.has(k) && placeholders(D[l][k]) !== placeholders(D.en[k])) report.errors.push(`lang ${l}: placeholders differ in ${k}: ${placeholders(D[l][k])} vs ${placeholders(D.en[k])}`); }); ks.forEach(k => { if (D.en[k] == null) report.errors.push(`lang ${l}: extra key ${k}`); }); });
    // dynamic keys used by the UI
    const need = [];
    MQ.MAP.regions.forEach(r => { need.push('region.' + r.id, 'region.' + r.id + '.intro', 'domain.' + r.domain); r.stages.forEach(s => need.push('stage.' + s, 'stage.' + s + '.d')); });
    MQ.MAP.badges.forEach(b => need.push('badge.' + b.id, 'badge.' + b.id + '.d')); MQ.T.list.forEach(tp => need.push('t.' + tp.id + '.title'));
    Object.entries(MQ.MAP.avatar).forEach(([k, arr]) => { need.push('av.' + k); arr.forEach(it => need.push('av.' + k + '.' + it.id)); });
    ['stage', 'level3', 'nohint'].forEach(q => need.push('quest.' + q)); MQ.game && MQ.game.LEAGUES && MQ.game.LEAGUES.forEach(l => need.push('league.' + l.id)); for (let i = 1; i <= 8; i++) need.push('praise.' + i); [1, 2, 3, 4].forEach(L => need.push('lvl.' + L, 'lvl.' + L + '.d'));
    ['rolls', 'tickets', 'apples', 'price'].forEach(c => need.push('t.prop_table.h.' + c)); [8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3].forEach(p => need.push('pv.h.' + p));
    LANGS.forEach(l => need.forEach(k => { if (D[l][k] == null) report.errors.push(`lang ${l}: missing UI key ${k}`); }));
    // stages with no template
    MQ.MAP.regions.forEach(r => r.stages.forEach(s => { if (!MQ.T.forStage(s).length) report.errors.push('stage without templates: ' + s); }));
    // ---- number words sanity
    LANGS.forEach(l => { for (let i = 0; i < 1000; i++) { const w = MQ.numwords.integer(i, l); if (!w || /undefined/.test(w)) report.errors.push(`numwords ${l} ${i}`); } });
    // ---- templates
    MQ.T.list.forEach(tp => {
      report.templates++; let c = 0, bad = 0;
      tp.levels.forEach(L => {
        for (let s = 1; s <= n; s++) {
          const seed = (s * 2654435761 + L * 97 + tp.id.length) >>> 0; const tag = `${tp.id} L${L} seed ${seed}`; const errs = [];
          try { const ex = MQ.T.make(tp.id, L, seed); checkExercise(ex, errs, tag); } catch (x) { errs.push(tag + ': generation threw ' + x.message); }
          c++; if (errs.length) { bad++; if (report.errors.length < 400) report.errors.push(...errs.slice(0, 3)); }
        }
      });
      report.instances += c; report.perTemplate[tp.id] = { instances: c, failing: bad };
    });
    // ---- curriculum coverage
    const by = {}; MQ.T.list.forEach(tp => tp.objectives.forEach(o => (by[o] = (by[o] || 0) + 1)));
    report.uncovered = MQ.CURRICULUM.allObjectives().filter(o => !by[o.id]).map(o => o.id);
    const mtBy = {}; MQ.T.list.forEach(tp => (tp.mt || []).forEach(o => (mtBy[o] = 1)));
    report.mtUncovered = MQ.CURRICULUM.mathematic.filter(o => !mtBy[o.id]).map(o => o.id + (o.scope ? ' (' + o.scope + ')' : ''));
    report.ms = Date.now() - t0;
    log(`Templates: ${report.templates} · instances: ${report.instances} (${n} per template and level) · 5 languages each · ${(report.ms / 1000).toFixed(1)} s`);
    log(`Errors: ${report.errors.length}`); report.errors.slice(0, 60).forEach(x => log('  ✗ ' + x));
    log(`Plan d'études objectives/contents without template: ${report.uncovered.length ? report.uncovered.join(', ') : 'none'}`);
    log(`MathemaTIC items without template: ${report.mtUncovered.length ? report.mtUncovered.join(', ') : 'none'}`);
    return report;
  }
  MQ.selftest = { run, checkExercise, textsOf };
  if (typeof module !== 'undefined') module.exports = MQ.selftest;
})(typeof window !== 'undefined' ? window : globalThis);
