# Architecture, assumptions and known limits

## 1. Assumptions and ambiguities (decided before coding)

1. **Three documents, one source of truth.** The brief speaks of a single source of truth but provides three documents. The Plan d'études (PE) is treated as authoritative: its objectives and recommended contents define what must be covered, in its wording and order. The Niveaux de compétence (NC) descriptors for levels 7–10 frame difficulty and are shown in the curriculum map. The MathemaTIC list is used as the finest level of detail and mapped onto PE objectives; nothing from it is added unless it falls under a PE objective.
2. **Cycle, not year.** The PE describes cycle 4 as a whole (4.1 + 4.2). Everything in the PE is covered, with 4.1-appropriate number ranges at levels 1–3 and 4.2-like demands at level 4. Two MathemaTIC items are explicitly 4.2 material (MT.67, MT.90); MT.90 (intersecting two linear equations on a scatterplot) is left out.
3. **Codes.** The PE numbers competences but not individual objectives. The app uses short codes (e.g. NO.1.2 = domain NO, competence 1, 2nd objective in PE order; NO.C3 = 3rd recommended content) so that the dashboard and the coverage table can refer to them. The wording beside each code is the PE's.
4. **Multiplication sign.** The brief asks for ×, but MENJE documents print "•" / "·". Default is ×; the dashboard can switch to ·. Division always uses ":".
5. **Numbers.** Decimal comma in RO/FR/DE/LB, point in EN. A thousands separator is written only from five digits on (12 345 / 12.345 as in MENJE documents); answers are accepted with or without it, with spaces, and with either separator when unambiguous.
6. **Teaching language.** In Luxembourg maths is taught in German in cycles 2–4 (French from secondary). German is therefore the reference for school terminology (Stellenwerttafel, Überschlag, Geodreieck…); French terms follow the PE.
7. **Shapes.** "Losange", "trapèze" are not named explicitly in the PE but belong to "quadrilatères"; they are included.
8. **Letters for numbers.** NO.2.5/NO.2.6 and MathemaTIC MT.82 ask for expressions and unknowns; the app mostly uses □, and letters only in one template (level 2–4 of `expr_vars`).
9. **Lëtzebuergesch.** Written according to the current official orthography (2019 reform), with the n-rule (Eifeler Regel) applied in number words and texts. Some school terms have no fixed Luxembourgish equivalent; German school terms are used where Luxembourgish classrooms use them. A native-speaker teacher should review the LB file before classroom use.
10. **What a screen cannot do.** Oral communication between pupils, drawing with a real ruler/compass/set square, and measuring physical objects are trained only in their decision part (see the end of `COVERAGE.md`).
11. **"PDF export"** uses the browser's print dialog (no PDF library, so the app stays dependency-free and offline).
12. **Read-aloud** uses the browser's speech synthesis. Luxembourgish voices are rarely installed; the app falls back to a German voice and says so once.

## 2. Modules

```
index.html            entry point; loads the scripts in order, no build step
lang/xx.js            all texts, one file per language (window.I18N_DATA["xx"] = {…})
css/app.css           layout, themes (dyslexia font, high contrast, text size), print styles
js/core/core.js       exact fractions (MQ.Q, BigInt where needed), seeded RNG, locale number/time/date formatting and parsing
js/core/i18n.js       t(key, vars), plural forms (Intl.PluralRules), typed variables (numbers, fractions, money, units, times, dates, expressions, number words)
js/core/numwords.js   numbers, decimals and fractions in words in 5 languages (FR traditional spelling, LB n-rule, RO gender agreement)
js/core/expr.js       arithmetic expressions with priority and brackets, evaluated exactly
js/core/check.js      answer checking for every widget type; canonical answer (used by "show solution" and the self-test)
js/figures/figures.js SVG drawing: number lines, fraction bars/pies, grids, coordinates, maps, protractor, ruler, solids, nets,
                      cube buildings and views, clocks, scales, jugs, charts, tangram, bar models, money
js/data/curriculum.js PE objectives and contents (French wording), NC levels 7–10, MathemaTIC items with their PE links
js/data/map.js        adventure map (4 regions = 4 domains, 27 stages), badges, avatar items
js/templates/*.js     96 exercise templates (registry.js = API + helpers; one file per domain)
js/game/game.js       profiles, localStorage, XP, levels, stars, adaptivity, streaks, daily quest, badges, mastery per objective
js/ui/media.js        synthesized sounds (WebAudio, mutable), speech synthesis, mascot SVG
js/ui/widgets.js      interactive widgets: input, MC, multi-select, ordering, drag & drop bins, matching, fraction shading,
                      number line, grid points, grid cells, true/false + reason, find-the-mistake, bar/line chart builder
js/ui/dashboard.js    teacher/parent area (PIN, mastery, errors, assignment, CSV/PDF export, coverage, settings)
js/app.js             screens (profiles, map, region, play, boss, 60 s challenge, avatar, badges, settings) and the exercise player
tools/selftest-core.js  the self-test (shared by Node and selftest.html)
tools/selftest.js     Node runner;  tools/diagnose.js  grouped failures;  tools/coverage.js  generates the docs
```

## 3. How an exercise is made

`MQ.T.make(id, level, seed)` runs the template's generator with a seeded RNG, so any exercise can be reproduced from (template, level, seed) — the self-test reports seeds. A generator returns language-neutral data: message keys with typed variables (`{ k: 't.frac_compare.q', v: { a: frac(3,4) } }`), a widget description, the exact answer, three hints, an explanation, optional `diagnose(values)` returning a misconception-specific message, `wrong` (typical wrong responses, used by the self-test) and `ranges`. Texts are rendered only at display time in the current language, which is why switching language never loses the current exercise or the half-typed answer.

## 4. Game rules (summary)

XP per correct answer: 5 + 5 × level (halved on the second try, reduced by hints, never negative). Player level L needs 25·L·(L+1) XP. Stars per stage: ★ 5 correct, ★★ +4 correct at level ≥ 3, ★★★ +3 correct at level 4. Adaptive mode: 4 correct in a row → offer the next level; 3 errors in the last 4 → drop one level and show a worked example. Mastery per objective = first-try success rate over the last 10 exercises touching that objective. No lives, no punishment, no purchases, no public leaderboard; the 60-second challenge compares only with one's own record.

## 5. Templates

The full list (96 templates, stage, exercise types and objectives) is generated in `COVERAGE.md`.
