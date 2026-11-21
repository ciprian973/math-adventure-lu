/* =====================================================================
 * game.js — profiles (localStorage), progress, XP, stars, streaks,
 * badges, daily quest, adaptive level logic and mastery per objective.
 * Only a first name/nickname and an avatar are stored: no personal data.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const KEY = 'mathAdventureLU.v1';
  const store = (() => { try { const t = '__t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; } catch (e) { const mem = {}; return { getItem: k => mem[k] || null, setItem: (k, v) => mem[k] = v, removeItem: k => delete mem[k] }; } })();

  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

  const G = MQ.game = {
    data: null,
    load() {
      let d = null; try { d = JSON.parse(store.getItem(KEY)); } catch (e) { d = null; }
      if (!d || d.v !== 1) d = { v: 1, profiles: [], active: null, settings: { lang: null, mute: false, dyslexia: false, mulSign: '×', pinHash: null, textScale: 1, rate: 0.95, contrast: false } };
      G.data = d;
      // badges moved to families with five tiers: drop old single badges, award silently what is earned now
      d.profiles.forEach(p => { if (!p.badgesV2) { p.badges = (p.badges || []).filter(b => b === 'firstStep' || b.includes(':')); p.badgesV2 = true; } G.checkBadges(p); });
      return d;
    },
    blitzUsedToday(p, sid) { return ((p.blitzDay || {})[sid]) === today(); },
    markBlitz(p, sid) { (p.blitzDay = p.blitzDay || {})[sid] = today(); G.save(); },
    save() { try { store.setItem(KEY, JSON.stringify(G.data)); } catch (e) { console.warn('save failed', e); } },
    settings() { return G.data.settings; },
    profiles() { return G.data.profiles; },
    active() { return G.data.profiles.find(p => p.id === G.data.active) || null; },
    setActive(id) { G.data.active = id; G.save(); },
    newProfile(name, avatar) {
      const p = { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: String(name).slice(0, 24), avatar: avatar || { fur: 'red', acc: 'none', bg: 'sky' }, created: today(),
        xp: 0, stages: {}, objectives: {}, errors: {}, time: { total: 0, byStage: {} }, badges: [], boss: {}, blitz: {}, assigned: [], history: [],
        streak: { days: 0, last: null }, quest: null, stats: { correct: 0, attempts: 0, noHintStreak: 0, noHintStreakBest: 0, questsDone: 0, retrySuccess: 0 } };
      G.data.profiles.push(p); G.data.active = p.id; G.save(); return p;
    },
    deleteProfile(id) { G.data.profiles = G.data.profiles.filter(p => p.id !== id); if (G.data.active === id) G.data.active = null; G.save(); },

    /* ---- per-stage state ---- */
    stage(p, sid) { if (!p.stages[sid]) p.stages[sid] = { level: 1, auto: true, attempts: 0, correct: 0, byLevel: { 1: { c: 0, a: 0 }, 2: { c: 0, a: 0 }, 3: { c: 0, a: 0 }, 4: { c: 0, a: 0 }, 5: { c: 0, a: 0 } }, recent: [], suggested: 0 }; const s = p.stages[sid]; if (!s.byLevel[5]) s.byLevel[5] = { c: 0, a: 0 }; return s; },
    /* level 5 (extreme) opens when the topic has all 3 stars */
    extremeOpen(p, sid) { return G.stars(p, sid) >= 3 && MQ.T.forStage(sid, 5).length > 0; },
    extremeCount(p) { return Object.values(p.stages).reduce((a, s) => a + ((s.byLevel || {})[5] || { c: 0 }).c, 0); },
    stars(p, sid) {
      const s = p.stages[sid]; if (!s) return 0; const b = s.byLevel;
      let st = 0; if (s.correct >= 5) st = 1;
      if (st >= 1 && b[3].c + b[4].c >= 4) st = 2;
      if (st >= 2 && b[4].c >= 3) st = 3;
      return st;
    },
    /* what is still missing for the next star of a topic (null when all 3 are there):
     * { star: 1|2|3, need: correct answers still needed, level: 0 (any) | 3 (level 3 or 4) | 4 } */
    nextStar(p, sid) {
      const n = G.stars(p, sid); if (n >= 3) return null;
      const s = p.stages[sid], b = s ? s.byLevel : { 3: { c: 0 }, 4: { c: 0 } }, c = s ? s.correct : 0;
      if (n === 0) return { star: 1, need: Math.max(1, 5 - c), level: 0 };
      if (n === 1) return { star: 2, need: Math.max(1, 4 - b[3].c - b[4].c), level: 3 };
      return { star: 3, need: Math.max(1, 3 - b[4].c), level: 4 };
    },
    regionStars(p, r) { return r.stages.reduce((a, s) => a + G.stars(p, s), 0); },

    /* ---- personal leagues (by total XP; no ranking against other children) ---- */
    LEAGUES: [{ id: 'bronze', xp: 0, icon: '🥉' }, { id: 'silver', xp: 500, icon: '🥈' }, { id: 'gold', xp: 1500, icon: '🥇' }, { id: 'platinum', xp: 3500, icon: '💠' }, { id: 'diamond', xp: 7000, icon: '💎' }, { id: 'legend', xp: 12000, icon: '👑' }],
    leagueOf(xp) { let i = 0; G.LEAGUES.forEach((l, k) => { if (xp >= l.xp) i = k; }); return i; },
    unlocked(p, it) { return it.league != null ? G.leagueOf(p.xp) >= it.league : G.levelOf(p.xp) >= (it.lvl || 1); },
    /* ---- XP and player level ---- */
    levelOf(xp) { let L = 1; while (xp >= 25 * L * (L + 1)) L++; return L; },     // 50, 150, 300, 500 …
    levelRange(L) { return [25 * (L - 1) * L, 25 * L * (L + 1)]; },

    /* ---- record an answer; returns events for the UI ---- */
    record(p, ex, ctx) {
      // ctx: { stage, correct, tries, hints, ms, fb, mode }
      const ev = { xp: 0, levelUp: false, suggestUp: false, dropDown: false, newBadges: [], questDone: false };
      const sid = ctx.stage; const st = G.stage(p, sid); const L = ex.level; if (!st.byLevel[L]) st.byLevel[L] = { c: 0, a: 0 };
      const firstTry = ctx.tries === 1;
      const starsBefore = G.stars(p, sid);
      st.attempts++; st.byLevel[L].a++; p.stats.attempts++;
      if (ctx.correct) { st.correct++; st.byLevel[L].c++; p.stats.correct++; }
      ev.starUp = G.stars(p, sid) > starsBefore ? G.stars(p, sid) : 0;
      ev.extremeOpened = ev.starUp === 3 && G.extremeOpen(p, sid);
      // XP: learning first — never negative
      let xp = ctx.correct ? (L === 5 ? 40 : 5 + 5 * L) : 0;            // XP only for correct answers (no reward for guessing)
      if (ctx.correct && !firstTry) { xp = Math.ceil(xp / 2); p.stats.retrySuccess++; }
      if (ctx.hints && xp) xp = Math.max(1, Math.ceil(xp * (1 - 0.2 * ctx.hints)));
      if (ctx.mode === 'boss') xp += ctx.correct ? 5 : 0;
      const before = G.levelOf(p.xp), lgBefore = G.leagueOf(p.xp); p.xp += xp; ev.xp = xp; ev.levelUp = G.levelOf(p.xp) > before;
      // no-hint streak
      if (ctx.correct && !ctx.hints && firstTry) { p.stats.noHintStreak++; p.stats.noHintStreakBest = Math.max(p.stats.noHintStreakBest, p.stats.noHintStreak); } else p.stats.noHintStreak = 0;
      // objectives mastery (recent window of 10)
      (ex.objectives || []).forEach(o => { const ob = p.objectives[o] || (p.objectives[o] = { c: 0, a: 0, recent: [] }); ob.a++; if (ctx.correct && firstTry) ob.c++; ob.recent.push(ctx.correct && firstTry ? 1 : 0); if (ob.recent.length > 10) ob.recent.shift(); });
      // frequent errors
      if (!ctx.correct || !firstTry) { const k = (ctx.fb && ctx.fb.k) || ('tpl:' + ex.tpl); p.errors[k] = (p.errors[k] || 0) + 1; }
      // time
      const ms = Math.min(ctx.ms || 0, 5 * 60000); p.time.total += ms; p.time.byStage[sid] = (p.time.byStage[sid] || 0) + ms;
      // history (capped)
      p.history.push({ d: today(), t: ex.tpl, L, ok: ctx.correct ? (firstTry ? 1 : 2) : 0, h: ctx.hints || 0, ms, s: sid, f: ctx.fb ? ctx.fb.k : null });
      if (p.history.length > 800) p.history.splice(0, p.history.length - 800);
      // adaptive (only in practice mode and when automatic levels are on)
      if (ctx.mode === 'practice' && L <= 4) {
        st.recent.push({ L, ok: ctx.correct && firstTry ? 1 : 0 }); if (st.recent.length > 8) st.recent.shift();
        const atL = st.recent.filter(r => r.L === L);
        const last4 = atL.slice(-4);
        if (st.auto && L < 4 && last4.length === 4 && last4.every(r => r.ok) && st.suggested !== st.attempts) { ev.suggestUp = true; st.suggested = st.attempts; }
        if (st.auto && L > 1 && L <= 4 && last4.length >= 3 && last4.filter(r => !r.ok).length >= 3) { ev.dropDown = true; st.level = L - 1; st.recent = []; }
      }
      // daily streak
      const t = today(); if (p.streak.last !== t) { p.streak.days = p.streak.last && dayDiff(p.streak.last, t) === 1 ? p.streak.days + 1 : 1; p.streak.last = t; p.stats.bestStreak = Math.max(p.stats.bestStreak || 0, p.streak.days); }
      // daily quest
      const q = G.quest(p); if (q && !q.done) { q.tasks.forEach(tk => G.questProgress(tk, ex, ctx, sid)); if (q.tasks.every(tk => tk.n >= tk.goal)) { q.done = true; p.xp += 50; ev.xp += 50; ev.questDone = true; p.stats.questsDone++; } }
      ev.leagueUp = G.leagueOf(p.xp) > lgBefore ? G.leagueOf(p.xp) : 0;
      // badges
      ev.newBadges = G.checkBadges(p);
      G.save(); return ev;
    },
    checkBadges(p) { const out = []; MQ.MAP.badges.forEach(b => { if (!p.badges.includes(b.id) && b.test(p, G)) { p.badges.push(b.id); out.push(b.id); } }); return out; },

    /* ---- daily quest: three small tasks, chosen from the date ---- */
    quest(p) {
      const t = today();
      if (!p.quest || p.quest.date !== t) {
        const r = MQ.RNG(MQ.hashStr(t + p.id));
        const allStages = MQ.MAP.regions.flatMap(rg => rg.stages);
        const pref = p.assigned && p.assigned.length ? p.assigned : allStages;
        const s1 = r.pick(pref);
        p.quest = { date: t, done: false, tasks: [
          { type: 'stage', stage: s1, goal: 5, n: 0 },
          { type: 'level3', goal: 3, n: 0 },
          { type: 'nohint', goal: 4, n: 0 }
        ] };
        G.save();
      }
      return p.quest;
    },
    questProgress(tk, ex, ctx, sid) {
      if (!ctx.correct) return;
      if (tk.type === 'stage' && sid === tk.stage) tk.n++;
      if (tk.type === 'level3' && ex.level >= 3) tk.n++;
      if (tk.type === 'nohint' && !ctx.hints && ctx.tries === 1) tk.n++;
      tk.n = Math.min(tk.n, tk.goal);
    },

    /* ---- mastery of a curriculum objective (0..1, null if not practised) */
    mastery(p, oid) {
      const ob = p.objectives[oid]; if (!ob || !ob.a) return null;
      const rec = ob.recent; return rec.reduce((a, b) => a + b, 0) / rec.length;
    },
    hashPin(pin) { return 'h' + MQ.hashStr('lux-math:' + pin).toString(36); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
