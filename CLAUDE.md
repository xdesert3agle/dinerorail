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
  - There is no linter. Imports go packages first, then `../`, then `./`, each alphabetical by path.
  - `tsc -b` is strict, with `noUnusedLocals` and `noUnusedParameters`, so an unused import or variable fails the build.
- **Deploy:** every push to `main` runs the tests and the build, on the Node version in `.nvmrc`, and publishes to GitHub Pages (`.github/workflows/deploy.yml`). That is the link the user's friends use.
  - Never commit or push unless asked.
  - `vite.config.ts` sets `base: './'`, so the build works from any subfolder.
  - The build adds a Content Security Policy as a `<meta>` (GitHub Pages allows no headers): scripts only from the app plus the inline ones in `index.html` by hash, requests and images only to `EXTERNAL_ORIGINS` (`urls.ts`). It is build-only, because Vite's dev server injects inline scripts. A new external host goes into `EXTERNAL_ORIGINS`, or the build blocks it.
  - `vite.config.ts` imports `urls.ts`, so that chain (`urls.ts` → `types.ts`) uses `.ts` extensions, which Vite's config loader needs (`allowImportingTsExtensions`).
- **`index.html`** has one inline script, before the first paint: it applies the saved skin and mode (from `hsr-jades:v1`), so the page does not flash Aha and the system mode first.
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
4. **If it fits,** do it, following steps 5 and 6.
5. **While doing it:**
   - Reuse before writing: look for an existing function, component, token or rule that does the job, or generalize it.
   - Keep siblings consistent: if the change touches one instance of a pattern (a card, a button, a row), apply it to the others or ask.
   - Engine and state changes come with their tests.
6. **Before calling it done:**
   - Remove what the change left orphaned: dead code, unused CSS rules, tokens, exports or texts.
   - Update this file when what it describes changes, and add rejected alternatives to `docs/decisiones.md`.
   - Run `npm test` and `npm run build`.

## Module map

### `src/engine/`

Pure, framework-free logic. Business logic belongs here, not in components. Tests sit next to the code they test, here and in `state/` and `components/`; they run in the `Europe/Madrid` time zone (`vite.config.ts`), so date tests behave the same in CI.

- **`rules.ts`:** every game rule.
  - `JADES_PER_PULL`, `DEFAULT_HARD_PITY`, `FOUR_STAR_PITY`, `PATCH_LENGTH_DAYS`, the Starlight constants and the banner model (`BANNERS`).
  - `wholeSinglesOf` and `PATHS`, the 9 Paths in game order. Memory is «Reminiscencia».
  - Put new game constants here and build help texts from them.
