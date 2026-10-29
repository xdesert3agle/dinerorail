# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Honkai: Star Rail players who plan their pulls ahead of banners: the owner and a small circle of friends. The friends must be able to use it without the owner explaining it. All are Spanish speakers who already know the gacha mechanics (pity, 50/50, guaranteed, 4★ pool, Undying Starlight). The job: "with what I have now and what I will earn until date X, can I get the 5★ targets I want, guaranteed or with what probability?"

Use is mostly on desktop, calmly, when planning the next patch or a banner. Mobile matters too: the layout must stay usable and readable on a phone.

## Product Purpose

Dinero Rail projects Stellar Jades and pulls ("singles") up to a target date, plans pulls for future banners in order, and estimates the odds of getting each target. Success means a player trusts the number enough to decide whether to pull, skip, or save for a later banner.

## Positioning

Three answers in one flow, from the player's real inventory and income sources:

- **Projected income:** current resources plus every enabled income source and the dated events in the user's own patch table, up to the target date. Future patches are never extrapolated.
- **Deterministic worst case:** hard pity on every target and every 50/50 lost, with Starlight refunds carried between rows. This is the «Peor caso» number.
- **Real odds:** a Monte Carlo simulation with the official consolidated rates (soft pity, 50/50 and 75/25), turned into a probability for each target given the budget.

The account import and the dupe tracking (which Eidolon or superimposition each planned target becomes) support the plan, but they are not the core claim.

## Operating Context

- **Tabs:** Calculadora (inventory, sources, packs, planner, results, odds), Cuenta (owned characters and Eidolons, imported from Reliquary Archiver's `profile.json`) and Configuración (sources, patch table, pity, themes, content sync).
- **Data sources:** the content catalog comes from nanoka.cc. Eidolon and light cone texts come from yatta.moe in Spanish, with a fallback to nanoka in English. Both are fetched in the browser and cached locally.
- **Persistence:** all state lives in the user's browser (localStorage), kept in sync between open tabs. There is no export or import of the whole state (removed on purpose); importing a profile only fills the Cuenta tab.

## Capabilities and Constraints

- **Hosting:** a client-only static app hosted on GitHub Pages, with no backend, accounts or server storage. The build must keep working from a subfolder (`base: './'`).
- **Language:** the UI is in Spanish. Game content names may appear in English when only nanoka has them.
- **Units:** everything is computed in Jades and shown in pulls («tiradas», 1 = 160 Jades).
- **Rules:** game rules live in `src/engine/rules.ts`. UI help text derives from those constants instead of repeating the numbers.
- **Settled decisions:** there is no reset or clear-all action, the yen rate is fixed, there are no charts in the odds section, and undo replaces confirmation dialogs.
- **Starlight per target (settled 2026-10-29):** each target's 5★ gives what the game gives for that copy, derived from the plan order and the account (new character 0, E1–E6 40, past E6 100, light cone 40), with no per-row selector. The 5★ lost to a 50/50 is assumed repeated (40).
- **Open product decisions:** story-mission tracking is parked until a data source exists. Banner dates per row, a reach date per row, and forecast-versus-reality tracking were proposed and not taken up.

## Brand Commitments

- **Name:** "Dinero Rail".
- **Character skins:** themes inspired by HSR characters (Aha, the default, and Sparxie) are part of the identity. Light/dark mode is independent of the skin.
- **Game icons:** real item icons (Jades, Passes, Undying Starlight, Oneiric Shards…) sit next to the text wherever a game item is named.
- **Player voice:** community vocabulary (tiradas, 50/50, pity, garantizado, E2, S3) without explaining the obvious; "singles" stays in code, the UI always says «tiradas». Labels are short; explanations, rates and conversions go in tooltips, not in descriptions under fields.

## Evidence on Hand

- **Assets:** game item icons in `src/assets/icons/`, Aha skin assets in `src/assets/aha/`, the Card Characters font in `src/assets/fonts/`, and the source design notes for Sparxie in `designs/`.
- **Rates:** tests in `src/engine/odds.test.ts` check the banner rates against the official consolidated figures.
- **Not on hand:** there are no testimonials, usage numbers or screenshots for promotion. Character art and texts belong to HoYoverse and are fetched at runtime from nanoka.cc and yatta.moe; the project does not own them. Do not fabricate any of these.

## Product Principles

1. **Honest numbers.** The guaranteed worst case and the probability are distinct and labeled as such. Nothing is projected from data the user did not enter, such as future patches.
2. **Think in pulls.** Every total is shown in pulls («tiradas»). Jades and other units are internal or secondary.
3. **Short by default.** Players know the game. Labels stay short, icons carry the item names, and detail goes behind a tooltip.
4. **Stable under change.** Numbers update on every keystroke. The layout must not shift as values change, and edits are reversible through undo instead of confirmation.
5. **Friend-proof.** A friend opening the GitHub Pages link for the first time should understand what to enter and what the result means without the owner beside them.
