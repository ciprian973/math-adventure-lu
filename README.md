# Math Adventure Lëtzebuerg — Cycle 4.1

An offline maths practice app for 5th-year pupils (enseignement fondamental, cycle 4.1, ages 10–11) in Luxembourg, built on the Plan d'études (cycle 4), the Niveaux de compétence and the MathemaTIC curriculum. Five languages: Română, English, Français, Deutsch, Lëtzebuergesch.

## Run it

Open `index.html` in a browser (double-click). Nothing to install, no internet, no account, no server. Works on tablets (primary target), laptops and phones; tested in Chrome. On an iPad, copy the folder into the Files app and open `index.html` with Safari, or put the folder on any static web space.

Progress is stored in the browser's `localStorage` on that device only. Each profile holds a nickname and an avatar — no surname, no age, no e-mail.

## Self-test (answer keys, uniqueness, ranges, rendering in 5 languages)

- **In the browser:** open `selftest.html`, choose 1000, press *Run self-test* (about 25 s). It also draws one figure of every template for a visual check.
- **In a terminal (Node 18+):** `node tools/selftest.js` (or `node tools/selftest.js 200` for a quicker run). Exit code 0 = everything passed; results are written to `docs/SELFTEST_RESULTS.md`.
- `node tools/diagnose.js` groups any failures by template, level and kind with an example seed.
- `node tools/coverage.js` regenerates `docs/COVERAGE.md` and `docs/CURRICULUM.md` from the code.

For every one of the 96 templates and each of its 4 levels the self-test generates 1000 random instances (384,000 in total) and checks, in all five languages: generation never fails; three hints, an explanation and an answer exist; the computed answer, typed with that language's decimal separator, is accepted; equivalent forms are accepted (1/2 for 0,5, "12 345" for 12345, "35 cm²" with its unit, "3.5" for 3,5 in FR/DE/LB/RO); the typical wrong answers the template knows about are rejected; multiple-choice questions have exactly one correct option and no two options look the same in any language; declared value ranges hold; template self-checks hold (e.g. every cube net is verified by folding it); no text contains a missing translation, an unresolved placeholder, `undefined` or `NaN`. It also checks that the five language files have the same keys and the same placeholders, and that every curriculum objective has at least one template.

## Teachers and parents

The 🎓 button opens a PIN-protected dashboard (you choose the PIN the first time): overview per pupil, mastery per Plan d'études objective in the official wording, frequent errors (the misconception messages the app showed most often), topics assigned to a pupil (marked with a flag on the map and fed into the daily quest), CSV export (semicolon-separated, opens in Excel) and a PDF report (through the browser's print dialog → "Save as PDF"), the curriculum coverage table and settings (multiplication sign × or the · used in MENJE documents, PIN change, delete all data).

The PIN only keeps children out on a shared device; it is not encryption.

## Editing translations

All texts are in `lang/ro.js`, `lang/en.js`, `lang/fr.js`, `lang/de.js`, `lang/lb.js` — one key per line, `"key": "text"`. Keep `{placeholders}` and `[[n|one:…|other:…]]` plural forms unchanged; `{MUL}` becomes the chosen multiplication sign. (They are JSON wrapped in one line of JavaScript, because browsers refuse to load plain `.json` files from `file://`.) Run the self-test afterwards: it reports missing keys or placeholders.

## Adding an exercise template

Templates live in `js/templates/*.js`, one file per domain. A template is

```js
T.add({ id: 'my_tpl', stage: 'no_dec', objectives: ['NO.1.2'], mt: ['MT.5'],
  gen(r, L) {               // r = seeded random generator, L = level 1–4
    const a = MQ.Q.dec(r.int(11, 99), 1), b = MQ.Q.dec(r.int(11, 99), 1);
    return { prompt: m('t.my_tpl.q', { a, b }),
             widget: { type: 'input', fields: [field('a', a.add(b))] },
             answer: m('c.num', { x: a.add(b) }), explain: m('t.my_tpl.ex', { a, b, x: a.add(b) }),
             diagnose: v => …misconception message or null…, wrong: [ …typical wrong responses… ] };
  } });
```

then add the keys `t.my_tpl.title`, `.q`, `.h1`–`.h3`, `.ex` to the five language files and run the self-test. All arithmetic uses exact fractions (`MQ.Q`), never floating point.

## Folder structure

See `docs/ARCHITECTURE.md`. Curriculum map: `docs/CURRICULUM.md`. Coverage: `docs/COVERAGE.md`.

## Licences

Code: written for this project. Fonts: Andika (SIL) and OpenDyslexic, both SIL Open Font License (`fonts/`). The mascot Léo and all figures are original SVG drawings.
