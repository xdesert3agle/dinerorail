# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Dinero Rail is a calculator for Honkai: Star Rail. It projects Stellar Jades and pulls ("singles") up to a target date, plans pulls for future banners, and estimates their odds. It is a client-only React 19 + Vite + TypeScript app with no backend.

The UI text and code comments are in Spanish, and new ones should be too.

Alternatives the user already tried and rejected are in [docs/decisiones.md](docs/decisiones.md). Check there before proposing a design change.

## Commands

```powershell
npm run dev                         # Vite dev server
npm run build                       # tsc -b (type check) + vite build → dist/ (empties dist/)
npm test                            # vitest run (all tests)
npx vitest run src/engine/odds.test.ts      # one file
npx vitest run -t "nombre del test"          # one test by name
```

- **No linter.** `tsc -b` is strict, with `noUnusedLocals` and `noUnusedParameters`, so an unused import or variable fails the build.
- **Relative base.** `vite.config.ts` sets `base: './'`, so the build works from any subfolder or from `file://`.
- **No `sed -i` on `src/` while the dev server runs.** On Windows it breaks Vite's watcher; edit files in place instead.

## Module map

### `src/engine/`

Pure, framework-free logic. All tests live here, next to the code; business logic belongs here, not in components.

- **`rules.ts`:** every game rule.
  - Constants: `JADES_PER_PULL`, `DEFAULT_HARD_PITY`, `FOUR_STAR_PITY`, `PATCH_LENGTH_DAYS` (42), plus the Starlight constants.
  - Banner model: `BANNERS` and `fiveStarChance`.
  - Helpers: `splitJades` (whole pulls and spare Jades).
  - `PATHS`: the 9 Paths in game order. Each has its internal code (nanoka `baseType`), Spanish name and icon. Memory is «Reminiscencia».
  - Put new game constants here, and build help texts from them.
- **`calculate.ts`:** `calculate(state, today)` returns the `Result`. `sources.ts` provides the schedule occurrences and `canBePending`; `packs.ts` covers shard packs.
- **`pulls.ts`:**
  - `planPulls`: cost per row;
  - `planBalance`: gross cost, refund and what is left;
  - `clampPity`.
- **`odds.ts`:**
  - `simulatePlan` and `planOdds`: Monte Carlo;
  - `guaranteedNeeded`: the worst case;
  - `shownChances`: rules for showing a %.
- **`dupes.ts`:**
  - `planCopies` / `planDupes`: which copy each row is;
  - `superimpositions`: light cones;
  - `resolve`: exact catalog lookup;
  - image URLs.
- **`account.ts`:** profile import (`parseProfile`), the roster and its Path grouping, Eidolons.
- **`catalog.ts`:** syncing the 5★ catalog (nanoka plus yatta names), `fold`/`searchCatalog`, and the weekly-sync logic (`WEEKLY_SYNC`, `lastWeeklySync`, `nextWeeklySync`, `syncDue`).
- **`details.ts`:** Eidolon and light cone texts (yatta, falling back to nanoka) and `formatDesc`.
- **`keyDates.ts`:** `KEY_DATES` (hand-maintained), `byVersion`, `patchText`/`phaseText`.
- **Basics:** `dates.ts`, `types.ts`, `util.ts` (`isObj`, `newId`), and `defaults.ts` (`defaultState`, built-in sources).

### `src/state/`

- **`store.ts`:** `useAppState`, `normalizeState` and `withSettings(patch)`.
  - `ChangeState`: the `onChange(update, undo?)` signature.
  - `Notice`: the undo text, or `namedNotice(before, name, after)` so the toast can cut only the name.
  - `SKINS`.
- **`catalog.ts` / `details.ts`:** hooks and localStorage caches for the catalog and the details.

### `src/components/`

- **Cards:**
  - `CurrentInventory`, `TargetDate`, `FuturePulls` (with `PullRow` and `PlanFooter`);
  - `Odds`, `ResultSummary`, `ShardPacks`, `PatchTable`;
  - `SourcesPanel`, `AccountPanel` (with `EidolonShards`);
  - `ContentSync`, `StoreSettings`, `PitySettings`;
  - `DupeGallery`.
- **Shared controls:**
  - `NumberField`, `DateField`, `NameCombobox`;
  - `Toggle`/`ToggleTerm`;
  - `Tip`/`TipTitle`, `TipSumRow`;
  - `RemoveGlyph`, `Icon`, `Rarity`, `Toast`.
- **Helpers:**
  - `glossary.tsx`: shared definitions;
  - `format.ts`: es-ES formatting such as `fmtSingles`, `fmtRate` and `fmtCountdown`;
  - `kinds.ts`: `KIND_LABEL` and `KIND_GLYPH`;
  - `motion.ts`: `reducedMotion`;
  - `inputs.ts`: `PLAIN_TEXT_INPUT`;
  - `usePlanOdds.ts`.
