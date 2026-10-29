# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Dinero Rail is a calculator for Honkai: Star Rail. It projects Stellar Jades and pulls up to a target date, plans pulls for future banners, and estimates their odds. It is a client-only React 19 + Vite + TypeScript app with no backend.

The UI text and code comments are in Spanish, and new ones should be too.

Related documents:
- **[PRODUCT.md](PRODUCT.md):** users, product principles and open product decisions (read by the impeccable skill).
- **[docs/decisiones.md](docs/decisiones.md):** design alternatives the user already tried and rejected. Check there before proposing a design change.

## Commands and workflow

```powershell
npm run dev                         # Vite dev server
npm run build                       # tsc -b (type check) + vite build → dist/ (empties dist/)
npm test                            # vitest run (all tests)
npx vitest run src/engine/odds.test.ts      # one file
npx vitest run -t "nombre del test"          # one test by name
```

- **Before calling something done,** run `npm test` and `npm run build`.
  - There is no linter.
  - `tsc -b` is strict, with `noUnusedLocals` and `noUnusedParameters`, so an unused import or variable fails the build.
- **Deploy:** every push to `main` runs the tests and the build, on the Node version in `.nvmrc`, and publishes to GitHub Pages (`.github/workflows/deploy.yml`). That is the link the user's friends use.
  - Never commit or push unless asked.
  - `vite.config.ts` sets `base: './'`, so the build works from any subfolder.
- **No `sed -i` on `src/` while the dev server runs:** on Windows it breaks Vite's watcher. Edit files in place.

## How to handle requests

Most work arrives as small, one-off UI requests. Never apply them blindly; that is how patches pile up.

1. **Before editing,** find where the thing is defined and what else uses it: the token, the shared component or the engine function.
2. **Check whether the request fits the system.** These are signs that it does not:
   - doing it right means touching the same value in several places;
   - adding a special case, an override or a stronger selector;
   - duplicating logic;
   - bypassing a token or shared control.
3. **If it does not fit,** say so in a line or two and propose fixing the system first, with the reason. For example: "button colors should become a token; today this change would touch three rules."
   - Wait for the user's go-ahead if the fix changes more than they asked for.
   - A purely internal improvement can be done directly and reported.
4. **If it fits,** just do it. Then run `npm test` and `npm run build`.

## Module map

### `src/engine/`

Pure, framework-free logic. Business logic belongs here, not in components. Tests sit next to the code they test, here and in `state/` and `components/`; they run in the `Europe/Madrid` time zone (`vite.config.ts`), so date tests behave the same in CI.

- **`rules.ts`:** every game rule.
  - `JADES_PER_PULL`, `DEFAULT_HARD_PITY`, `FOUR_STAR_PITY`, `PATCH_LENGTH_DAYS`, the Starlight constants and the banner model (`BANNERS`).
  - `splitJades` and `PATHS`, the 9 Paths in game order. Memory is «Reminiscencia».
  - Put new game constants here and build help texts from them.
- **`calculate.ts`:** `calculate(state, today)` returns the `Result`. Also `eventTiming`: whether a dated event counts.
- **`sources.ts`:** schedule occurrences and `canBePending`.
- **`packs.ts`:** shard packs.
- **`pulls.ts`:** `planPulls` (cost per row), `planBalance` and `effectivePity` (the only place that limits the pity).
- **`odds.ts`:** `simulatePlan`/`planOdds` (Monte Carlo), `guaranteedNeeded` (worst case) and `shownChances`.
- **`dupes.ts`:** `planCopies`/`planDupes` and `superimpositions`.
- **`urls.ts`:** every external address (nanoka.cc, yatta.moe, StarRailRes), including the image URLs.
- **`account.ts`:** `parseProfile`, the roster and its Path groups.
- **`catalog.ts`:**
  - parsing and weekly-sync rules (`WEEKLY_SYNC`, `syncDue`);
  - `fold`/`searchCatalog` for searching;
  - `findByName`, the one definition of «same name»;
  - `entryOf` and `withCatalogIds`: a plan row is its catalog entry by `entryId`, falling back to its name.
- **`details.ts`:** Eidolon and light cone texts, `formatDesc` and `DETAILS_VERSION` (bump it when what is cached changes).
- **`keyDates.ts`:** the key dates.
- **Basics:**
  - `dates.ts`: dates are UTC day numbers, and `weekday` 0 is Monday, not JS's Sunday;
  - `types.ts`, `defaults.ts` and `util.ts`.

