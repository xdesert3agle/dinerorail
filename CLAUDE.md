# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Honkai: Star Rail calculator that projects Stellar Jades and pulls ("singles") up to a target date, plans pulls for future banners, and estimates their odds. It is a client-only React 19 + Vite + TypeScript app with no backend. The UI text and code comments are in Spanish, and new UI strings and comments should be too.

## Commands

```powershell
npm run dev                         # Vite dev server
npm run build                       # tsc -b (type check) + vite build → dist/ (empties dist/)
npm test                            # vitest run (all tests)
npx vitest run src/engine/odds.test.ts      # one file
npx vitest run -t "nombre del test"          # one test by name
```

There is no linter. `tsc -b` is strict, with `noUnusedLocals` and `noUnusedParameters`, so unused imports or variables fail the build. The `vite.config.ts` sets `base: './'`, so the build works from any subfolder or from `file://`.

## Architecture

- **`src/engine/`**: pure, framework-free logic. All tests live here, next to the code.
- **`src/state/store.ts`**: the state hook.
- **`src/components/`**: presentational pieces that receive `state` and an `onChange(updater)`.
- **`App.tsx`**: owns the state and runs `calculate(state, today)` once in a `useMemo`. It passes the `Result` down.

### Units: Jades inside, singles outside

Everything is computed in Jades (1 single = 160 Jades, `JADES_PER_PULL`). Special Passes count as 1 single each. Oneiric Shards convert 1:1 to Jades when `settings.includeShards` is on. Every total shown to the user is in singles. Use `fmtSingles` and `fmtSinglesShort` from `components/format.ts`, which format es-ES with `useGrouping: 'always'` (that option needs `ES2023.Intl` in tsconfig).

### Income projection (`calculate.ts`, `sources.ts`)

`buildEvents` turns the enabled sources into a dated list of `IncomeEvent`s. The period runs from **tomorrow through the target date**, plus today when a source has `pendingNow`. That one list feeds the total, the per-source breakdown (`bySource`) and the timeline.

- **Source schedules** are `daily | weekly | monthly | cycle(anchor, periodDays) | perPatch(offsetDays)`. `perPatch` only fires at patch starts from the user's patch table. Future patches are never extrapolated.
- **Patch events** are dated rows inside each patch.
- **Shard packs** (`packs.ts`) count as an income event today. Prices are in EUR, or in JPY at the fixed rate `JPY_PER_EUR`. The first purchase gets ×2.
- **Undying Starlight** in the inventory converts to Special Passes at 20 = 1. The remainder (`starlightLeftover`) is carried into pull planning.

### Pull planning (`pulls.ts`): deterministic worst case

`planPulls` walks the planned banners in order.

- **Cost per target:** each 5★ costs the configured hard pity (`settings.hardPity`, default 80 for characters and 70 for light cones).
- **Losing the 50/50:** doubles the cost.
- **First row of each kind:** subtracts the current pity. If `guaranteed[kind]` is set, it wins automatically.
- **Starlight refund (`countStarlight`):** 40 per 5★, plus the expected 4★ refund at 13 % per pull with a per-banner average. Starlight is only floored when it is converted to passes, and it carries over between rows. A target's own 5★ refund never pays for its own row.

### Odds (`odds.ts`): Monte Carlo

- **Rates:**
  - Characters: 0.6 % base, soft pity from 74, hard pity at 90, 50/50.
  - Light cones: 0.8 % base, soft pity from 66, hard pity at 80, 75/25.

  Tests check these against the official consolidated rates.
- **Simulation:** `simulatePlan` runs 10,000 seeded runs (mulberry32). It samples each 5★ in one draw from a precomputed CDF, so it is cheap enough to re-run on every keystroke; keep it that way.
- **`guaranteedNeeded`:** the absolute worst case behind the "100 % seguro" stat.
- **`planOdds`:** turns a simulation plus a budget into probabilities.

### State and persistence (`store.ts`)

