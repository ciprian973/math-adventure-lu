/* =====================================================================
 * numwords.js — number words ("mots-nombres") in FR, DE, LB, RO, EN.
 * Used by objective NO.1.5 (fractions and decimals with ≤ 3 decimals,
 * integer part 0–999) and for screen-reader / read-aloud labels.
 * Teachers: the word lists are at the top of each language block.
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};

  /* ---------------- French (France / Luxembourg usage) ---------------- */
  const FR_U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const FR_T = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
  function fr99(n) {
    if (n < 20) return FR_U[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (t <= 6) return FR_T[t] + (u === 0 ? '' : u === 1 ? ' et un' : '-' + FR_U[u]);
    if (t === 7) return 'soixante' + (u === 1 ? ' et onze' : '-' + FR_U[10 + u]);
    if (t === 8) return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + FR_U[u];
    return 'quatre-vingt-' + FR_U[10 + u];
  }
  function fr(n) {
    if (n < 100) return fr99(n);
    if (n < 1000) {
      const h = Math.floor(n / 100), r = n % 100;
      const head = h === 1 ? 'cent' : FR_U[h] + ' cent' + (r === 0 ? 's' : '');
      return r === 0 ? head : head + ' ' + fr99(r);
    }
    if (n >= 1e6) { const mil = Math.floor(n / 1e6), rest = n % 1e6; const head = mil === 1 ? 'un million' : fr(mil) + ' millions'; return rest ? head + ' ' + fr(rest) : head; }
    const th = Math.floor(n / 1000), r = n % 1000;
    let head = th === 1 ? 'mille' : fr(th).replace(/cents$/, 'cent').replace(/vingts$/, 'vingt') + ' mille';
    return r === 0 ? head : head + ' ' + fr(r);
  }

  /* ---------------- German (Standard German, as in LU schools) -------- */
  const DE_U = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const DE_T = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  function de99(n, final) {
    if (n === 1) return final ? 'eins' : 'ein';
    if (n < 20) return DE_U[n];
    const t = Math.floor(n / 10), u = n % 10;
    return u === 0 ? DE_T[t] : (u === 1 ? 'ein' : DE_U[u]) + 'und' + DE_T[t];
  }
  function de(n) {
    if (n === 0) return 'null';
    let s = '';
    const th = Math.floor(n / 1000), r = n % 1000;
    if (th) s += (th === 1 ? 'ein' : deUnder1000(th, false)) + 'tausend';
    if (r) s += deUnder1000(r, true);
    return s;
  }
  function deUnder1000(n, final) {
    const h = Math.floor(n / 100), r = n % 100;
    let s = h ? (h === 1 ? 'ein' : DE_U[h]) + 'hundert' : '';
    if (r) s += de99(r, final);
    return s;
  }

  /* ---------------- Luxembourgish (current orthography, Eifeler Regel) */
  const LB_U = ['null', 'eent', 'zwee', 'dräi', 'véier', 'fënnef', 'sechs', 'siwen', 'aacht', 'néng', 'zéng', 'eelef', 'zwielef', 'dräizéng', 'véierzéng', 'fofzéng', 'siechzéng', 'siwwenzéng', 'uechtzéng', 'nonzéng'];
  const LB_T = ['', '', 'zwanzeg', 'drësseg', 'véierzeg', 'fofzeg', 'sechzeg', 'siwwenzeg', 'achtzeg', 'nonzeg'];
  /* Eifeler Regel: final -n is kept before a vowel and before n, d, t, z, h */
  const keepN = next => /^[aeiouäëéèîïöüyndtzh]/i.test(next);
  function lb99(n, inCompound) {
    if (n === 1) return inCompound ? 'een' : 'eent';
    if (n < 20) return LB_U[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return LB_T[t];
    const unit = u === 1 ? 'een' : LB_U[u];
    return unit + (keepN(LB_T[t]) ? 'an' : 'a') + LB_T[t];
  }
  function lbUnder1000(n) {
    const h = Math.floor(n / 100), r = n % 100;
    let s = h ? (h === 1 ? '' : (h === 1 ? 'een' : LB_U[h])) + 'honnert' : '';
    if (r) s += lb99(r, false);
    return s;
  }
  function lb(n) {
    if (n === 0) return 'null';
    const th = Math.floor(n / 1000), r = n % 1000;
    let s = th ? (th === 1 ? '' : lbUnder1000(th).replace(/eent$/, 'een')) + 'dausend' : '';
    if (r) s += lbUnder1000(r);
    return s;
  }
  /* indefinite article "en/e" before a noun, by the Eifeler Regel */
  const lbArticle = noun => keepN(noun) ? 'en' : 'e';

  /* ---------------- Romanian ---------------- */
  const RO_U = ['zero', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece'];
  const RO_T = ['', '', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'];
  function ro99(n, fem) {
    if (fem) { if (n === 1) return 'o'; if (n === 2) return 'două'; if (n === 12) return 'douăsprezece'; }
    if (n < 20) return RO_U[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return RO_T[t];
    const unit = fem ? (u === 1 ? 'una' : u === 2 ? 'două' : RO_U[u]) : RO_U[u];
    return RO_T[t] + ' și ' + unit;
  }
  function ro(n, fem = false) {
    if (n < 100) return ro99(n, fem);
    if (n < 1000) {
      const h = Math.floor(n / 100), r = n % 100;
      const head = h === 1 ? 'o sută' : (h === 2 ? 'două' : RO_U[h]) + ' sute';
      return r === 0 ? head : head + ' ' + (fem && r === 1 ? 'una' : ro99(r, fem));
    }
    const th = Math.floor(n / 1000), r = n % 1000;
    let head;
    if (th === 1) head = 'o mie';
    else { const w = ro(th, true); head = w + ((th % 100 === 0 || th % 100 >= 20) ? ' de mii' : ' mii'); }
    return r === 0 ? head : head + ' ' + ro(r, fem);
  }
  /* "de" before a plural noun when the count ends in 00 or 20–99 */
  const roDe = n => (n % 100 === 0 && n > 0) || n % 100 >= 20 ? ' de ' : ' ';

  /* ---------------- English (British) ---------------- */
  const EN_U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const EN_T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function en99(n) { if (n < 20) return EN_U[n]; const t = Math.floor(n / 10), u = n % 10; return EN_T[t] + (u ? '-' + EN_U[u] : ''); }
  function enUnder1000(n) { const h = Math.floor(n / 100), r = n % 100; if (!h) return en99(r); return EN_U[h] + ' hundred' + (r ? ' and ' + en99(r) : ''); }
  function en(n) { if (n < 1000) return enUnder1000(n); const th = Math.floor(n / 1000), r = n % 1000; return enUnder1000(th) + ' thousand' + (r ? (r < 100 ? ' and ' : ' ') + enUnder1000(r) : ''); }

  const INT = { fr, de, lb, ro: n => ro(n, false), en };
  function integer(n, lang) { return INT[lang](n); }

  /* ---------------- Decimals: "3,125" ----------------
   * FR / RO read the decimal part as a number (zeros first: "zéro cinq");
   * DE / LB / EN read the digits one by one (standard in those languages). */
  const DIGIT = { de: d => d === 1 ? 'eins' : DE_U[d], lb: d => LB_U[d], en: d => EN_U[d] };
  function decimal(str, lang) {
    // str uses '.' : "3.125"
    const [i, f] = str.split('.');
    const ip = integer(+i, lang);
    if (!f) return ip;
    const sep = { fr: ' virgule ', ro: ' virgulă ', de: ' Komma ', lb: ' Komma ', en: ' point ' }[lang];
    let fp;
    if (lang === 'fr' || lang === 'ro') {
      const zeros = f.match(/^0*/)[0].length;
      const zw = lang === 'fr' ? 'zéro' : 'zero';
      const rest = f.slice(zeros);
      fp = Array(zeros).fill(zw).concat(rest ? [integer(+rest, lang)] : []).join(' ');
    } else {
      fp = f.split('').map(d => DIGIT[lang](+d)).join(' ');
    }
    return ip + sep + fp;
  }

  /* ---------------- Fractions: n/d ---------------- */
  const FR_DEN = { 2: ['demi', 'demis'], 3: ['tiers', 'tiers'], 4: ['quart', 'quarts'] };
  const DE_DEN = { 2: ['Halb', 'Halbe'], 3: ['Drittel'], 4: ['Viertel'], 5: ['Fünftel'], 6: ['Sechstel'], 7: ['Siebtel'], 8: ['Achtel'], 9: ['Neuntel'], 10: ['Zehntel'], 11: ['Elftel'], 12: ['Zwölftel'], 100: ['Hundertstel'], 1000: ['Tausendstel'] };
  const LB_DEN = { 3: 'Drëttel', 4: 'Véierel', 5: 'Fënneftel', 6: 'Sechstel', 7: 'Siwentel', 8: 'Aachtel', 9: 'Néngtel', 10: 'Zéngtel', 100: 'Honnertstel', 1000: 'Dausendstel' };
  const RO_DEN = { 2: ['doime', 'doimi'], 3: ['treime', 'treimi'], 4: ['pătrime', 'pătrimi'], 5: ['cincime', 'cincimi'], 6: ['șesime', 'șesimi'], 7: ['șeptime', 'șeptimi'], 8: ['optime', 'optimi'], 9: ['nonime', 'nonimi'], 10: ['zecime', 'zecimi'], 100: ['sutime', 'sutimi'], 1000: ['miime', 'miimi'] };
  const EN_DEN = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 7: ['seventh', 'sevenths'], 8: ['eighth', 'eighths'], 9: ['ninth', 'ninths'], 10: ['tenth', 'tenths'], 100: ['hundredth', 'hundredths'], 1000: ['thousandth', 'thousandths'] };
  /* which denominators have reliable word forms per language */
  const FRACTION_DENS = {
    fr: [2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1000], de: [2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1000],
    lb: [3, 4, 5, 6, 7, 8, 9, 10, 100, 1000], ro: [2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1000], en: [2, 3, 4, 5, 6, 7, 8, 9, 10, 100, 1000]
  };
  function fraction(n, d, lang) {
    if (!FRACTION_DENS[lang].includes(d) || n > 999) return n + '/' + d;
    switch (lang) {
      case 'fr': {
        const forms = FR_DEN[d] || (() => { const base = d === 5 ? 'cinquième' : d === 9 ? 'neuvième' : fr(d).replace(/e$/, '') + 'ième'; return [base, base + 's']; })();
        return (n === 1 ? 'un' : fr(n)) + ' ' + (n === 1 ? forms[0] : forms[1]);
      }
      case 'de': {
        const f = DE_DEN[d]; const noun = n === 1 ? f[0] : (f[1] || f[0]);
        return (n === 1 ? (d === 2 ? 'ein' : 'ein') : de(n)) + ' ' + noun;
      }
      case 'lb': { const noun = LB_DEN[d]; return (n === 1 ? lbArticle(noun) : lb(n)) + ' ' + noun; }
      case 'ro': { const f = RO_DEN[d]; return n === 1 ? 'o ' + f[0] : ro(n, true) + roDe(n).replace(/^ $/, ' ') + f[1]; }
      case 'en': { const f = EN_DEN[d]; return (n === 1 ? (d === 2 ? 'one' : 'one') : en(n)) + ' ' + (n === 1 ? f[0] : f[1]); }
    }
    return n + '/' + d;
  }

  MQ.numwords = { integer, decimal, fraction, FRACTION_DENS };
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
