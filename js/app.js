/* =====================================================================
 * app.js — screens and navigation (vanilla JS, no framework).
 * Screens: profiles → map → region → play (practice / boss / timed)
 *          avatar, badges, settings, teacher dashboard (PIN).
 * The language can be switched on every screen; the current exercise and
 * the pupil's unfinished answer are kept.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const G = MQ.game; const W = MQ.widgets; const h = W.h;
  const $ = s => document.querySelector(s);
  const t = (k, v) => MQ.t(k, v || {});
  const tm = m => MQ.tm(m);
  const LANG_NAMES = { ro: 'Română', en: 'English', fr: 'Français', de: 'Deutsch', lb: 'Lëtzebuergesch' };
  const LEVEL_KEYS = { 1: 'lvl.1', 2: 'lvl.2', 3: 'lvl.3', 4: 'lvl.4', 5: 'lvl.5' };
  let current = { screen: 'profiles', params: {} };
  let player = null;

  /* "3 more correct answers at level 3 or 4 to the second star" */
  function nextStarText(p, sid) {
    const ns = MQ.game.nextStar(p, sid);
    return ns ? '⭐ ' + t('star.next' + ns.star, { n: ns.need }) : '🌟 ' + t('star.all');
  }
  const App = MQ.app = {
    init() {
      G.load(); const s = G.settings();
      if (!s.lang) { const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase(); s.lang = MQ.LANGS.includes(nav) ? nav : 'fr'; }
      MQ.setLang(s.lang); MQ.setSigns(s.mulSign); App.applySettings();
      App.header(); App.watchWidth();
      if (G.active()) App.go('map'); else App.go('profiles');
      if (MQ.speech.available()) speechSynthesis.onvoiceschanged = () => {};
      document.addEventListener('keydown', e => { if (e.key === 'Escape') App.closeModal(); });
      // ask the browser to keep this site's data (helps against automatic clean-up, e.g. on iPads)
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* not available */ }
      // the app open in two tabs: when the other tab saves, this one reloads instead of overwriting it later
      window.addEventListener('storage', e => { if (e.key === G.KEY) { try { sessionStorage.setItem('mq.reloaded', '1'); } catch (x) { /* ignore */ } location.reload(); } });
      let reloaded = false; try { reloaded = sessionStorage.getItem('mq.reloaded') === '1'; sessionStorage.removeItem('mq.reloaded'); } catch (x) { /* ignore */ }
      if (reloaded) setTimeout(() => App.toast('🔄 ' + t('ui.otherTab'), 6000), 300);
      if (G.loadProblem) setTimeout(() => App.modal(`<h2>⚠️ ${t('ui.loadProblemTitle')}</h2><p>${t(G.loadProblem === 'kept' ? 'ui.loadProblemKept' : 'ui.loadProblemLost')}</p>`, [{ label: t('ui.ok'), cls: 'primary' }]), 400);
      else if (G.memoryOnly()) setTimeout(() => App.toast('⚠️ ' + t('ui.memoryOnly'), 9000), 400);
    },
    applySettings() {
      const s = G.settings();
      document.documentElement.lang = s.lang === 'lb' ? 'lb' : s.lang;
      document.body.classList.toggle('dyslexia', !!s.dyslexia);
      document.body.classList.toggle('contrast', !!s.contrast);
      document.documentElement.style.setProperty('--scale', s.textScale || 1);
    },
    setLang(l) {
      const keep = player && current.screen === 'play' ? player.snapshot() : null;
      G.settings().lang = l; G.save(); MQ.setLang(l); App.applySettings(); MQ.speech.stop();
      App.header(); App.go(current.screen, current.params, keep);
    },

    /* ---------------- header (always visible) ---------------- */
    header() {
      const s = G.settings(), p = G.active();
      document.body.classList.toggle('calm', !!(p && p.calm));
      const hd = $('#topbar'); hd.innerHTML = '';
      const home = h('button', { class: 'brand', type: 'button', 'aria-label': t('ui.home') }, `${MQ.mascot(p ? p.avatar : {}, 40)}<span>${t('app.title')}</span>`);
      home.onclick = () => App.go(G.active() ? 'map' : 'profiles'); hd.appendChild(home);
      const right = h('div', { class: 'tools' });
      if (p) {
        const L = G.level(p), [a, b] = G.levelRange(L);
        const chip = h('button', { class: 'pchip', type: 'button', 'aria-label': t('ui.profileMenu') }, `<b>${esc(p.name)}</b><span class="lg" title="${t('league.' + G.LEAGUES[G.leagueOf(p.xp)].id)}">${G.LEAGUES[G.leagueOf(p.xp)].icon}</span><span class="lv">${t('ui.level', { n: L })}</span><span class="lvs">${t('ui.levelShort', { n: L })}</span><span class="xpbar" aria-hidden="true"><i style="width:${Math.max(0, Math.round(100 * (p.xp - a) / (b - a)))}%"></i></span><span class="xp">${p.xp} XP</span>${p.streak.days ? `<span class="streak" title="${t('ui.streak')}">🔥 ${p.streak.days}</span>` : ''}`);
        chip.onclick = () => App.go('profiles'); right.appendChild(chip);
      }
      const sel = h('select', { class: 'langsel', 'aria-label': t('ui.language') });
      const narrow = App.narrow();
      MQ.LANGS.forEach(l => { const o = h('option', { value: l }, narrow ? l.toUpperCase() : LANG_NAMES[l]); if (narrow) o.setAttribute('aria-label', LANG_NAMES[l]); if (l === s.lang) o.selected = true; sel.appendChild(o); });
      sel.onchange = () => App.setLang(sel.value); right.appendChild(sel);
      const mute = h('button', { class: 'icon', type: 'button', 'aria-pressed': !!s.mute, 'aria-label': t(s.mute ? 'ui.unmute' : 'ui.mute') }, s.mute ? '🔇' : '🔊');
      mute.onclick = () => { s.mute = !s.mute; G.save(); App.header(); }; right.appendChild(mute);
      const set = h('button', { class: 'icon', type: 'button', 'aria-label': t('ui.settings') }, '⚙️'); set.onclick = () => App.go('settings'); right.appendChild(set);
      const tch = h('button', { class: 'icon', type: 'button', 'aria-label': t('ui.teacher') }, '🎓'); tch.onclick = () => App.go('teacher'); right.appendChild(tch);
      hd.appendChild(right);
    },

    /* phones: compact header (language codes instead of names) */
    narrow() { try { return root.matchMedia('(max-width: 640px)').matches; } catch (e) { return false; } },
    watchWidth() { try { const mq = root.matchMedia('(max-width: 640px)'); const f = () => App.header(); mq.addEventListener ? mq.addEventListener('change', f) : mq.addListener(f); } catch (e) { /* old browser: keep the layout */ } },
    go(screen, params = {}, keep = null) {
      if (player) { player.stop(); player = null; App._player = null; }
      if (screen !== 'teacher' && MQ.dashboard) MQ.dashboard.lock();   // leaving the adult area always locks it
      current = { screen, params }; const main = $('#main'); main.innerHTML = ''; main.className = 'screen-' + screen;
      (Screens[screen] || Screens.map)(main, params, keep);
      if (screen !== 'play') main.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    },
    modal(html, buttons = [], opts = {}) {
      App.closeModal();
      const ov = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
      const box = h('div', { class: 'modal ' + (opts.cls || '') }); box.innerHTML = html;
      const row = h('div', { class: 'mbtns' });
      buttons.forEach(b => { const bt = h('button', { type: 'button', class: 'btn ' + (b.cls || '') }, b.label); bt.onclick = () => { App.closeModal(); b.fn && b.fn(); }; row.appendChild(bt); });
      box.appendChild(row); ov.appendChild(box); document.body.appendChild(ov);
      const f = box.querySelector('button, input'); f && f.focus();
      return box;
    },
    closeModal() { document.querySelectorAll('.overlay').forEach(o => o.remove()); },
    toast(html, ms = 2600) { const e = h('div', { class: 'toast', role: 'status' }, html); document.body.appendChild(e); setTimeout(() => e.classList.add('show'), 10); setTimeout(() => { e.classList.remove('show'); setTimeout(() => e.remove(), 400); }, ms); },
    calm() { const p = G.active(); return !!(p && p.calm); },   // quiet mode: no confetti, pop-ups or XP numbers (set by an adult)
    confetti() { if (App.calm()) return; const c = h('div', { class: 'confetti', 'aria-hidden': 'true' }); for (let i = 0; i < 24; i++) { const s = h('i'); s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 0.3 + 's'; s.style.background = ['#ef3340', '#00a3e0', '#ffd23f', '#3bb273', '#7b3fa0'][i % 5]; c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 1600); }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* stars 4–6 of a topic are "super stars" (another colour) */
  const stars = (n, m = 3) => `<span class="stars" aria-label="${t('ui.stars', { n, m })}">${Array.from({ length: m }, (_, i) => `<span class="${i >= n ? 'off' : i >= 3 ? 'sup' : 'on'}">★</span>`).join('')}</span>`;
  const tstars = n => stars(n, G.MAXSTARS);
  const regionOf = sid => MQ.MAP.regions.find(r => r.stages.includes(sid));

  /* =================================================================== */
  const Screens = {
    /* ---------------- who is playing? ---------------- */
    profiles(main) {
      const hero = h('div', { class: 'hero' }, `<img src="assets/img/leo-hero.webp" alt="${esc(t('ui.heroAlt'))}" width="480" height="432" onerror="this.remove()"><div class="herotext"><h1>${t('app.title')}</h1><p>${t('ui.heroSub')}</p></div>`);
      main.appendChild(hero);
      main.appendChild(h('h2', {}, t('ui.whoPlays')));
      const grid = h('div', { class: 'profgrid' });
      G.profiles().forEach(p => { const b = h('button', { class: 'prof', type: 'button' }, `${MQ.mascot(p.avatar, 84)}<b>${esc(p.name)}</b><small>${t('ui.level', { n: G.level(p) })} · ${p.xp} XP</small>`); b.onclick = () => { G.setActive(p.id); App.header(); App.go('map'); }; grid.appendChild(b); });
      const add = h('button', { class: 'prof add', type: 'button' }, `<span class="plus">+</span><b>${t('ui.newPlayer')}</b>`); add.onclick = () => App.go('newProfile'); grid.appendChild(add);
      main.appendChild(grid);
      main.appendChild(h('p', { class: 'privacy' }, t('ui.privacy')));
      const ab = h('button', { class: 'btn linkish', type: 'button' }, 'ℹ️ ' + t('ui.about')); ab.onclick = () => App.go('about'); main.appendChild(ab);
    },

    /* ---------------- about the app (presentation posters) ---------------- */
    about(main) {
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => App.go(G.active() ? 'map' : 'profiles'); main.appendChild(back);
      main.appendChild(h('h1', {}, 'ℹ️ ' + t('ui.about')));
      main.appendChild(h('p', {}, t('ui.aboutText')));
      main.appendChild(h('p', { class: 'small' }, t('ui.posterNote')));
      const g = h('div', { class: 'posters' });
      [['poster-journey', 'ui.posterAlt2'], ['poster-idea', 'ui.posterAlt1']].forEach(([f, k]) => g.appendChild(h('figure', {}, `<img src="assets/img/${f}.webp" alt="${esc(t(k))}" width="1200" height="800" loading="lazy" onerror="this.closest('figure').remove()">`)));
      main.appendChild(g);
    },
    newProfile(main) {
      main.appendChild(h('h1', {}, t('ui.newPlayer')));
      const f = h('form', { class: 'card form' });
      f.innerHTML = `<label>${t('ui.nickname')}<input name="n" maxlength="24" required autocomplete="off"></label><p class="hint">${t('ui.nicknameHint')}</p><button class="btn primary" type="submit">${t('ui.start')}</button>`;
      f.onsubmit = e => { e.preventDefault(); const n = f.n.value.trim(); if (!n) return; G.newProfile(n); App.header(); App.go('avatar', { first: true }); };
      main.appendChild(f); setTimeout(() => f.n.focus(), 50);
    },

    /* ---------------- adventure map ---------------- */
    map(main) {
      const p = G.active(); if (!p) return App.go('profiles');
      const q = G.quest(p);
      // once per profile: explain the six stars to players who already had progress
      if (!p.newsV3) { p.newsV3 = true; G.save(); if (p.xp > 0) setTimeout(() => App.modal(`${MQ.mascot(p.avatar, 90)}<h2>🌟 ${t('ui.newsV3Title')}</h2><p>${t('ui.newsV3')}</p>`, [{ label: t('ui.letsGo'), cls: 'primary' }]), 300); }
      const top = h('div', { class: 'maptop banner' });
      top.innerHTML = `<div class="hello">${MQ.mascot(p.avatar, 72)}<div><h1>${t('ui.hello', { n: esc(p.name) })}</h1><p>${t('ui.mapIntro')}</p></div></div>`;
      const qb = h('button', { class: 'quest ' + (q.done ? 'done' : ''), type: 'button' }, `<b>📜 ${t('ui.dailyQuest')}</b><span>${q.done ? t('ui.questDone') : t('ui.questProgress', { n: q.tasks.filter(k => k.n >= k.goal).length })}</span>`);
      qb.onclick = () => Screens.questModal(p); top.appendChild(qb);
      main.appendChild(top);
      // the map itself
      const wrap = h('div', { class: 'mapwrap' });
      wrap.innerHTML = `<svg class="lux" viewBox="0 0 100 100" aria-hidden="true"><path d="M38 4 L58 2 L66 12 L62 22 L72 26 L80 36 L76 48 L84 58 L82 70 L74 80 L76 92 L60 98 L48 92 L36 96 L30 86 L22 78 L26 64 L20 52 L26 40 L22 28 L30 16 Z" class="land"/><path d="M76 48 Q86 66 74 80 Q80 90 76 92" class="river"/><path d="M40 8 Q46 30 50 44 Q54 60 60 98" class="road"/></svg>`;
      MQ.MAP.regions.forEach(r => {
        const total = r.stages.length * G.MAXSTARS, got = G.regionStars(p, r);
        const assigned = r.stages.some(s => p.assigned.includes(s));
        const b = h('button', { class: 'region r-' + r.theme, type: 'button', style: `left:${r.pos[0]}%;top:${r.pos[1]}%` }, `<span class="ricon" aria-hidden="true">${{ city: '🏙️', castle: '🏰', forest: '🌲', fair: '🎡' }[r.theme]}</span><b>${t('region.' + r.id)}</b><small>${t('domain.' + r.domain)}</small><span class="rprog"><i style="width:${Math.round(100 * got / total)}%"></i></span><small>★ ${got}/${total}</small>${assigned ? `<span class="flag" title="${t('ui.assigned')}">🚩</span>` : ''}`);
        b.onclick = () => App.go('region', { id: r.id }); wrap.appendChild(b);
      });
      main.appendChild(wrap);
      { // the summit: extreme problems of every topic with 3 stars
        const all = MQ.MAP.regions.flatMap(rg => rg.stages).filter(s => MQ.T.forStage(s, 5).length), open = all.filter(s => G.extremeOpen(p, s)).length;
        const sb = h('button', { class: 'summitbtn' + (open ? ' open' : ''), type: 'button' }, `<span class="sicon" aria-hidden="true">🏔️</span><span><b>${t('ui.summit')}</b><small>${t('ui.summitShort', { n: open, m: all.length })}</small></span>`);
        sb.onclick = () => App.go('extreme'); main.appendChild(sb);
      }
      const nav = h('div', { class: 'navrow' });
      const nSets = MQ.sets.forPupil(p).filter(s => { const r = (p.setRuns || {})['s:' + s.id]; return !r || !MQ.sets.summary(r).complete; }).length;
      [['📚', 'ui.sets', () => App.go('sets'), nSets], [G.LEAGUES[G.leagueOf(p.xp)].icon, 'ui.leagues', () => App.go('leagues')], ['🦁', 'ui.avatar', () => App.go('avatar')], ['🏅', 'ui.badges', () => App.go('badges')]].forEach(([i, k, fn, badge]) => { const b = h('button', { class: 'btn', type: 'button' }, `${i} ${t(k)}${badge ? ` <span class="pill">${badge}</span>` : ''}`); b.onclick = fn; nav.appendChild(b); });
      main.appendChild(nav);
    },

    /* ---------------- the summit (Kneiff): extreme problems ---------------- */
    extreme(main) {
      const p = G.active(); if (!p) return App.go('profiles');
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.map')); back.onclick = () => App.go('map'); main.appendChild(back);
      main.appendChild(h('h1', { class: 'summittitle' }, '🏔️ ' + t('ui.summit')));
      main.appendChild(h('p', { class: 'rintro' }, t('ui.summitIntro')));
      const all = MQ.MAP.regions.flatMap(rg => rg.stages).filter(s => MQ.T.forStage(s, 5).length), open = all.filter(s => G.extremeOpen(p, s));
      main.appendChild(h('p', { class: 'small' }, t('ui.summitStats', { n: open.length, m: all.length, x: G.extremeCount(p) })));
      const go = h('button', { class: 'btn primary big', type: 'button' }, '🏔️ ' + t('ui.summitStart')); go.disabled = !open.length;
      go.onclick = () => App.go('play', { mode: 'extreme' }); main.appendChild(go);
      if (!open.length) main.appendChild(h('p', { class: 'tip' }, t('ui.summitLocked')));
      const grid = h('div', { class: 'summitgrid' });
      MQ.MAP.regions.forEach(rg => rg.stages.filter(s => all.includes(s)).forEach(s => {
        const ok = open.includes(s), n = G.stars(p, s);
        const c = h('button', { type: 'button', class: 'summittopic' + (ok ? ' open' : '') }, `<span aria-hidden="true">${ok ? '🏔️' : '🔒'}</span> ${t('stage.' + s)} <small>${tstars(n)}</small>`);
        c.onclick = () => { if (ok) App.go('play', { mode: 'extreme', only: s }); else App.toast('🔒 ' + t('ui.extremeLockedTopic', { s: { k: 'stage.' + s }, n: 3 - n })); };
        grid.appendChild(c);
      }));
      main.appendChild(h('h2', {}, t('ui.summitTopics'))); main.appendChild(grid);
    },

    /* ---------------- exercise sets ---------------- */
    sets(main) {
      const p = G.active(); if (!p) return App.go('profiles');
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.map')); back.onclick = () => App.go('map'); main.appendChild(back);
      main.appendChild(h('h1', {}, '📚 ' + t('ui.sets')));
      const runBtns = (key, card) => {
        const run = (p.setRuns || {})[key]; const sm = run ? MQ.sets.summary(run) : null;
        const row = h('div', { class: 'brow' });
        const go = h('button', { class: 'btn primary', type: 'button' }, !sm || !sm.done ? '▶ ' + t('ui.start') : sm.complete ? '🔍 ' + t('ui.review') : '▶ ' + t('ui.continue')); go.onclick = () => App.go('play', { mode: 'set', key });
        row.appendChild(go);
        if (sm && sm.done) { const re = h('button', { class: 'btn', type: 'button' }, '↺ ' + t('ui.restartSet')); re.onclick = () => App.modal(`<p>${t('ui.confirmRestart')}</p>`, [{ label: t('ui.restartSet'), cls: 'primary', fn: () => { MQ.sets.restart(p, key); App.go('play', { mode: 'set', key }); } }, { label: t('ui.cancel') }]); row.appendChild(re); }
        if (key.startsWith('q:')) { const del = h('button', { class: 'btn', type: 'button', 'aria-label': t('dash.delete') }, '🗑'); del.onclick = () => { MQ.sets.deleteRun(p, key); App.go('sets'); }; row.appendChild(del); }
        if (sm) card.appendChild(h('p', { class: 'small' }, t('ui.setProgress', { d: sm.done, n: sm.n }) + (sm.done ? ' · ' + t('ui.setScore', { a: sm.correct, b: sm.n }) : '')));
        card.appendChild(row);
      };
      // sets from the teacher / parent
      main.appendChild(h('h2', {}, '🎓 ' + t('ui.setsFromAdult')));
      const mine = MQ.sets.forPupil(p);
      if (!mine.length) main.appendChild(h('p', { class: 'small' }, t('ui.noSets')));
      const list = h('div', { class: 'stagegrid' });
      mine.forEach(s => { const c = h('div', { class: 'stage card' }); c.innerHTML = `<h3>${esc(s.name)}</h3><p class="sdesc">${[...new Set(s.items.map(x => x.stage))].map(x => t('stage.' + x)).join(' · ')}</p><p class="small">${t('ui.setSize', { n: s.items.length })} · ${s.level === 'mix' ? t('dash.setMixed') : s.level === 'mixx' ? t('dash.setMixedX') : t('lvl.' + s.level)}</p>`; runBtns('s:' + s.id, c); list.appendChild(c); });
      main.appendChild(list);
      // quick sets made by the pupil
      main.appendChild(h('h2', {}, '⚡ ' + t('ui.quickSets')));
      const f = h('form', { class: 'card form quickset' });
      f.innerHTML = `<label>${t('ui.qsTopic')} <select name="st">${MQ.MAP.regions.map(r => `<optgroup label="${esc(t('region.' + r.id))}">${r.stages.map(sid => `<option value="${sid}">${esc(t('stage.' + sid))}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <label>${t('ui.qsCount')} <select name="n">${[5, 10, 15, 20].map(n => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>${t('ui.qsLevel')} <select name="L"><option value="mine">${t('ui.qsMine')}</option><option value="mix">${t('dash.setMixed')}</option>${[1, 2, 3, 4, 5].map(L => `<option value="${L}">${L} · ${t('lvl.' + L)}</option>`).join('')}</select></label>
        <button class="btn primary">✨ ${t('ui.qsMake')}</button>`;
      f.onsubmit = e => { e.preventDefault(); if (f.L.value === '5' && !G.extremeOpen(p, f.st.value)) { App.toast('🔒 ' + t('ui.extremeLocked')); return; } const key = MQ.sets.quick(p, f.st.value, +f.n.value, f.L.value); App.go('play', { mode: 'set', key }); };
      main.appendChild(f);
      const quick = Object.values(p.setRuns || {}).filter(r => r.key.startsWith('q:')).sort((a, b) => b.updated - a.updated);
      if (quick.length) { const ql = h('div', { class: 'stagegrid' }); quick.forEach(r => { const c = h('div', { class: 'stage card' }); c.innerHTML = `<h3>${esc(t('stage.' + r.stage))}</h3><p class="small">${t('ui.setSize', { n: r.items.length })} · ${(d => MQ.fmtDate(d.getFullYear(), d.getMonth() + 1, d.getDate()))(new Date(r.started))}</p>`; runBtns(r.key, c); ql.appendChild(c); }); main.appendChild(ql); }
    },
    questModal(p) {
      const q = G.quest(p);
      const rows = q.tasks.map(tk => `<li class="${tk.n >= tk.goal ? 'ok' : ''}"><span>${t('quest.' + tk.type, { s: { k: 'stage.' + tk.stage }, n: tk.goal, d: tk.days || 0 })}</span><b>${tk.n}/${tk.goal}</b></li>`).join('');
      App.modal(`<h2>📜 ${t('ui.dailyQuest')}</h2><ul class="qlist">${rows}</ul><p>${t('ui.questReward')}</p>`, [{ label: t('ui.ok'), cls: 'primary' }].concat(q.tasks[0].n < q.tasks[0].goal ? [{ label: t('ui.goQuest'), fn: () => App.go('play', { stage: q.tasks[0].stage, mode: 'practice' }) }] : []));
    },

    /* ---------------- one region: list of stages + boss ---------------- */
    region(main, { id }) {
      const p = G.active(); const r = MQ.MAP.regions.find(x => x.id === id);
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.map')); back.onclick = () => App.go('map'); main.appendChild(back);
      main.appendChild(h('h1', { class: 'rtitle r-' + r.theme }, `${t('region.' + r.id)} <small>${t('domain.' + r.domain)}</small>`));
      main.appendChild(h('p', { class: 'rintro' }, t('region.' + r.id + '.intro')));
      const list = h('div', { class: 'stagegrid' });
      r.stages.forEach(sid => {
        const st = G.stage(p, sid), n = G.stars(p, sid), assigned = p.assigned.includes(sid);
        const c = h('div', { class: 'stage card' + (assigned ? ' assigned' : '') });
        c.innerHTML = `<h3>${t('stage.' + sid)} ${assigned ? '🚩' : ''}</h3><p class="sdesc">${t('stage.' + sid + '.d')}</p>${tstars(n)}<p class="nextstar">${nextStarText(p, sid)}</p><p class="small">${t('ui.levelNow', { l: { k: LEVEL_KEYS[st.level] } })} · ${t('ui.doneCount', { n: st.correct })}</p>`;
        const row = h('div', { class: 'brow' });
        const play = h('button', { class: 'btn primary', type: 'button' }, '▶ ' + t('ui.practise')); play.onclick = () => App.go('play', { stage: sid, mode: 'practice' });
        const used = G.blitzUsedToday(p, sid); const blitz = h('button', { class: 'btn', type: 'button', title: used ? t('ui.timedDoneTitle') : t('ui.timedTitle') }, used ? '⏱ ' + t('ui.timedDone') : '⏱ ' + t('ui.timed')); blitz.disabled = used; blitz.onclick = () => { if (G.blitzUsedToday(p, sid)) { App.toast(t('ui.timedDoneTitle')); return; } App.go('play', { stage: sid, mode: 'blitz' }); };
        row.append(play, blitz); c.appendChild(row); list.appendChild(c);
      });
      const boss = h('div', { class: 'stage card boss' });
      boss.innerHTML = `<h3>🐉 ${t('ui.boss')}</h3><p class="sdesc">${t('ui.bossDesc')}</p>${stars(p.boss[r.id] || 0)}`;
      const bb = h('button', { class: 'btn primary', type: 'button' }, '⚔️ ' + t('ui.bossStart')); bb.onclick = () => App.go('play', { region: r.id, mode: 'boss' }); boss.appendChild(bb);
      list.appendChild(boss); main.appendChild(list);
    },

    /* ---------------- the exercise player ---------------- */
    play(main, params, keep) { player = new Player(main, params, keep); App._player = player; },

    /* ---------------- avatar ---------------- */
    avatar(main, { first }) {
      const p = G.active(); const L = G.level(p); const A = MQ.MAP.avatar;
      main.appendChild(h('h1', {}, t('ui.avatarTitle')));
      const prev = h('div', { class: 'avprev' }); const render = () => { prev.innerHTML = MQ.mascot(p.avatar, 160) + `<p>${t('ui.mascotIntro')}</p>`; };
      render(); main.appendChild(prev);
      const cur = kind => p.avatar[kind] || A[kind][0].id;
      ['style', 'fur', 'acc', 'frame', 'bg'].forEach(kind => {
        const sec = h('div', { class: 'card avsec' }); sec.appendChild(h('h3', {}, t('av.' + kind)));
        const row = h('div', { class: 'avrow' });
        A[kind].forEach(it => {
          const locked = !G.unlocked(p, it);
          const need = it.league != null ? t('ui.unlockLeague', { l: { k: 'league.' + G.LEAGUES[it.league].id } }) : it.stars != null ? t('ui.unlockStars', { n: it.stars, m: G.totalStars(p) }) : t('ui.unlockAt', { n: it.lvl });
          const short = it.league != null ? G.LEAGUES[it.league].icon : it.stars != null ? '★' + it.stars : t('ui.levelShort', { n: it.lvl });
          const b = h('button', { type: 'button', class: 'avopt' + (cur(kind) === it.id ? ' sel' : '') + (locked ? ' locked' : ''), 'aria-pressed': cur(kind) === it.id, 'aria-label': t('av.' + kind + '.' + it.id) + (locked ? ' — ' + need : '') });
          b.innerHTML = MQ.mascot({ ...p.avatar, [kind]: it.id }, 56) + `<small>${locked ? '🔒 ' + short : t('av.' + kind + '.' + it.id)}</small>`;
          b.onclick = () => { if (locked) { App.toast(need); return; } p.avatar[kind] = it.id; G.save(); App.header(); App.go('avatar', { first }); };
          row.appendChild(b);
        });
        sec.appendChild(row); main.appendChild(sec);
      });
      const done = h('button', { class: 'btn primary big', type: 'button' }, first ? t('ui.letsGo') : t('ui.done')); done.onclick = () => App.go('map'); main.appendChild(done);
    },

    /* ---------------- leagues (personal: no ranking against other children) ---------------- */
    leagues(main) {
      const p = G.active(); if (!p) return App.go('profiles');
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.map')); back.onclick = () => App.go('map'); main.appendChild(back);
      main.appendChild(h('h1', {}, '🏆 ' + t('ui.leagues')));
      const cur = G.leagueOf(p.xp), next = G.LEAGUES[cur + 1];
      main.appendChild(h('p', {}, next ? t('ui.leagueNext', { n: next.xp - p.xp, l: { k: 'league.' + next.id } }) : t('ui.leagueTop')));
      const list = h('ol', { class: 'leaguelist', reversed: '' });
      G.LEAGUES.slice().reverse().forEach(lg => { const i = G.LEAGUES.indexOf(lg); const nx = G.LEAGUES[i + 1]; const pct = i < cur ? 100 : i > cur ? 0 : nx ? Math.round(100 * (p.xp - lg.xp) / (nx.xp - lg.xp)) : 100;
        const frame = MQ.MAP.avatar.frame.find(f => f.league === i);
        list.appendChild(h('li', { class: 'league' + (i === cur ? ' cur' : i < cur ? ' done' : ' todo') }, `<span class="lgicon">${lg.icon}</span><div class="lginfo"><b>${t('league.' + lg.id)}</b><small>${lg.xp} XP${frame ? ' · ' + t('ui.leagueReward', { f: { k: 'av.frame.' + frame.id } }) : ''}</small><span class="lgbar"><i style="width:${pct}%"></i></span></div>${i === cur ? `<span class="you">${MQ.mascot(p.avatar, 44)}</span>` : ''}`)); });
      main.appendChild(list);
      main.appendChild(h('p', { class: 'small' }, t('ui.leagueNote')));
    },

    /* ---------------- badges ---------------- */
    badges(main) {
      const p = G.active();
      main.appendChild(h('h1', {}, '🏅 ' + t('ui.badges')));
      const total = MQ.MAP.badges.length, got = MQ.MAP.badges.filter(b => p.badges.includes(b.id)).length;
      main.appendChild(h('p', {}, t('ui.badgeCount', { n: got, m: total }) + ' ' + t('ui.badgeTiers')));
      const show = id => { const bt = MQ.badgeText(id); const has = p.badges.includes(id); App.modal(`<div class="badgeinfo">${MQ.medal(bt.tier, bt.icon, 120, !has)}<h2>${bt.name}</h2>${bt.tierName ? `<p class="tiername">${bt.tierName}</p>` : ''}<p>${bt.desc}</p><p class="small">${has ? '✅ ' + t('ui.badgeHave') : '🔒 ' + t('ui.badgeNotYet')}</p></div>`, [{ label: t('ui.ok'), cls: 'primary' }]); };
      MQ.MAP.BADGE_CATS.forEach(cat => {
        main.appendChild(h('h2', {}, t('badgecat.' + cat)));
        const grid = h('div', { class: 'famgrid' });
        MQ.MAP.badgeFamilies.filter(f => f.cat === cat).forEach(f => {
          const row = h('div', { class: 'card fam' }); row.appendChild(h('h3', {}, `${f.icon} ${t(f.nameKey)}`));
          const medals = h('div', { class: 'medals' });
          for (let tr = 1; tr <= 5; tr++) { const id = f.id + ':' + tr, has = p.badges.includes(id); const b = h('button', { type: 'button', class: 'medalbtn' + (has ? ' has' : ''), 'aria-label': `${t(f.nameKey)} · ${t('badge.tier.' + tr)}${has ? '' : ' — ' + t('ui.badgeNotYet')}` }, MQ.medal(tr, f.icon, 58, !has) + `<small>${t('badge.tierShort.' + tr)}</small>`); b.onclick = () => show(id); medals.appendChild(b); }
          row.appendChild(medals); grid.appendChild(row);
        });
        main.appendChild(grid);
      });
      const back = h('button', { class: 'btn', type: 'button' }, '← ' + t('ui.map')); back.onclick = () => App.go('map'); main.appendChild(back);
    },

    /* ---------------- settings ---------------- */
    settings(main) {
      const s = G.settings();
      main.appendChild(h('h1', {}, t('ui.settings')));
      const c = h('div', { class: 'card form' });
      c.innerHTML = `
        <label class="row"><input type="checkbox" id="dys" ${s.dyslexia ? 'checked' : ''}> ${t('ui.dyslexia')}</label>
        <label class="row"><input type="checkbox" id="con" ${s.contrast ? 'checked' : ''}> ${t('ui.contrast')}</label>
        <label>${t('ui.textSize')} <input type="range" id="ts" min="0.9" max="1.4" step="0.1" value="${s.textScale || 1}"></label>
        <label>${t('ui.speechRate')} <input type="range" id="sr" min="0.6" max="1.2" step="0.05" value="${s.rate || 0.95}"></label>
        <label class="row"><input type="checkbox" id="mu" ${s.mute ? 'checked' : ''}> ${t('ui.mute')}</label>
        <p class="small">${MQ.speech.available() ? t('ui.voiceInfo', { v: (MQ.speech.voiceFor(s.lang) || {}).name || t('ui.noVoice') }) : t('ui.noSpeech')}</p>`;
      c.querySelector('#dys').onchange = e => { s.dyslexia = e.target.checked; G.save(); App.applySettings(); };
      c.querySelector('#con').onchange = e => { s.contrast = e.target.checked; G.save(); App.applySettings(); };
      c.querySelector('#ts').oninput = e => { s.textScale = +e.target.value; G.save(); App.applySettings(); };
      c.querySelector('#sr').oninput = e => { s.rate = +e.target.value; G.save(); };
      c.querySelector('#mu').onchange = e => { s.mute = e.target.checked; G.save(); App.header(); };
      main.appendChild(c);
      const ab = h('button', { class: 'btn linkish', type: 'button' }, 'ℹ️ ' + t('ui.about')); ab.onclick = () => App.go('about'); main.appendChild(ab);
      const back = h('button', { class: 'btn', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => App.go(G.active() ? 'map' : 'profiles'); main.appendChild(back);
    },

    /* ---------------- teacher / parent ---------------- */
    teacher(main) { MQ.dashboard.gate(main); }
  };
  App.screens = Screens;

  /* =================================================================== */
  /* Player: practice, boss and timed challenge                           */
  /* =================================================================== */
  const BLITZ_MS = 120000;   // timed challenge: 2 minutes, once a day per topic
  class Player {
    constructor(main, params, keep) {
      this.main = main; this.p = G.active(); this.params = params; this.mode = params.mode || 'practice';
      // the 2-minute challenge is once a day per topic: a second start becomes ordinary practice
      if (!keep && this.mode === 'blitz' && G.blitzUsedToday(this.p, params.stage)) { this.mode = 'practice'; this.params = Object.assign({}, params, { mode: 'practice' }); setTimeout(() => App.toast('⏱ ' + t('ui.timedDoneTitle'), 4000), 200); }
      if (keep) { Object.assign(this, keep.state); this.restoring = keep; }
      else {
        this.recent = []; this.score = 0; this.count = 0;
        if (this.mode === 'boss') { this.region = MQ.MAP.regions.find(r => r.id === params.region); this.queue = MQ.RNG(Date.now() & 0xffffff).shuffle(this.region.stages.concat(this.region.stages).slice(0, 8)); this.bossTotal = this.queue.length; }
        if (this.mode === 'blitz') { this.deadline = null; this.blitzLevel = Math.min(4, G.stage(this.p, params.stage).level); G.markBlitz(this.p, params.stage); }
        this.items = []; this.pos = -1;
        if (this.mode === 'set') {
          this.run = MQ.sets.run(this.p, params.key);
          this.items = this.run.items.map((it, i) => Object.assign({ ex: MQ.T.make(it.tpl, it.level, it.seed), stage: it.stage }, this.run.state[i] || {}));
          const firstOpen = this.items.findIndex(it => !it.done), last = this.items[this.run.pos || 0];
          this.load(last && !last.done ? (this.run.pos || 0) : (firstOpen >= 0 ? firstOpen : 0));
          if (firstOpen < 0) this.setDone = true;
        } else this.next(true);
      }
      this.render();
      if (this.mode === 'blitz' && !this.timer) this.startTimer();
    }
    snapshot() { return { state: { recent: this.recent, score: this.score, count: this.count, queue: this.queue, bossTotal: this.bossTotal, region: this.region, ex: this.ex, stage: this.stage, tries: this.tries, hints: this.hints, t0: this.t0, done: this.done, lastRes: this.lastRes, deadline: this.deadline, blitzLevel: this.blitzLevel, finished: this.finished, items: this.items, pos: this.pos, run: this.run, redo: this.redo, setDone: this.setDone }, resp: this.widget && !this.done ? this.widget.get() : (this.items && this.items[this.pos] ? this.items[this.pos].resp : null) }; }
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; MQ.speech.stop(); }
    pickLevel(sid) {
      const st = G.stage(this.p, sid);
      if (this.mode === 'boss') return Math.max(2, Math.min(3, st.level));
      if (this.mode === 'blitz') return this.blitzLevel;
      if (this.mode === 'extreme') return 5;
      return st.level === 5 && !G.extremeOpen(this.p, sid) ? 4 : st.level;
    }
    /* ---- history: every exercise of the session (or of the set) is kept, so the pupil can go back ---- */
    canNavigate() { return this.mode === 'practice' || this.mode === 'set' || this.mode === 'extreme'; }
    free() { return this.mode === 'practice' || this.mode === 'extreme'; }
    saveCur() {
      if (!this.canNavigate() || this.pos < 0) return; const it = this.items[this.pos];
      Object.assign(it, { ex: this.ex, stage: this.stage, tries: this.tries, hints: this.hints, done: this.done, lastRes: this.lastRes ? { kind: this.lastRes.kind, fb: this.lastRes.fb || null, praise: this.lastRes.praise, xp: this.lastRes.ev ? this.lastRes.ev.xp : this.lastRes.xp } : null, redo: !!this.redo });
      if (!this.done && this.widget) it.resp = this.widget.get();
      if (this.mode === 'set') { this.run.state[this.pos] = { tries: it.tries, hints: it.hints, done: it.done, correct: !!it.correct, firstTry: !!it.firstTry, lastRes: it.lastRes, redo: it.redo, skipped: !!it.skipped, resp: it.resp || null }; this.run.pos = this.pos; this.run.updated = Date.now(); G.save(); }
    }
    load(i) {
      const it = this.items[i]; this.pos = i; this.ex = it.ex; this.stage = it.stage || it.ex.stage;
      this.tries = it.tries || 0; this.hints = it.hints || 0; this.done = !!it.done; this.lastRes = it.lastRes || null; this.redo = !!it.redo;
      this.t0 = Date.now(); this.widget = null; this.restoring = { resp: it.resp || null };
    }
    go(i) { if (i < 0 || i >= this.items.length || i === this.pos) return; this.saveCur(); this.load(i); this.setDone = false; this.render(); window.scrollTo && window.scrollTo({ top: 0 }); }
    prev() { this.go(this.pos - 1); }
    redoCur() { this.done = false; this.tries = 0; this.hints = 0; this.lastRes = null; this.redo = true; this.t0 = Date.now(); this.widget = null; this.restoring = { resp: null }; const it = this.items[this.pos]; it.resp = null; it.correct = false; this.saveCur(); this.render(); }
    next(first, fresh) {
      if (this.canNavigate() && !first) this.saveCur();
      if (this.free() && !fresh && this.pos < this.items.length - 1) { this.load(this.pos + 1); this.render(); return; }
      this.redo = false;
      let L, tpls;
      if (this.mode === 'extreme') {
        // the summit mixes the extreme problems of every topic that has 3 stars
        // (with params.only: just that topic's extreme problems — a summit topic tile)
        const open = MQ.MAP.regions.flatMap(rg => rg.stages).filter(s => G.extremeOpen(this.p, s) && (!this.params.only || s === this.params.only));
        const ok = MQ.T.extreme().filter(tp => [].concat(tp.stage, tp.stages || []).some(s => open.includes(s)));
        tpls = ok.map(x => x.id); L = 5;
        if (!tpls.length) { App.go('extreme'); return; }
      } else {
        this.stage = this.mode === 'boss' ? this.queue[this.count] : this.params.stage;
        L = this.pickLevel(this.stage);
        tpls = MQ.T.forStage(this.stage, L).map(x => x.id);
        if (!tpls.length) { L = Math.min(L, 4); tpls = MQ.T.forStage(this.stage, L).map(x => x.id); }
      }
      const notSkipped = tpls.filter(x => !(this.skipTpl && this.skipTpl.has(x)));
      const pool = notSkipped.length ? notSkipped : tpls;
      const avail = pool.filter(x => !this.recent.slice(-Math.min(2, pool.length - 1)).includes(x));
      const r = MQ.RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);
      const id = r.pick(avail.length ? avail : pool); this.recent.push(id);
      if (this.mode === 'extreme') { const tp = MQ.T.byId[id]; this.stage = this.params.only || [].concat(tp.stage, tp.stages || []).find(s => G.extremeOpen(this.p, s)); }
      this.ex = MQ.T.make(id, L, r.int(1, 2 ** 30));
      this.tries = 0; this.hints = 0; this.t0 = Date.now(); this.done = false; this.lastRes = null;
      if (this.free()) { this.items.push({ ex: this.ex, stage: this.stage }); if (this.items.length > 30) this.items.shift(); this.pos = this.items.length - 1; this.widget = null; this.restoring = { resp: null }; }
      if (!first) this.render();
    }
    startTimer() {
      this.deadline = this.deadline || Date.now() + BLITZ_MS;
      this.timer = setInterval(() => { const left = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000)); const el = this.main.querySelector('.timer'); if (el) el.textContent = '⏱ ' + left + ' s'; if (left <= 10 && left > 0) MQ.audio.play('tick'); if (left <= 0) { this.stop(); this.finishBlitz(); } }, 1000);
    }
    render() {
      const ex = this.ex, lang = MQ.i18n.lang, m = this.main; m.innerHTML = '';
      const keepResp = this.restoring ? this.restoring.resp : (this.widget ? this.widget.get() : null); this.restoring = null;
      // top bar
      const bar = h('div', { class: 'playbar' });
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => { if (this.mode === 'set') { this.saveCur(); App.go('sets'); } else if (this.mode === 'extreme') App.go('extreme'); else App.go('region', { id: (this.region || regionOf(this.stage)).id }); }; bar.appendChild(back);
      if (this.mode === 'extreme') bar.appendChild(h('h2', {}, `🏔️ ${t('ui.summit')} <small><span class="sep">· </span>${t('stage.' + this.stage)} · ${t('t.' + ex.tpl + '.title')}</small>`)); else
      if (this.mode === 'set') bar.appendChild(h('h2', {}, `📚 ${esc(this.run.name || t('stage.' + this.run.stage))} <small><span class="sep">· </span>${t('stage.' + this.stage)} · ${t('t.' + ex.tpl + '.title')}</small>`)); else
      bar.appendChild(h('h2', {}, this.mode === 'boss' ? `🐉 ${t('ui.boss')} · ${t('region.' + this.region.id)} <small>${this.count + 1}/${this.bossTotal}</small>` : t('stage.' + this.stage) + ` <small><span class="sep">· </span>${t('t.' + ex.tpl + '.title')}</small>`));
      if (this.mode === 'practice') {
        const st = G.stage(this.p, this.stage);
        const lv = h('div', { class: 'levels', role: 'radiogroup', 'aria-label': t('ui.chooseLevel') });
        const hasX = MQ.T.forStage(this.stage, 5).length > 0, xOpen = G.extremeOpen(this.p, this.stage);
        [1, 2, 3, 4, 5].filter(L => L < 5 || hasX).forEach(L => {
          const locked = L === 5 && !xOpen;
          const b = h('button', { type: 'button', class: 'lvlb' + (L === 5 ? ' xlvl' : '') + (locked ? ' locked' : '') + (ex.level === L ? ' sel' : ''), role: 'radio', 'aria-checked': ex.level === L, 'aria-disabled': locked ? 'true' : 'false', title: locked ? t('ui.extremeLocked') : t(LEVEL_KEYS[L] + '.d') }, `${L === 5 ? (locked ? '🔒' : '🏔️') : L}<span class="lvname"> · ${t(LEVEL_KEYS[L])}</span>`);
          b.setAttribute('aria-label', `${L} · ${t(LEVEL_KEYS[L])}${locked ? ' — ' + t('ui.extremeLocked') : ''}`);
          b.onclick = () => { if (locked) { App.toast('🔒 ' + t('ui.extremeLocked')); return; } st.level = L; st.auto = false; st.recent = []; G.save(); this.next(false, true); };
          lv.appendChild(b);
        });
        const auto = h('label', { class: 'auto' }, `<input type="checkbox" ${st.auto ? 'checked' : ''}> ${t('ui.autoLevel')}`); auto.querySelector('input').onchange = e => { st.auto = e.target.checked; G.save(); };
        lv.appendChild(auto); bar.appendChild(lv);
        bar.appendChild(h('p', { class: 'nextstar', 'aria-live': 'polite' }, ex.level === 5 ? '🏔️ ' + t('ui.extremeNote') : nextStarText(this.p, this.stage)));
      }
      if (this.mode === 'blitz') bar.appendChild(h('div', { class: 'timer', 'aria-live': 'off' }, '⏱ ' + Math.max(0, Math.ceil(((this.deadline || Date.now() + BLITZ_MS) - Date.now()) / 1000)) + ' s'));
      if (this.mode === 'blitz' || this.mode === 'boss') bar.appendChild(h('div', { class: 'score' }, t('ui.score', { n: this.score })));
      m.appendChild(bar);
      if (this.finished) return this.mode === 'boss' ? this.finishBoss(true) : this.finishBlitz(true);
      if (this.canNavigate()) m.appendChild(this.navRow());
      if (this.setDone) return this.finishSet(true);
      // exercise card
      const card = h('section', { class: 'excard', 'aria-live': 'polite' });
      const q = h('div', { class: 'prompt' });
      q.innerHTML = `<div class="qtext">${tm(ex.prompt)}</div>`;
      const say = h('button', { class: 'icon say', type: 'button', 'aria-label': t('ui.readAloud'), title: t('ui.readAloud') }, MQ.mascot(this.p.avatar, 40) + '<span class="wave" aria-hidden="true">🔊</span>');
      say.onclick = () => { const r = MQ.speech.speak(MQ.stripHtml(tm(ex.prompt)), lang); if (!r.ok) App.toast(t('ui.noSpeech')); else if (r.fallback && !this.warnedLb) { this.warnedLb = true; App.toast(t('ui.lbVoice')); } };
      q.prepend(say); card.appendChild(q);
      const fig = renderFigure(ex, lang); if (fig) card.appendChild(h('div', { class: 'figure' }, fig));
      this.widget = W.build(ex, lang, () => this.submit());
      if (keepResp) this.widget.set(keepResp);
      if (this.done) { this.widget.lock(); if (this.lastRes && this.lastRes.kind === 'solution' && this.widget.reveal) this.widget.reveal(); }
      card.appendChild(h('div', { class: 'widget' })).appendChild(this.widget.el);
      // hints
      const hintBox = h('div', { class: 'hints' });
      for (let i = 0; i < this.hints; i++) hintBox.appendChild(h('p', { class: 'hint h' + i }, `<b>${t('ui.hintN', { n: i + 1 })}</b> ${tm(ex.hints[i])}`));
      card.appendChild(hintBox);
      // feedback
      const fb = h('div', { class: 'feedback', 'aria-live': 'assertive' }); card.appendChild(fb);
      // buttons
      const btns = h('div', { class: 'brow actions' });
      this.btnHint = h('button', { class: 'btn', type: 'button' }, '💡 ' + t('ui.hint')); this.btnHint.onclick = () => { if (this.hints < 3) { this.hints++; this.render(); } };
      this.btnCheck = h('button', { class: 'btn primary big', type: 'button' }, '✔ ' + t('ui.check')); this.btnCheck.onclick = () => this.submit();
      this.btnNext = h('button', { class: 'btn primary big', type: 'button' }, t('ui.next') + ' →'); this.btnNext.onclick = () => this.advance();
      this.btnShow = h('button', { class: 'btn', type: 'button' }, t('ui.showSolution')); this.btnShow.onclick = () => this.giveUp();
      this.btnSkip = h('button', { class: 'btn skipbtn', type: 'button', title: t('ui.skipTitle') }, '⏭ ' + t('ui.skip')); this.btnSkip.onclick = () => this.skip();
      this.btnRedo = h('button', { class: 'btn', type: 'button' }, '↺ ' + t('ui.redo')); this.btnRedo.onclick = () => this.redoCur();
      if (this.mode === 'set' && this.pos === this.items.length - 1) this.btnNext.textContent = t('ui.setFinish') + ' ✓';
      if (this.hints >= 3 || this.mode === 'blitz') this.btnHint.disabled = true;
      btns.append(this.btnSkip, this.btnHint, this.btnShow, this.btnRedo, this.btnCheck, this.btnNext);
      card.appendChild(btns); m.appendChild(card);
      this.fbEl = fb; this.updateButtons();
      if (this.lastRes) this.showFeedback(this.lastRes, true);
      if (!this.done && this.widget.focus) this.widget.focus();
    }
    updateButtons() {
      this.btnCheck.hidden = this.done; this.btnNext.hidden = !this.done && !(this.mode === 'set' || (this.free() && this.pos < this.items.length - 1));
      if (this.btnRedo) this.btnRedo.hidden = !(this.canNavigate() && this.done && this.lastRes && this.lastRes.kind === 'solution');
      if (this.navEl) this.navEl.querySelectorAll('[data-i]').forEach(b => { const it = this.items[+b.dataset.i]; const d = +b.dataset.i === this.pos ? { done: this.done, correct: this.done && this.lastRes && this.lastRes.kind === 'ok' } : it; b.className = 'navdot' + (+b.dataset.i === this.pos ? ' cur' : '') + (d.done ? (d.correct ? ' ok' : ' bad') : (it.skipped ? ' skipped' : '')); });
      this.btnShow.hidden = this.done || this.tries === 0 || this.mode === 'blitz';
      this.btnHint.hidden = this.done;
      if (this.btnSkip) this.btnSkip.hidden = this.done;
    }
    submit() {
      if (this.done) return;
      const lang = MQ.i18n.lang; const resp = this.widget.get();
      let res; try { res = MQ.check(this.ex, resp, lang); } catch (e) { console.error(e); res = { correct: false, fb: null }; }
      const formal = res.formal != null ? res.formal : !!(res.fb && ['fb.empty', 'fb.chooseOne', 'fb.notNumber', 'fb.timeFormat', 'fb.dateFormat', 'fb.binsIncomplete', 'fb.onePoint', 'fb.onlyResult'].includes(res.fb.k));
      if (!res.correct && res.fb && formal && this.mode !== 'blitz') {
        // formal problem, not a mathematical mistake: does not count as a try
        this.lastRes = { kind: 'formal', fb: res.fb }; this.showFeedback(this.lastRes); return;
      }
      this.tries++;
      if (!res.correct && Date.now() - this.t0 < 4000 && (!this.lastReadNote || Date.now() - this.lastReadNote > 60000)) { this.lastReadNote = Date.now(); App.toast('📖 ' + t('ui.readFirst')); }
      const maxTries = this.mode === 'blitz' ? 1 : 2;
      if (res.correct) { this.finish(true, res); }
      else if (this.tries >= maxTries) { this.finish(false, res); }
      else { MQ.audio.play('retry'); this.lastRes = { kind: 'retry', fb: res.fb, res }; this.widget.mark && this.widget.mark(res); this.showFeedback(this.lastRes); this.updateButtons(); }
    }
    /* skip: no XP, no statistics, no mastery change — only counted (for the adult) as "skipped" */
    skip() {
      if (this.done || this.finished) return;
      const p = this.p; p.skips = p.skips || {}; p.skips[this.ex.tpl] = (p.skips[this.ex.tpl] || 0) + 1; G.save();
      MQ.audio.play('tap'); App.toast('⏭ ' + t('ui.skippedToast'));
      if (this.mode === 'set') { const it = this.items[this.pos]; it.skipped = true; this.saveCur(); return this.advance(); }
      if (this.mode === 'blitz') return this.advance();
      (this.skipTpl = this.skipTpl || new Set()).add(this.ex.tpl); this.recent.push(this.ex.tpl);
      if (this.free()) { this.items[this.pos].skipped = true; return this.next(false, true); }
      this.next();                                   // boss: another question of the same topic replaces it
    }
    giveUp() { this.tries = Math.max(this.tries, 2); this.finish(false, { fb: null }); }
    finish(correct, res) {
      if (this.canNavigate()) { const it = this.items[this.pos]; it.resp = this.widget.get(); it.correct = correct; it.firstTry = correct && this.tries === 1 && !this.redo; }
      this.done = true; const ms = Date.now() - this.t0;
      // a redo comes after the answer was already shown (or found): good practice, but no XP, no stars,
      // and not counted a second time in the statistics
      const ev = this.redo ? { xp: 0, redo: true, newBadges: [] } : G.record(this.p, this.ex, { stage: this.stage, correct, tries: this.tries, hints: this.hints, ms, fb: (this.lastRes && this.lastRes.fb) || res.fb, mode: this.mode });
      if (correct) { this.score++; MQ.audio.play('ok'); if (this.tries === 1) App.confetti(); }
      this.lastRes = { kind: correct ? 'ok' : 'solution', fb: res.fb, ev, praise: 'praise.' + (1 + Math.floor(Math.random() * 8)) };
      this.widget.lock(); this.widget.reveal && !correct && this.widget.reveal();
      this.showFeedback(this.lastRes); this.saveCur(); this.updateButtons(); App.header();
      const calm = App.calm();
      if (ev.leagueUp && !calm) setTimeout(() => { const lg = G.LEAGUES[ev.leagueUp]; MQ.audio.play('badge'); App.confetti(); App.modal(`<div class="leagueup"><div class="lgicon">${lg.icon}</div><h2>${t('ui.leagueUpTitle')}</h2><p>${t('ui.leagueUp', { l: { k: 'league.' + lg.id } })}</p>${MQ.MAP.avatar.frame.some(f => f.league === ev.leagueUp) ? `<p class="small">${t('ui.leagueFrame')}</p>` : ''}</div>`, [{ label: t('ui.letsGo'), cls: 'primary' }]); }, 400);
      { const ns = this.main.querySelector('.playbar .nextstar'); if (ns) ns.innerHTML = nextStarText(this.p, this.stage); }
      if (ev.starUp) { MQ.audio.play('level'); App.toast('🌟 ' + t('star.won' + ev.starUp, { s: { k: 'stage.' + this.stage } })); }
      if (ev.extremeOpened) setTimeout(() => App.toast('🏔️ ' + t('ui.extremeOpened', { s: { k: 'stage.' + this.stage } })), 2800);
      if (ev.levelUp && !calm) { MQ.audio.play('level'); App.toast(`⭐ ${t('ui.levelUp', { n: G.level(this.p) })}`); }
      if (!calm) ev.newBadges.forEach(b => { MQ.audio.play('badge'); const bt = MQ.badgeText(b); App.toast(`🏅 ${t('ui.newBadge', { b: { raw: bt.name + (bt.tierName ? ' · ' + bt.tierName : '') } })}`); });
      if (!calm) { const big = ev.newBadges.map(b => MQ.badgeText(b)).filter(bt => bt.tier >= 3).sort((a, b) => b.tier - a.tier)[0]; if (big) setTimeout(() => { App.confetti(); App.modal(`<div class="badgeinfo">${MQ.medal(big.tier, big.icon, 140)}<h2>${big.name} <small>· ${big.tierName}</small></h2><p>${big.desc}</p></div>`, [{ label: t('ui.letsGo'), cls: 'primary' }]); }, 600); }
      if (ev.questDone) App.toast('📜 ' + t('ui.questDone'));
      if (this.mode === 'blitz') { setTimeout(() => { if (!this.finished && Date.now() < this.deadline) this.advance(); }, correct ? 500 : 1400); }
      if (ev.suggestUp && this.mode === 'practice') setTimeout(() => App._player === this && App.modal(`${MQ.mascot(this.p.avatar, 90)}<h2>${t('ui.suggestUpTitle')}</h2><p>${t('ui.suggestUp', { l: { k: LEVEL_KEYS[this.ex.level + 1] } })}</p>`, [{ label: t('ui.yesHarder'), cls: 'primary', fn: () => { const st = G.stage(this.p, this.stage); st.level = Math.min(4, this.ex.level + 1); st.recent = []; G.save(); if (App._player === this) { App.toast('⬆️ ' + t('ui.levelNow', { l: { k: LEVEL_KEYS[st.level] } })); this.next(false, true); } } }, { label: t('ui.stayHere') }]), 700);
      if (ev.dropDown && this.mode === 'practice') setTimeout(() => App._player === this && this.workedExample(), 700);
    }
    workedExample() {
      const L = G.stage(this.p, this.stage).level;
      const ex = MQ.T.make(this.ex.tpl, L, (Date.now() & 0xfffff) + 3);
      const lang = MQ.i18n.lang; const fig = renderFigure(ex, lang);
      App.modal(`<h2>🧭 ${t('ui.workedTitle')}</h2><p>${t('ui.workedIntro', { l: { k: LEVEL_KEYS[L] } })}</p><div class="worked"><div class="qtext">${tm(ex.prompt)}</div>${fig ? `<div class="figure">${fig}</div>` : ''}<p><b>${t('ui.answerIs')}</b> ${tm(ex.answer)}</p><p class="explain">${tm(ex.explain)}</p></div>`, [{ label: t('ui.understood'), cls: 'primary', fn: () => { if (App._player === this && this.done) this.next(false, true); } }], { cls: 'wide' });
    }
    showFeedback(r, silent) {
      const ex = this.ex; const fb = this.fbEl; fb.className = 'feedback ' + r.kind; let html = '';
      if (r.kind === 'formal') html = `<p>${tm(r.fb)}</p>`;
      if (r.kind === 'retry') html = `${MQ.mascot(this.p.avatar, 56, 'think')}<div><p><b>${t('ui.notYet')}</b> ${r.fb ? tm(r.fb) : t('ui.tryAgain')}</p><p class="small">${t('ui.retryHint')}</p></div>`;
      if (r.kind === 'ok') html = `${MQ.mascot(this.p.avatar, 56)}<div><p><b>${t(r.praise)}</b> ${r.ev && r.ev.redo ? `<span class="xpnext">${t('ui.redoNoXp')}</span>` : `<span class="xpgain">+${r.ev ? r.ev.xp : (r.xp || 0)} XP</span>`}${r.ev && !r.ev.redo ? ` <span class="xpnext">${t('ui.xpToLevel', { n: G.levelRange(G.level(this.p))[1] - this.p.xp, l: G.level(this.p) + 1 })}</span>` : ''}</p><p class="explain"><b>${t('ui.why')}</b> ${tm(ex.explain)}</p></div>`;
      if (r.kind === 'solution') html = `${MQ.mascot(this.p.avatar, 56, 'think')}<div><p><b>${t('ui.letsSee')}</b> ${r.fb ? tm(r.fb) : ''}</p><p><b>${t('ui.answerIs')}</b> ${tm(ex.answer)}</p><p class="explain"><b>${t('ui.why')}</b> ${tm(ex.explain)}</p><p class="small">${t('ui.noProblem')}</p></div>`;
      fb.innerHTML = html;
    }
    advance() {
      if (this.mode === 'set') {
        this.saveCur();
        if (this.pos < this.items.length - 1) return this.go(this.pos + 1);
        this.setDone = true; return this.render();
      }
      this.count++;
      if (this.mode === 'boss' && this.count >= this.bossTotal) return this.finishBoss();
      if (this.mode === 'blitz' && Date.now() >= this.deadline) return this.finishBlitz();
      this.next();
    }
    navRow() {
      const nav = h('div', { class: 'exnav' }); this.navEl = nav;
      const prev = h('button', { class: 'btn', type: 'button', 'aria-label': t('ui.prev') }, '← ' + t('ui.prev')); prev.disabled = this.pos <= 0 && !this.setDone; prev.onclick = () => { if (this.setDone) { this.setDone = false; this.render(); } else this.prev(); };
      nav.appendChild(prev);
      if (this.mode === 'set') {
        const dots = h('div', { class: 'navdots', role: 'group', 'aria-label': t('ui.exList') });
        this.items.forEach((it, i) => { const b = h('button', { type: 'button', 'data-i': i, class: 'navdot', 'aria-label': t('ui.exN', { n: i + 1 }) }, String(i + 1)); b.onclick = () => { this.setDone = false; this.go(i); if (i === this.pos) this.render(); }; dots.appendChild(b); });
        nav.appendChild(dots);
      } else nav.appendChild(h('span', { class: 'navinfo' }, t('ui.exN', { n: this.pos + 1 }) + (this.pos < this.items.length - 1 ? ' · ' + t('ui.reviewing') : '')));
      return nav;
    }
    finishSet() {
      this.main.querySelector('.excard') && this.main.querySelector('.excard').remove();
      const sm = MQ.sets.summary(this.run); if (sm.correct === sm.n) { MQ.audio.play('badge'); App.confetti(); }
      const counted = this.p.setsCounted || (this.p.setsCounted = []); if (sm.complete && sm.correct >= 0.8 * sm.n && !counted.includes(this.run.key)) { counted.push(this.run.key); this.p.stats.setsDone = (this.p.stats.setsDone || 0) + 1; G.checkBadges(this.p).forEach(b => { const bt = MQ.badgeText(b); App.toast(`🏅 ${t('ui.newBadge', { b: { raw: bt.name + (bt.tierName ? ' · ' + bt.tierName : '') } })}`); }); G.save(); }
      const c = h('section', { class: 'excard result' }, `${MQ.mascot(this.p.avatar, 110)}<h2>${t(sm.complete ? 'ui.setDone' : 'ui.setNotDone')}</h2><p>${t('ui.setScore', { a: sm.correct, b: sm.n })}</p><p class="small">${t('ui.setDetail', { f: sm.first, l: sm.later, w: sm.wrong })}${sm.skipped ? ' · ' + t('ui.setSkipped', { s: sm.skipped }) : ''}</p>${sm.wrong ? `<p>${t('ui.setRedoHint')}</p>` : ''}${sm.skipped ? `<p>${t('ui.setSkipHint')}</p>` : ''}`);
      const row = h('div', { class: 'brow' });
      const back = h('button', { class: 'btn primary', type: 'button' }, '📚 ' + t('ui.sets')); back.onclick = () => App.go('sets');
      const again = h('button', { class: 'btn', type: 'button' }, '↺ ' + t('ui.restartSet')); again.onclick = () => App.modal(`<p>${t('ui.confirmRestart')}</p>`, [{ label: t('ui.restartSet'), cls: 'primary', fn: () => { MQ.sets.restart(this.p, this.run.key); App.go('play', { mode: 'set', key: this.run.key }); } }, { label: t('ui.cancel') }]);
      row.append(back, again); c.appendChild(row); this.main.appendChild(c); this.updateNavOnly();
    }
    updateNavOnly() { if (this.navEl) this.navEl.querySelectorAll('[data-i]').forEach(b => { const it = this.items[+b.dataset.i]; b.className = 'navdot' + (it.done ? (it.correct ? ' ok' : ' bad') : (it.skipped ? ' skipped' : '')); }); }
    finishBoss(rerender) {
      this.finished = true; const sc = this.score, n = this.bossTotal; const st = sc >= n ? 3 : sc >= n - 2 ? 2 : sc >= n / 2 ? 1 : 0;
      if (!rerender) { this.p.boss[this.region.id] = Math.max(this.p.boss[this.region.id] || 0, st); G.checkBadges(this.p).forEach(b => { const bt = MQ.badgeText(b); App.toast(`🏅 ${t('ui.newBadge', { b: { raw: bt.name + (bt.tierName ? ' · ' + bt.tierName : '') } })}`); }); G.save(); }
      if (st >= 2) { MQ.audio.play('badge'); App.confetti(); }
      this.main.querySelector('.excard') && this.main.querySelector('.excard').remove();
      const c = h('section', { class: 'excard result' }, `${MQ.mascot(this.p.avatar, 110)}<h2>${t(st >= 2 ? 'ui.bossWon' : 'ui.bossTry')}</h2><p>${t('ui.bossScore', { a: sc, b: n })}</p>${stars(st)}`);
      const row = h('div', { class: 'brow' }); const again = h('button', { class: 'btn primary', type: 'button' }, t('ui.again')); again.onclick = () => App.go('play', this.params); const back = h('button', { class: 'btn', type: 'button' }, '← ' + t('ui.map')); back.onclick = () => App.go('region', { id: this.region.id }); row.append(again, back); c.appendChild(row); this.main.appendChild(c);
    }
    finishBlitz(rerender) {
      this.finished = true; this.stop(); const best = this.p.blitz[this.stage] || 0;
      if (!rerender && this.score > best) { this.p.blitz[this.stage] = this.score; G.save(); }
      this.main.querySelector('.excard') && this.main.querySelector('.excard').remove();
      const c = h('section', { class: 'excard result' }, `${MQ.mascot(this.p.avatar, 110)}<h2>${t('ui.timeUp')}</h2><p>${t('ui.blitzScore', { n: this.score })}</p><p>${this.score > best ? t('ui.newRecord') : t('ui.bestSoFar', { n: best })}</p><p class="small">${t('ui.blitzNote')}</p>`);
      const row = h('div', { class: 'brow' }); const again = h('button', { class: 'btn primary', type: 'button' }, '▶ ' + t('ui.practise')); again.onclick = () => App.go('play', { stage: this.stage, mode: 'practice' }); const back = h('button', { class: 'btn', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => App.go('region', { id: regionOf(this.stage).id }); row.append(again, back); c.appendChild(row); this.main.appendChild(c);
    }
  }

  function renderFigure(ex, lang) {
    const f = ex.figure; if (!f) return '';
    if (typeof f === 'function') return f(lang);
    if (typeof f === 'string') return f;
    if (f.htmlFig) return MQ.fmtVal(f.htmlFig, lang);
    return '';
  }
  App.renderFigure = renderFigure; App.esc = esc; App.stars = stars;
  root.addEventListener && root.addEventListener('DOMContentLoaded', () => App.init());
})(typeof window !== 'undefined' ? window : globalThis);
