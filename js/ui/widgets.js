/* =====================================================================
 * widgets.js — interactive answer widgets (DOM). One builder per widget
 * type; each returns { el, get(), set(resp), lock() }.  get() returns the
 * response object understood by core/check.js.  All widgets work with
 * touch, mouse and keyboard (Tab / arrows / Enter / Space).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ; const F = MQ.fig;
  const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } if (html) e.innerHTML = html; return e; };
  const T = (msg, lang) => MQ.tm(msg, lang);
  const W = MQ.widgets = {};
  W.h = h;

  /* make an element keyboard-activatable */
  function pressable(el, fn) { el.setAttribute('tabindex', '0'); el.addEventListener('click', fn); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } }); return el; }

  /* ---------------- symbol keys ----------------
   * Phone and tablet keyboards for numbers have no fraction bar, brackets
   * or × — these buttons type them into the answer box that was used last.
   * They only type symbols; nothing is ever computed for the pupil. */
  W.mathKeys = (fields, inputs, lang) => {
    const kinds = fields.map(f => f.kind || 'num');
    const num = kinds.some(k => k !== 'time' && k !== 'date' && k !== 'text');
    if (!num && !kinds.includes('time') && !kinds.includes('date')) return null;
    const st = MQ.i18n, dec = lang === 'en' ? '.' : ',';
    const fracIcon = '<span class="kfrac" aria-hidden="true"><i></i><b></b><i></i></span>';
    const K = [];
    if (num) K.push(
      { id: 'frac', html: fracIcon, ins: '/' },
      { id: 'lpar', html: '(', ins: '(' }, { id: 'rpar', html: ')', ins: ')' },
      { id: 'plus', html: '+', ins: '+', sp: 1 }, { id: 'minus', html: '−', ins: '−', sp: 1 },
      { id: 'times', html: st.mulSign, ins: st.mulSign, sp: 1 }, { id: 'div', html: st.divSign, ins: st.divSign, sp: 1 },
      { id: 'eq', html: '=', ins: '=', sp: 1 }, { id: lang === 'en' ? 'point' : 'comma', html: dec, ins: dec });
    if (kinds.includes('time')) K.push({ id: 'colon', html: ':', ins: ':' });
    if (kinds.includes('date')) K.push({ id: 'dot', html: '.', ins: '.' });
    K.push({ id: 'back', html: '⌫', back: 1 });
    const list = Object.values(inputs);
    let last = list[0];
    list.forEach(i => { i.addEventListener('focus', () => { last = i; refresh(); }); i.addEventListener('input', () => refresh()); });
    const bar = h('div', { class: 'mathkeys', role: 'group', 'aria-label': MQ.t('ui.keys', {}, lang) });
    const prev = h('div', { class: 'kprev', 'aria-hidden': 'true' });
    const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    function refresh() {
      const v = last ? last.value : '';
      if (!/[\/×·*:÷()+=]|\d\s*[-−]/.test(v) || (last && fields[list.indexOf(last)] && /time|date/.test(fields[list.indexOf(last)].kind || ''))) { prev.innerHTML = ''; prev.classList.remove('on'); return; }
      prev.innerHTML = esc(v).replace(/\*/g, st.mulSign).replace(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/g, '<span class="frac"><span class="fn">$1</span><span class="fd">$2</span></span>');
      prev.classList.add('on');
    }
    function type(k) {
      const inp = last; if (!inp || inp.disabled) return;
      const v = inp.value;
      const a = inp.selectionStart != null ? inp.selectionStart : v.length, b = inp.selectionEnd != null ? inp.selectionEnd : v.length;
      let left = v.slice(0, a), right = v.slice(b);
      if (k.back) { if (a === b) left = left.replace(/\s+$/, '').slice(0, -1).replace(/\s+$/, ''); }
      else {
        const trimmed = left.replace(/\s+$/, '');
        // a minus at the start or after "(" or another sign is a negative number: no spaces
        const unary = k.id === 'minus' && (!trimmed || /[(+−\-×·*:÷=]$/.test(trimmed));
        if (k.sp && !unary) { left = trimmed + (trimmed ? ' ' : '') + k.ins + ' '; right = right.replace(/^\s+/, ''); }
        else left += k.ins;
      }
      inp.value = left + right; inp.focus({ preventScroll: true });
      try { inp.setSelectionRange(left.length, left.length); } catch (e) { }
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const btns = K.map(k => {
      const bt = h('button', { type: 'button', class: 'mk mk-' + k.id, 'aria-label': MQ.t('ui.key.' + k.id, {}, lang), title: MQ.t('ui.key.' + k.id, {}, lang) });
      bt.innerHTML = k.html;
      // keep the focus (and the phone keyboard) in the answer box
      bt.addEventListener('pointerdown', e => e.preventDefault());
      bt.addEventListener('mousedown', e => e.preventDefault());
      bt.addEventListener('click', () => type(k));
      bar.appendChild(bt); return bt;
    });
    const wrap = h('div', { class: 'mkwrap' }); wrap.appendChild(bar); wrap.appendChild(prev);
    return { el: wrap, refresh, lock: () => btns.forEach(b => b.disabled = true) };
  };

  /* ---------------- input ---------------- */
  W.input = (ex, lang, onSubmit) => {
    const w = ex.widget, box = h('div', { class: 'w-input' });
    const inputs = {};
    w.fields.forEach((f, i) => {
      const row = h('label', { class: 'field' });
      if (f.label) row.appendChild(h('span', { class: 'flabel' }, T(f.label, lang)));
      const inp = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': f.label ? MQ.stripHtml(T(f.label, lang)) : MQ.t('ui.answer', {}, lang), inputmode: f.kind === 'time' || f.kind === 'date' ? 'numeric' : 'decimal', placeholder: f.kind === 'time' ? 'hh:mm' : f.kind === 'date' ? MQ.t('ui.datePh', {}, lang) : '' });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const next = Object.values(inputs)[i + 1]; if (next) next.focus(); else onSubmit(); } });
      row.appendChild(inp);
      if (f.unit) row.appendChild(h('span', { class: 'unit' }, MQ.unitStr(f.unit)));
      inputs[f.id] = inp; box.appendChild(row);
    });
    const kb = W.mathKeys(w.fields, inputs, lang);
    if (kb) box.appendChild(kb.el);
    box.appendChild(h('p', { class: 'tip' }, MQ.t(lang === 'en' ? 'ui.tipDecEn' : 'ui.tipDec', {}, lang)));
    return {
      el: box,
      get: () => ({ fields: Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.value])) }),
      set: r => { if (r && r.fields) for (const k in r.fields) if (inputs[k]) inputs[k].value = r.fields[k]; if (kb) kb.refresh(); },
      lock: () => { Object.values(inputs).forEach(i => i.disabled = true); if (kb) kb.lock(); },
      focus: () => { const f = Object.values(inputs)[0]; if (f) setTimeout(() => f.focus({ preventScroll: true }), 30); },
      mark: res => { if (res && res.fieldOk) for (const k in inputs) inputs[k].classList.toggle('bad', res.fieldOk[k] === false); }
    };
  };

  /* ---------------- mc / multi ---------------- */
  function choiceWidget(ex, lang, multi) {
    const w = ex.widget, box = h('div', { class: 'w-mc ' + (w.layout || (w.options.some(o => o.fig) ? 'grid' : 'list')), role: multi ? 'group' : 'radiogroup' });
    let sel = multi ? new Set() : null; const btns = [];
    w.options.forEach((o, i) => {
      const b = h('button', { class: 'opt', type: 'button', role: multi ? 'checkbox' : 'radio', 'aria-checked': 'false' });
      b.innerHTML = (o.fig ? `<span class="ofig">${o.fig}</span>` : '') + `<span class="olabel">${T(o.label, lang)}</span>`;
      b.addEventListener('click', () => {
        if (multi) { sel.has(i) ? sel.delete(i) : sel.add(i); } else sel = i;
        btns.forEach((bb, j) => { const on = multi ? sel.has(j) : sel === j; bb.classList.toggle('sel', on); bb.setAttribute('aria-checked', on); });
        MQ.audio && MQ.audio.play('tap');
      });
      btns.push(b); box.appendChild(b);
    });
    const refresh = () => btns.forEach((bb, j) => { const on = multi ? sel.has(j) : sel === j; bb.classList.toggle('sel', on); bb.setAttribute('aria-checked', on); });
    return {
      el: box,
      get: () => multi ? { choices: [...sel] } : { choice: sel },
      set: r => { if (!r) return; if (multi && r.choices) sel = new Set(r.choices); if (!multi && r.choice != null) sel = r.choice; refresh(); },
      lock: () => btns.forEach(b => b.disabled = true),
      reveal: () => btns.forEach((b, j) => b.classList.toggle('right', !!w.options[j].correct))
    };
  }
  W.mc = (ex, lang) => choiceWidget(ex, lang, false);
  W.multi = (ex, lang) => choiceWidget(ex, lang, true);

  /* ---------------- order (drag or ↑↓) ---------------- */
  W.order = (ex, lang) => {
    const w = ex.widget; let order = w.items.map((_, i) => i);
    const box = h('ol', { class: 'w-order' });
    const render = () => {
      box.innerHTML = '';
      order.forEach((idx, pos) => {
        const li = h('li', { class: 'oitem', 'data-pos': pos });
        li.innerHTML = `<span class="grip" aria-hidden="true">⋮⋮</span><span class="olabel">${T(w.items[idx].label, lang)}</span>`;
        const up = h('button', { type: 'button', class: 'mv', 'aria-label': MQ.t('ui.moveUp', {}, lang) }, '▲'), dn = h('button', { type: 'button', class: 'mv', 'aria-label': MQ.t('ui.moveDown', {}, lang) }, '▼');
        up.disabled = pos === 0; dn.disabled = pos === order.length - 1;
        up.onclick = () => { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; render(); box.querySelectorAll('.mv')[2 * (pos - 1)]?.focus(); };
        dn.onclick = () => { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; render(); box.querySelectorAll('.mv')[2 * (pos + 1) + 1]?.focus(); };
        li.append(up, dn);
        dragSort(li, box, () => order, o => { order = o; render(); });
        box.appendChild(li);
      });
    };
    render();
    return { el: box, get: () => ({ order: order.slice() }), set: r => { if (r && r.order && r.order.length === order.length) { order = r.order.slice(); render(); } }, lock: () => box.querySelectorAll('button').forEach(b => b.disabled = true) };
  };
  // pointer-based drag to reorder list items
  function dragSort(li, list, getOrder, setOrder) {
    const grip = li.querySelector('.grip');
    grip.addEventListener('pointerdown', e => {
      e.preventDefault(); const from = +li.dataset.pos; li.classList.add('dragging'); grip.setPointerCapture(e.pointerId);
      const move = ev => { li.style.transform = `translateY(${ev.clientY - e.clientY}px)`; };
      const up = ev => {
        grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); li.classList.remove('dragging'); li.style.transform = '';
        const items = [...list.children]; let to = from;
        items.forEach((it, i) => { const r = it.getBoundingClientRect(); if (ev.clientY > r.top && ev.clientY < r.bottom) to = i; });
        if (to !== from) { const o = getOrder().slice(); const [x] = o.splice(from, 1); o.splice(to, 0, x); setOrder(o); }
      };
      grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up);
    });
  }

  /* ---------------- bins (sort into groups): tap card, then tap group --- */
  W.bins = (ex, lang) => {
    const w = ex.widget; const place = w.items.map(() => null); let picked = null;
    const box = h('div', { class: 'w-bins' });
    const render = () => {
      box.innerHTML = '';
      const pool = h('div', { class: 'pool', 'aria-label': MQ.t('ui.cards', {}, lang) });
      const bins = w.bins.map((b, bi) => { const el = h('div', { class: 'bin', role: 'button', 'aria-label': MQ.stripHtml(T(b, lang)) }); el.innerHTML = `<div class="bintitle">${T(b, lang)}</div><div class="bincards"></div>`; pressable(el, () => { if (picked != null) { place[picked] = bi; picked = null; render(); MQ.audio && MQ.audio.play('tap'); } }); return el; });
      w.items.forEach((it, i) => {
        const c = h('button', { type: 'button', class: 'card' + (picked === i ? ' picked' : ''), 'aria-pressed': picked === i });
        c.innerHTML = T(it.label, lang);
        if (it.speak) c.setAttribute('aria-label', MQ.stripHtml(T(it.speak, lang)));
        c.addEventListener('click', e => { e.stopPropagation(); if (place[i] != null && picked == null) { place[i] = null; picked = i; } else picked = picked === i ? null : i; render(); });
        cardDrag(c, i, box, bi => { place[i] = bi; picked = null; render(); });
        (place[i] == null ? pool : bins[place[i]].querySelector('.bincards')).appendChild(c);
      });
      box.appendChild(pool); const row = h('div', { class: 'binrow' }); bins.forEach(b => row.appendChild(b)); box.appendChild(row);
    };
    render();
    return { el: box, get: () => ({ bins: place.slice() }), set: r => { if (r && r.bins) { r.bins.forEach((b, i) => place[i] = b); render(); } }, lock: () => { box.querySelectorAll('button').forEach(b => b.disabled = true); box.classList.add('locked'); } };
  };
  function cardDrag(card, i, box, drop) {
    card.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; const sx = e.clientX, sy = e.clientY; let moved = false;
      const move = ev => { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) { moved = true; card.style.transform = `translate(${ev.clientX - sx}px,${ev.clientY - sy}px)`; card.classList.add('dragging'); } };
      const up = ev => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        card.style.transform = ''; card.classList.remove('dragging');
        if (!moved) return;
        card.style.pointerEvents = 'none'; const t = document.elementFromPoint(ev.clientX, ev.clientY); card.style.pointerEvents = '';
        const bin = t && t.closest('.bin'); if (bin) { const bi = [...box.querySelectorAll('.bin')].indexOf(bin); drop(bi); }
        card.addEventListener('click', stop, { capture: true, once: true });
      };
      const stop = ev => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
  }

  /* ---------------- match: tap left, then right ---------------- */
  W.match = (ex, lang) => {
    const w = ex.widget; const n = w.left.length; const rightOrder = MQ.RNG(ex.seed + 7).shuffle([...Array(n).keys()]);
    const pairs = Array(n).fill(null); let pickL = null;
    const box = h('div', { class: 'w-match' });
    const colors = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];
    const render = () => {
      box.innerHTML = ''; const L = h('div', { class: 'mcol' }), R = h('div', { class: 'mcol' });
      w.left.forEach((lab, i) => { const b = h('button', { type: 'button', class: 'mitem ' + (pairs[i] != null ? colors[i] : '') + (pickL === i ? ' picked' : '') }); b.innerHTML = (pairs[i] != null ? `<span class="badge ${colors[i]}">${i + 1}</span>` : '') + T(lab, lang); b.onclick = () => { pickL = pickL === i ? null : i; render(); }; L.appendChild(b); });
      rightOrder.forEach(j => { const owner = pairs.indexOf(j); const b = h('button', { type: 'button', class: 'mitem ' + (owner >= 0 ? colors[owner] : '') }); b.innerHTML = (owner >= 0 ? `<span class="badge ${colors[owner]}">${owner + 1}</span>` : '') + T(w.right[j], lang); b.onclick = () => { if (pickL != null) { const prev = pairs.indexOf(j); if (prev >= 0) pairs[prev] = null; pairs[pickL] = j; pickL = null; MQ.audio && MQ.audio.play('tap'); } else if (owner >= 0) pairs[owner] = null; render(); }; R.appendChild(b); });
      box.append(L, R);
    };
    render();
    return { el: box, get: () => ({ pairs: pairs.slice() }), set: r => { if (r && r.pairs) { r.pairs.forEach((p, i) => pairs[i] = p); render(); } }, lock: () => box.querySelectorAll('button').forEach(b => b.disabled = true) };
  };

  /* ---------------- shade (pie / bar / set / cells) ---------------- */
  W.shade = (ex, lang) => {
    const w = ex.widget; let on = new Set();
    const box = h('div', { class: 'w-shade' });
    const ids = w.kind === 'cells' ? w.cellIds : [...Array(w.parts).keys()];
    const draw = () => {
      const arr = [...on];
      box.innerHTML = w.kind === 'pie' ? F.pie(w.parts, arr, { interactive: true }) : w.kind === 'bar' ? F.bar(w.parts, arr, { interactive: true }) : w.kind === 'set' ? F.set(w.parts, arr, { interactive: true, cols: w.cols || 6 }) : F.cells(w.cols, w.rows, arr, { interactive: true, cell: w.cols >= 10 && w.rows >= 10 ? 26 : 30 });
      box.insertAdjacentHTML('beforeend', `<p class="count" aria-live="polite">${MQ.t('ui.coloured', { n: on.size, t: ids.length }, lang)}</p>`);
      box.querySelectorAll('.hit').forEach(el => { const id = w.kind === 'cells' ? el.dataset.cell : +el.dataset.cell; el.setAttribute('tabindex', '0'); const tog = () => { on.has(id) ? on.delete(id) : on.add(id); MQ.audio && MQ.audio.play('tap'); draw(); const again = [...box.querySelectorAll('.hit')].find(x => String(x.dataset.cell) === String(id)); again && again.focus(); }; el.addEventListener('click', tog); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } }); });
    };
    draw();
    return { el: box, get: () => ({ shaded: [...on] }), set: r => { if (r && r.shaded) { on = new Set(r.shaded); draw(); } }, lock: () => { box.classList.add('locked'); } };
  };

  /* ---------------- number line ---------------- */
  W.numberline = (ex, lang) => {
    const w = ex.widget; let tick = null; const box = h('div', { class: 'w-nline', tabindex: '0', role: 'slider', 'aria-valuemin': 0, 'aria-valuemax': w.ticks });
    const draw = () => {
      const markers = tick == null ? [] : [{ at: MQ.Q.of(w.a).add(MQ.Q.of(w.b).sub(w.a).div(w.ticks).mul(tick)), label: '', cls: 'user' }];
      box.innerHTML = F.numberLine(w.a, w.b, w.ticks, { labelEvery: w.labelEvery, lang, interactive: true, markers, fracLabels: w.fracLabels });
      box.querySelectorAll('.hit').forEach(el => el.addEventListener('click', () => { tick = +el.dataset.i; MQ.audio && MQ.audio.play('tap'); draw(); }));
      box.setAttribute('aria-valuenow', tick == null ? '' : tick);
    };
    box.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { tick = Math.min(w.ticks, (tick == null ? 0 : tick + 1)); draw(); e.preventDefault(); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { tick = Math.max(0, (tick == null ? 0 : tick - 1)); draw(); e.preventDefault(); } });
    draw();
    return { el: box, get: () => ({ tick }), set: r => { if (r && r.tick != null) { tick = r.tick; draw(); } }, lock: () => box.classList.add('locked') };
  };

  /* ---------------- point(s) on a coordinate grid ---------------- */
  W.point = (ex, lang) => {
    const w = ex.widget; let pts = []; let cursor = [0, 0];
    const box = h('div', { class: 'w-point', tabindex: '0', 'aria-label': MQ.t('ui.gridHelp', {}, lang) });
    const draw = () => {
      const icons = w.iconsFn ? w.iconsFn(lang) : [];
      const segs = (w.segs || []).map(s => [s[0], s[1], s[2], s[3], s[4] || 'ln thick'])
        .concat(w.arrow ? [[w.arrow[0], w.arrow[1], w.arrow[2], w.arrow[3], 'ln vec']] : [])
        .concat(w.poly ? w.poly.map((p, i) => { const q = w.poly[(i + 1) % w.poly.length]; return [p[0], p[1], q[0], q[1], 'ln']; }) : [])
        .concat(w.poly && pts.length === w.poly.length ? pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return [p[0], p[1], q[0], q[1], 'ln user']; }) : []);
      const points = (w.given || []).map(g => ({ ...g })).concat(pts.map((p, i) => ({ x: p[0], y: p[1], label: w.max > 1 && w.poly ? String.fromCharCode(65 + i) + "'" : '', cls: 'user' })));
      box.innerHTML = F.coord(w.w, w.h, { points, segments: segs, icons, interactive: true }) + `<p class="count">${MQ.t('ui.pointsPlaced', { n: pts.length, m: w.max || 1 }, lang)}${pts.length ? ' — ' + pts.map(p => '(' + p[0] + ' ; ' + p[1] + ')').join(' ') : ''}</p>`;
      box.querySelectorAll('.lattice').forEach(el => el.addEventListener('click', () => toggle(+el.dataset.x, +el.dataset.y)));
      const c = box.querySelector(`.lattice[data-x="${cursor[0]}"][data-y="${cursor[1]}"]`); if (c && document.activeElement === box) c.classList.add('cursor');
    };
    const toggle = (x, y) => { const k = pts.findIndex(p => p[0] === x && p[1] === y); if (k >= 0) pts.splice(k, 1); else { pts.push([x, y]); if (pts.length > (w.max || 1)) pts.shift(); } MQ.audio && MQ.audio.play('tap'); draw(); };
    box.addEventListener('keydown', e => { const k = e.key; if (k.startsWith('Arrow')) { e.preventDefault(); if (k === 'ArrowRight') cursor[0] = Math.min(w.w, cursor[0] + 1); if (k === 'ArrowLeft') cursor[0] = Math.max(0, cursor[0] - 1); if (k === 'ArrowUp') cursor[1] = Math.min(w.h, cursor[1] + 1); if (k === 'ArrowDown') cursor[1] = Math.max(0, cursor[1] - 1); draw(); } if (k === 'Enter' || k === ' ') { e.preventDefault(); toggle(cursor[0], cursor[1]); } });
    box.addEventListener('focus', draw);
    draw();
    return { el: box, get: () => ({ points: pts.map(p => p.slice()) }), set: r => { if (r && r.points) { pts = r.points.map(p => p.slice()); draw(); } }, lock: () => box.classList.add('locked') };
  };

  /* ---------------- cells (colour squares on a grid) ---------------- */
  W.cells = (ex, lang) => {
    const w = ex.widget; let on = new Set(); let cursor = [0, 0];
    const box = h('div', { class: 'w-cells', tabindex: '0', 'aria-label': MQ.t('ui.gridHelp', {}, lang) });
    const draw = () => {
      const fixed = w.fixed || [];
      let svg = F.cells(w.cols, w.rows, [...on].concat(fixed), { interactive: true, axis: w.axis, fixed, cell: 30 });
      if (w.axes) { const extra = w.axes.map(a => a.type === 'v' ? F.line(2 + a.at * 30, -4, 2 + a.at * 30, w.rows * 30 + 8, 'axis') : F.line(-4, 2 + a.at * 30, w.cols * 30 + 8, 2 + a.at * 30, 'axis')).join(''); svg = svg.replace('</svg>', extra + '</svg>'); }
      box.innerHTML = svg + `<p class="count">${MQ.t('ui.coloured2', { n: on.size }, lang)}</p>`;
      box.querySelectorAll('.hit').forEach(el => el.addEventListener('click', () => tog(el.dataset.cell)));
      if (document.activeElement === box) { const c = box.querySelector(`[data-cell="${cursor[0]},${cursor[1]}"]`); c && c.classList.add('cursor'); }
    };
    const tog = id => { if ((w.fixed || []).includes(id)) return; on.has(id) ? on.delete(id) : on.add(id); MQ.audio && MQ.audio.play('tap'); draw(); };
    box.addEventListener('keydown', e => { const k = e.key; if (k.startsWith('Arrow')) { e.preventDefault(); if (k === 'ArrowRight') cursor[0] = Math.min(w.cols - 1, cursor[0] + 1); if (k === 'ArrowLeft') cursor[0] = Math.max(0, cursor[0] - 1); if (k === 'ArrowDown') cursor[1] = Math.min(w.rows - 1, cursor[1] + 1); if (k === 'ArrowUp') cursor[1] = Math.max(0, cursor[1] - 1); draw(); } if (k === 'Enter' || k === ' ') { e.preventDefault(); tog(cursor.join(',')); } });
    box.addEventListener('focus', draw);
    draw();
    return { el: box, get: () => ({ cells: [...on] }), set: r => { if (r && r.cells) { on = new Set(r.cells); draw(); } }, lock: () => box.classList.add('locked') };
  };

  /* ---------------- true / false with justification ---------------- */
  W.tf = (ex, lang) => {
    const w = ex.widget; let val = null, reason = null; const box = h('div', { class: 'w-tf' });
    const render = () => {
      box.innerHTML = '';
      const row = h('div', { class: 'tfrow', role: 'radiogroup' });
      [[true, 'c.true'], [false, 'c.false']].forEach(([v, k]) => { const b = h('button', { type: 'button', class: 'opt tfb' + (val === v ? ' sel' : ''), role: 'radio', 'aria-checked': val === v }, MQ.t(k, {}, lang)); b.onclick = () => { val = v; render(); }; row.appendChild(b); });
      box.appendChild(row);
      if (w.reasons) {
        box.appendChild(h('p', { class: 'sub' }, MQ.t('ui.because', {}, lang)));
        const list = h('div', { class: 'w-mc list', role: 'radiogroup' });
        w.reasons.forEach((r, i) => { const b = h('button', { type: 'button', class: 'opt' + (reason === i ? ' sel' : ''), role: 'radio', 'aria-checked': reason === i }, T(r.label, lang)); b.onclick = () => { reason = i; render(); }; list.appendChild(b); });
        box.appendChild(list);
      }
    };
    render();
    return { el: box, get: () => ({ value: val, reason }), set: r => { if (r) { val = r.value != null ? r.value : val; reason = r.reason != null ? r.reason : reason; render(); } }, lock: () => box.querySelectorAll('button').forEach(b => b.disabled = true) };
  };

  /* ---------------- find the mistake ---------------- */
  W.mistake = (ex, lang, onSubmit) => {
    const w = ex.widget; let step = null; const box = h('div', { class: 'w-mistake' });
    let fix = null;
    const render = () => {
      const keep = fix ? fix.get() : null;
      box.innerHTML = '';
      const list = h('ol', { class: 'steps' });
      w.steps.forEach((s, i) => { const li = h('li', { class: 'step' + (step === i ? ' sel' : ''), role: 'button', 'aria-pressed': step === i }); li.innerHTML = T(s, lang); pressable(li, () => { step = i; render(); }); list.appendChild(li); });
      box.appendChild(list);
      if (step != null && w.fields && w.fields.length) { fix = W.input({ widget: { fields: w.fields } }, lang, onSubmit); if (keep) fix.set(keep); box.appendChild(fix.el); }
    };
    render();
    return { el: box, get: () => ({ step, fields: fix ? fix.get().fields : {} }), set: r => { if (r) { step = r.step != null ? r.step : step; render(); if (r.fields && fix) fix.set({ fields: r.fields }); } }, lock: () => { box.querySelectorAll('li').forEach(l => l.setAttribute('tabindex', '-1')); box.classList.add('locked'); fix && fix.lock(); } };
  };

  /* ---------------- bar chart builder ---------------- */
  W.bars = (ex, lang) => {
    const w = ex.widget; let vals = w.target.map(() => 0); let cur = 0;
    const box = h('div', { class: 'w-bars', tabindex: '0', 'aria-label': MQ.t('ui.barsHelp', {}, lang) });
    const draw = () => {
      box.innerHTML = (w.line ? F.lineChart : F.barChart)(w.labelsFn(lang), vals, { max: w.max, step: w.step, interactive: true, yName: w.yName || '' }) + `<p class="count">${w.labelsFn(lang).map((l, i) => l + ': ' + vals[i]).join(' · ')}</p>`;
      box.querySelectorAll('.barhit').forEach(el => el.addEventListener('click', () => { vals[+el.dataset.i] = +el.dataset.v; cur = +el.dataset.i; MQ.audio && MQ.audio.play('tap'); draw(); }));
    };
    box.addEventListener('keydown', e => { const k = e.key; if (k === 'ArrowLeft') cur = Math.max(0, cur - 1); if (k === 'ArrowRight') cur = Math.min(vals.length - 1, cur + 1); if (k === 'ArrowUp') vals[cur] = Math.min(w.max, vals[cur] + (w.step >= 2 ? w.step / 2 : 1)); if (k === 'ArrowDown') vals[cur] = Math.max(0, vals[cur] - (w.step >= 2 ? w.step / 2 : 1)); if (k.startsWith('Arrow')) { e.preventDefault(); draw(); } });
    draw();
    return { el: box, get: () => ({ values: vals.slice() }), set: r => { if (r && r.values) { vals = r.values.slice(); draw(); } }, lock: () => box.classList.add('locked') };
  };

  W.build = (ex, lang, onSubmit) => W[ex.widget.type](ex, lang, onSubmit);
})(typeof window !== 'undefined' ? window : globalThis);
