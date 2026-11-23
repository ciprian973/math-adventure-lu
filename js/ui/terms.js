/* =====================================================================
 * terms.js — the maths words in a second language (usually German, the
 * language maths is taught in at the école fondamentale).
 *  - in questions, hints and explanations, known terms are underlined with
 *    dots; a tap shows (and says) the term in the other language;
 *  - a dictionary page lists every term in the five languages.
 * The child keeps learning the terms in the language of the app; the
 * second language is one tap away. Set per pupil in the teacher area.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ;
  const NAMES = { ro: 'Română', de: 'Deutsch', fr: 'Français', en: 'English', lb: 'Lëtzebuergesch' };
  const cache = {};

  /* one regular expression per language, longest forms first */
  function finder(lang) {
    if (cache[lang]) return cache[lang];
    const map = new Map(); const forms = [];
    MQ.GLOSSARY.forEach(g => (g[lang] ? g[lang].f : []).forEach(f => { const k = f.toLowerCase(); if (!map.has(k)) { map.set(k, g.id); forms.push(f); } }));
    forms.sort((a, b) => b.length - a.length);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = forms.length ? new RegExp('(?<![\\p{L}\\p{N}])(' + forms.map(esc).join('|') + ')(?![\\p{L}\\p{N}])', 'giu') : null;
    return (cache[lang] = { re, map });
  }

  const T = MQ.terms = {
    NAMES,
    byId: id => MQ.GLOSSARY.find(g => g.id === id),
    /* the second language for a pupil: chosen, or German (French when the app itself is in German) */
    otherLang(p, uiLang) {
      const c = p && p.termLang;
      if (c === 'none') return null;
      if (c && c !== uiLang) return c;
      return uiLang === 'de' ? 'fr' : 'de';
    },
    /* underline known terms of `lang` inside `el` (first occurrence of each term only) */
    mark(el, lang, other) {
      if (!el || !other || other === lang || !MQ.GLOSSARY) return;
      const { re, map } = finder(lang); if (!re) return;
      const seen = new Set();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest('button, input, textarea, select, svg, .term, .frac, .kprev, code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const text = node.nodeValue; re.lastIndex = 0; let m, last = 0; const frag = document.createDocumentFragment(); let changed = false;
        while ((m = re.exec(text))) {
          const id = map.get(m[1].toLowerCase()); if (!id || seen.has(id)) continue;
          seen.add(id); changed = true;
          frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          const b = document.createElement('button'); b.type = 'button'; b.className = 'term'; b.dataset.g = id; b.dataset.l = lang; b.dataset.o = other; b.textContent = m[1];
          b.setAttribute('aria-label', m[1] + ' — ' + MQ.t('ui.termTap'));
          frag.appendChild(b); last = m.index + m[1].length;
        }
        if (changed) { frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
      });
    },
    /* a tap on a term: show it in the other language and say it */
    show(id, lang, other) {
      const g = T.byId(id); if (!g || !g[other]) return;
      MQ.app.toast(`📖 ${g[lang] ? g[lang].t : ''} = <b>${g[other].t}</b> <small>(${NAMES[other]})</small>`, 4500);
      if (MQ.speech && MQ.speech.available()) MQ.speech.speak(g[other].t.replace(/\(.*?\)/g, ''), other);
    }
  };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.term'); if (b) { e.preventDefault(); T.show(b.dataset.g, b.dataset.l, b.dataset.o); } });
})(typeof window !== 'undefined' ? window : globalThis);
