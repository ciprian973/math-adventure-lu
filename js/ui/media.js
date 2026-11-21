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
  /* which seasonal frame "auto" shows today */
  MQ.seasonFrame = (d = new Date()) => {
    const m = d.getMonth() + 1, day = d.getDate(), md = m * 100 + day;
    if (md >= 1201 && md <= 1231) return 'christmas';
    if (md >= 1015 && md <= 1102) return 'halloween';
    if (md >= 618 && md <= 625) return 'nationalday';
    if (md >= 820 && md <= 912) return 'fouer';
    return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'spring' : m <= 8 ? 'summer' : 'autumn';
  };
  const ring = (glyphs, n = 10, r = 44, size = 13) => Array.from({ length: n }, (_, k) => { const a = -Math.PI / 2 + 2 * Math.PI * k / n; return `<text x="${(50 + r * Math.cos(a)).toFixed(1)}" y="${(50 + r * Math.sin(a) + size * 0.35).toFixed(1)}" font-size="${size}" text-anchor="middle">${glyphs[k % glyphs.length]}</text>`; }).join('');
  const band = (stroke, w = 5, extra = '') => `<circle cx="50" cy="50" r="46.5" fill="none" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
  const FRAMES = {
    none: () => '',
    winter: () => band('#bfe3ff') + ring(['❄️']),
    spring: () => band('#c8f0c0') + ring(['🌸', '🌼']),
    summer: () => band('#ffe08a') + ring(['☀️', '🌊']),
    autumn: () => band('#f4c08a') + ring(['🍂', '🍁']),
    christmas: () => band('#1f7a3a') + ring(['🎄', '⭐', '🎁']) + band('#d7263d', 1.5, 'stroke-dasharray="3 4"'),
    halloween: () => band('#ff8a1f') + ring(['🎃', '🦇']),
    nationalday: () => '<circle cx="50" cy="50" r="47" fill="none" stroke="#ef3340" stroke-width="2.4"/><circle cx="50" cy="50" r="44.8" fill="none" stroke="#ffffff" stroke-width="2.4"/><circle cx="50" cy="50" r="42.6" fill="none" stroke="#00a3e0" stroke-width="2.4"/>' + ring(['🎆'], 4, 44, 11),
    fouer: () => band('#ffd23f') + ring(['🎡', '🎠', '🍭']),
    silver: () => band('#b8c2cc', 6) + band('#eef2f5', 1.5),
    gold: () => band('#e8b923', 6) + band('#fff3b0', 1.5) + ring(['✨'], 6, 46, 9),
    platinum: () => band('#9fd8e8', 6) + band('#f2fbff', 1.5) + ring(['✦'], 8, 46, 8),
    diamond: () => band('#6ec6ff', 6) + ring(['💎'], 6, 45, 10),
    legend: () => band('url(#mqRainbow)', 6) + ring(['👑', '⭐'], 6, 45, 10)
  };
  MQ.FRAMES = Object.keys(FRAMES);

  MQ.mascot = (av = {}, size = 96, mood = 'happy') => {
    const M = MQ.MAP.avatar;
    const fur = (M.fur.find(f => f.id === av.fur) || M.fur[0]).c;
    const bgItem = M.bg.find(b => b.id === av.bg) || M.bg[0]; const bg = bgItem.c;
    const girl = av.style === 'girl';
    const mouth = mood === 'think' ? '<path d="M44 70 q6 -3 12 0" class="mline"/>' : '<path d="M42 68 q8 8 16 0" class="mline"/>';
    const acc = {
      none: '',
      cap: '<path d="M26 34 q24 -22 48 0 z" fill="#00a3e0"/><rect x="24" y="32" width="54" height="5" rx="2" fill="#0077a8"/>',
      bow: '<path d="M50 27 l-13 -7 v14 z" fill="#ff4f8b"/><path d="M50 27 l13 -7 v14 z" fill="#ff4f8b"/><circle cx="50" cy="27" r="3.5" fill="#d61f69"/>',
      scarf: '<path d="M30 80 q20 10 40 0 l2 7 q-22 10 -44 0z" fill="#ef3340"/><path d="M31 85 q19 8 38 0" stroke="#fff" stroke-width="3" fill="none"/><path d="M33 90 q17 6 34 0" stroke="#00a3e0" stroke-width="3" fill="none"/>',
      flower: '<g transform="translate(70 34)">' + [0, 72, 144, 216, 288].map(a => `<circle cx="${(6 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(6 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="4.5" fill="#ffffff" stroke="#f3a6c8" stroke-width="1"/>`).join('') + '<circle r="3.5" fill="#ffd23f"/></g>',
      glasses: '<circle cx="40" cy="52" r="8" fill="none" stroke="#222" stroke-width="2.5"/><circle cx="60" cy="52" r="8" fill="none" stroke="#222" stroke-width="2.5"/><line x1="48" y1="52" x2="52" y2="52" stroke="#222" stroke-width="2.5"/>',
      headphones: '<path d="M24 54 q26 -40 52 0" stroke="#333" stroke-width="5" fill="none"/><rect x="18" y="50" width="10" height="16" rx="4" fill="#ff6f3c"/><rect x="72" y="50" width="10" height="16" rx="4" fill="#ff6f3c"/>',
      crown: '<path d="M32 30 l6 -14 l6 10 l6 -14 l6 14 l6 -10 l6 14 z" fill="#f5c518" stroke="#b8860b" stroke-width="1.5"/>',
      wizard: '<path d="M30 34 l20 -32 l20 32 z" fill="#3b2a7a"/><circle cx="48" cy="18" r="2.5" fill="#ffd54f"/><circle cx="56" cy="26" r="2" fill="#ffd54f"/>',
      sunglasses: '<rect x="31" y="46" width="16" height="11" rx="4" fill="#1d2433"/><rect x="53" y="46" width="16" height="11" rx="4" fill="#1d2433"/><line x1="47" y1="50" x2="53" y2="50" stroke="#1d2433" stroke-width="2.5"/><path d="M34 48 l5 0" stroke="#7fd3ff" stroke-width="1.5"/><path d="M56 48 l5 0" stroke="#7fd3ff" stroke-width="1.5"/>',
      chef: '<rect x="35" y="22" width="30" height="12" rx="2" fill="#fff" stroke="#ccc"/><circle cx="38" cy="18" r="8" fill="#fff" stroke="#ddd"/><circle cx="50" cy="13" r="9" fill="#fff" stroke="#ddd"/><circle cx="62" cy="18" r="8" fill="#fff" stroke="#ddd"/>',
      pirate: '<path d="M22 34 q28 -26 56 0 q-28 -8 -56 0z" fill="#1d1d1d"/><circle cx="50" cy="24" r="4" fill="#fff"/><path d="M47 28 l6 0" stroke="#fff" stroke-width="1.5"/><circle cx="58" cy="52" r="6" fill="#1d1d1d"/><path d="M30 44 l34 6" stroke="#1d1d1d" stroke-width="1.5"/>',
      viking: '<path d="M28 36 q22 -28 44 0 z" fill="#9aa5b1" stroke="#5f6b77" stroke-width="1.5"/><rect x="27" y="34" width="46" height="4" fill="#6b4f2a"/><path d="M29 32 q-12 -6 -10 -20 q6 10 14 14z" fill="#f2e6c9" stroke="#bfae86"/><path d="M71 32 q12 -6 10 -20 q-6 10 -14 14z" fill="#f2e6c9" stroke="#bfae86"/>',
      graduate: '<path d="M22 26 l28 -10 l28 10 l-28 10 z" fill="#1d2433"/><rect x="38" y="28" width="24" height="8" fill="#1d2433"/><path d="M74 27 v12" stroke="#f5c518" stroke-width="2"/><circle cx="74" cy="40" r="2.5" fill="#f5c518"/>',
      astronaut: '<circle cx="50" cy="55" r="33" fill="#cfefff" fill-opacity=".28" stroke="#e6eef5" stroke-width="4"/><path d="M28 34 q8 -10 20 -12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="40" y="86" width="20" height="6" rx="2" fill="#e6eef5"/>',
      hero: '<path d="M28 50 q12 -10 22 -2 q10 -8 22 2 q-4 10 -12 8 q-6 -1 -10 -4 q-4 3 -10 4 q-8 2 -12 -8z" fill="#d7263d"/><circle cx="42" cy="52" r="2.6" fill="#fff"/><circle cx="58" cy="52" r="2.6" fill="#fff"/>',
      diamondcrown: '<path d="M30 30 l6 -16 l7 10 l7 -14 l7 14 l7 -10 l6 16 z" fill="#bfe9ff" stroke="#3aa0d8" stroke-width="1.5"/><path d="M50 14 l3 4 l-3 4 l-3 -4z" fill="#6ec6ff"/><circle cx="37" cy="24" r="1.8" fill="#fff"/><circle cx="63" cy="24" r="1.8" fill="#fff"/>'
    }[av.acc || 'none'] || '';
    // face details: the girl lion has a softer, smaller mane, eyelashes and a little tuft-bow
    const maneR = girl ? 8 : 9, maneDist = girl ? 25 : 26;
    const lashes = girl ? '<path d="M38 48.5 l-2 -2.5 M40.5 47.6 l-0.8 -3 M43.5 48 l0.6 -2.8" stroke="#222" stroke-width="1.3" stroke-linecap="round"/><path d="M62 48.5 l2 -2.5 M59.5 47.6 l0.8 -3 M56.5 48 l-0.6 -2.8" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>' : '';
    const tuft = girl && !['bow', 'crown', 'wizard', 'chef', 'pirate', 'viking', 'graduate', 'astronaut', 'diamondcrown', 'cap'].includes(av.acc) ? '<path d="M50 31 l-7 -4 v8 z M50 31 l7 -4 v8 z" fill="#ff4f8b"/><circle cx="50" cy="31" r="2.2" fill="#d61f69"/>' : (!girl ? '<path d="M47 33 q3 -7 6 0" fill="' + fur + '"/>' : '');
    const space = bgItem.id === 'space' ? [[20, 22], [78, 18], [84, 70], [16, 76], [30, 88], [70, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join('') : '';
    const frameId = av.frame === 'auto' ? MQ.seasonFrame() : (av.frame || 'none');
    const frame = (FRAMES[frameId] || FRAMES.none)();
    const defs = (fur.includes('mqRainbow') || frameId === 'legend') ? '<defs><linearGradient id="mqRainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d4d"/><stop offset=".25" stop-color="#ffb84d"/><stop offset=".5" stop-color="#5dd35d"/><stop offset=".75" stop-color="#4da6ff"/><stop offset="1" stop-color="#b84dff"/></linearGradient></defs>' : '';
    return `<svg class="mascot" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Léo">${defs}<circle cx="50" cy="50" r="49" fill="${bg}"/>${space}
      <g fill="${fur}"><circle cx="50" cy="55" r="30" opacity=".55"/>${[0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => `<circle cx="${(50 + maneDist * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(55 + maneDist * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="${maneR}"/>`).join('')}</g>
      <circle cx="50" cy="56" r="21" fill="#ffd9a8"/><circle cx="35" cy="38" r="6" fill="${fur}"/><circle cx="65" cy="38" r="6" fill="${fur}"/>${tuft}
      <circle cx="42" cy="52" r="3.2" fill="#222"/><circle cx="58" cy="52" r="3.2" fill="#222"/><circle cx="43" cy="51" r="1" fill="#fff"/><circle cx="59" cy="51" r="1" fill="#fff"/>${lashes}
      <ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#7a3b2e"/>${mouth}<circle cx="37" cy="62" r="3" fill="#ff9e9e" opacity="${girl ? '.85' : '.6'}"/><circle cx="63" cy="62" r="3" fill="#ff9e9e" opacity="${girl ? '.85' : '.6'}"/>${acc}${frame}</svg>`;
  };

  /* ---------------- medals for badges (5 tiers) ----------------
   * 1 bronze + ribbon · 2 silver + oak leaves · 3 gold + laurels
   * 4 supreme: diamond + laurels + crossed swords + star · 5 maximum: rays, crown, everything */
  const METAL = { 1: ['#e0a36a', '#a0612b', '#6e3d14'], 2: ['#eef2f6', '#b6c0ca', '#6f7b87'], 3: ['#ffe27a', '#e5b21c', '#9a6f00'], 4: ['#d8f4ff', '#7fd0f5', '#2a86b8'], 5: ['#fff3b0', '#f0b400', '#8e44ad'] };
  const RIBBON = { 1: ['#c8102e', '#8f0b20'], 2: ['#1f78b4', '#13507a'], 3: ['#ef3340', '#00a3e0'], 4: ['#6a3d9a', '#43246a'], 5: ['#8e44ad', '#f0b400'] };
  const leaf = (x, y, rot, c, s = 1) => `<ellipse cx="${x}" cy="${y}" rx="${4.2 * s}" ry="${1.9 * s}" transform="rotate(${rot} ${x} ${y})" fill="${c}"/>`;
  const laurel = (c1, c2) => { let o = ''; for (let k = 0; k < 8; k++) { const deg = 105 + k * 19, a = deg * Math.PI / 180, x = 60 + 39 * Math.cos(a), y = 62 + 39 * Math.sin(a); const rot = deg + 90 - 25; o += leaf(x.toFixed(1), y.toFixed(1), rot.toFixed(0), k % 2 ? c1 : c2, 1.25); o += leaf((120 - x).toFixed(1), y.toFixed(1), (180 - rot).toFixed(0), k % 2 ? c1 : c2, 1.25); } return o; };
  const oak = () => { const lobe = (x, y, rot) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0 q-3 -4 0 -7 q-4 -2 -1 -6 q-4 -1 -1 -6 q3 1 3 4 q3 -2 4 2 q-3 2 -1 4 q3 1 1 4 q-2 1 -2 1z" fill="#6b8e23" stroke="#4b6418" stroke-width=".6"/>`;
    return lobe(24, 82, -35) + lobe(18, 62, -8) + lobe(24, 42, 20) + lobe(96, 82, 35) + lobe(102, 62, 8) + lobe(96, 42, -20) + '<circle cx="28" cy="92" r="3" fill="#b5651d"/><rect x="25.5" y="87.5" width="5" height="3" rx="1.2" fill="#6e3d14"/><circle cx="92" cy="92" r="3" fill="#b5651d"/><rect x="89.5" y="87.5" width="5" height="3" rx="1.2" fill="#6e3d14"/>'; };
  const swords = () => { const sw = flip => `<g transform="translate(60 62) rotate(${flip ? 45 : -45})"><rect x="-2.2" y="-54" width="4.4" height="86" rx="1" fill="#e8eef2" stroke="#7d8791" stroke-width=".8"/><path d="M-2.2 -54 l2.2 -7 l2.2 7z" fill="#e8eef2" stroke="#7d8791" stroke-width=".8"/><rect x="-10" y="32" width="20" height="4.5" rx="2" fill="#b8860b"/><rect x="-2.2" y="36.5" width="4.4" height="10" fill="#6e3d14"/><circle cy="48.5" r="3.2" fill="#b8860b"/></g>`; return sw(0) + sw(1); };
  const rays = () => Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<path d="M60 60 L${(60 + 58 * Math.cos(a - 0.08)).toFixed(1)} ${(60 + 58 * Math.sin(a - 0.08)).toFixed(1)} L${(60 + 58 * Math.cos(a + 0.08)).toFixed(1)} ${(60 + 58 * Math.sin(a + 0.08)).toFixed(1)}z" fill="#ffd54f" opacity=".55"/>`; }).join('');
  MQ.medal = (tier = 1, icon = '🏅', size = 72, locked = false) => {
    const [hi, mid, lo] = METAL[tier], [r1, r2] = RIBBON[tier], gid = 'mg' + tier;
    const ribbon = `<path d="M44 84 l-12 34 l10 -4 l6 9 l10 -30z" fill="${r1}"/><path d="M76 84 l12 34 l-10 -4 l-6 9 l-10 -30z" fill="${r2}"/>`;
    const mark = { 1: 'I', 2: 'II', 3: 'III', 4: '★', 5: '♛' }[tier];
    let s = `<defs><radialGradient id="${gid}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${hi}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></radialGradient></defs>`;
    if (tier >= 5) s += rays();
    if (tier >= 4) s += swords();
    s += ribbon;
    if (tier === 2) s += oak();
    if (tier >= 3) s += laurel(tier >= 5 ? '#e5b21c' : '#2e7d32', tier >= 5 ? '#b8860b' : '#43a047');
    s += `<circle cx="60" cy="60" r="31" fill="url(#${gid})" stroke="${lo}" stroke-width="2.5"/><circle cx="60" cy="60" r="25" fill="none" stroke="${hi}" stroke-width="1.5" opacity=".8"/>`;
    s += `<text x="60" y="66" font-size="24" text-anchor="middle">${icon}</text><text x="60" y="86" font-size="11" font-weight="800" text-anchor="middle" fill="${lo}">${mark}</text>`;
    if (tier >= 4) s += `<path d="M60 14 l3.5 7 l7.7 1.1 l-5.6 5.4 l1.3 7.6 l-6.9 -3.6 l-6.9 3.6 l1.3 -7.6 l-5.6 -5.4 l7.7 -1.1z" fill="${tier >= 5 ? '#f0b400' : '#7fd0f5'}" stroke="${tier >= 5 ? '#9a6f00' : '#2a86b8'}" stroke-width="1"/>`;
    if (tier >= 5) s += '<path d="M44 12 l5 -9 l6 6 l5 -8 l5 8 l6 -6 l5 9z" fill="#f0b400" stroke="#9a6f00" stroke-width="1" transform="translate(0 -2)"/>';
    return `<svg class="medal t${tier}${locked ? ' locked' : ''}" viewBox="0 0 120 125" width="${size}" height="${Math.round(size * 125 / 120)}" aria-hidden="true">${s}</svg>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
