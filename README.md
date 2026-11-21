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

For every one of the 97 templates and each of its 4 levels the self-test generates 1000 random instances (388,000 in total) and checks, in all five languages: generation never fails; three hints, an explanation and an answer exist; the computed answer, typed with that language's decimal separator, is accepted; equivalent forms are accepted (1/2 for 0,5, "12 345" for 12345, "35 cm²" with its unit, "3.5" for 3,5 in FR/DE/LB/RO); the typical wrong answers the template knows about are rejected; multiple-choice questions have exactly one correct option and no two options look the same in any language; declared value ranges hold; template self-checks hold (e.g. every cube net is verified by folding it); no text contains a missing translation, an unresolved placeholder, `undefined` or `NaN`; counts agree with their noun in every language (no "1 squares", and in Romanian "20 de minute" but "101 minute"). It also checks that the five language files have the same keys and the same placeholders, and that every curriculum objective has at least one template.

## Symbol keys under the answer box

Number keyboards on phones and tablets have no fraction bar, brackets or ×, so every answer box has a row of buttons that type them: fraction bar, ( ), +, −, ×, :, =, the decimal comma (point in English), and a delete key; time boxes get ":" and date boxes ".". The buttons only type symbols — nothing is computed for the pupil, it is not a calculator. A fraction typed as 3/4 is shown stacked underneath so the child sees what was written.

The pupil may type only the result or the whole calculation ending with "=" and the result (`12 × 5 = 60`, `(2 + 3) × 4 = 20`). The result after the last "=" is what is checked. Every earlier part that can be computed must have the same value, so the classic misuse of "=" as "and then" (`5 × 4 = 20 + 3 = 23`) is rejected with an explanation of what "=" means. A calculation without "=" and a result gets a message asking for the result.

## Léo, leagues and rewards

Each child dresses up their own lion: boy or girl, fur colour, accessories, a frame and a background. Most items unlock with the player level (some only at level 20–30, so they take real effort); seasonal frames (winter, spring, summer, autumn, Christmas, Halloween, or "season of today", which changes by itself with the calendar), Luxembourg National Day and Schueberfouer frames, and special frames for each league. Leagues (Bronze, Silver, Gold, Platinum, Diamond, Legend) follow the XP a child has collected; they show personal progress only — there is no ranking against other children. The lion also sits on the read-aloud button.

**Badges** come in 24 families (the four map regions, 14 topic groups covering all 27 topics, and effort: correct answers, error-free streaks, days in a row, daily quests, level-4 work, perseverance, the 2-minute challenge, exercise sets, exploring, region challenges), each with five tiers drawn as medals: I bronze with ribbon, II silver with oak leaves, III gold with laurels, Supreme (diamond, laurels and crossed swords) and Maximum (legendary crown) — 121 badges in all, the top tiers taking months.

**The 2-minute challenge** can be played once a day per topic; only correct answers count, and wrong answers give no XP anywhere in the app. A wrong answer given within a few seconds shows a gentle reminder to read the exercise first.

## Teachers and parents

The 🎓 button opens a PIN-protected dashboard (you choose the PIN the first time): overview per pupil, mastery per Plan d'études objective in the official wording, frequent errors (the misconception messages the app showed most often), topics assigned to a pupil (marked with a flag on the map and fed into the daily quest), CSV export (semicolon-separated, opens in Excel) and a PDF report (through the browser's print dialog → "Save as PDF"), the curriculum coverage table and settings (multiplication sign × or the · used in MENJE documents, PIN change, delete all data).

**Exercise sets.** In the dashboard tab *Exercise sets* an adult chooses one or more topics, a level (1–4, or rising from 1 to 4) and the number of exercises, and gives the set to one or more pupils. A set is a fixed list: every pupil gets exactly the same exercises, and the dashboard shows each pupil's result (right first time, corrected later, still wrong). Pupils find their sets under 📚 on the map, and can also make a quick set for one topic themselves. Inside a set, exercises are checked one by one as usual; the numbered buttons show which are right (green) or wrong (red), the pupil can go back to any exercise, and a wrong one can be done again. Work on a set is saved, so it can be continued later. In ordinary practice the pupil can also go back to the previous exercises of the session. A **Skip** button lets the pupil pass over an exercise without any penalty (no XP lost, nothing counted in the results or the mastery) — for topics not yet covered at school. Skipped exercises are listed for the adult in the dashboard (tab *Frequent errors*), and in a set they keep a dashed border so the pupil can come back to them later.

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