- **`calculate.ts`:** `calculate(state, today)` returns the `Result`. Also `eventTiming`, whether a dated event counts, `countedEvents`/`countedEventSingles`, the events that count and their pulls (the calculation and the card's header total share them), and `eventsSingles`, what a version's events give whether they count or not (each version's total).
- **`sources.ts`:** schedule occurrences and `canBePending`.
- **`packs.ts`:** shard packs.
- **`pulls.ts`:** `planPulls` (cost per row), `planBalance` and `effectivePity` (the only place that limits the pity).
- **`odds.ts`:** `simulatePlan`/`planOdds` (Monte Carlo), `guaranteedNeeded` (the worst possible luck, which only gates 100 %) and `shownChances`.
- **`dupes.ts`:** `planCopies`/`planDupes` and `superimpositions`.
- **`urls.ts`:** every external address (nanoka.cc, yatta.moe, StarRailRes), including the image URLs, and `EXTERNAL_ORIGINS` for the build's CSP. Every yatta request goes through `yattaUrl`, which adds `?vh=` with the current minute: without it, Cloudflare serves copies (and 404s) up to 16 days old. Every fetch passes `AbortSignal.timeout(FETCH_TIMEOUT_MS)`; background downloads (`prefetchDetails`) go with `priority: 'low'`.
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
  - `Toggle` and `SwitchInput` (the bare switch), `Tip`/`TipTitle`, `Term`/`TermProvider`, `TipSumRow` and `TipEquation` (every «=» with icons in a bubble);
  - `RemoveGlyph`, `Icon`, `Rarity`, `Toast` and `RewardInline` (a reward with its icons, in sources and events);
  - `EditDialog` and `useEditDialog`: the modal edit dialog (native `<dialog>` with `showModal()`, portaled to `<body>`) with its action foot, shared by the sources and the versions. Its `addButton` ref goes on the card's add button, and `removed(commit)` closes the dialog first, then deletes (so the undo toast lands outside it) and moves the focus there;
  - `SortableRows`: rows reordered by a handle and turned to dust on removal (`SortableList`, `useSortableRow`, `DragHandle`, `DustFilter`, `useDustRemoval`), shared by the plan and the events.
    - A tap on the handle that does not move it opens its «Subir / Bajar» menu (`MoveMenu`, WCAG 2.5.7: reordering without dragging); the keyboard picks the row up with space or enter instead.
    - Removing a row that has the focus moves it to the ✕ of the next row (or the previous one), and with no rows left to the `fallback` the list passes (its add button).
- **Helpers:**
  - `glossary.tsx`: shared definitions;
  - `format.ts`: every es-ES formatter, such as `fmtSingles`, `fmtChance` and `fmtEuros`;
  - `kinds.ts`, `motion.ts`, `inputs.ts`, `usePlanOdds.ts` and `useFocusNew.ts` (a newly added row focuses its name once);
  - `layer.ts` (`useLayer`): where floating pieces portal to, `<body>` or the open modal dialog. A modal makes everything outside it inert and puts it underneath, so `Tip`, the `Toast` and the screen-reader announcements of `SortableRows` (and dnd-kit's) go into the dialog while one is open. Inside a dialog, `DateField`'s calendar goes next to its field instead (air-datepicker misplaces it in a scrolled container). Whatever closes on Esc inside a dialog (a bubble, the calendar, the move menu) calls `preventDefault`, or Esc closes the dialog too.

`App.tsx` owns the state. It runs `calculate`, `usePlanOdds` and `planCopies` once each, passes the results down, and keeps the undo toast. Planner and event rows are reordered with `@dnd-kit`, through `SortableRows`.

## Domain rules

- **Units: Jades inside, «tiradas» outside.**
  - Everything is computed in Jades (1 pull = 160). A Special Pass is 1 pull.
  - Oneiric Shards convert 1:1: the inventory ones when `settings.includeShards` is on, the pack ones whenever packs count.
  - Totals are shown in pulls, and the UI word is always **«tiradas»**; "singles" stays in code.
  - Use `fmtSingles`, and `wholeSingles` for header totals.
- **Vocabulary:**
  - A game version is **«versión»** in the UI («4.7 · 1.ª parte»), but `Patch` in code. Keep `Patch`, because `version` already names schema versions and a patch's number.
  - The planner card is «Plan de tiradas», and texts say «el plan».
  - The pity: its **«límite»** is the value in Configuración › Pity (80/70); the game's own (90/80) is «el límite del juego». Never «pity duro», which named both.
  - The bet is «50/50» on the character banner and «75/25» on the light cone one: texts take it from `fiftyFiftyName(kind)` (`rules.ts`, from `BANNERS[kind].featuredWin`). "fiftyFifty" stays in code for both.
  - An exchange rate names the items («20 Cosmiluz = 1 Pase Especial»); «tirada» is the action and counts totals.
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
  - Rows return their pieces (`hardPity`, `pityDiscount`, `losesFiftyFifty`) for the cost tip, and those of their Starlight (`fourStarStarlight`, `lostStarlight`, `targetStarlight`) for the row's «Cosmiluz esperada» pill, shown while it is reinvested.
  - **Starlight refund (`countStarlight`):** what each 5★ gives plus the expected 4★ refund (13 % per pull on the character banner, 14.8 % on the light cone one).
    - The target's 5★ gives `targetStarlight` by its copy (from `planCopies`): a light cone 40; a character 0 if new, 40 from E1 to E6, 100 past E6. A row without a known copy (no catalog, or a name outside it) counts as new, the safe side.
    - The 5★ lost to the 50/50 (a standard one) is assumed repeated: 40.
    - The plan, the simulation and `guaranteedNeeded` all take `copies`, so they agree.
    - It carries over between rows.
    - A target's own refund never pays for its own row.
- **Odds (Monte Carlo):** official consolidated rates (tests check them).
  - Characters: 0.6 % base, soft pity from 74, hard at 90, 50/50.
  - Light cones: 0.8 % base, soft pity from 66, hard at 80, 75/25.
  - Losing the 50/50 or 75/25 can still give the featured 5★ (1 in 8, `FIFTY_FIFTY_POOL`), so the featured one comes 56.25 % / 78.125 % of the time, which gives the official 1.113 % / 1.534 %.
  - `simulatePlan` runs 10,000 seeded runs from a precomputed CDF. It must stay cheap enough for every keystroke.
  - `guaranteedNeeded` is the worst possible luck at the game's limits: a target shows 100 % only if the budget covers it. It is not shown as a figure. Its guaranteed 4★ count per banner, as in the game.
- **Plan rows and dupes:** a row stores the catalog name and, once known, its `entryId`. With a catalog, `App` keeps every row's id and name current (`withCatalogIds`): a beta name in English becomes the Spanish one when yatta publishes it. The dupe is never stored: `planCopies` derives each row's copy from the plan order, after the owned copies (Eidolon + 1).
- **Key dates:** `KEY_DATES` is hand-maintained.
  - Unpublished dates are estimated at `PATCH_LENGTH_DAYS` per version.
  - Clicking a leaf sets the target date.
  - Only the next version shows (or up to the one with the target date, when it is a later one); «Ver N versiones más» opens the rest. The folded list grows on its own to show the target date but never shrinks on its own (picking a date higher up leaves the rows below); «Ver menos» folds it back to the target's version. The list grows and shrinks to its new height with the rest clipped (Web Animations, in `TargetDate`), so rows are revealed or covered while what is below follows; those that go stay until it ends.

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
  - **Register:** explanations and definitions are formal, not the players' colloquial speech: «la siguiente tirada garantiza un 5★», not «la tirada da el 5★ seguro»; «será el destacado con total seguridad», not «será el destacado seguro». Cause and consequence go in separate sentences, not joined by a colon.
- **Tabs:** chosen by URL hash: none is Calculadora, `#cuenta` and `#configuracion` the others. They change the URL and the history, so they are navigation: links in a `<nav>` with `aria-current="page"`, not an ARIA tablist.
- **Skins:** `aha` (the default and the CSS base) and `sparxie`, set as `data-skin` on `<html>`.
  - Light/dark is separate: `settings.theme` becomes `data-theme`, with no attribute for `system`. The two mode buttons store the opposite of the system as `light`/`dark`; pressing the one that matches the system stores `system` again (never that mode, which would pin it).
  - Use tokens and never hard-code colors.
  - Sparxie comes from `designs/droolsuite.DESIGN.md`.
  - Aha uses Figtree, plus Card Characters (`--font-card`, a single weight of 400) for card titles and result figures.
  - Every font is self-hosted as woff2 in `src/assets/fonts/`: the Google ones (Figtree, Pixelify Sans, VT323, Courier Prime) are declared in `src/fonts.css`, with their OFL license; Card Characters and ChicagoFLF in `styles.css`.
  - In Sparxie, Pixelify Sans is only for labels without digits; numbers use Courier Prime. Window titles, bubble headings and the big figures use ChicagoFLF (`--font-display`), a public-domain copy of the classic Mac's Chicago, self-hosted in `src/assets/fonts/` with its license.
- **CSS organization (`styles.css`):**
  - The header has an index; sections are marked `/* == Name == */`.
  - Color tokens are `light-dark(light, dark)`. The dark blocks hold only `color-scheme` and non-color tokens, written twice: once in the media query and once under `[data-theme='dark']`.
  - The base is Aha. Sparxie overrides it, and `:where(:root[data-skin='aha'])` is kept only for Aha extras that Sparxie must not inherit (the card font on figures, uppercase card and bubble titles, the page decoration). Skin rules sit next to their component under `:where()`, so they keep base specificity.
  - The field base rule is under `:where()`, so components need no `[type]`.
  - Variants set variables instead of undoing rules: buttons set `--btn-hover-bg`/`--btn-hover-border` (one `.btn:hover` rule) and ghost ones `--btn-ghost-hover-text`; a button's fill is `--btn-bg`, one layer above its backdrop (the card); switches use `--switch-on`/`--switch-knob-on`/`--switch-knob-off`, focus uses `--focus-ring`. Floating surfaces (`.dupe-pop`, `.tip`, `.toast`) share one rule.
  - Width queries use range syntax (`width <= 720px`, `width > 720px`): with display scaling the width can be fractional, and a 1179/1180 pair left a gap.
  - air-datepicker's CSS is imported in `main.tsx` before `styles.css`, which overrides it by source order.
  - No `!important`.
  - The last section, «Colores forzados», covers Windows high contrast: a state drawn with a background or a shadow (selection, the switch, the dragged row) needs an outline or border in a system color there, because forced colors remove both.
  - Something that does not count (a source turned off, an event that misses the target date) is dimmed by redefining the text tokens to `--text-muted` inside it, with only its icons at half opacity. Never `opacity` on text: it drops below 4.5:1.
- **Accent color:** problems («Faltan», a row that does not fit), selection (tab, key date, calendar day, combobox or menu option, dragged row) and focus. Never neutral data or controls at rest.
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
  - spacing `--space-1…5` (4/8/12/16/20; 6px for repeating row pitch), and `--card-gap` between a card's header and its blocks (12; 4 in the Resumen). The plan's first row sits at 16 instead, an approved exception (`docs/decisiones.md`);
  - type scale 12/13/14/16/18/20/24/56px;
  - controls: `--control-h`, `--field-compact-h`, `--field-compact-pad`, `--field-radius`, `--field-border` (3.3:1 with the card and the field's own fill: WCAG's 3:1 plus a margin, because a 1px line looks weaker than its color, more so with display scaling; in Aha light and dark and in Sparxie dark, while Sparxie light keeps its ink frames; edit dialogs are cards too, so no field sits on `--surface-2` except in the row being dragged; `--border` separates cards, not controls), `--stepper-w`, `--btn-pad-x`, `--remove-w`, `--date-field-w`, `--badge-out`, `--focus-ring`;
  - layers, about 1.19:1 apart in Aha: `--surface` (card, also the edit dialog), `--surface-2` (buttons, stat boxes, the dragged row);
  - `--backdrop`, the veil behind a modal dialog;
  - floating surfaces: `--shadow-pop`, `--border-pop`;
  - accent mixes: `--accent-frame`, `--accent-hover`;
  - layers, bottom to top: `--z-raised`, `--z-list`, `--z-popover`, `--z-tip`, `--z-toast` (the loose −1/1/2 only order pieces inside a component). The edit dialog sits above all of them in the browser's top layer, and whatever floats over it goes inside it (`layer.ts`);
  - motion: `--fade-in`/`--fade-out`, `--press-scale`/`--press-ms`, `--pop-scale`. What floats over a control (`.tip`, `.dupe-pop`, the dropdowns, the calendar) is born at `--pop-scale` (0.95) and grows from its control (`transform-origin` on the side of its arrow or its control; `pop-in`/`pop-out`), never with `transform`, which would re-anchor fixed pieces inside it. The edit dialog only fades, for the same reason (the toast can be inside it). A switch's knob stretches 12% while pressed (`--knob-w`; not in Sparxie).
  - Field padding follows `--input-nudge`: 0 in Aha, and −1px in Sparxie, whose Courier sits high, so it gets 1px more on top.
- **Breakpoints:**
  - 2000 and 1480 (dupe gallery), 1180 (two columns), 1040 (Configuración aside);
  - ≤720 (rows split into two lines; >720 the reverse), ≤560 (phones), ≤520 (sources), ≤430 (events in three lines) and ≤350;
  - container queries: `plan` 29rem (the add buttons lose their text and each row's Starlight drops under the cost), key dates 36rem, account 30 and 44rem.
- **Calculadora order:** below 1180px the cards order by class: Resumen, Recursos actuales, Plan, Previsión, Fecha objetivo, Versiones y eventos, Paquetes, Desglose.
- **Explanations:**
  - **`Tip`** explains a value on hover, focus or tap, linked with `aria-describedby`. `control` wraps a button. Without it, the value is a `role="button"` toggletip with `aria-expanded` (Enter or space open and close it). With the mouse it opens after 400 ms (`HOVER_DELAY`), but right away while another bubble is open or closed less than 300 ms ago (`WARM_MS`: going from one term to the next). On leaving, it fades from the first moment and comes back if the pointer reaches it or its term within `LEAVE_GRACE` (as the gallery popover does).
  - **No `title`** for explanations; it is allowed only on controls with an accessible name.
  - **Glossary:** a dotted-underlined term opens its definition, headed by the term itself (`TipTitle`). A bubble under a card title is headed by what it explains, never by that title («Simulación» under «Previsión de suerte»). Explanations of a setting or a value («Precios de los paquetes», a cost) have no heading. A `Toggle`'s `tip` or a `NumberField`'s `info` is opened by the `Term` in its label, which marks only the defined word («Pity» in «Pity de personaje»), or the whole label when it is the term. Mark a term once per card, where something is decided. A term has one definition, shared through `glossary.tsx`.
- **Controls:**
  - **`NumberField`** delivers clamped integers, so parents do not clamp again. Emptied, it delivers 0. While focused, the typed text is left alone; the clamped value shows on blur.
    - It draws its own ±1 arrows inside the field (`.stepper`; the native ones are hidden everywhere), only under `pointer: fine`. Amounts in the thousands, typed rather than counted (Jades, Esquirlas), pass `noStepper`; the rest keep them (packs, Pases, Cosmiluz, pity, days).
  - **The segmented control** (`.segmented` with `.segment` buttons) serves the theme and mode selectors, the store and the Path filter.
  - **`Toggle`** is for on/off settings. Per-row choices stay checkboxes (the 50/50, the ×2). The sources' bare `role="switch"` is named by the source's visible name (`aria-labelledby`) and has no label of its own, so it is not a `Toggle`.
  - **Add buttons** go in the container they add to. What is added to the card goes in its header (`.btn`: «+ Versión», «+ Personaje», «+ Fuente personalizada»). What is added to a list inside an edit dialog goes at the end of that list, as a plain `.btn` that starts where the rows' first field does, sharing the line with the list's total, like a table foot (`.event-foot`: «+ Evento» and the version's total).
  - **Remove buttons** are `btn btn-ghost btn-remove` with `<RemoveGlyph />`, never ✕: a circle as wide as `--remove-w`, centered in its row, so its hover and focus ring are round. The drag handle beside it is as tall as its row (the grip) with the same round ends, a capsule: icon buttons in a row share fully rounded ends (Sparxie keeps its near-square corners on both). The toast and the edit dialog close with the same button.
  - **Read in the card, edit in a dialog:** Fuentes de ingresos and Versiones y eventos show read-only rows, and a ghost «Editar» (`aria-haspopup="dialog"`) opens that one in a modal dialog (`useEditDialog`, `EditDialog`): a `.card` with the edited thing as its header title and a close X (`btn-remove`, like the toast's; in Sparxie it is the window's close box, on the left, instead of the decorative one), its fields, and the version's total for a version. Two widths: a few fields (a source) by default, `wide` for the event rows. In a version, every field (number, start, event names, «+ Evento») starts after the handles' gutter (`--row-gutter`), even with no events, while the title and the foot stay on the edge.
    - The foot (`.edit-dialog-footer`) holds only the actions, as in a form: «Eliminar …» on the left (`btn btn-ghost btn-danger`) and «Terminar edición» on the right (a plain `.btn`). Settings of the edited thing go with the fields, never in the foot.
    - Changes are saved as they are typed, so closing never loses anything: «Terminar edición», the X, Esc and a click on the backdrop (one that also started there) all just close, and return the focus to «Editar». «Terminar edición» repeats the X on purpose: it says what was typed stays, where an X alone could read as «cancel».
    - The focus starts on the dialog itself, so a phone does not open its keyboard; on something just added, on its first field (the name, the version number).
    - The content mounts once the dialog is open: closed, it has no box, and what measures itself on mount (`NumberField`'s thousands mask) would come out at zero.
  - **Every `.btn` and `.chip` fades its hover** with `--fade-in`/`--fade-out`, and shrinks to `--press-scale` (0.97, in `--press-ms`) while pressed. Not the drag handle, which picks the row up on press, and not in Sparxie (`--press-scale: 1`), whose press is the inverted bevel.
  - **Ghost text buttons align by their box when they are actions** («Editar», «Deshacer», «Eliminar …»): the box sits on the content edge, so the hover tint lines up with the fields and stays inside the padding, and the text is inset like any button's. Only one that reads as a link under a column of text («Ver N versiones más») aligns its text instead, with a smaller padding pulled out by a negative margin.
- **Undo instead of confirmations:** deleting or replacing data passes a `Notice` to `onChange`, and the toast offers «Deshacer».
  - Any other change closes that toast, also one arriving from another tab, because its snapshot predates the change.
  - It leaves on its own after 10 s (`TOAST_MS`), paused while the pointer or the focus is on it. A hidden `role="status"` announces only its text, plus «Acciones disponibles» with «Deshacer»; the visible toast sits in the «Avisos» region. Closing it from inside returns the focus to where it was.
  - What deletes something hands the focus on (the next row, the add button): the focus never falls to `<body>`.
  - Planner and event rows turn to dust before leaving, except with reduced motion.
- **Touch:** under `pointer: coarse`, small controls get a 44px hit area (36px tall on `.check`). Glossary terms sit above it.
- **Pull totals** show the pass ticket and the figure (`.card-total`), never a sentence: whole pulls in a card header (Recursos actuales, Paquetes, Versiones y eventos), and with decimals at the foot of each version (`.patch-total` sets `--total-size`/`--total-icon`).
  - **Size scale of totals:** a row's figure 16px < a sum of rows 18px (Paquetes' «Total», each version's total) < a card header 20px. The ticket keeps the header's proportion (28/20 in Aha, 20/20 in Sparxie).
- **Zeros and dashes:** a real zero shows as «0» (`fmtSingles` does it). «—» only means "not applicable".
- **No decorative gradients:** only functional ones.
- **`NameCombobox`:** while unfocused, the name is painted by `.combo-value` at `50% + 6px − var(--input-nudge)`, because Chrome shifts input text that falls back to another font (the ★). Keep that formula if the padding changes.
