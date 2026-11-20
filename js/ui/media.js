/* =====================================================================
 * media.js — short synthesized sounds (no audio files, mute button),
 * read-aloud with the browser's speech synthesis, and the mascot Léo
 * (an original drawing of a young red lion, as on Luxembourg's arms).
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};

  /* ---------------- sounds ---------------- */
  let ctx = null;
  const tones = {
    tap: [[660, 0.04, 0.05]],
    ok: [[523, 0.09, 0.12], [784, 0.14, 0.12]],
    retry: [[330, 0.12, 0.08], [294, 0.16, 0.06]],
    level: [[523, 0.1, 0.12], [659, 0.1, 0.12], [784, 0.1, 0.12], [1047, 0.25, 0.12]],
    badge: [[784, 0.12, 0.1], [988, 0.12, 0.1], [1175, 0.3, 0.1]],
    tick: [[880, 0.03, 0.04]]
  };
  MQ.audio = {
    play(name) {
      if (MQ.game && MQ.game.data && MQ.game.data.settings.mute) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        let t = ctx.currentTime;
        (tones[name] || []).forEach(([f, d, v]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9; });
      } catch (e) { /* audio not available */ }
    }
  };

  /* ---------------- read aloud ---------------- */
  MQ.speech = {
    available: () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    voiceFor(lang) {
      if (!MQ.speech.available()) return null;
      const voices = speechSynthesis.getVoices(); const prefs = MQ.LOCALE[lang].speech;
      for (const p of prefs) { const v = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(p.toLowerCase())); if (v) return v; }
      return null;
    },
    speak(text, lang) {
      if (!MQ.speech.available()) return { ok: false, reason: 'none' };
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = MQ.speech.voiceFor(lang);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = MQ.LOCALE[lang].speech[0];
      u.rate = (MQ.game && MQ.game.data && MQ.game.data.settings.rate) || 0.95;
      speechSynthesis.speak(u);
      const fallback = lang === 'lb' && (!v || !v.lang.toLowerCase().startsWith('lb'));
      return { ok: true, fallback };
    },
    stop() { if (MQ.speech.available()) speechSynthesis.cancel(); }
  };

  /* ---------------- mascot ---------------- */
  MQ.mascot = (av = {}, size = 96, mood = 'happy') => {
    const M = MQ.MAP.avatar;
    const fur = (M.fur.find(f => f.id === av.fur) || M.fur[0]).c;
    const bg = (M.bg.find(b => b.id === av.bg) || M.bg[0]).c;
    const mouth = mood === 'think' ? '<path d="M44 70 q6 -3 12 0" class="mline"/>' : '<path d="M42 68 q8 8 16 0" class="mline"/>';
    const acc = {
      none: '',
      cap: '<path d="M26 34 q24 -22 48 0 z" fill="#00a3e0"/><rect x="24" y="32" width="54" height="5" rx="2" fill="#0077a8"/>',
      scarf: '<path d="M30 80 q20 10 40 0 l2 7 q-22 10 -44 0z" fill="#ef3340"/><path d="M31 85 q19 8 38 0" stroke="#fff" stroke-width="3" fill="none"/><path d="M33 90 q17 6 34 0" stroke="#00a3e0" stroke-width="3" fill="none"/>',
      glasses: '<circle cx="40" cy="52" r="8" fill="none" stroke="#222" stroke-width="2.5"/><circle cx="60" cy="52" r="8" fill="none" stroke="#222" stroke-width="2.5"/><line x1="48" y1="52" x2="52" y2="52" stroke="#222" stroke-width="2.5"/>',
      headphones: '<path d="M24 54 q26 -40 52 0" stroke="#333" stroke-width="5" fill="none"/><rect x="18" y="50" width="10" height="16" rx="4" fill="#ff6f3c"/><rect x="72" y="50" width="10" height="16" rx="4" fill="#ff6f3c"/>',
      crown: '<path d="M32 30 l6 -14 l6 10 l6 -14 l6 14 l6 -10 l6 14 z" fill="#f5c518" stroke="#b8860b" stroke-width="1.5"/>',
      wizard: '<path d="M30 34 l20 -32 l20 32 z" fill="#3b2a7a"/><circle cx="48" cy="18" r="2.5" fill="#ffd54f"/><circle cx="56" cy="26" r="2" fill="#ffd54f"/>'
    }[av.acc || 'none'] || '';
    return `<svg class="mascot" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Léo"><circle cx="50" cy="50" r="49" fill="${bg}"/>
      <g fill="${fur}"><circle cx="50" cy="55" r="30" opacity=".55"/>${[0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => `<circle cx="${50 + 26 * Math.cos(a * Math.PI / 180)}" cy="${55 + 26 * Math.sin(a * Math.PI / 180)}" r="9"/>`).join('')}</g>
      <circle cx="50" cy="56" r="21" fill="#ffd9a8"/><circle cx="35" cy="38" r="6" fill="${fur}"/><circle cx="65" cy="38" r="6" fill="${fur}"/>
      <circle cx="42" cy="52" r="3.2" fill="#222"/><circle cx="58" cy="52" r="3.2" fill="#222"/><circle cx="43" cy="51" r="1" fill="#fff"/><circle cx="59" cy="51" r="1" fill="#fff"/>
      <ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#7a3b2e"/>${mouth}<circle cx="37" cy="62" r="3" fill="#ff9e9e" opacity=".6"/><circle cx="63" cy="62" r="3" fill="#ff9e9e" opacity=".6"/>${acc}</svg>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
