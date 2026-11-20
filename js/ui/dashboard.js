/* =====================================================================
 * dashboard.js — teacher / parent area, protected by a PIN.
 * Mastery per curriculum objective (official PE wording), time spent,
 * frequent errors, topic assignment, export to CSV and to PDF (print),
 * curriculum coverage of the app, settings (× or · sign, PIN).
 * Note: the PIN keeps children out of this area on a shared device; it
 * is not strong security (everything stays on this device).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const G = MQ.game; const h = MQ.widgets.h; const App = () => MQ.app;
  const t = (k, v) => MQ.t(k, v || {});
  let unlocked = false, selected = null, tab = 'overview';
  const pct = x => x == null ? '—' : Math.round(100 * x) + ' %';
  const mins = ms => Math.round(ms / 60000);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const D = MQ.dashboard = {
    gate(main) {
      const s = G.settings();
      if (unlocked) return D.render(main);
      main.appendChild(h('h1', {}, '🎓 ' + t('ui.teacher')));
      const f = h('form', { class: 'card form narrow' });
      if (!s.pinHash) {
        f.innerHTML = `<p>${t('dash.setPin')}</p><label>${t('dash.pin')}<input name="a" type="password" inputmode="numeric" minlength="4" maxlength="8" required></label><label>${t('dash.pinAgain')}<input name="b" type="password" inputmode="numeric" minlength="4" maxlength="8" required></label><button class="btn primary">${t('ui.ok')}</button><p class="small">${t('dash.pinNote')}</p>`;
        f.onsubmit = e => { e.preventDefault(); if (f.a.value.length < 4 || f.a.value !== f.b.value) { App().toast(t('dash.pinMismatch')); return; } s.pinHash = G.hashPin(f.a.value); G.save(); unlocked = true; App().go('teacher'); };
      } else {
        f.innerHTML = `<label>${t('dash.pin')}<input name="a" type="password" inputmode="numeric" maxlength="8" required></label><button class="btn primary">${t('dash.open')}</button><p class="small">${t('dash.forgot')}</p>`;
        f.onsubmit = e => { e.preventDefault(); if (G.hashPin(f.a.value) === s.pinHash) { unlocked = true; App().go('teacher'); } else App().toast(t('dash.wrongPin')); };
      }
      main.appendChild(f); setTimeout(() => f.a.focus(), 50);
    },
    lock() { unlocked = false; },

    render(main) {
      const ps = G.profiles();
      const head = h('div', { class: 'dashhead' });
      head.innerHTML = `<h1>🎓 ${t('ui.teacher')}</h1>`;
      const lock = h('button', { class: 'btn', type: 'button' }, '🔒 ' + t('dash.lock')); lock.onclick = () => { unlocked = false; App().go(G.active() ? 'map' : 'profiles'); }; head.appendChild(lock);
      main.appendChild(head);
      if (!ps.length) { main.appendChild(h('p', {}, t('dash.noPupils'))); D.renderSettings(main); D.renderCoverage(main); return; }
      if (!selected || !ps.find(p => p.id === selected)) selected = ps[0].id;
      const sel = h('div', { class: 'pupilsel', role: 'tablist' });
      ps.forEach(p => { const b = h('button', { type: 'button', role: 'tab', class: 'btn' + (p.id === selected ? ' primary' : ''), 'aria-selected': p.id === selected }, esc(p.name)); b.onclick = () => { selected = p.id; App().go('teacher'); }; sel.appendChild(b); });
      main.appendChild(sel);
      const tabs = h('div', { class: 'tabs', role: 'tablist' });
      [['overview', 'dash.overview'], ['mastery', 'dash.mastery'], ['errors', 'dash.errors'], ['assign', 'dash.assign'], ['sets', 'dash.sets'], ['export', 'dash.export'], ['coverage', 'dash.coverage'], ['settings', 'ui.settings']].forEach(([id, k]) => { const b = h('button', { type: 'button', role: 'tab', class: 'tab' + (tab === id ? ' sel' : ''), 'aria-selected': tab === id }, t(k)); b.onclick = () => { tab = id; App().go('teacher'); }; tabs.appendChild(b); });
      main.appendChild(tabs);
      const p = ps.find(x => x.id === selected);
      const box = h('div', { class: 'dashbody' }); main.appendChild(box);
      ({ overview: D.renderOverview, mastery: D.renderMastery, errors: D.renderErrors, assign: D.renderAssign, sets: D.renderSets, export: D.renderExport, coverage: D.renderCoverage, settings: D.renderSettings })[tab](box, p);
    },

    renderOverview(box, p) {
      const acc = p.stats.attempts ? p.stats.correct / p.stats.attempts : null;
      box.innerHTML = `<div class="kpis">
        <div class="kpi"><b>${G.levelOf(p.xp)}</b><span>${t('dash.level')}</span></div>
        <div class="kpi"><b>${p.xp}</b><span>XP</span></div>
        <div class="kpi"><b>${p.stats.attempts}</b><span>${t('dash.exercises')}</span></div>
        <div class="kpi"><b>${pct(acc)}</b><span>${t('dash.correctRate')}</span></div>
        <div class="kpi"><b>${mins(p.time.total)} min</b><span>${t('dash.time')}</span></div>
        <div class="kpi"><b>${p.badges.length}</b><span>${t('ui.badges')}</span></div></div>`;
      const tbl = h('table', { class: 'dtable' });
      tbl.innerHTML = `<caption>${t('dash.byStage')}</caption><tr><th>${t('dash.stage')}</th><th>★</th><th>${t('dash.levelNow')}</th><th>${t('dash.exercises')}</th><th>${t('dash.correctRate')}</th><th>${t('dash.time')}</th></tr>` +
        MQ.MAP.regions.flatMap(r => r.stages).map(sid => { const s = p.stages[sid]; return `<tr><td>${t('stage.' + sid)}</td><td>${G.stars(p, sid)}</td><td>${s ? s.level : '—'}</td><td>${s ? s.attempts : 0}</td><td>${s && s.attempts ? pct(s.correct / s.attempts) : '—'}</td><td>${mins(p.time.byStage[sid] || 0)} min</td></tr>`; }).join('');
      box.appendChild(tbl);
      const del = h('button', { class: 'btn danger', type: 'button' }, '🗑 ' + t('dash.deletePupil', { n: esc(p.name) }));
      del.onclick = () => App().modal(`<p>${t('dash.confirmDelete', { n: esc(p.name) })}</p>`, [{ label: t('dash.delete'), cls: 'danger', fn: () => { G.deleteProfile(p.id); selected = null; App().header(); App().go('teacher'); } }, { label: t('ui.cancel') }]);
      box.appendChild(del);
    },

    /* mastery per curriculum objective, official French wording (PE) */
    renderMastery(box, p) {
      box.appendChild(h('p', { class: 'small' }, t('dash.masteryNote')));
      const C = MQ.CURRICULUM;
      const row = (o) => { const m = G.mastery(p, o.id), ob = p.objectives[o.id]; const cls = m == null ? 'na' : m >= 0.8 ? 'good' : m >= 0.5 ? 'mid' : 'low'; return `<tr class="${cls}"><td class="oid">${o.id}</td><td>${esc(o.fr)}</td><td>${ob ? ob.a : 0}</td><td><span class="mbar"><i style="width:${m == null ? 0 : Math.round(100 * m)}%"></i></span> ${pct(m)}</td></tr>`; };
      let html = `<table class="dtable mastery"><tr><th>ID</th><th>${t('dash.objective')}</th><th>n</th><th>${t('dash.masteryCol')}</th></tr>`;
      html += `<tr class="sec"><td colspan="4">${t('dash.general')}</td></tr>` + C.general.map(row).join('');
      C.domains.forEach(d => { html += `<tr class="sec"><td colspan="4">${esc(d.fr)} — ${t('domain.' + d.id)}</td></tr>`; d.competences.forEach(c => { html += `<tr class="sub"><td colspan="4">${c.id} ${esc(c.fr)}</td></tr>` + c.objectives.map(row).join(''); }); html += `<tr class="sub"><td colspan="4">${t('dash.contents')}</td></tr>` + d.contents.map(row).join(''); });
      box.insertAdjacentHTML('beforeend', html + '</table>');
    },

    renderErrors(box, p) {
      const sk = Object.entries(p.skips || {}).sort((a, b) => b[1] - a[1]);
      if (sk.length) {
        const st = tp => (MQ.T.list.find(x => x.id === tp) || {}).stage;
        const tb = h('table', { class: 'dtable' });
        tb.innerHTML = `<caption>⏭ ${t('dash.skips')}</caption><tr><th>${t('dash.stage')}</th><th>${t('dash.skipEx')}</th><th>n</th></tr>` + sk.map(([tp, n]) => `<tr><td>${st(tp) ? t('stage.' + st(tp)) : ''}</td><td>${t('t.' + tp + '.title')}</td><td>${n}</td></tr>`).join('');
        box.appendChild(h('p', { class: 'small' }, t('dash.skipsNote'))); box.appendChild(tb);
      }
      const list = Object.entries(p.errors).sort((a, b) => b[1] - a[1]).slice(0, 12);
      if (!list.length) { box.appendChild(h('p', {}, t('dash.noErrors'))); return; }
      box.appendChild(h('p', { class: 'small' }, t('dash.errorsNote')));
      const tbl = h('table', { class: 'dtable' });
      tbl.innerHTML = `<tr><th>${t('dash.errorType')}</th><th>n</th></tr>` + list.map(([k, n]) => `<tr><td>${k.startsWith('tpl:') ? t('dash.generalError', { x: { k: 't.' + k.slice(4) + '.title' } }) : MQ.has(k) ? MQ.stripHtml(t(k, { d: '…', b: '…', a: '…', n: '…', s: '…', u: '…', f: '…', p: '…', k: '…', unit: '…', y: '…', x: '…' })) : esc(k)}</td><td>${n}</td></tr>`).join('');
      box.appendChild(tbl);
    },

    renderAssign(box, p) {
      box.appendChild(h('p', {}, t('dash.assignNote', { n: esc(p.name) })));
      MQ.MAP.regions.forEach(r => {
        const sec = h('fieldset', { class: 'card' }); sec.appendChild(h('legend', {}, t('region.' + r.id) + ' — ' + t('domain.' + r.domain)));
        r.stages.forEach(sid => { const l = h('label', { class: 'row' }, `<input type="checkbox" ${p.assigned.includes(sid) ? 'checked' : ''}> ${t('stage.' + sid)}`); l.querySelector('input').onchange = e => { if (e.target.checked) p.assigned.push(sid); else p.assigned = p.assigned.filter(x => x !== sid); p.quest = null; G.save(); }; sec.appendChild(l); });
        box.appendChild(sec);
      });
    },

    /* ---- exercise sets: create, assign, see results ---- */
    renderSets(box) {
      const ps = G.profiles();
      box.appendChild(h('p', {}, t('dash.setsNote')));
      const f = h('form', { class: 'card form' });
      f.innerHTML = `<h3>➕ ${t('dash.setNew')}</h3>
        <label>${t('dash.setName')} <input name="nm" type="text" maxlength="60" placeholder="${esc(t('dash.setNamePh'))}" required></label>
        <fieldset class="stagepick"><legend>${t('dash.setStages')}</legend>${MQ.MAP.regions.map(r => `<div class="rgroup"><b>${esc(t('region.' + r.id))}</b>${r.stages.map(sid => `<label class="row"><input type="checkbox" name="st" value="${sid}"> ${esc(t('stage.' + sid))}</label>`).join('')}</div>`).join('')}</fieldset>
        <div class="brow"><label>${t('dash.setLevel')} <select name="L"><option value="mix">${t('dash.setMixed')}</option>${[1, 2, 3, 4].map(L => `<option value="${L}">${L} · ${t('lvl.' + L)}</option>`).join('')}</select></label>
        <label>${t('dash.setCount')} <select name="n">${[5, 8, 10, 12, 15, 20].map(n => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <fieldset><legend>${t('dash.setAssign')}</legend>${ps.map(pp => `<label class="row"><input type="checkbox" name="pp" value="${pp.id}" checked> ${esc(pp.name)}</label>`).join('')}</fieldset>
        <button class="btn primary">${t('dash.setCreate')}</button>`;
      f.onsubmit = e => {
        e.preventDefault(); const stages = [...f.querySelectorAll('input[name=st]:checked')].map(x => x.value);
        if (!stages.length) { App().toast(t('dash.setNeedStage')); return; }
        const set = MQ.sets.create(f.nm.value, stages, f.L.value === 'mix' ? 'mix' : +f.L.value, +f.n.value);
        [...f.querySelectorAll('input[name=pp]:checked')].forEach(x => MQ.sets.toggleAssign(set.id, x.value, true));
        App().toast('✓ ' + t('dash.setCreated', { n: set.name })); App().go('teacher');
      };
      box.appendChild(f);
      const sets = MQ.sets.all();
      if (!sets.length) { box.appendChild(h('p', { class: 'small' }, t('dash.noSetsYet'))); return; }
      sets.slice().reverse().forEach(set => {
        const c = h('div', { class: 'card setcard' });
        c.innerHTML = `<h3>📚 ${esc(set.name)} <small>· ${t('ui.setSize', { n: set.items.length })} · ${set.level === 'mix' ? t('dash.setMixed') : t('lvl.' + set.level)} · ${esc(set.created.split('-').reverse().join('.'))}</small></h3>`;
        const det = h('details', {}, `<summary>${t('dash.setPreview')}</summary><ol class="small">${set.items.map(it => `<li>${esc(t('stage.' + it.stage))} — ${esc(t('t.' + it.tpl + '.title'))} (${t('dash.level')} ${it.level})</li>`).join('')}</ol>`);
        c.appendChild(det);
        const tbl = h('table', { class: 'dtable' });
        tbl.innerHTML = `<tr><th>${t('dash.setPupil')}</th><th>${t('dash.setAssigned')}</th><th>${t('dash.setResult')}</th></tr>` + ps.map(pp => {
          const run = (pp.setRuns || {})['s:' + set.id]; const sm = run ? MQ.sets.summary(run) : null;
          return `<tr><td>${esc(pp.name)}</td><td><input type="checkbox" data-p="${pp.id}" ${set.assigned.includes(pp.id) ? 'checked' : ''} aria-label="${esc(t('dash.setAssigned') + ': ' + pp.name)}"></td><td>${!sm || !sm.done ? t('dash.setNotStarted') : t('ui.setScore', { a: sm.correct, b: sm.n }) + ` <span class="small">(${t('ui.setDetail', { f: sm.first, l: sm.later, w: sm.wrong })}${sm.skipped ? ' · ' + t('ui.setSkipped', { s: sm.skipped }) : ''}${sm.complete ? '' : ' · ' + t('ui.setProgress', { d: sm.done, n: sm.n })})</span>`}</td></tr>`;
        }).join('');
        tbl.querySelectorAll('input[data-p]').forEach(cb => cb.onchange = () => MQ.sets.toggleAssign(set.id, cb.dataset.p, cb.checked));
        c.appendChild(tbl);
        const del = h('button', { class: 'btn danger', type: 'button' }, '🗑 ' + t('dash.setDelete')); del.onclick = () => App().modal(`<p>${t('dash.confirmDeleteSet', { n: esc(set.name) })}</p>`, [{ label: t('dash.delete'), cls: 'danger', fn: () => { MQ.sets.remove(set.id); App().go('teacher'); } }, { label: t('ui.cancel') }]);
        c.appendChild(del); box.appendChild(c);
      });
    },

    renderExport(box, p) {
      box.appendChild(h('p', {}, t('dash.exportNote')));
      const row = h('div', { class: 'brow' });
      const csv1 = h('button', { class: 'btn primary', type: 'button' }, '⬇ ' + t('dash.csvPupil', { n: esc(p.name) })); csv1.onclick = () => D.downloadCSV([p]);
      const csv2 = h('button', { class: 'btn', type: 'button' }, '⬇ ' + t('dash.csvAll')); csv2.onclick = () => D.downloadCSV(G.profiles());
      const pdf = h('button', { class: 'btn', type: 'button' }, '🖨 ' + t('dash.pdf')); pdf.onclick = () => D.printReport(p);
      row.append(csv1, csv2, pdf); box.appendChild(row);
    },
    downloadCSV(list) {
      const C = MQ.CURRICULUM; const objs = C.allObjectives();
      const q = s => '"' + String(s).replace(/"/g, '""') + '"';
      const lines = [['pupil', 'objective_id', 'objective_fr', 'attempts', 'first_try_correct', 'recent_mastery_pct'].join(';')];
      list.forEach(p => objs.forEach(o => { const ob = p.objectives[o.id]; const m = G.mastery(p, o.id); lines.push([q(p.name), o.id, q(o.fr), ob ? ob.a : 0, ob ? ob.c : 0, m == null ? '' : Math.round(100 * m)].join(';')); }));
      lines.push(''); lines.push(['pupil', 'stage', 'stars', 'level', 'attempts', 'correct', 'minutes'].join(';'));
      list.forEach(p => MQ.MAP.regions.flatMap(r => r.stages).forEach(sid => { const s = p.stages[sid]; lines.push([q(p.name), sid, G.stars(p, sid), s ? s.level : '', s ? s.attempts : 0, s ? s.correct : 0, mins(p.time.byStage[sid] || 0)].join(';')); }));
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'math-adventure-' + (list.length === 1 ? list[0].name : 'class') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
    printReport(p) {
      const div = h('div', { id: 'printarea' });
      const tmp = h('div'); D.renderMastery(tmp, p);
      div.innerHTML = `<h1>${t('app.title')} — ${esc(p.name)}</h1><p>${new Date().toLocaleDateString()} · ${t('dash.level')} ${G.levelOf(p.xp)} · ${p.stats.attempts} ${t('dash.exercises')} · ${mins(p.time.total)} min</p>` + tmp.innerHTML;
      document.body.appendChild(div); document.body.classList.add('printing');
      setTimeout(() => { window.print(); setTimeout(() => { document.body.classList.remove('printing'); div.remove(); }, 500); }, 100);
    },

    /* which templates train which objective (computed from the code) */
    renderCoverage(box) {
      const C = MQ.CURRICULUM; const objs = C.allObjectives();
      const by = {}; MQ.T.list.forEach(tp => tp.objectives.forEach(o => (by[o] = by[o] || []).push(tp.id)));
      const mt = {}; MQ.T.list.forEach(tp => (tp.mt || []).forEach(o => (mt[o] = mt[o] || []).push(tp.id)));
      box.appendChild(h('p', { class: 'small' }, t('dash.coverageNote', { n: MQ.T.list.length })));
      let html = `<table class="dtable"><tr><th>ID</th><th>${t('dash.objective')}</th><th>${t('dash.trainedBy')}</th></tr>`;
      objs.forEach(o => { const l = by[o.id] || []; html += `<tr class="${l.length ? '' : 'low'}"><td class="oid">${o.id}</td><td>${esc(o.fr)}</td><td>${l.map(id => t('t.' + id + '.title')).join(', ') || '⚠'}</td></tr>`; });
      html += `<tr class="sec"><td colspan="3">MathemaTIC — Grades 5 & 6</td></tr>`;
      C.mathematic.forEach(o => { const l = mt[o.id] || []; html += `<tr class="${l.length ? '' : 'low'}"><td class="oid">${o.id}</td><td>${esc(o.en)}${o.scope ? ' <i>(' + o.scope + ')</i>' : ''}</td><td>${l.map(id => t('t.' + id + '.title')).join(', ') || '—'}</td></tr>`; });
      box.insertAdjacentHTML('beforeend', html + '</table>');
    },

    renderSettings(box) {
      const s = G.settings();
      const c = h('div', { class: 'card form' });
      c.innerHTML = `<h3>${t('dash.notation')}</h3>
        <label class="row"><input type="radio" name="mul" value="×" ${s.mulSign !== '·' ? 'checked' : ''}> 6 × 7 &nbsp; ${t('dash.mulCross')}</label>
        <label class="row"><input type="radio" name="mul" value="·" ${s.mulSign === '·' ? 'checked' : ''}> 6 · 7 &nbsp; ${t('dash.mulDot')}</label>
        <h3>${t('dash.changePin')}</h3><label>${t('dash.newPin')}<input name="np" type="password" inputmode="numeric" minlength="4" maxlength="8"></label>`;
      c.querySelectorAll('input[name=mul]').forEach(r => r.onchange = () => { s.mulSign = r.value; MQ.setSigns(r.value); G.save(); });
      const save = h('button', { class: 'btn', type: 'button' }, t('dash.savePin')); save.onclick = () => { const v = c.querySelector('[name=np]').value; if (v.length >= 4) { s.pinHash = G.hashPin(v); G.save(); App().toast(t('dash.pinSaved')); } else App().toast(t('dash.pinShort')); };
      c.appendChild(save);
      const reset = h('button', { class: 'btn danger', type: 'button' }, t('dash.resetAll')); reset.onclick = () => App().modal(`<p>${t('dash.confirmReset')}</p>`, [{ label: t('dash.delete'), cls: 'danger', fn: () => { G.data.profiles = []; G.data.active = null; G.save(); App().header(); App().go('teacher'); } }, { label: t('ui.cancel') }]);
      c.appendChild(h('hr')); c.appendChild(reset);
      box.appendChild(c);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
