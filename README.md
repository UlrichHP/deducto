# Deducto

A procedural deduction game for the browser and Android, in English and French.

A murder has been committed in a manor. Each suspect was in a different room and held a different item. The police report gives the crime room and the weapon; the culprit is whoever was in that room with that weapon. Read the clues (all true), fill in the notebook grid, and make your accusation. You get three tries.

Every case is generated from a seed and has exactly one solution. The **daily case** uses the date as its seed, so everyone gets the same puzzle on a given day.

## Stack

- [Vue 3](https://vuejs.org/) + TypeScript, built with [Vite](https://vite.dev/)
- [vue-i18n](https://vue-i18n.intlify.dev/) with JSON locale files, precompiled by `@intlify/unplugin-vue-i18n`
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/): installable and playable offline
- [Vitest](https://vitest.dev/) for unit tests
- Android packaging planned with [Capacitor](https://capacitorjs.com/) (the build already uses relative paths for it)

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev        # dev server with hot reload
npm test           # unit tests
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Project layout

```
src/
  game/                 pure game logic, no Vue, no text
    data.ts             content pools as language-neutral ids
    generator.ts        case generator and solver
    rng.ts              seeded PRNG (mulberry32) and string hash
    types.ts            Case and Clue types
    __tests__/          generator tests
  locales/
    en.json, fr.json    every user-facing string
  i18n/
    index.ts            vue-i18n instance factory, supported locales
    locale.ts           initial locale detection and persistence
    caseText.ts         turns a case into sentences (report, clues, labels)
    __tests__/          locale parity and rendering tests
  components/
    MenuScreen.vue      title screen
    GameScreen.vue      tabs, accusation flow, end of game
    CaseFile.vue        police report, suspects, clues
    NoteBook.vue        suspect × room and suspect × item grids
    AppModal.vue, LanguageSwitch.vue
  utils/text.ts         small string helpers
  style.css             design tokens and all styles (mobile first)
```

## How generation works

1. Draw a random solution: one permutation for rooms, one for items, and a culprit. The crime room and the weapon are the culprit's.
2. List every configuration consistent with the known fact (whoever was in the crime room held the weapon).
3. Draw random true clues, keeping only those that rule out at least one remaining configuration, until a single one is left.
4. Try removing each clue; drop it if the solution stays unique. The remaining set has no redundant clue.

Clues are stored as logic (`notRoom`, `notItem`, `roomItem`, `notRoomItem`, `eitherRoom`) plus a phrasing variant (`a` or `b`). Each locale provides its own sentence templates in `clues.<type>.<variant>`, so the language can change mid-game.

## Translations

All strings live in `src/locales/<code>.json` and use the [vue-i18n message format](https://vue-i18n.intlify.dev/guide/essentials/syntax.html): `{name}` placeholders and `singular | plural` forms. Grammatical gender is handled with separate keys (see `report.m` / `report.f` and `victims.<id>.gender`).

To add a language, copy `en.json`, translate it, and register the code in `SUPPORTED_LOCALES` and `messages` in `src/i18n/index.ts`. The locale tests fail if a key is missing or a clue does not render as a full sentence.