- **Storage:** `AppState` (`version: 1`) is stored in localStorage under `hsr-jades:v1` and can be exported and imported as JSON.
- **Normalization:** every load and import goes through `normalizeState`. It validates each field, fills defaults and contains the **migrations** for older saved shapes.
- **When you add a field to `AppState`:** add it to `defaultState` (`engine/defaults.ts`) and to `normalizeState`, plus a store test if it needs migration.
- **Built-in sources:** their name and description always come from the current defaults. New built-in sources are appended automatically to old saves.
- **Content catalog (`engine/catalog.ts`, `state/catalog.ts`):** the 5★ characters and light cones from nanoka.cc (a beta `.51` build, English names only), synced with the "Sincronizar contenido" button in Configuración (1 min cooldown, also persisted). It is a cache outside `AppState`, under `hsr-jades:catalog:v1`, and is not exported. The planner only uses it to suggest names; names stay free text.

### UI conventions

- **Tabs:** chosen by URL hash. No hash is "Calculadora"; `#configuracion` is "Configuración", and the legacy `#fuentes` also maps to it.
- **Themes ("skins"):** `kafka`, `aha`, `grafito` and `sparxie`, set as `data-skin` on `<html>`. Only `aha` (the default) and `sparxie` appear in the selector. `kafka` and `grafito` keep their code but are listed in `HIDDEN_SKINS` (`store.ts`), and `normalizeState` moves them to the default. To bring one back, remove it from that list. All colors are CSS custom properties in `src/styles.css`, with light and dark variants per skin. Use the tokens; never hard-code colors.
  - `grafito` comes from `designs/resent.DESIGN.md` (flavors.design "Soupabase"), and `sparxie` (called `retro` before; `normalizeState` migrates it) from `designs/droolsuite.DESING.md` (flavors.design "Droolsuite"). Both designs are dark-only or light-only; the missing variant was made up following the same rules.
  - Their fonts load from Google Fonts (linked in `index.html`). Their component rules sit under `:where(:root[data-skin='…'])` so they keep base specificity.
  - The hero decoration per skin is the `DECORATION` map in `ResultSummary.tsx` (`sparxie` has none).
  - `aha` uses Figtree (Google Fonts) for body text, chosen over Outfit, DM Sans and Plus Jakarta Sans.
  - In `aha`, card titles use Card Characters, a playing-card index font that only has capitals. It ships with the project in `src/assets/fonts/` and loads through `@font-face`, so it does not depend on the system.
- **Light/dark mode:** `settings.theme` is `system | light | dark` and is independent of the skin. `App.tsx` sets it as `data-theme` on `<html>`, or removes the attribute for `system` so the CSS follows `prefers-color-scheme`. The selector has only sun and moon buttons. `system` is the starting value with no button; while it is active, the button for the current OS mode is shown pressed. Every skin needs its dark tokens in both the media query and `[data-theme='dark']`.
  - In `sparxie`, Pixelify Sans is only for short labels without digits: its 5 looks like an S. Numbers stay in Courier Prime.
- **Layout stability is a recurring user concern.** Numbers in headers and rows must not shift the layout as their digit count changes:
  - Use fixed `rem` column widths.
  - Reserve space with `visibility: hidden` instead of unmounting.
- **Input padding:** inputs have 1px less top padding than bottom, to vertically center Segoe UI text. It is the `--input-nudge` variable (`calc(8px - var(--input-nudge))` on top, `+` at the bottom); `aha` (Figtree) and `grafito` (Inter) set it to 0 because their text is already centered, and `sparxie` to -1px because Courier Prime sits 1px high. Use it when adding inputs.
- **Shared controls:** `NumberField` keeps an empty input while the user types, and has `info` tooltips and an `icon`. `Toggle` renders switch-style checkboxes; use it instead of a plain checkbox.
- **Icons:** game item icons are PNGs in `src/assets/icons/`, used through `Icon.tsx`.
