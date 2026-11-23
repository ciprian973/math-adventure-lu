#!/usr/bin/env node
/* Number words: known forms in the five languages, checked against the generator (js/core/numwords.js).
 * Luxembourgish forms come from "Schwätzt Dir Lëtzebuergesch? A1" (number table p. 24 and the page numbers
 * written in words, 1–191), including the Eifeler Regel: eenanzwanzeg, eenavéierzeg, eenafofzeg, eenasiechzeg.
 *   node tools/numwords-check.js */
const path = require('path'); global.window = global;
require(path.join(__dirname, '..', 'js', 'core', 'numwords.js'));
const W = MQ.numwords.integer;
const T = {
  lb: [[11, 'eelef'], [16, 'siechzéng'], [17, 'siwwenzéng'], [21, 'eenanzwanzeg'], [27, 'siwenanzwanzeg'], [29, 'nénganzwanzeg'], [31, 'eenandrësseg'], [41, 'eenavéierzeg'], [45, 'fënnefavéierzeg'], [51, 'eenafofzeg'], [60, 'siechzeg'], [61, 'eenasiechzeg'], [70, 'siwwenzeg'], [71, 'eenasiwwenzeg'], [81, 'eenanachtzeg'], [91, 'eenannonzeg'], [101, 'honnerteent'], [117, 'honnertsiwwenzéng'], [121, 'honnerteenanzwanzeg'], [135, 'honnertfënnefandrësseg'], [165, 'honnertfënnefasiechzeg'], [250, 'zweehonnertfofzeg'], [750, 'siwenhonnertfofzeg'], [1000, 'dausend'], [2014, 'zweedausendvéierzéng'], [10000, 'zéngdausend'], [100000, 'honnertdausend'], [1000000, 'eng Millioun'], [2000000, 'zwou Milliounen'], [7000000, 'siwe Milliounen']],
  de: [[64, 'vierundsechzig'], [101, 'einhunderteins'], [1234567, 'eine Million zweihundertvierunddreißigtausendfünfhundertsiebenundsechzig'], [21000000, 'einundzwanzig Millionen']],
  fr: [[71, 'soixante et onze'], [80, 'quatre-vingts'], [80000, 'quatre-vingt mille'], [200, 'deux cents'], [1234567, 'un million deux cent trente-quatre mille cinq cent soixante-sept'], [2000000, 'deux millions']],
  ro: [[21000, 'douăzeci și una de mii'], [1234567, 'un milion două sute treizeci și patru de mii cinci sute șaizeci și șapte'], [2000000, 'două milioane'], [12000000, 'douăsprezece milioane'], [21000000, 'douăzeci și unu de milioane']],
  en: [[1234567, 'one million two hundred and thirty-four thousand five hundred and sixty-seven'], [3000005, 'three million and five']]
};
let bad = 0, n = 0;
for (const L in T) for (const [v, w] of T[L]) { n++; const g = W(v, L); if (g !== w) { bad++; console.log('✗', L, v, '→', g, '(expected', w + ')'); } }
console.log(`number words: ${n} checked, ${bad} wrong`); process.exit(bad ? 1 : 0);