### `src/state/`

React hooks and browser storage.

- **`store.ts`:** `useAppState`, `normalizeState`, `withSettings`, `ChangeState`, `Notice`/`namedNotice` and `SKINS`.
- **`catalog.ts` / `details.ts`:** download and cache the catalog and the details.
- **`today.ts`:** `useToday`, today's local date. It refreshes at midnight and when the tab becomes visible again.

### `src/components/`

- **Cards:** one per card, named after it. The planner is split into `FuturePulls` (list and drag), `PullRow` and `PlanFooter`.
- **Shared controls:**
  - `NumberField`, `DateField` (air-datepicker) and `NameCombobox`;
  - `Toggle`/`ToggleTerm` and `SwitchInput` (the bare switch), `Tip`/`TipTitle` and `TipSumRow`;
  - `RemoveGlyph`, `Icon`, `Rarity` and `Toast`.
- **Helpers:**
  - `glossary.tsx`: shared definitions;
  - `format.ts`: every es-ES formatter, such as `fmtSingles`, `fmtChance` and `fmtEuros`;
  - `kinds.ts`, `motion.ts`, `inputs.ts` and `usePlanOdds.ts`.

`App.tsx` owns the state. It runs `calculate`, `usePlanOdds` and `planCopies` once each, passes the results down, and keeps the undo toast. Planner rows are reordered with `@dnd-kit`.

## Domain rules

- **Units: Jades inside, «tiradas» outside.**
  - Everything is computed in Jades (1 pull = 160). A Special Pass is 1 pull.
  - Oneiric Shards convert 1:1: the inventory ones when `settings.includeShards` is on, the pack ones whenever packs count.
  - Totals are shown in pulls, and the UI word is always **«tiradas»**; "singles" stays in code.
  - Use `fmtSingles`, and `wholeSingles` for header totals.
- **Vocabulary:**
  - A game version is **«versión»** in the UI («4.7 · 1.ª parte»), but `Patch` in code. Keep `Patch`, because `version` already names schema versions and a patch's number.
  - The planner card is «Plan de tiradas», and texts say «el plan».
- **Income (`buildEvents`):** dated events from **tomorrow through the target date**. Today's income is assumed to be already in the current resources.
  - A source with `pendingNow` also counts today (`canBePending`; never for per-patch sources).
  - Patch events follow `eventTiming`.
  - `perPatch` fires only at the starts in the user's patch table. Future patches are never extrapolated.
  - Shard packs count today, in EUR or in JPY at `JPY_PER_EUR`.
  - Each shard switch rules only its own card: `includePacks` for packs, `includeShards` for the inventory.
  - Undying Starlight converts at 20 = 1 pass. The remainder carries into planning.
- **Pity:** «tiradas por 5★» in Configuración (`settings.hardPity`; 80 for characters and 70 for light cones by default) is the maximum pity.
  - The current pity runs from 0 to that maximum − 1.
  - The saved pity is kept as typed. Everything reads it through `effectivePity`: the field, the plan and the simulation. So lowering the maximum and raising it again keeps the pity, and typing «80» in Configuración (which passes through «8») loses nothing.
- **Pull planning (deterministic worst case):**
  - Each target costs the maximum, and losing the 50/50 doubles that.
  - The first row of a kind subtracts the current pity, or wins outright if `guaranteed[kind]` is set.
  - Rows return their pieces (`hardPity`, `pityDiscount`, `losesFiftyFifty`) for the cost tip.
  - **Starlight refund (`countStarlight`):** what each 5★ gives plus the expected 4★ refund (13 % per pull).
    - The target's 5★ gives `targetStarlight` by its copy (from `planCopies`): a light cone 40; a character 0 if new, 40 from E1 to E6, 100 past E6. A row without a known copy (no catalog, or a name outside it) counts as new, the safe side.
    - The 5★ lost to the 50/50 (a standard one) is assumed repeated: 40.
    - The plan, the simulation and the «Peor caso» all take `copies`, so they agree.
    - It carries over between rows.
    - A target's own refund never pays for its own row.