- **`App.tsx`:** owns the state. It runs `calculate`, `usePlanOdds` and `planCopies` once each, passes the results down, and keeps the undo toast.

## Domain rules

### Units: Jades inside, singles outside

- **Internal unit:** everything is computed in Jades (1 single = 160, `JADES_PER_PULL`). Special Passes are 1 single each.
- **Oneiric Shards** convert 1:1 to Jades:
  - inventory shards only when `settings.includeShards` is on;
  - pack shards whenever packs are counted.
- **What the user sees:** totals are in singles, but the UI word is always **«tiradas»**, including help and screen-reader text. "singles" stays in code only.
- **Formatting:** use `fmtSingles`, and `wholeSingles` for header totals (whole pulls only). The formatters use `useGrouping: 'always'`, which needs `ES2023.Intl`.

### Vocabulary

- **Game version (4.7, 5.0…):** the UI always says **«versión»**, for example «4.7 · 1.ª parte».
  - The code says `Patch` (`PatchTable`, `perPatch`), and the source category id is `'parche'`.
  - Keep `Patch` in code: `version` already names schema versions (`AppState.version`, `DETAILS_VERSION`, the catalog's nanoka `version`) and a patch's number.
  - The weekly «Sincronizar contenido» updates the catalog, not the game.
- **The planner card** is «Plan de tiradas», and texts say «el plan».
- **Voice:** neutral, never «tú». Infinitive for actions, nominal phrases for states, impersonal for explanations.

### Income (`calculate.ts`, `sources.ts`)

- **`buildEvents`** lists dated `IncomeEvent`s from tomorrow through the target date. Today is included too when a source has `pendingNow`, which `canBePending` forbids for per-patch sources. One list feeds both the total and `bySource`.
- **Schedules:** `daily | weekly | monthly | cycle(anchor, periodDays) | perPatch(offsetDays)`.
  - `perPatch` fires only at patch starts in the user's patch table, which is sorted first.
  - Future patches are never extrapolated.
- **Patch events:** dated rows inside each patch.
- **Shard packs** count today.
  - **Prices:** in EUR, or in JPY at `JPY_PER_EUR` (`settings.packsInYen`, the «Tienda» card in Configuración).
  - **«Por compra»:** always `base + bonus`. The first purchase's ×2 shows only in the row total.
  - **Switches:** each one rules only its own card.
    - `settings.includePacks` («Usar paquetes en el plan») turns packs on or off without clearing the quantities.
    - `settings.includeShards` affects only the inventory shards.
  - **Result fields:** `Result.shardsHeld` is inventory plus pack shards; `Result.shards` is the part counted.
- **Undying Starlight:** converts to passes at 20 = 1.
  - The remainder (`starlightLeftover`) carries into planning.
  - The «Recursos actuales» header counts all of it.
- **Key dates:**
  - `KEY_DATES` is fixed. Unpublished dates are `estimated` at `PATCH_LENGTH_DAYS` per version after the last known one, and the 2.ª parte is `PHASE_2_WEEKS` after the 1.ª.
  - Clicking a leaf sets `targetDate`, and past dates disappear.
  - Only the next 3 versions show; «Ver N versiones más» opens the rest, and they open by themselves when the target date is hidden.

### Pull planning (`pulls.ts`): deterministic worst case

- **Cost per target:** the configured hard pity (`settings.hardPity`; 80 for characters and 70 for light cones by default).
- **Losing the 50/50:** doubles that.
- **First row of each kind:** subtracts the current pity, and wins if `guaranteed[kind]` is set.
- **Rows report their pieces:** `hardPity`, `pityDiscount` and `losesFiftyFifty`. The cost tip builds its sum from them.
- **Starlight refund (`countStarlight`):** 40 per 5★, plus the expected 4★ refund (13 % per pull, with a per-banner average).
  - It carries over between rows and is floored only when converted to passes.
  - A target's own 5★ refund never pays for its own row.

### Odds (`odds.ts`): Monte Carlo

- **Rates:**
  - characters: 0.6 % base, soft pity from 74, hard at 90, 50/50;
  - light cones: 0.8 % base, soft pity from 66, hard at 80, 75/25.

  Tests check them against the official consolidated rates.
- **Simulation:** `simulatePlan` runs 10,000 seeded runs, each 5★ drawn once from a precomputed CDF. It is cheap enough to run on every keystroke; keep it that way.
- **Stats:**
  - `guaranteedNeeded` is the «Peor caso» stat;
  - `shownChances` decides when to show 100 % (only in the worst case) or 0 %.
- **Where the % shows:** each row's % (with the rows before it) sits in its name box. «Previsión de suerte» shows only the summary stats.

### Dupes (`dupes.ts`)

- **What is stored:** a row stores only the catalog name, never the dupe.
- **`planCopies`:** derives each row's copy from the plan order, after the owned copies (Eidolon + 1).
- **Display:**
  - the planner shows it as an `.eidolon-badge` on the thumbnail, the same as in Cuenta;
  - the dupe gallery (side margins, ≥1480px) uses `planDupes`, with light cone superimpositions up to `MAX_SUPERIMPOSITION`.

## State and external data

- **Storage (localStorage):**

  | Key | What |
  | --- | --- |
  | `hsr-jades:v1` | `AppState` (`version: 1`). No full export or import. |
  | `hsr-jades:catalog:v1` | The catalog cache, outside `AppState`. |
  | `hsr-jades:catalog-last-sync` | Last sync attempt (1 min cooldown). |
  | `hsr-jades:details:v1` | yatta details, reset when `DETAILS_VERSION` changes. |
  | `hsr-jades:details-misses:v1` | What yatta lacks, remembered for 24 h. |

- **Every load goes through `normalizeState`.** It validates each field, fills defaults, clamps quantities to non-negative integers, and holds the **migrations**.
  - Adding a field to `AppState` means updating `defaultState` and `normalizeState`, plus a store test if it migrates.
  - Built-in sources always take their name and description from the current defaults, and new built-ins are appended to old saves.
  - An unknown skin falls back to `aha`.
- **Catalog:** the 5★ list comes from nanoka.cc at its manifest version (`FALLBACK_VERSION` if that fails), with Spanish names from yatta.moe. Beta content keeps its English name until yatta has it.
  - A sync makes 5 requests.
  - It runs from the «Sincronizar contenido» button and automatically on Tuesdays at 10:00 local time.
  - Being due is checked on load, at that hour, and when the tab becomes visible.
  - Name searches compare through `fold`, which ignores case, accents and signs.
  - `NameCombobox` only accepts names picked from the list; without a catalog it accepts free text.
- **Details popover:** Spanish text from yatta, falling back to nanoka (English).
  - Items are prefetched once they appear in the gallery.
  - `<img>` elements use `crossOrigin="anonymous"`, matching the CSS mask's CORS fetch.
- **Account:** owned characters with their Eidolon, set by hand or imported from Reliquary Archiver's `profile.json`.
  - With the catalog, only 5★ are kept, and Trailblazers (ids 8000+) are dropped.
  - Importing replaces everything, with undo.

## UI conventions

- **Tabs** are chosen by URL hash: none is Calculadora, `#cuenta` is Cuenta and `#configuracion` is Configuración.
- **Skins:** `aha` (the default and the CSS base) and `sparxie`, set as `data-skin` on `<html>`.
  - Light/dark is separate: `settings.theme` is `system | light | dark` and becomes `data-theme`, or no attribute for `system`.
  - Every skin defines its dark tokens twice, in the `prefers-color-scheme` query and under `[data-theme='dark']`.
  - Use the tokens and never hard-code colors.
  - Sparxie comes from `designs/droolsuite.DESING.md`.
  - Aha's body font is Figtree. Its card titles and result figures use Card Characters (`--font-card`, one weight, 400), which ships in `src/assets/fonts/`.
  - In Sparxie, Pixelify Sans is only for labels without digits (its 5 looks like an S); numbers stay in Courier Prime.
- **CSS organization (`styles.css`):**
  - The header has an index of sections, each marked `/* == Name == */`.
  - A skin's rule for one component sits next to that component, under `:where(:root[data-skin='…'])` so it keeps base specificity and wins only by source order. Sparxie's global rules are in its own section at the end.
  - No `!important`.
- **Color only for problems.** The accent (red in Aha) marks what needs attention, such as «Faltan» or a row that does not fit.
  - Checked controls use `--text`; Aha's switches use `--switch-on`, a moss green.
  - These accent uses are deliberate exceptions:
    - the bubbles' `--border-pop` and the toast border;
    - «Deshacer»;
    - focus rings and the focus border of fields;
    - the selected tab, the selected key date, and the calendar's selected day and key-date dots;
    - the dragged row's ring and handle;
    - the combobox's selected option;
    - the dupe badges;
    - the Resumen card and Aha's stat boxes, both at 28 %.
  - Sparxie's turquoise is not an alarm color, so its switches and bars keep it.
  - Rarity colors (`--rarity-4`/`--rarity-5`, `Rarity.tsx`) are the game's own colors, the same in every skin.
  - No state may be shown by color alone; add a word, a shape or a weight.
- **Layout stability:**
  - `html` has `scrollbar-gutter: stable`.
  - Numbers must not shift the layout: use fixed `rem` columns and reserve space with `visibility: hidden` (`.invisible`, `.swap`).
  - Aligned numbers use `font-variant-numeric: var(--num-variant)`. Numbers inside a phrase, such as countdowns, use `normal`.
- **Tokens (`:root`):**
  - spacing `--space-1…5` (4/8/12/16/20; 6px only for repeating row pitch);
  - type scale 12/13/14/16/18/20/24/56px, with 13px for labels;
  - control sizes: `--control-h`, `--field-compact-h`, `--field-compact-pad`, `--btn-pad-x`, `--remove-w`;
  - floating surfaces: `--shadow-pop`, `--border-pop`/`--border-pop-w`;
  - motion: `--fade-in`/`--fade-out` (180/150ms, shared by bubbles and button hovers);
  - accent fills: `--on-accent`/`--selected-bg`.

  Inputs use `--input-nudge` (1px less padding on top: 0 in Aha, −1px in Sparxie) when adding padding.
- **Breakpoints:**
  - 1480 (dupe gallery), 1180 (two columns), 1040 (Configuración aside);
  - ≤720 (rows split into two lines), ≤560 (phone tweaks), ≤520 (sources), ≤430 (tab icons hidden, 50/50 under the portrait, pity fields stacked), ≤380 (events in three lines), ≤350 (packs' «por compra» on its own line);
  - container queries: `plan` ≤29rem (add buttons lose their text), key dates <36rem, account <30rem and <44rem.
- **Calculadora order:** from 1180px there are two equal columns. Below that, cards order by class:
  1. Resumen;
  2. Recursos actuales;
  3. Plan;
  4. Previsión;
  5. Fecha objetivo;
  6. Versiones y eventos;
  7. Paquetes;
  8. Desglose.

  Card headers never wrap; the title wraps instead.
- **Explanations:**
  - **`Tip`:**
    - Explains a data value.
    - It opens on hover after 400 ms and stays open while the pointer is on it (WCAG 1.4.13). It also opens on focus, where Esc closes it, and on tap.
    - It links the trigger with `aria-describedby`.
    - Keep the trigger small: on stat tiles, the label is the trigger (`tip-term`).
    - `control` wraps a button (a tap still works the button); a function child `(id) => …` describes a control that is not its direct child.
    - `side="above"` makes it prefer opening above.
    - Content with icons needs an `.sr-only` text.
  - **No `title` for explanations.** It is allowed only on controls that already have an accessible name.
  - **Glossary:** a dotted-underlined term opens its definition.
    - Mark a term once per card, where it drives a decision.
    - One term has one definition, shared through `glossary.tsx` (`StarlightDefinition`).
    - On a `Toggle`, wrap one word of the label in `<ToggleTerm>`. Its bubble starts with a `<TipTitle>` giving the full game name, and its id is also the input's description. Wrap a label that has a term in a single `<span>`.
- **Shared controls:**
  - **`NumberField`** accepts only clamped integers and keeps an empty field while typing. Unfocused, a `.num-mask` overlay shows thousands separators. `info` opens from the label (`tip-term`); `info` and `hint` go in `aria-describedby`.
  - **`Toggle`** is for on/off settings, instead of a plain checkbox. It is as wide as its text. Per-row choices, like the 50/50 and the ×2, stay checkboxes.
  - **Remove buttons** are `btn btn-ghost btn-remove` with `<RemoveGlyph />`, never the ✕ character.
  - **Every `.btn` fades its hover** with `--fade-in`/`--fade-out`:
    - ghost buttons tint at 10 % ink over `--surface`;
    - filled buttons tint at 10 % over `--surface-2`;
    - Aha's key-date leaves change only their border.
- **Undo instead of confirmations:** deleting or replacing data passes a `Notice` as the second argument of `onChange`. `App.tsx` then shows the toast with «Deshacer».
  - The toast closes after 5 s and pauses on hover or focus.
  - Its region is always mounted (`role="status"`).
  - It holds one line, cutting only the name.
  - Planner rows turn to dust (`DUST_MS`, SVG filter) before leaving, and are removed at once with reduced motion.
- **Touch:** under `pointer: coarse`, small controls get an invisible hit area of 44px (36px tall on `.check`). Glossary terms sit above it, so tapping a term does not flip its switch.
- **Zeros and dashes:** a real zero shows as «0». «—» only means "not applicable".
- **No decorative gradients:** only functional ones (masks, the switch knob, the dupe-card glare).
- **`NameCombobox`:** while unfocused, the name is painted by `.combo-value` at `50% + 6px − var(--input-nudge)`. Chrome shifts input text that falls back to another font (the ★), so keep that formula if the padding changes.
