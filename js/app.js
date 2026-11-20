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
  const LEVEL_KEYS = { 1: 'lvl.1', 2: 'lvl.2', 3: 'lvl.3', 4: 'lvl.4' };
  let current = { screen: 'profiles', params: {} };
  let player = null;

  const App = MQ.app = {
    init() {
      G.load(); const s = G.settings();
      if (!s.lang) { const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase(); s.lang = MQ.LANGS.includes(nav) ? nav : 'fr'; }
      MQ.setLang(s.lang); MQ.setSigns(s.mulSign); App.applySettings();
      App.header();
      if (G.active()) App.go('map'); else App.go('profiles');
      if (MQ.speech.available()) speechSynthesis.onvoiceschanged = () => {};
      document.addEventListener('keydown', e => { if (e.key === 'Escape') App.closeModal(); });
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
      const hd = $('#topbar'); hd.innerHTML = '';
      const home = h('button', { class: 'brand', type: 'button', 'aria-label': t('ui.home') }, `${MQ.mascot(p ? p.avatar : {}, 40)}<span>${t('app.title')}</span>`);
      home.onclick = () => App.go(G.active() ? 'map' : 'profiles'); hd.appendChild(home);
      const right = h('div', { class: 'tools' });
      if (p) {
        const L = G.levelOf(p.xp), [a, b] = G.levelRange(L);
        const chip = h('button', { class: 'pchip', type: 'button', 'aria-label': t('ui.profileMenu') }, `<b>${esc(p.name)}</b><span class="lv">${t('ui.level', { n: L })}</span><span class="xpbar" aria-hidden="true"><i style="width:${Math.round(100 * (p.xp - a) / (b - a))}%"></i></span><span class="xp">${p.xp} XP</span>${p.streak.days ? `<span class="streak" title="${t('ui.streak')}">🔥 ${p.streak.days}</span>` : ''}`);
        chip.onclick = () => App.go('profiles'); right.appendChild(chip);
      }
      const sel = h('select', { class: 'langsel', 'aria-label': t('ui.language') });
      MQ.LANGS.forEach(l => { const o = h('option', { value: l }, LANG_NAMES[l]); if (l === s.lang) o.selected = true; sel.appendChild(o); });
      sel.onchange = () => App.setLang(sel.value); right.appendChild(sel);
      const mute = h('button', { class: 'icon', type: 'button', 'aria-pressed': !!s.mute, 'aria-label': t(s.mute ? 'ui.unmute' : 'ui.mute') }, s.mute ? '🔇' : '🔊');
      mute.onclick = () => { s.mute = !s.mute; G.save(); App.header(); }; right.appendChild(mute);
      const set = h('button', { class: 'icon', type: 'button', 'aria-label': t('ui.settings') }, '⚙️'); set.onclick = () => App.go('settings'); right.appendChild(set);
      const tch = h('button', { class: 'icon', type: 'button', 'aria-label': t('ui.teacher') }, '🎓'); tch.onclick = () => App.go('teacher'); right.appendChild(tch);
      hd.appendChild(right);
    },

    go(screen, params = {}, keep = null) {
      if (player) { player.stop(); player = null; App._player = null; }
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
    toast(html) { const e = h('div', { class: 'toast', role: 'status' }, html); document.body.appendChild(e); setTimeout(() => e.classList.add('show'), 10); setTimeout(() => { e.classList.remove('show'); setTimeout(() => e.remove(), 400); }, 2600); },
    confetti() { const c = h('div', { class: 'confetti', 'aria-hidden': 'true' }); for (let i = 0; i < 24; i++) { const s = h('i'); s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 0.3 + 's'; s.style.background = ['#ef3340', '#00a3e0', '#ffd23f', '#3bb273', '#7b3fa0'][i % 5]; c.appendChild(s); } document.body.appendChild(c); setTimeout(() => c.remove(), 1600); }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stars = n => `<span class="stars" aria-label="${t('ui.stars', { n })}">${'★'.repeat(n)}<span class="off">${'★'.repeat(3 - n)}</span></span>`;
  const regionOf = sid => MQ.MAP.regions.find(r => r.stages.includes(sid));

  /* =================================================================== */
  const Screens = {
    /* ---------------- who is playing? ---------------- */
    profiles(main) {
      main.appendChild(h('h1', {}, t('ui.whoPlays')));
      const grid = h('div', { class: 'profgrid' });
      G.profiles().forEach(p => { const b = h('button', { class: 'prof', type: 'button' }, `${MQ.mascot(p.avatar, 84)}<b>${esc(p.name)}</b><small>${t('ui.level', { n: G.levelOf(p.xp) })} · ${p.xp} XP</small>`); b.onclick = () => { G.setActive(p.id); App.header(); App.go('map'); }; grid.appendChild(b); });
      const add = h('button', { class: 'prof add', type: 'button' }, `<span class="plus">+</span><b>${t('ui.newPlayer')}</b>`); add.onclick = () => App.go('newProfile'); grid.appendChild(add);
      main.appendChild(grid);
      main.appendChild(h('p', { class: 'privacy' }, t('ui.privacy')));
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
      const top = h('div', { class: 'maptop' });
      top.innerHTML = `<div class="hello">${MQ.mascot(p.avatar, 72)}<div><h1>${t('ui.hello', { n: esc(p.name) })}</h1><p>${t('ui.mapIntro')}</p></div></div>`;
      const qb = h('button', { class: 'quest ' + (q.done ? 'done' : ''), type: 'button' }, `<b>📜 ${t('ui.dailyQuest')}</b><span>${q.done ? t('ui.questDone') : t('ui.questProgress', { n: q.tasks.filter(k => k.n >= k.goal).length })}</span>`);
      qb.onclick = () => Screens.questModal(p); top.appendChild(qb);
      main.appendChild(top);
      // the map itself
      const wrap = h('div', { class: 'mapwrap' });
      wrap.innerHTML = `<svg class="lux" viewBox="0 0 100 100" aria-hidden="true"><path d="M38 4 L58 2 L66 12 L62 22 L72 26 L80 36 L76 48 L84 58 L82 70 L74 80 L76 92 L60 98 L48 92 L36 96 L30 86 L22 78 L26 64 L20 52 L26 40 L22 28 L30 16 Z" class="land"/><path d="M76 48 Q86 66 74 80 Q80 90 76 92" class="river"/><path d="M40 8 Q46 30 50 44 Q54 60 60 98" class="road"/></svg>`;
      MQ.MAP.regions.forEach(r => {
        const total = r.stages.length * 3, got = G.regionStars(p, r);
        const assigned = r.stages.some(s => p.assigned.includes(s));
        const b = h('button', { class: 'region r-' + r.theme, type: 'button', style: `left:${r.pos[0]}%;top:${r.pos[1]}%` }, `<span class="ricon" aria-hidden="true">${{ city: '🏙️', castle: '🏰', forest: '🌲', fair: '🎡' }[r.theme]}</span><b>${t('region.' + r.id)}</b><small>${t('domain.' + r.domain)}</small><span class="rprog"><i style="width:${Math.round(100 * got / total)}%"></i></span><small>★ ${got}/${total}</small>${assigned ? `<span class="flag" title="${t('ui.assigned')}">🚩</span>` : ''}`);
        b.onclick = () => App.go('region', { id: r.id }); wrap.appendChild(b);
      });
      main.appendChild(wrap);
      const nav = h('div', { class: 'navrow' });
      [['🦁', 'ui.avatar', () => App.go('avatar')], ['🏅', 'ui.badges', () => App.go('badges')]].forEach(([i, k, fn]) => { const b = h('button', { class: 'btn', type: 'button' }, `${i} ${t(k)}`); b.onclick = fn; nav.appendChild(b); });
      main.appendChild(nav);
    },
    questModal(p) {
      const q = G.quest(p);
      const rows = q.tasks.map(tk => `<li class="${tk.n >= tk.goal ? 'ok' : ''}"><span>${t('quest.' + tk.type, { s: { k: 'stage.' + tk.stage }, n: tk.goal })}</span><b>${tk.n}/${tk.goal}</b></li>`).join('');
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
        c.innerHTML = `<h3>${t('stage.' + sid)} ${assigned ? '🚩' : ''}</h3><p class="sdesc">${t('stage.' + sid + '.d')}</p>${stars(n)}<p class="small">${t('ui.levelNow', { l: { k: LEVEL_KEYS[st.level] } })} · ${t('ui.doneCount', { n: st.correct })}</p>`;
        const row = h('div', { class: 'brow' });
        const play = h('button', { class: 'btn primary', type: 'button' }, '▶ ' + t('ui.practise')); play.onclick = () => App.go('play', { stage: sid, mode: 'practice' });
        const blitz = h('button', { class: 'btn', type: 'button' }, '⏱ ' + t('ui.timed')); blitz.onclick = () => App.go('play', { stage: sid, mode: 'blitz' });
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
      const p = G.active(); const L = G.levelOf(p.xp); const A = MQ.MAP.avatar;
      main.appendChild(h('h1', {}, t('ui.avatarTitle')));
      const prev = h('div', { class: 'avprev' }); const render = () => { prev.innerHTML = MQ.mascot(p.avatar, 160) + `<p>${t('ui.mascotIntro')}</p>`; };
      render(); main.appendChild(prev);
      ['fur', 'acc', 'bg'].forEach(kind => {
        const sec = h('div', { class: 'card avsec' }); sec.appendChild(h('h3', {}, t('av.' + kind)));
        const row = h('div', { class: 'avrow' });
        A[kind].forEach(it => {
          const locked = it.lvl > L; const b = h('button', { type: 'button', class: 'avopt' + (p.avatar[kind] === it.id ? ' sel' : '') + (locked ? ' locked' : ''), 'aria-pressed': p.avatar[kind] === it.id, 'aria-label': t('av.' + kind + '.' + it.id) + (locked ? ' — ' + t('ui.unlockAt', { n: it.lvl }) : '') });
          b.innerHTML = MQ.mascot({ ...p.avatar, [kind]: it.id }, 56) + `<small>${locked ? '🔒 ' + t('ui.levelShort', { n: it.lvl }) : t('av.' + kind + '.' + it.id)}</small>`;
          b.onclick = () => { if (locked) { App.toast(t('ui.unlockAt', { n: it.lvl })); return; } p.avatar[kind] = it.id; G.save(); App.header(); App.go('avatar', { first }); };
          row.appendChild(b);
        });
        sec.appendChild(row); main.appendChild(sec);
      });
      const done = h('button', { class: 'btn primary big', type: 'button' }, first ? t('ui.letsGo') : t('ui.done')); done.onclick = () => App.go('map'); main.appendChild(done);
    },

    /* ---------------- badges ---------------- */
    badges(main) {
      const p = G.active();
      main.appendChild(h('h1', {}, t('ui.badges')));
      const grid = h('div', { class: 'badgegrid' });
      MQ.MAP.badges.forEach(b => { const has = p.badges.includes(b.id); grid.appendChild(h('div', { class: 'badge card' + (has ? '' : ' off') }, `<span class="bicon" aria-hidden="true">${has ? b.icon : '❔'}</span><b>${t('badge.' + b.id)}</b><small>${t('badge.' + b.id + '.d')}</small>`)); });
      main.appendChild(grid);
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
      const back = h('button', { class: 'btn', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => App.go(G.active() ? 'map' : 'profiles'); main.appendChild(back);
    },

    /* ---------------- teacher / parent ---------------- */
    teacher(main) { MQ.dashboard.gate(main); }
  };
  App.screens = Screens;

  /* =================================================================== */
  /* Player: practice, boss and timed challenge                           */
  /* =================================================================== */
  class Player {
    constructor(main, params, keep) {
      this.main = main; this.p = G.active(); this.params = params; this.mode = params.mode || 'practice';
      if (keep) { Object.assign(this, keep.state); this.restoring = keep; }
      else {
        this.recent = []; this.score = 0; this.count = 0;
        if (this.mode === 'boss') { this.region = MQ.MAP.regions.find(r => r.id === params.region); this.queue = MQ.RNG(Date.now() & 0xffffff).shuffle(this.region.stages.concat(this.region.stages).slice(0, 8)); this.bossTotal = this.queue.length; }
        if (this.mode === 'blitz') { this.deadline = null; this.blitzLevel = G.stage(this.p, params.stage).level; }
        this.next(true);
      }
      this.render();
      if (this.mode === 'blitz' && !this.timer) this.startTimer();
    }
    snapshot() { return { state: { recent: this.recent, score: this.score, count: this.count, queue: this.queue, bossTotal: this.bossTotal, region: this.region, ex: this.ex, stage: this.stage, tries: this.tries, hints: this.hints, t0: this.t0, done: this.done, lastRes: this.lastRes, deadline: this.deadline, blitzLevel: this.blitzLevel, finished: this.finished }, resp: this.widget ? this.widget.get() : null }; }
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; MQ.speech.stop(); }
    pickLevel(sid) {
      const st = G.stage(this.p, sid);
      if (this.mode === 'boss') return Math.max(2, Math.min(3, st.level));
      if (this.mode === 'blitz') return this.blitzLevel;
      return st.level;
    }
    next(first) {
      this.stage = this.mode === 'boss' ? this.queue[this.count] : this.params.stage;
      const tpls = MQ.T.forStage(this.stage).map(x => x.id);
      const avail = tpls.filter(x => !this.recent.slice(-Math.min(2, tpls.length - 1)).includes(x));
      const r = MQ.RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);
      const id = r.pick(avail.length ? avail : tpls); this.recent.push(id);
      this.ex = MQ.T.make(id, this.pickLevel(this.stage), r.int(1, 2 ** 30));
      this.tries = 0; this.hints = 0; this.t0 = Date.now(); this.done = false; this.lastRes = null;
      if (!first) this.render();
    }
    startTimer() {
      this.deadline = this.deadline || Date.now() + 60000;
      this.timer = setInterval(() => { const left = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000)); const el = this.main.querySelector('.timer'); if (el) el.textContent = '⏱ ' + left + ' s'; if (left <= 10 && left > 0) MQ.audio.play('tick'); if (left <= 0) { this.stop(); this.finishBlitz(); } }, 1000);
    }
    render() {
      const ex = this.ex, lang = MQ.i18n.lang, m = this.main; m.innerHTML = '';
      const keepResp = this.restoring ? this.restoring.resp : (this.widget ? this.widget.get() : null); this.restoring = null;
      // top bar
      const bar = h('div', { class: 'playbar' });
      const back = h('button', { class: 'btn back', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => App.go('region', { id: (this.region || regionOf(this.stage)).id }); bar.appendChild(back);
      bar.appendChild(h('h2', {}, this.mode === 'boss' ? `🐉 ${t('ui.boss')} · ${t('region.' + this.region.id)} <small>${this.count + 1}/${this.bossTotal}</small>` : t('stage.' + this.stage) + ` <small>· ${t('t.' + ex.tpl + '.title')}</small>`));
      if (this.mode === 'practice') {
        const st = G.stage(this.p, this.stage);
        const lv = h('div', { class: 'levels', role: 'radiogroup', 'aria-label': t('ui.chooseLevel') });
        [1, 2, 3, 4].forEach(L => { const b = h('button', { type: 'button', class: 'lvlb' + (ex.level === L ? ' sel' : ''), role: 'radio', 'aria-checked': ex.level === L, title: t(LEVEL_KEYS[L] + '.d') }, `${L} · ${t(LEVEL_KEYS[L])}`); b.onclick = () => { st.level = L; st.auto = false; st.recent = []; G.save(); this.next(); }; lv.appendChild(b); });
        const auto = h('label', { class: 'auto' }, `<input type="checkbox" ${st.auto ? 'checked' : ''}> ${t('ui.autoLevel')}`); auto.querySelector('input').onchange = e => { st.auto = e.target.checked; G.save(); };
        lv.appendChild(auto); bar.appendChild(lv);
      }
      if (this.mode === 'blitz') bar.appendChild(h('div', { class: 'timer', 'aria-live': 'off' }, '⏱ ' + Math.max(0, Math.ceil(((this.deadline || Date.now() + 60000) - Date.now()) / 1000)) + ' s'));
      if (this.mode === 'blitz' || this.mode === 'boss') bar.appendChild(h('div', { class: 'score' }, t('ui.score', { n: this.score })));
      m.appendChild(bar);
      if (this.finished) return this.mode === 'boss' ? this.finishBoss(true) : this.finishBlitz(true);
      // exercise card
      const card = h('section', { class: 'excard', 'aria-live': 'polite' });
      const q = h('div', { class: 'prompt' });
      q.innerHTML = `<div class="qtext">${tm(ex.prompt)}</div>`;
      const say = h('button', { class: 'icon say', type: 'button', 'aria-label': t('ui.readAloud') }, '🗣️');
      say.onclick = () => { const r = MQ.speech.speak(MQ.stripHtml(tm(ex.prompt)), lang); if (!r.ok) App.toast(t('ui.noSpeech')); else if (r.fallback && !this.warnedLb) { this.warnedLb = true; App.toast(t('ui.lbVoice')); } };
      q.prepend(say); card.appendChild(q);
      const fig = renderFigure(ex, lang); if (fig) card.appendChild(h('div', { class: 'figure' }, fig));
      this.widget = W.build(ex, lang, () => this.submit());
      if (keepResp) this.widget.set(keepResp);
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
      if (this.hints >= 3 || this.mode === 'blitz') this.btnHint.disabled = true;
      btns.append(this.btnHint, this.btnShow, this.btnCheck, this.btnNext);
      card.appendChild(btns); m.appendChild(card);
      this.fbEl = fb; this.updateButtons();
      if (this.lastRes) this.showFeedback(this.lastRes, true);
      if (!this.done && this.widget.focus) this.widget.focus();
    }
    updateButtons() {
      this.btnCheck.hidden = this.done; this.btnNext.hidden = !this.done;
      this.btnShow.hidden = this.done || this.tries === 0 || this.mode === 'blitz';
      this.btnHint.hidden = this.done;
    }
    submit() {
      if (this.done) return;
      const lang = MQ.i18n.lang; const resp = this.widget.get();
      let res; try { res = MQ.check(this.ex, resp, lang); } catch (e) { console.error(e); res = { correct: false, fb: null }; }
      if (!res.correct && res.fb && ['fb.empty', 'fb.chooseOne', 'fb.notNumber', 'fb.timeFormat', 'fb.dateFormat', 'fb.binsIncomplete', 'fb.onePoint'].includes(res.fb.k) && this.mode !== 'blitz') {
        // formal problem, not a mathematical mistake: does not count as a try
        this.lastRes = { kind: 'formal', fb: res.fb }; this.showFeedback(this.lastRes); return;
      }
      this.tries++;
      const maxTries = this.mode === 'blitz' ? 1 : 2;
      if (res.correct) { this.finish(true, res); }
      else if (this.tries >= maxTries) { this.finish(false, res); }
      else { MQ.audio.play('retry'); this.lastRes = { kind: 'retry', fb: res.fb, res }; this.widget.mark && this.widget.mark(res); this.showFeedback(this.lastRes); this.updateButtons(); }
    }
    giveUp() { this.tries = Math.max(this.tries, 2); this.finish(false, { fb: null }); }
    finish(correct, res) {
      this.done = true; const ms = Date.now() - this.t0;
      const ev = G.record(this.p, this.ex, { stage: this.stage, correct, tries: this.tries, hints: this.hints, ms, fb: (this.lastRes && this.lastRes.fb) || res.fb, mode: this.mode === 'practice' ? 'practice' : this.mode });
      if (correct) { this.score++; MQ.audio.play('ok'); if (this.tries === 1) App.confetti(); }
      this.lastRes = { kind: correct ? 'ok' : 'solution', fb: res.fb, ev, praise: 'praise.' + (1 + Math.floor(Math.random() * 8)) };
      this.widget.lock(); this.widget.reveal && !correct && this.widget.reveal();
      this.showFeedback(this.lastRes); this.updateButtons(); App.header();
      if (ev.levelUp) { MQ.audio.play('level'); App.toast(`⭐ ${t('ui.levelUp', { n: G.levelOf(this.p.xp) })}`); }
      ev.newBadges.forEach(b => { MQ.audio.play('badge'); App.toast(`🏅 ${t('ui.newBadge', { b: { k: 'badge.' + b } })}`); });
      if (ev.questDone) App.toast('📜 ' + t('ui.questDone'));
      if (this.mode === 'blitz') { setTimeout(() => { if (!this.finished && Date.now() < this.deadline) this.advance(); }, correct ? 500 : 1400); }
      if (ev.suggestUp && this.mode === 'practice') setTimeout(() => App._player === this && App.modal(`${MQ.mascot(this.p.avatar, 90)}<h2>${t('ui.suggestUpTitle')}</h2><p>${t('ui.suggestUp', { l: { k: LEVEL_KEYS[this.ex.level + 1] } })}</p>`, [{ label: t('ui.yesHarder'), cls: 'primary', fn: () => { G.stage(this.p, this.stage).level = this.ex.level + 1; G.save(); } }, { label: t('ui.stayHere') }]), 700);
      if (ev.dropDown && this.mode === 'practice') setTimeout(() => App._player === this && this.workedExample(), 700);
    }
    workedExample() {
      const L = G.stage(this.p, this.stage).level;
      const ex = MQ.T.make(this.ex.tpl, L, (Date.now() & 0xfffff) + 3);
      const lang = MQ.i18n.lang; const fig = renderFigure(ex, lang);
      App.modal(`<h2>🧭 ${t('ui.workedTitle')}</h2><p>${t('ui.workedIntro', { l: { k: LEVEL_KEYS[L] } })}</p><div class="worked"><div class="qtext">${tm(ex.prompt)}</div>${fig ? `<div class="figure">${fig}</div>` : ''}<p><b>${t('ui.answerIs')}</b> ${tm(ex.answer)}</p><p class="explain">${tm(ex.explain)}</p></div>`, [{ label: t('ui.understood'), cls: 'primary' }], { cls: 'wide' });
    }
    showFeedback(r, silent) {
      const ex = this.ex; const fb = this.fbEl; fb.className = 'feedback ' + r.kind; let html = '';
      if (r.kind === 'formal') html = `<p>${tm(r.fb)}</p>`;
      if (r.kind === 'retry') html = `${MQ.mascot(this.p.avatar, 56, 'think')}<div><p><b>${t('ui.notYet')}</b> ${r.fb ? tm(r.fb) : t('ui.tryAgain')}</p><p class="small">${t('ui.retryHint')}</p></div>`;
      if (r.kind === 'ok') html = `${MQ.mascot(this.p.avatar, 56)}<div><p><b>${t(r.praise)}</b> <span class="xpgain">+${r.ev ? r.ev.xp : 0} XP</span></p><p class="explain"><b>${t('ui.why')}</b> ${tm(ex.explain)}</p></div>`;
      if (r.kind === 'solution') html = `${MQ.mascot(this.p.avatar, 56, 'think')}<div><p><b>${t('ui.letsSee')}</b> ${r.fb ? tm(r.fb) : ''}</p><p><b>${t('ui.answerIs')}</b> ${tm(ex.answer)}</p><p class="explain"><b>${t('ui.why')}</b> ${tm(ex.explain)}</p><p class="small">${t('ui.noProblem')}</p></div>`;
      fb.innerHTML = html;
    }
    advance() {
      this.count++;
      if (this.mode === 'boss' && this.count >= this.bossTotal) return this.finishBoss();
      if (this.mode === 'blitz' && Date.now() >= this.deadline) return this.finishBlitz();
      this.next();
    }
    finishBoss(rerender) {
      this.finished = true; const sc = this.score, n = this.bossTotal; const st = sc >= n ? 3 : sc >= n - 2 ? 2 : sc >= n / 2 ? 1 : 0;
      if (!rerender) { this.p.boss[this.region.id] = Math.max(this.p.boss[this.region.id] || 0, st); G.checkBadges(this.p).forEach(b => App.toast(`🏅 ${t('ui.newBadge', { b: { k: 'badge.' + b } })}`)); G.save(); }
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
      const row = h('div', { class: 'brow' }); const again = h('button', { class: 'btn primary', type: 'button' }, t('ui.again')); again.onclick = () => App.go('play', this.params); const back = h('button', { class: 'btn', type: 'button' }, '← ' + t('ui.back')); back.onclick = () => App.go('region', { id: regionOf(this.stage).id }); row.append(again, back); c.appendChild(row); this.main.appendChild(c);
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