- **Odds (Monte Carlo):** official consolidated rates (tests check them).
  - Characters: 0.6 % base, soft pity from 74, hard at 90, 50/50.
  - Light cones: 0.8 % base, soft pity from 66, hard at 80, 75/25.
  - `simulatePlan` runs 10,000 seeded runs from a precomputed CDF. It must stay cheap enough for every keystroke.
  - `guaranteedNeeded` is the «Peor caso». Its guaranteed 4★ count per banner, as in the game.
- **Plan rows and dupes:** a row stores the catalog name and, once known, its `entryId`. With a catalog, `App` keeps every row's id and name current (`withCatalogIds`): a beta name in English becomes the Spanish one when yatta publishes it. The dupe is never stored: `planCopies` derives each row's copy from the plan order, after the owned copies (Eidolon + 1).
- **Key dates:** `KEY_DATES` is hand-maintained.
  - Unpublished dates are estimated at `PATCH_LENGTH_DAYS` per version.
  - Clicking a leaf sets the target date.
  - Only the next 3 versions show.

## State and external data

| localStorage key | What |
| --- | --- |
| `hsr-jades:v1` | `AppState` (`version: 1`), synced between open tabs. |
| `hsr-jades:v1:unreadable` | Copy of a saved state that failed to load (see below). |
| `hsr-jades:catalog:v1` | The catalog cache. |
| `hsr-jades:catalog-last-sync` | Last sync attempt (1 min cooldown). |
| `hsr-jades:details:v1` | yatta details, reset when `DETAILS_VERSION` changes. |
| `hsr-jades:details-misses:v1` | What yatta lacks, remembered for 24 h. |

- **Every load goes through `normalizeState`.** It validates fields, fills defaults and turns quantities into integers. It holds no migrations: saved data is rewritten in the current format on every visit, and the old ones were removed (2026-10-29).
  - Adding a field to `AppState` means updating `defaultState` and `normalizeState`, plus a store test.
  - **Changing the shape of a saved field** needs a conversion in `normalizeState` for the data already saved, or that data falls back to the defaults.
  - **Trap:** a state that fails to load (bad JSON, another `version`) is replaced by the defaults, which then overwrite it. Only the copy under `:unreadable` survives. Never bump `AppState.version` without a conversion.
- **Catalog:** the 5★ list comes from nanoka.cc, with Spanish names from yatta.moe. It syncs automatically on Tuesdays at 10:00 local time, or with the button.
  - A failed automatic sync is retried when the tab becomes visible, on reload, or with the button.
  - Without a catalog, `NameCombobox` accepts free text.
- **Details popover:** yatta in Spanish, falling back to nanoka in English at the catalog's version, which `App` passes down.
- **Account:** set by hand or imported from Reliquary Archiver's `profile.json`, which replaces everything with undo.
  - Trailblazers (ids 8000+) are always dropped.
  - With the catalog, only 5★ are kept.

## UI conventions

- **Voice:** neutral, never «tú».
  - Actions use the infinitive, states use nominal phrases, and explanations and instructions are impersonal.
  - **Exception:** keyboard instructions that only screen readers hear are imperative, with keys in lowercase («elige el día con las flechas y pulsa intro»), like the reader's own hints.
- **Tabs:** chosen by URL hash: none is Calculadora, `#cuenta` and `#configuracion` the others.
- **Skins:** `aha` (the default and the CSS base) and `sparxie`, set as `data-skin` on `<html>`.
  - Light/dark is separate: `settings.theme` becomes `data-theme`, with no attribute for `system`.
  - Use tokens and never hard-code colors.
  - Sparxie comes from `designs/droolsuite.DESIGN.md`.
  - Aha uses Figtree, plus Card Characters (`--font-card`, a single weight of 400) for card titles and result figures.
  - In Sparxie, Pixelify Sans is only for labels without digits; numbers use Courier Prime.
- **CSS organization (`styles.css`):**
  - The header has an index; sections are marked `/* == Name == */`.
  - Color tokens are `light-dark(light, dark)`. The dark blocks hold only `color-scheme` and non-color tokens, written twice: once in the media query and once under `[data-theme='dark']`.
  - The base is Aha. Sparxie overrides it, and `:where(:root[data-skin='aha'])` is kept only for Aha extras that Sparxie must not inherit (the card font on figures, the page decoration). Skin rules sit next to their component under `:where()`, so they keep base specificity.
  - The field base rule is under `:where()`, so components need no `[type]`.
  - Variants set variables instead of undoing rules: buttons set `--btn-hover-bg`/`--btn-hover-border` (one `.btn:hover` rule), switches use `--switch-on`/`--switch-knob-on`/`--switch-knob-off`, focus uses `--focus-ring`. Floating surfaces (`.dupe-pop`, `.tip`, `.toast`) share one rule.
  - Width queries use range syntax (`width <= 720px`, `width > 720px`): with display scaling the width can be fractional, and a 1179/1180 pair left a gap.
  - air-datepicker's CSS is imported in `main.tsx` before `styles.css`, which overrides it by source order.
  - No `!important`.
