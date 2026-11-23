#!/usr/bin/env node
/* Self-test runner for Node.js (no dependencies):
 *   node tools/selftest.js            → 1000 instances per template and level
 *   node tools/selftest.js 200        → quicker run
 * Exit code 0 = all checks passed. Also writes docs/SELFTEST_RESULTS.md. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
global.window = global; // the app's files attach to window
const files = ['lang/fr.js', 'lang/de.js', 'lang/lb.js', 'lang/en.js', 'lang/ro.js',
  'js/core/core.js', 'js/core/i18n.js', 'js/core/numwords.js', 'js/core/expr.js', 'js/core/check.js', 'js/figures/figures.js',
  'js/data/curriculum.js', 'js/data/map.js', 'js/data/badges.js', 'js/templates/registry.js', 'js/templates/no_numbers.js', 'js/templates/no_operations.js',
  'js/templates/ef_geometry.js', 'js/templates/gm_measures.js', 'js/templates/rp_problems.js', 'js/templates/extreme.js', 'js/game/game.js', 'tools/selftest-core.js'];
files.forEach(f => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }));
const n = +process.argv[2] || 1000;
const lines = [];
const rep = MQ.selftest.run({ n, log: s => { console.log(s); lines.push(s); } });
const md = ['# Self-test results', '', `Run: ${new Date().toISOString()} · Node ${process.version}`, '', '```', ...lines, '```', '', '| Template | Instances | Failing |', '|---|---:|---:|',
  ...Object.entries(rep.perTemplate).map(([k, v]) => `| ${k} | ${v.instances} | ${v.failing} |`)].join('\n');
// the results file is tracked in git: written only on request (node tools/selftest.js 1000 --write)
if (process.argv.includes('--write')) { fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'docs', 'SELFTEST_RESULTS.md'), md + '\n'); }
process.exit(rep.errors.length ? 1 : 0);
