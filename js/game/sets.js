/* =====================================================================
 * sets.js — exercise sets.
 *  • Sets made by an adult in the dashboard: a fixed list of exercises
 *    (template, level, seed), so every pupil gets exactly the same ones;
 *    assigned to one or more pupils. Stored in G.data.sets.
 *  • Quick sets a pupil makes for one topic: generated on the spot.
 * A pupil's work on a set (a "run") is stored in the profile
 * (p.setRuns), so the pupil can stop, come back, move between exercises
 * and redo the ones that went wrong. Pure data, no DOM.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const G = MQ.game;
  const stageOfTpl = (tp, stages) => [tp.stage].concat(tp.stages || []).find(s => stages.includes(s)) || tp.stage;

  const S = MQ.sets = {
    MAX_QUICK: 6,
    all() { return G.data.sets || (G.data.sets = []); },
    byId(id) { return S.all().find(s => s.id === id) || null; },

    /* Pick `count` exercises from the given stages. level: 1–5, 'mix' (rises 1→4
     * across the set), 'mixx' (rises 2→5, the last quarter extreme) or 'mine'
     * (each stage at the pupil's current level). Level 5 = extreme problems. */
    makeItems(stages, level, count, seed, p) {
      const r = MQ.RNG(seed >>> 0); const items = []; let lastTpl = null;
      for (let i = 0; i < count; i++) {
        const sid = stages[i % stages.length];
        let L = level === 'mix' ? Math.min(4, 1 + Math.floor(4 * i / count)) : level === 'mixx' ? Math.min(5, 2 + Math.floor(4 * i / count)) : level === 'mine' ? (p ? G.stage(p, sid).level : 1) : +level;
        let tpls = MQ.T.forStage(sid, L); if (!tpls.length) { L = Math.min(L, 4); tpls = MQ.T.forStage(sid, L); }
        const pool = tpls.length > 1 ? tpls.filter(tp => tp.id !== lastTpl) : tpls;
        const tp = r.pick(pool); lastTpl = tp.id;
        items.push({ tpl: tp.id, level: L, seed: r.int(1, 2 ** 30), stage: stageOfTpl(tp, [sid]) });
      }
      return items;
    },
    create(name, stages, level, count) {
      const set = { id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: String(name || '').trim().slice(0, 60) || '—', stages: stages.slice(), level, created: new Date().toISOString().slice(0, 10), assigned: [], items: S.makeItems(stages, level, count, (Date.now() ^ (Math.random() * 1e9)) >>> 0) };
      S.all().push(set); G.save(); return set;
    },
    remove(id) { G.data.sets = S.all().filter(s => s.id !== id); G.profiles().forEach(p => { if (p.setRuns) delete p.setRuns['s:' + id]; }); G.save(); },
    toggleAssign(id, pid, on) { const s = S.byId(id); if (!s) return; s.assigned = s.assigned.filter(x => x !== pid); if (on) s.assigned.push(pid); G.save(); },
    forPupil(p) { return S.all().filter(s => s.assigned.includes(p.id)); },

    /* ---- runs (a pupil's work on a set) ---- */
    runs(p) { return p.setRuns || (p.setRuns = {}); },
    run(p, key) {
      const R = S.runs(p);
      if (!R[key] && key.startsWith('s:')) { const s = S.byId(key.slice(2)); if (!s) return null; R[key] = { key, name: s.name, items: s.items.map(x => ({ ...x })), state: s.items.map(() => ({})), pos: 0, started: Date.now(), updated: Date.now() }; G.save(); }
      return R[key] || null;
    },
    quick(p, stage, count, level) {
      const key = 'q:' + Date.now().toString(36);
      const items = S.makeItems([stage], level, count, (Date.now() ^ (Math.random() * 1e9)) >>> 0, p);
      S.runs(p)[key] = { key, stage, name: null, items, state: items.map(() => ({})), pos: 0, started: Date.now(), updated: Date.now() };
      const quick = Object.values(S.runs(p)).filter(r => r.key.startsWith('q:')).sort((a, b) => b.updated - a.updated);
      quick.slice(S.MAX_QUICK).forEach(r => delete S.runs(p)[r.key]);
      G.save(); return key;
    },
    restart(p, key) {
      const r = S.runs(p)[key]; if (!r) return;
      if (key.startsWith('s:')) { delete S.runs(p)[key]; S.run(p, key); }
      else { r.state = r.items.map(() => ({})); r.pos = 0; r.updated = Date.now(); G.save(); }
    },
    deleteRun(p, key) { delete S.runs(p)[key]; G.save(); },
    summary(run) {
      const st = run.state; const n = st.length;
      const done = st.filter(s => s.done).length;
      const first = st.filter(s => s.done && s.correct && s.firstTry).length;
      const later = st.filter(s => s.done && s.correct && !s.firstTry).length;
      const skipped = st.filter(s => !s.done && s.skipped).length;
      return { n, done, first, later, skipped, correct: first + later, wrong: done - first - later, complete: done + skipped === n };
    }
  };
  if (typeof module !== 'undefined') module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
