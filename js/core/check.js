/* =====================================================================
 * check.js — answer checking (pure, no DOM; used by the UI and by the
 * self-test). A "response" is the pupil's answer in widget-specific form:
 *   input     { fields: { id: "text typed" } }
 *   mc        { choice: index }            multi { choices: [i, …] }
 *   order     { order: [itemIndex, …] }    bins  { bins: [binIndex per item] }
 *   match     { pairs: [rightIndex per left item] }
 *   shade     { shaded: [cellId, …] }      numberline { tick: i }
 *   point     { points: [[x,y], …] }       cells { cells: ["x,y", …] }
 *   tf        { value: true|false, reason: index }
 *   mistake   { step: index, fields: {…} } bars  { values: [v, …] }
 * Result: { correct, partial?, fb: msg|null, fieldOk?: {id: bool} }
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};

  function checkField(f, raw, lang) {
    const Q = MQ.Q;
    if (raw == null || String(raw).trim() === '') return { ok: false, fb: { k: 'fb.empty' } };
    if (f.kind === 'time') {
      const v = MQ.parseTime(raw); if (v == null) return { ok: false, fb: { k: 'fb.timeFormat' } };
      return { ok: v === f.expect % 1440 || v === f.expect, value: v };
    }
    if (f.kind === 'date') {
      const v = MQ.parseDate(raw); if (!v) return { ok: false, fb: { k: 'fb.dateFormat' } };
      return { ok: v.d === f.expect.d && v.m === f.expect.m && v.y === f.expect.y, value: v };
    }
    if (f.kind === 'text') {
      const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
      return { ok: [].concat(f.expect).map(norm).includes(norm(raw)) };
    }
    // numeric
    const p = MQ.parseAnswer(raw, lang);
    if (!p.ok) return { ok: false, value: p.value, fb: { k: { unknownUnit: 'fb.unknownUnit', expression: 'fb.onlyResult', eqMismatch: 'fb.eqMismatch' }[p.reason] || 'fb.notNumber' } };
    if (p.unit && f.unit && p.unit !== f.unit && !(f.unit === '€' && p.unit === '€')) return { ok: false, fb: { k: 'fb.wrongUnit', v: { unit: MQ.unitStr(f.unit) } }, value: p.value };
    // the box has no unit (it is written next to it, or none is wanted): a typed unit is not checked, so ask for the number alone
    if (p.unit && !f.unit && p.unit !== '%') return { ok: false, fb: { k: 'fb.numberOnly' }, value: p.value };
    const targets = [f.expect].concat(f.alt || []).map(x => Q.of(x));
    const valueOk = targets.some(t => t.eq(p.value));
    if (!valueOk) return { ok: false, value: p.value, parsed: p };
    if (f.form === 'irreducible') {
      if (p.form === 'integer' && p.value.isInt()) return { ok: true, value: p.value };
      if (p.form !== 'fraction' || p.num == null) return { ok: false, value: p.value, fb: { k: 'fb.wantFraction' } };   // "1 1/2", "1,5": right value, other form
      if (MQ.gcd(p.num, p.den) !== 1) return { ok: false, value: p.value, fb: { k: 'fb.notReduced' } };
    }
    if (f.form === 'fraction' && p.form !== 'fraction' && !(p.value.isInt() && f.allowInt)) return { ok: false, value: p.value, fb: { k: 'fb.wantFraction' } };
    if (f.form === 'decimal' && p.form === 'fraction') return { ok: false, value: p.value, fb: { k: 'fb.wantDecimal' } };
    if (f.denominator && p.den !== f.denominator) return { ok: false, value: p.value, fb: { k: 'fb.wantDenominator', v: { d: f.denominator } } };
    return { ok: true, value: p.value };
  }

  const FORMAL = ['fb.empty', 'fb.notNumber', 'fb.timeFormat', 'fb.dateFormat', 'fb.onlyResult', 'fb.unknownUnit', 'fb.numberOnly', 'fb.notReduced', 'fb.wantFraction', 'fb.wantDecimal', 'fb.wantDenominator'];
  MQ.FORMAL_FB = FORMAL;
  function checkFields(fields, resp, lang, ex) {
    const fieldOk = {}; let fb = null; const values = {};
    fields.forEach(f => {
      const r = checkField(f, (resp.fields || {})[f.id], lang);
      fieldOk[f.id] = r.ok; values[f.id] = r.value;
      if (!r.ok && r.fb && !fb) fb = r.fb;
    });
    const correct = fields.every(f => fieldOk[f.id]);
    // "formal": every wrong box only has a form problem (unknown unit, fraction not simplified …) — this does not use up a try
    const fbs = fields.filter(f => !fieldOk[f.id]).map(f => checkField(f, (resp.fields || {})[f.id], lang).fb);
    const formal = !correct && fbs.every(x => x && FORMAL.includes(x.k));
    if (!correct && !fb && ex && ex.diagnose) { try { fb = ex.diagnose(values, resp) || null; } catch (e) { fb = null; } }
    return { correct, fieldOk, fb, values, formal };
  }

  function check(ex, resp, lang) {
    const w = ex.widget; resp = resp || {};
    switch (w.type) {
      case 'input': {
        if (w.custom) return w.custom(resp, lang);
        return checkFields(w.fields, resp, lang, ex);
      }
      case 'mc': {
        const o = w.options[resp.choice];
        if (!o) return { correct: false, fb: { k: 'fb.chooseOne' } };
        return { correct: !!o.correct, fb: o.correct ? null : (o.why || null) };
      }
      case 'multi': {
        const set = new Set(resp.choices || []);
        const correct = w.options.every((o, i) => !!o.correct === set.has(i));
        const missed = w.options.some((o, i) => o.correct && !set.has(i)), extra = w.options.some((o, i) => !o.correct && set.has(i));
        return { correct, fb: correct ? null : { k: extra ? (w.extraFb || 'fb.multiExtra') : 'fb.multiMissing' } };
      }
      case 'order': {
        const ord = resp.order || [];
        const keys = ord.map(i => MQ.Q.of(w.items[i].key));
        let ok = ord.length === w.items.length;
        for (let i = 1; ok && i < keys.length; i++) ok = w.desc ? keys[i - 1].gt(keys[i]) : keys[i - 1].lt(keys[i]);
        return { correct: ok, fb: ok ? null : (ex.orderFb || { k: 'fb.order' }) };
      }
      case 'bins': {
        const b = resp.bins || [];
        const ok = w.items.every((it, i) => b[i] === it.bin);
        return { correct: ok, fb: ok ? null : { k: b.some(x => x == null) ? 'fb.binsIncomplete' : 'fb.bins' } };
      }
      case 'match': {
        const p = resp.pairs || [];
        const ok = w.left.every((_, i) => p[i] === i);
        return { correct: ok, fb: ok ? null : { k: 'fb.match' } };
      }
      case 'shade': {
        const n = (resp.shaded || []).length;
        const ok = w.check ? w.check(resp.shaded || []) : n === w.target;
        return { correct: ok, fb: ok ? null : (ex.diagnose ? ex.diagnose({ count: n }, resp) : null) || { k: 'fb.shadeCount', v: { n } } };
      }
      case 'numberline': {
        const ok = resp.tick === w.target;
        return { correct: ok, fb: ok ? null : (ex.diagnose ? ex.diagnose({ tick: resp.tick }, resp) : null) };
      }
      case 'point': {
        const pts = resp.points || [];
        if (w.check) return w.check(pts);
        const want = w.targets.map(p => p.join(','));
        const got = pts.map(p => p.join(','));
        const ok = want.length === got.length && want.every(p => got.includes(p));
        let fb = null;
        if (!ok && pts.length === 1 && w.targets.length === 1 && pts[0][0] === w.targets[0][1] && pts[0][1] === w.targets[0][0]) fb = { k: 'fb.swapXY' };
        return { correct: ok, fb };
      }
      case 'cells': {
        const r = w.check(new Set(resp.cells || []));
        return typeof r === 'object' ? r : { correct: !!r, fb: r ? null : (w.fb || null) };
      }
      case 'tf': {
        const vOk = resp.value === w.truth;
        const rOk = !w.reasons || (w.reasons[resp.reason] && w.reasons[resp.reason].correct);
        return { correct: vOk && rOk, partial: vOk && !rOk, fb: !vOk ? (w.wrongFb || null) : (!rOk ? { k: 'fb.reason' } : null) };
      }
      case 'mistake': {
        if (resp.step !== w.wrongStep) return { correct: false, fb: (w.stepFb && w.stepFb[resp.step]) || { k: 'fb.mistakeStep' } };
        if (!w.fields || !w.fields.length) return { correct: true };
        const r = checkFields(w.fields, resp, lang, ex);
        return { correct: r.correct, partial: !r.correct, fb: r.correct ? null : (r.fb || { k: 'fb.mistakeFix' }) };
      }
      case 'bars': {
        const v = resp.values || [];
        const ok = w.target.every((t, i) => v[i] === t);
        return { correct: ok, fb: ok ? null : { k: 'fb.bars' } };
      }
    }
    throw new Error('unknown widget ' + w.type);
  }

  /* The canonical (correct) response for an exercise — used by the
   * self-test and by "show me the answer" in worked examples.           */
  function canonical(ex, lang) {
    const w = ex.widget;
    const fmtField = f => {
      if (f.kind === 'time') return MQ.fmtTime(f.expect);
      if (f.kind === 'date') return MQ.fmtDate(f.expect.y, f.expect.m, f.expect.d);
      if (f.kind === 'text') return [].concat(f.expect)[0];
      const q = MQ.Q.of(f.expect);
      if (f.form === 'irreducible' || f.form === 'fraction') return q.isInt() && f.form === 'irreducible' ? String(q.n) : (f.denominator ? (q.n * f.denominator / q.d) + '/' + f.denominator : q.n + '/' + q.d);
      if (q.decimalPlaces() < 0 || (q.decimalPlaces() > 3 && f.form !== 'decimal')) return q.n + '/' + q.d;
      return MQ.fmtNum(q, lang).replace(/\./g, lang === 'en' ? '.' : '').replace(/,/g, lang === 'en' ? '' : ',');
    };
    const fields = fs => { const o = {}; (fs || []).forEach(f => o[f.id] = fmtField(f)); return o; };
    switch (w.type) {
      case 'input': return w.canonical ? w.canonical(lang) : { fields: fields(w.fields) };
      case 'mc': return { choice: w.options.findIndex(o => o.correct) };
      case 'multi': return { choices: w.options.map((o, i) => o.correct ? i : -1).filter(i => i >= 0) };
      case 'order': return { order: w.items.map((it, i) => i).sort((a, b) => { const c = MQ.Q.of(w.items[a].key).cmp(w.items[b].key); return w.desc ? -c : c; }) };
      case 'bins': return { bins: w.items.map(it => it.bin) };
      case 'match': return { pairs: w.left.map((_, i) => i) };
      case 'shade': return { shaded: w.canonical ? w.canonical() : Array.from({ length: w.target }, (_, i) => w.cellIds ? w.cellIds[i] : i) };
      case 'numberline': return { tick: w.target };
      case 'point': return { points: w.canonical ? w.canonical() : w.targets.map(p => p.slice()) };
      case 'cells': return { cells: w.canonical() };
      case 'tf': return { value: w.truth, reason: w.reasons ? w.reasons.findIndex(r => r.correct) : undefined };
      case 'mistake': return { step: w.wrongStep, fields: fields(w.fields) };
      case 'bars': return { values: w.target.slice() };
    }
  }

  MQ.check = check; MQ.checkField = checkField; MQ.canonical = canonical;
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