- **Accent color:** problems («Faltan», a row that does not fit), selection (tab, key date, calendar day, combobox option, dragged row) and focus. Never neutral data or controls at rest.
  - Deliberate extras: the bubbles' and toast's `--border-pop`, «Deshacer», and the 28 % `--accent-frame` of the Resumen card and its stat boxes.
  - Sparxie's turquoise is not an alarm color.
  - Rarity colors (`Rarity.tsx`) are the game's own.
  - No state is shown by color alone.
- **Layout stability:**
  - `html` has `scrollbar-gutter: stable`.
  - Use fixed `rem` columns and reserve space with `.invisible`/`.swap`.
  - Aligned numbers use `var(--num-variant)`.
  - Card headers never wrap; the title wraps instead.
- **Tokens:**
  - spacing `--space-1…5` (4/8/12/16/20; 6px for repeating row pitch);
  - type scale 12/13/14/16/18/20/24/56px;
  - controls: `--control-h`, `--field-compact-h`, `--field-compact-pad`, `--btn-pad-x`, `--remove-w`, `--date-field-w`, `--badge-out`, `--focus-ring`;
  - floating surfaces: `--shadow-pop`, `--border-pop`;
  - accent mixes: `--accent-frame`, `--accent-hover`;
  - motion: `--fade-in`/`--fade-out`.
  - Field padding follows `--input-nudge`: 0 in Aha, and −1px in Sparxie, whose Courier sits high, so it gets 1px more on top.
- **Breakpoints:**
  - 2000 and 1480 (dupe gallery), 1180 (two columns), 1040 (Configuración aside);
  - ≤720 (rows split into two lines; >720 the reverse), ≤560 (phones), ≤520 (sources), ≤430, ≤380 and ≤350;
  - container queries: `plan` 29rem, key dates 36rem, account 30 and 44rem.
- **Calculadora order:** below 1180px the cards order by class: Resumen, Recursos actuales, Plan, Previsión, Fecha objetivo, Versiones y eventos, Paquetes, Desglose.
- **Explanations:**
  - **`Tip`** explains a value on hover, focus or tap, linked with `aria-describedby`. `control` wraps a button.
  - **No `title`** for explanations; it is allowed only on controls with an accessible name.
  - **Glossary:** a dotted-underlined term (`ToggleTerm` on a `Toggle`) opens its definition. Mark a term once per card. A term has one definition, shared through `glossary.tsx`.
- **Controls:**
  - **`NumberField`** delivers clamped integers, so parents do not clamp again. Emptied, it delivers 0. While focused, the typed text is left alone; the clamped value shows on blur.
  - **The segmented control** (`.segmented` with `.segment` buttons) serves the theme and mode selectors, the store and the Path filter.
  - **`Toggle`** is for on/off settings. Per-row choices stay checkboxes (the 50/50, the ×2). The sources' bare `role="switch"` has no visible label, so it is not a `Toggle`.
  - **Remove buttons** are `btn btn-ghost btn-remove` with `<RemoveGlyph />`, never ✕.
  - **Every `.btn` and `.chip` fades its hover** with `--fade-in`/`--fade-out`.
- **Undo instead of confirmations:** deleting or replacing data passes a `Notice` to `onChange`, and the toast offers «Deshacer».
  - Any other change closes that toast, also one arriving from another tab, because its snapshot predates the change.
  - Planner rows turn to dust before leaving, except with reduced motion.
- **Touch:** under `pointer: coarse`, small controls get a 44px hit area (36px tall on `.check`). Glossary terms sit above it.
- **Zeros and dashes:** a real zero shows as «0». «—» only means "not applicable".
- **No decorative gradients:** only functional ones.
- **`NameCombobox`:** while unfocused, the name is painted by `.combo-value` at `50% + 6px − var(--input-nudge)`, because Chrome shifts input text that falls back to another font (the ★). Keep that formula if the padding changes.
