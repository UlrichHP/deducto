# AGENTS.md

Guidance for AI coding agents working on Deducto. See README.md for what the game is and how generation works.

## Commands

- `npm run dev`: dev server on http://localhost:5173
- `npm test`: Vitest unit tests
- `npm run build`: `vue-tsc` type-check, then production build. Run it before declaring work done.

## Conventions

- **Language**: code, identifiers, comments, commit messages and docs are in English. User-facing text is never hardcoded: it goes in `src/locales/en.json` **and** `src/locales/fr.json`, with the same keys in both.
- **Layering**: `src/game/` is pure TypeScript with no Vue and no text. It works with language-neutral ids (`data.ts`) and indexes. Sentences are built in `src/i18n/caseText.ts`; components only call `t()` or those helpers.
- **Determinism**: case generation must stay a pure function of `(size, seed)`, using the seeded RNG in `src/game/rng.ts`, never `Math.random`. The daily case depends on it.
- **Puzzle validity**: every generated case must have exactly one solution and no redundant clue. A new clue type needs a `holds()` rule, a weight, phrasings `a`/`b` in every locale, and must keep the generator tests green.
- **Tests**: unit tests live in `__tests__/` folders next to the code, named `*.spec.ts`.
- **Vue**: Composition API with `<script setup lang="ts">`. Styles live in `src/style.css` using the CSS variables in `:root`. Mobile first: touch targets of at least 44px, and nothing may scroll horizontally at 375px wide.
- **Paths**: keep `base: './'` in `vite.config.ts`; the build must work from a file URL for Capacitor.
- **Storage**: progress and settings live in `localStorage`; every read and write is wrapped in try/catch and the app must work when storage is unavailable. Stored data goes through a normalize function so older saves still load.
- **Icons**: [Lucide](https://lucide.dev/) via `lucide-vue-next` (ISC), imported per icon. Mark them `aria-hidden="true"`; the button carries the label.
- **Fonts**: self-hosted in `src/fonts.css` (Latin subset, no third-party requests). Use the CSS variables: `--font-display` (Limelight: logo and titles, weight 400 only), `--font-type` (Special Elite: police report and clues), `--font-ui` (Inter: everything else).
- **Corners**: `corner-shape: squircle` is applied inside `@supports` at the end of `style.css`; add new rounded components to that list.
- **Audio**: everything is synthesized with the Web Audio API (no audio files). Nothing may play before the first user gesture. Use `data-sfx` on elements rather than calling `playSound()` in click handlers.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`, `perf:`. Imperative mood, one logical change per commit.
