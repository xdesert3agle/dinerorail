---
version: "alpha"
name: "Droolsuite"
description: "A 1987 leisure desktop on dithered pink: cream windows with 1px ink frames, bevelled system buttons, a TV full of static and a dock of pixel icons."
colors:
  primary: "#afe5dd"
  on-primary: "#000000"
  surface: "#f6d5d5"
  surface-container: "#f9f0e9"
  on-surface: "#000000"
  on-surface-variant: "#5f5550"
  outline: "#000000"
  paper: "#ffffff"
  tertiary: "#faf5c6"
  button: "#f6d6d5"
  button-shadow: "#7b6b6b"
  accent-shadow: "#58736f"
  bevel-dark: "#9b9b9b"
  chip: "#e3dcd6"
  on-air: "#ef4444"
  sky: "#f3a37c"
  sea: "#2f7fa8"
  sand: "#f0cf9a"
  leaf: "#3f7d4e"
  desk-fg: "#000000"
typography:
  headline-display:
    fontFamily: "Instrument Serif"
    fontSize: 64px
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: -2px
  body-md:
    fontFamily: "Courier Prime"
    fontSize: 13px
    lineHeight: 1.45
  label-md:
    fontFamily: "VT323"
    fontSize: 17px
    letterSpacing: 0.5px
  label-sm:
    fontFamily: "Pixelify Sans"
    fontSize: 12px
rounded:
  sm: 3px
  md: 4px
  lg: 6px
  full: 9999px
spacing:
  unit: 4px
  section: 96px
  max-width: 1180px
---

# Droolsuite

> A members-only pool radio that lives in a 1987 home computer: cream windows floating on a dithered pink desktop, Garamond-ish titles, pixel labels and a TV playing a faded 1986 pool-at-sunset tape through a veil of static.

Source: https://flavors.design/f/droolsuite

The real faces are commercial or bespoke bitmap fonts (Pixolde, Everyday, ChiKareGo2, ITC Garamond, Pixelated Times New Roman). Stand-ins chosen by skeleton from Google Fonts: **VT323** for Pixolde (uppercase bar labels), **Pixelify Sans** for Everyday UI text, **Instrument Serif** for the condensed ITC Garamond window titles and big headings, **Courier Prime** for Pixelated Times / typewriter body copy. The originals are listed second in each stack.

## Overview

Droolsuite is a website that pretends to be a desktop operating system from the summer of 1987, run by a country club. There is no scrolling landing in the original: a pink desktop, a black-and-cream top bar split into cells, overlapping application windows (a TV player, Mixtapes, Newsroom, Event Calendar, Member Perks, Guestbook) and a dock of pixel icons pinned to the bottom edge. This flavor keeps that desktop as the hero and then lays each spec section out **as another window** on the same desktop, so the page scrolls through a stack of apps. The emotion is smug, sunburnt nostalgia: yacht rock, terry cloth, sunscreen. It is not vaporwave (no purple grids, no Greek busts), not mid-90s office-PC grey, and not glossy candy-plastic chrome. Everything is flat cream, pink and black ink with one pale teal button.

## Colors

| Role          | Value     | Notes                                                              |
| ------------- | --------- | ------------------------------------------------------------------ |
| bg            | `#f6d5d5` | desktop pink, overlaid with a 2px checker dither                   |
| bg-2          | `#f9f0e9` | window chrome, top-bar cells, dock, secondary buttons              |
| fg            | `#000000` | all ink: text, 1px frames, icons                                   |
| fg-muted      | `#5f5550` | captions, timestamps, status-bar text                              |
| accent        | `#afe5dd` | the teal "secondary button": play, primary CTA                     |
| accent-fg     | `#000000` | text on teal                                                       |
| border        | `#000000` | every frame is solid black 1px                                     |
| paper         | `#ffffff` | inset panes inside windows; bevel highlight                        |
| tertiary      | `#faf5c6` | butter-yellow windows (Event Calendar, Welcome)                    |
| button        | `#f6d6d5` | pink bevel button                                                  |
| button-shadow | `#7b6b6b` | lower-right bevel of pink buttons                                  |
| accent-shadow | `#58736f` | lower-right bevel of teal buttons                                  |
| bevel-dark    | `#9b9b9b` | lower-right bevel of cream buttons                                 |
| chip          | `#e3dcd6` | filename chips under CDs, tabs, LIVE pill                          |
| on-air        | `#ef4444` | the pinging live dot and the clock face                            |
| sky / sea     | `#f3a37c` / `#2f7fa8` | Fallback fill behind photos; CD and calendar accents   |
| sand / leaf   | `#f0cf9a` / `#3f7d4e` | CSS "photos": beach and palm                           |
| desk-fg       | `#000000` | section eyebrows and leads that sit straight on the desktop; light in dark schemes |

Scheme: light. Contrast rule: text is always pure `fg` on cream, white or pink (≥ 15:1); muted only for timestamps and status bars.
Color rules: the teal appears on at most one button per window; pink buttons are the default "become a member" colour; photos are the only place with saturated colour; no gradients on chrome.

## Typography

- Display: `"Instrument Serif", "ITC Garamond", Georgia, serif` — 400 only, tight tracking (-0.6px to -3px), used for window titles (21px, uppercase, squeezed with `scaleX(.86)` and a 0.5px stroke to fake the condensed bold Garamond), hero and section headlines (40–64px, sentence case, line-height .9) and big numbers.
- Body: `"Pixelify Sans", "Everyday", system-ui, sans-serif` — 11–13px pixel UI text: track titles, dock labels, status bars, captions.
- Type: `"Courier Prime", "Pixelated Times New Roman", "Courier New", monospace` — 12–13px typewriter voice for paragraphs, list titles (700), buttons (600) and dates.
- Mono: `"VT323", "Pixolde", ui-monospace, monospace` — 15–17px UPPERCASE with 0.5px tracking for the top bar, eyebrows and footer cells.
- Scale: 11 / 12 / 13 / 17 / 21 / 44 / 56 / 64 / 84
- Load: `<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Pixelify+Sans:wght@400;600&family=VT323&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">`
- Rules: `-webkit-font-smoothing: none` everywhere; italics only as a single emphasised serif word or the "Activated" perk status; never bold the serif.

## Layout

- Max width 1180px, 20px gutters
- Base unit 4px; spacing scale 4 / 6 / 10 / 16 / 24 / 40 / 64 / 96
- Section rhythm 96px between windows; windows sit directly on the desktop, never inside a section band
- Hero: full-viewport desktop with two overlapping windows (the TV player right of centre, a yellow Welcome window overlapping its left edge) under a sticky top bar, above a fixed dock
- Grid: most sections are a two-column split (a window + a loose serif headline sitting on the desktop); pricing is three windows, the middle one raised 18px
- Density: dense — 6px padding inside window chrome, 10–14px inside panes, 11–13px text
- Under 1100px the hero windows stack; under 860px every split becomes one column and the dock scrolls horizontally

## Elevation & Depth

System 6 flat, then one soft cast: surfaces are separated by solid 1px black lines and a single blurred drop per window.

- Every window: `border: 1px solid #000`, `border-radius: 6px`, `box-shadow: 0 50px 80px -50px color-mix(in srgb, #000 34%, transparent)` (the site's `shadow-is-component`, `--depth` is the knob). No other shadow on windows.
- Inset panes: white `#fff`, `1px solid #000`, 4px radius and a lip `box-shadow: 0 1px 0 #000, inset 0 1px 0 #fff` (the site's `shadow-is-media-button`).
- Buttons are bevelled: `inset -1px -1px 0 #9b9b9b, inset 1px 1px 0 #fff, 0 0 0 1px #000` at rest; on `:active` the insets swap (`inset 1px 1px 0 #9b9b9b, inset -1px -1px 0 #fff`). Pink and teal buttons use `--button-shadow` / `--accent-shadow` for the dark edge. The default button in an alert gets an extra ring: `0 0 0 3px #f9f0e9, 0 0 0 4px #000`.
- Desktop dither: `repeating-conic-gradient(color-mix(in srgb, #000 3%, transparent) 0 25%, transparent 0 50%)` at `background-size: 2px 2px` over the pink.
- Top-bar and footer cells: 1px black on three sides, flush to the viewport edge, 4px radius only on the inner corner; the text carries `text-shadow: 0 1px 0 #fff`.
- Forbidden: coloured glows, glassmorphism, grey Win95 chrome, shadows on buttons beyond the bevel.

## Shapes

- Radius: 6px windows, 4px panes/selects/transport groups, 3px buttons and photos, 2px chips and the LCD; the top-bar palm cell and dock tiles are square
- CDs and the live dot are circles; the turntable is a 150px circle of wavy grooves
- Close boxes are 9×9 pixel-stair crosses drawn on a 1px grid; every icon uses `shape-rendering: crispEdges` and 1px strokes
- The TV screen is a 592×456 rectangle with a 17px black status strip under it

## Components

- **Top bar.** Two cell strips pinned to the top corners, not a full-width bar. Left: a 32px black cell with a white palm, then 31px-tall cream cells in VT323 uppercase ("JOIN THE CABANA / LOG IN"). Right: date cell and a clock cell with a red clock glyph. Hover inverts a cell to black-on-cream.
- **Window.** Cream chrome, 30px title row: pixel close box left, optional black icon tile, and the app name **right-aligned** in condensed uppercase serif. Content lives in white inset panes 6px apart. Optional 18px status bar ("118 items").
- **TV player (hero).** A real photograph (pastel resort pool at sunset: peach sky, deep blue sea, teal pool, pink-striped parasol, white loungers) inlined as a small WebP data URI and `cover`-fitted, with a canvas of 1-bit static at 22% opacity over it, so it reads as a worn VHS tape. Never fake the scene with CSS gradients or SVG; a script "DS" tag in the corner, black filename strip with two tiny cream buttons and the resolution, a now-playing pane (bold pixel title + pinging red dot, artist line, hairline), a transport group (teal play, stop, next in one bordered bar), channel select with a LIVE chip and a volume ruler.
- **Mixtapes.** Three CDs (conic-gradient discs with a hub) above filename chips like `02-NoSkip.mp3`, then a deck: black LCD with a 2px chip-grey bezel and a line-art turntable.
- **Newsroom / Gazette.** Chip tabs (active is black), a huge serif masthead between 2px rules, uppercase caption, rows of 120px CSS photos (2px black frame) beside uppercase typewriter headlines and dates.
- **Event Calendar.** Butter-yellow window, 60px serif title, "Upcoming" centred between rules, events with bold typewriter titles and a double-framed date stamp.
- **Guestbook (testimonials).** A pane with a pink "Sign the guestbook" button, then a scrolling list of entries: bold name, tiny timestamp, one-line quote, dotted separators and a fake pixel scrollbar.
- **Member perks (pricing).** Three windows; the middle one has a sunset banner with a white serif word, a teal full-width button and sits 18px higher. Perks end with a pixel check and an italic status.
- **Alert (final CTA).** Classic dialog: pixel warning triangle, serif line, fine print, "Not yet" and a ringed default button.
- **Dock.** Fixed to the bottom edge, 80×70 cells divided by 1px black, 32px pixel icons (cocktail, envelope, CD, ID card, calendar, camera, sunscreen, book, monitor) over 11px labels.
- Inputs / selects: 24px cream bars with a 1px frame and the lip shadow, chip on the right, `▾`.

## Do's and Don'ts

- Do present every section as a window with a right-aligned condensed serif title and a pixel close box.
- Do keep all frames 1px solid black and all chrome cream `#f9f0e9` on the dithered pink.
- Do bevel every button with a white top-left and a darker bottom-right inset, and swap them on press.
- Do mix three voices: serif for headlines, typewriter for reading, pixel for UI labels, VT323 caps for the top bar.
- Do draw photos as flat CSS sunsets, pools and palms inside 2px black frames.
- Do pin the cell top bar and the icon dock to the viewport edges so the page reads as a desktop.
- Do let one element move: the TV static and the pinging on-air dot.

- Don't use rounded pill buttons, gradients on chrome or coloured shadows.
- Don't centre a window title; it sits on the right.
- Don't add full-width section bands; the desktop is the only background.
- Don't use a modern sans (Inter, Helvetica) anywhere.
- Don't put more than one teal button in a window.
- Don't hardcode colours outside `:root`; derive tints with `color-mix()`.
- Don't slide, fade or parallax windows in on scroll.

## Motion

- Duration 150ms, easing `cubic-bezier(.4, 0, .2, 1)`
- What animates: background tint on button/dock/cell hover, FAQ caret rotation, the on-air dot ping (`scale(2.2)` fade, 1.2s loop) and the TV static redrawn every 90ms
- What never animates: windows, layout, the dither, section entrances
- Signature move: pressing a button swaps its bevel instantly (no transition) like a 1-bit OS
- All of it lives inside `@media (prefers-reduced-motion: no-preference)`; the static draws one frame without it

## Tweaks

Five knobs. `--dither` (0–16%) is the ink strength of the 2px desktop checker; `--static` (0–100%) is the TV noise opacity over the sunset behind it; `--depth` (0–60%) is the strength of the window drop shadow; `--bevel-w` (0–3px) thickens every button bevel; `--window-radius` (0–14px) rounds the window chrome. Schemes: Lido, Sunscreen, Night Swim, Country Club, each setting all nineteen colour literals.

## Reference CSS

```css
:root{
--bg:#f6d5d5;
--bg-2:#f9f0e9;
--fg:#000000;
--fg-muted:#5f5550;
--accent:#afe5dd;
--accent-fg:#000000;
--border:#000000;
--paper:#ffffff;
--tertiary:#faf5c6;
--button:#f6d6d5;
--button-shadow:#7b6b6b;
--accent-shadow:#58736f;
--bevel-dark:#9b9b9b;
--chip:#e3dcd6;
--on-air:#ef4444;
--sky:#f3a37c;
--sea:#2f7fa8;
--sand:#f0cf9a;
--leaf:#3f7d4e;
--desk-fg:#000000;
--font-display:"Instrument Serif", "ITC Garamond", Georgia, serif;
--font-body:"Pixelify Sans", "Everyday", system-ui, sans-serif;
--font-mono:"VT323", "Pixolde", ui-monospace, monospace;
--font-type:"Courier Prime", "Pixelated Times New Roman", "Courier New", monospace;
--radius:4px;
--radius-lg:6px;
--space-1:4px;
--space-2:6px;
--space-3:10px;
--space-4:16px;
--space-5:24px;
--space-6:40px;
--space-7:64px;
--space-8:96px;
--shadow:0 50px 80px -50px color-mix(in srgb,var(--fg) var(--depth),transparent);
--bevel:inset calc(var(--bevel-w) * -1) calc(var(--bevel-w) * -1) 0 var(--bevel-dark),inset var(--bevel-w) var(--bevel-w) 0 var(--paper),0 0 0 1px var(--border);
--bevel-in:inset var(--bevel-w) var(--bevel-w) 0 var(--bevel-dark),inset calc(var(--bevel-w) * -1) calc(var(--bevel-w) * -1) 0 var(--paper),0 0 0 1px var(--border);
--lip:0 1px 0 var(--border),inset 0 1px 0 var(--paper);
--ease:cubic-bezier(.4,0,.2,1);
--dur:150ms;
--max-width:1180px;
--section:96px;
--dither:3%;
--depth:34%;
--bevel-w:1px;
--static:22%;
--window-radius:6px;
}
.flavor{min-height:100vh;overflow-x:hidden;padding-bottom:110px;background-color:var(--bg);background-image:repeating-conic-gradient(color-mix(in srgb,var(--fg) var(--dither),transparent) 0 25%,transparent 0 50%);background-size:2px 2px}
.win{position:relative;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--window-radius);box-shadow:var(--shadow);padding:0 6px 6px}
.tb h2,.tb .t{margin-left:auto;font:400 21px/1 var(--font-display);text-transform:uppercase;letter-spacing:-.6px;transform:scaleX(.86);transform-origin:right center;-webkit-text-stroke:.5px var(--fg)}
.pane{background:var(--paper);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--lip)}
.bv{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:5px 14px 4px;border-radius:3px;background:var(--bg-2);box-shadow:var(--bevel);font:600 13px/1.1 var(--font-type);letter-spacing:-.2px;white-space:nowrap}
.bv:active{box-shadow:var(--bevel-in)}
.bv.tl{background:var(--accent);color:var(--accent-fg);box-shadow:inset -1px -1px 0 var(--accent-shadow),inset 1px 1px 0 var(--paper),0 0 0 1px var(--border)}
```

## Reference markup

```html
<div class="win">
  <div class="tb">
    <button class="x" aria-label="Close"><svg><use href="#x" /></svg></button>
    <h2>Mixtapes</h2>
  </div>
  <div class="pane mix">
    <div class="disc">
      <span class="cd" style="--c1: var(--sea); --c2: var(--sky)"></span>
      <h3 class="chip">01-LobbyHours.mp3</h3>
      <p>Channels change with the sun.</p>
    </div>
  </div>
  <div class="stat"><span>3 items</span><span>☼</span></div>
</div>
<a class="bv pk" href="#">Become a member</a>
<a class="bv tl" href="#">Tune in free</a>
```

## How to apply this flavor

1. Replace the target page's design tokens with the palette, fonts and spacing above, and give the page body the dithered pink desktop.
2. Wrap each section in a `.win` with a right-aligned title; put content in white `.pane`s.
3. Add the cell top bar and the icon dock; restyle every button with the bevel.
4. Apply the motion rules; remove any animation not described here.
5. Check the Don't list before finishing.

## Full source

```html
<!doctype html>
<!-- Droolsuite: a 1987 leisure desktop on dithered pink, cream windows with 1px ink frames, bevelled buttons and a TV full of static. -->
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Droolsuite — the leisure desktop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Pixelify+Sans:wght@400;600&family=VT323&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
<!-- prettier-ignore -->
<style>:root{
--bg:#f6d5d5;
--bg-2:#f9f0e9;
--fg:#000000;
--fg-muted:#5f5550;
--accent:#afe5dd;
--accent-fg:#000000;
--border:#000000;
--paper:#ffffff;
--tertiary:#faf5c6;
--button:#f6d6d5;
--button-shadow:#7b6b6b;
--accent-shadow:#58736f;
--bevel-dark:#9b9b9b;
--chip:#e3dcd6;
--on-air:#ef4444;
--sky:#f3a37c;
--sea:#2f7fa8;
--sand:#f0cf9a;
--leaf:#3f7d4e;
--desk-fg:#000000;
--font-display:"Instrument Serif", "ITC Garamond", Georgia, serif;
--font-body:"Pixelify Sans", "Everyday", system-ui, sans-serif;
--font-mono:"VT323", "Pixolde", ui-monospace, monospace;
--font-type:"Courier Prime", "Pixelated Times New Roman", "Courier New", monospace;
--radius:4px;
--radius-lg:6px;
--space-1:4px;
--space-2:6px;
--space-3:10px;
--space-4:16px;
--space-5:24px;
--space-6:40px;
--space-7:64px;
--space-8:96px;
--shadow:0 50px 80px -50px color-mix(in srgb,var(--fg) var(--depth),transparent);
--bevel:inset calc(var(--bevel-w) * -1) calc(var(--bevel-w) * -1) 0 var(--bevel-dark),inset var(--bevel-w) var(--bevel-w) 0 var(--paper),0 0 0 1px var(--border);
--bevel-in:inset var(--bevel-w) var(--bevel-w) 0 var(--bevel-dark),inset calc(var(--bevel-w) * -1) calc(var(--bevel-w) * -1) 0 var(--paper),0 0 0 1px var(--border);
--lip:0 1px 0 var(--border),inset 0 1px 0 var(--paper);
--ease:cubic-bezier(.4,0,.2,1);
--dur:150ms;
--max-width:1180px;
--section:96px;
--dither:3%;
--depth:34%;
--bevel-w:1px;
--static:22%;
--window-radius:6px;
}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;color:var(--fg);font:400 13px/1.35 var(--font-body);-webkit-font-smoothing:none}
a{color:inherit;text-decoration:none}
h1,h2,h3,p,dl,dd,ol,ul{margin:0;padding:0}
li{list-style:none}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
.flavor{min-height:100vh;overflow-x:hidden;padding-bottom:110px;background-color:var(--bg);background-image:repeating-conic-gradient(color-mix(in srgb,var(--fg) var(--dither),transparent) 0 25%,transparent 0 50%);background-size:2px 2px}
.wrap{max-width:var(--max-width);margin:0 auto;padding:0 20px}
/* top bar */
.bar{position:sticky;top:0;z-index:40;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}
.cells{display:flex;pointer-events:auto;background:var(--bg-2);border:1px solid var(--border);border-top:0}
.cells.l{border-left:0;border-radius:0 0 var(--radius) 0}
.cells.r{border-right:0;border-radius:0 0 0 var(--radius)}
.cell{display:flex;align-items:center;gap:6px;height:31px;padding:1px 10px 0;font:400 17px/1 var(--font-mono);text-transform:uppercase;letter-spacing:.5px;text-shadow:0 1px 0 var(--paper);border-left:1px solid var(--border);white-space:nowrap}
.cell:first-child{border-left:0}
.cells a.cell:hover{background:var(--fg);color:var(--bg-2);text-shadow:none}
.palm{width:32px;padding:0;justify-content:center;background:var(--fg);color:var(--bg-2)}
.palm svg{width:18px;height:18px}
.clock svg{width:15px;height:15px}
/* windows */
.win{position:relative;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--window-radius);box-shadow:var(--shadow);padding:0 6px 6px}
.tb{display:flex;align-items:center;gap:8px;height:30px;padding:0 2px}
.tb .x{width:14px;height:14px;display:grid;place-items:center}
.tb .x svg{width:9px;height:9px}
.tb .ic{width:18px;height:18px;border-radius:2px;background:var(--fg);display:grid;place-items:center;color:var(--bg-2)}
.tb .ic svg{width:12px;height:12px}
.tb h2,.tb .t{margin-left:auto;font:400 21px/1 var(--font-display);text-transform:uppercase;letter-spacing:-.6px;transform:scaleX(.86);transform-origin:right center;-webkit-text-stroke:.5px var(--fg)}
.pane{background:var(--paper);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--lip)}
.stat{display:flex;justify-content:space-between;align-items:center;height:18px;padding:0 3px;font-size:11px;color:var(--fg-muted)}
/* buttons */
.bv{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:5px 14px 4px;border-radius:3px;background:var(--bg-2);box-shadow:var(--bevel);font:600 13px/1.1 var(--font-type);letter-spacing:-.2px;white-space:nowrap}
.bv:hover{background:color-mix(in srgb,var(--bg-2) 88%,var(--fg))}
.bv:active{box-shadow:var(--bevel-in)}
.bv.pk{background:var(--button);box-shadow:inset -1px -1px 0 var(--button-shadow),inset 1px 1px 0 var(--paper),0 0 0 1px var(--border)}
.bv.pk:hover{background:color-mix(in srgb,var(--button) 86%,var(--button-shadow))}
.bv.tl{background:var(--accent);color:var(--accent-fg);box-shadow:inset -1px -1px 0 var(--accent-shadow),inset 1px 1px 0 var(--paper),0 0 0 1px var(--border)}
.bv.tl:hover{background:color-mix(in srgb,var(--accent) 86%,var(--accent-shadow))}
.bv.wide{width:100%}
.bv svg{width:11px;height:11px}
/* hero */
.hero{position:relative;height:calc(100vh - 32px);min-height:760px;max-height:900px}
.player{position:absolute;left:50%;top:70px;width:606px;margin-left:-250px;z-index:2}
.welcome{position:absolute;left:50%;top:150px;width:392px;margin-left:-600px;z-index:3;background:var(--tertiary)}
.welcome .in{padding:18px 24px 24px}
.welcome h1{font:400 64px/.9 var(--font-display);letter-spacing:-2px;max-width:7ch}
.welcome .cal{position:absolute;right:26px;top:48px;width:50px}
.eyebrow{display:block;margin-bottom:14px;font:400 17px/1 var(--font-mono);text-transform:uppercase;letter-spacing:.5px}
.sub{margin-top:16px;font:400 13px/1.45 var(--font-type)}
.sub b{font-weight:700}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.proof{display:flex;align-items:center;gap:8px;margin-top:18px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--fg) 25%,transparent);font:400 12px/1.3 var(--font-body);color:var(--fg-muted)}
.dotlive{position:relative;width:7px;height:7px;flex:none;border-radius:50%;background:var(--on-air)}
.screen{position:relative;height:456px;border:1px solid var(--border);border-radius:var(--radius) var(--radius) 0 0;overflow:hidden;background:var(--sky) url(data:image/webp;base64,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) center/cover}
.screen canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;opacity:var(--static)}
.screen .tag{position:absolute;left:14px;top:12px;z-index:1;font:italic 400 34px/1 var(--font-display);color:var(--on-air);transform:rotate(-14deg);text-shadow:1px 1px 0 var(--paper)}
.vbar{display:flex;align-items:center;height:17px;background:var(--fg);color:var(--bg-2);font:400 11px/1 var(--font-body);border:1px solid var(--border);border-top:0}
.vbar i{display:grid;place-items:center;width:17px;height:15px;margin-left:1px;background:var(--bg-2);color:var(--fg);font-style:normal;font-size:8px}
.vbar span{flex:1;padding-left:6px}
.vbar em{font-style:normal;padding-right:6px}
.now{margin-top:6px;padding:10px 10px 0}
.now h3{display:flex;align-items:center;gap:8px;font:600 13px/1 var(--font-body)}
.now p{margin-top:6px;font-size:12px;padding-bottom:9px;border-bottom:1px solid color-mix(in srgb,var(--fg) 20%,transparent)}
.ctl{display:grid;grid-template-columns:1fr 232px;gap:6px;margin-top:-1px}
.ctl .pane{border-radius:0 0 var(--radius) var(--radius);border-top:0;padding:14px 10px 8px;font:600 13px/1 var(--font-body)}
.trans{display:flex;margin-top:6px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--lip);align-self:start}
.trans button{flex:1;height:32px;display:grid;place-items:center;background:var(--bg-2);border-left:1px solid var(--border)}
.trans button:first-child{border:0;flex:1.6;background:var(--accent)}
.trans button:hover{background:color-mix(in srgb,var(--bg-2) 85%,var(--fg))}
.trans svg{width:11px;height:11px}
.chan{display:grid;grid-template-columns:1fr 1fr 70px;gap:6px;margin-top:6px}
.sel{display:flex;align-items:center;gap:6px;height:24px;padding:0 6px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--lip);font-size:11px}
.sel .chip{margin-left:auto}
.chip{display:inline-block;padding:1px 4px;border-radius:2px;background:var(--chip);font:400 10px/1.2 var(--font-body)}
.vol{height:24px;background:repeating-linear-gradient(90deg,var(--fg) 0 1px,transparent 1px 3px);opacity:.3;border-radius:2px}
/* dock */
.dock{position:fixed;left:50%;bottom:0;z-index:50;transform:translateX(-50%);display:flex;background:var(--bg-2);border:1px solid var(--border);border-bottom:0;border-radius:var(--radius) var(--radius) 0 0}
.dock a{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;width:80px;height:70px;padding:0 0 6px;border-left:1px solid var(--border);font-size:11px}
.dock a:first-child{border-left:0}
.dock a:hover{background:color-mix(in srgb,var(--bg-2) 88%,var(--fg))}
.dock svg{width:32px;height:32px;shape-rendering:crispEdges}
/* sections */
.sec{padding-top:var(--section)}
.two{display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:start}
.lead{font:400 44px/.95 var(--font-display);letter-spacing:-1px}
.lead em{font-style:italic}
.body{margin-top:12px;font:400 13px/1.5 var(--font-type);max-width:52ch}
.sec>.eyebrow,.sec>.lead,.two>div:not(.win){color:var(--desk-fg)}
/* stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.stats .pane{padding:12px 12px 10px}
.stats b{display:block;font:400 46px/1 var(--font-display);letter-spacing:-1.5px}
.stats span{display:block;margin-top:6px;font:400 12px/1.25 var(--font-body);color:var(--fg-muted)}
/* mixtapes */
.mix{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:18px 14px}
.disc{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px}
.cd{width:46px;height:46px;border-radius:50%;background:radial-gradient(circle,var(--paper) 0 3px,var(--fg) 3px 4px,var(--chip) 4px 8px,transparent 8px),conic-gradient(from 40deg,var(--c1),var(--sand),var(--c2),var(--paper),var(--c1));border:1px solid var(--fg);box-shadow:2px 2px 0 color-mix(in srgb,var(--fg) 20%,transparent)}
.disc .chip{padding:3px 6px;font:700 12px/1.15 var(--font-type);max-width:130px}
.disc p{font:400 12px/1.4 var(--font-type);color:var(--fg-muted);max-width:28ch}
.deck{display:grid;grid-template-columns:1fr 150px;gap:10px;margin-top:6px;padding:6px;align-items:center}
.lcd{height:132px;padding:10px;background:var(--fg);color:var(--bg-2);border-radius:2px;box-shadow:0 0 0 2px var(--chip),0 0 0 3px var(--fg);font:600 12px/1.35 var(--font-body);display:flex;flex-direction:column}
.lcd hr{border:0;border-top:1px solid color-mix(in srgb,var(--bg-2) 30%,transparent);margin:6px 0 auto;width:100%}
.lcd small{font-weight:400;font-size:10px}
.rec svg{display:block;width:100%}
/* newsroom */
.tabs{display:flex;flex-wrap:wrap;gap:8px;padding:22px 24px 0}
.tabs a{padding:3px 6px;font:700 12px/1.2 var(--font-type);background:var(--chip)}
.tabs a.on{background:var(--fg);color:var(--bg-2)}
.mast{margin:18px 24px 0;padding:4px 0 2px;border-top:2px solid var(--fg);border-bottom:2px solid var(--fg);font:400 84px/.9 var(--font-display);letter-spacing:-3px;text-transform:uppercase;display:flex;justify-content:space-between}
.mast+small{display:block;margin:6px 24px 0;font:400 11px/1 var(--font-body);text-transform:uppercase}
.posts{padding:14px 24px 20px}
.post{display:grid;grid-template-columns:120px 1fr;gap:20px;align-items:center;padding:10px 0}
.photo{height:94px;border:2px solid var(--fg);border-radius:3px;background:var(--sky);background-size:cover;background-position:center;object-fit:cover}
.photo.a{background-image:url(data:image/webp;base64,UklGRkoDAABXRUJQVlA4ID4DAAAwGwCdASoEAZEAPrVaqE8nJSimo3OYyRAWiWdu3Vxm4AmDiX/GCeDVf4IjLC9wXsa2gjjGUuIZUk6sX0ECrFiPfm0xK3deLnXADZhKlYsY/ur4QEUFPezDgL/KaUqDctpx6qn99Mfmm3f/KSM87/QBP5m3zpftdhd2FJ5Yjv+9hPlCwPy+AVPHibJNORSbALqvVy8BOfVT00GFznRij4R/ivXu8ryxglCWSQodR7LAk1lA4K6NP+6Ok5yg2OcOP38Cky9qUaXVY+cVf//MNh4nosOolmT6+8y586v8GZAxS1lwAP7wzf/zbyNvo59Wk0kl+DVNSO0QEdOjECylAK49K/wJqmsxzPMWIPlVkgG1eRD8MvGe004hMWR8Cm9KpgbSA6oR8duNLOW0RHW/SxZcI3EfdxcW7Ei3F71S1nGIhcPmFaa/aeGYHEqWKFfyBW0O32uUJ6TMFnSqD4DfFxSQOqBcJt6/LglTm9A4LHOuFo04T5gmWCxwfoIEL3gPwLniOg7FQs6PxrgYtGUZxqY2vLvVZ07l9TOmSOaEBEbnDSupo2tNVvAZKA5Zo/oG40J8tCqABWNP4E2GfYSxlFdEqZcZkW0NnhC4rCBrZuJ6EQsKEVe06gYsQY0Bq25YpwD8B6Nl/UMY6NK2tTd/u1kIFhcwRxmSdClb9jGEmIaN7sUQ/IsVN8SYgdaEk442A6rOJbJPCAh+Z9FhLKhIESZwb6DS3PSUbTDEFx02R830NQ97HCc0ObWXRZPKWG+f/hcJbAsv+Jb6a4Xn96JYbfuPHa+4hS54AuyVrxzfiPLF+cE4ycCaX1t+pKZ4Na5QJTtyMsKKC3z2PE9ePZlhSr7MPiKjJnDvuKjf5/3wJ1ZKoaOlSSXcU+KXYpCzDwH/V8qKCgB7qIbu1gTdNGuQ7F4QLdy56UeOFdiKOYWvhiEy1t1MNrkyGZ0CESr5uNfhmtOlc5xVMaGItp1Kt/yjRJYJjKjPFwo62NcVRC9brPqqqmxXnh43b0+jXOKgG7zpNNusWDGf8GuP1baYqsltiJ1WgpKc5VaBo42s9pliwbPfWMeGuBmL2gMqpi96IpdmU8vFQAgL++A/ywCTIWgAAA==)}
.photo.b{background-image:url(data:image/webp;base64,UklGRhACAABXRUJQVlA4IAQCAABQGACdASoEAZEAPrVYpk2nJSOiKDd4gOAWiWdu3V5XKoAsit8c4atWeSPkK1pW4atWd6+lk51/An1+19UU0rVP2py9zBn3qhTAzJpDBh+bYjmT/a3LyysxmZSzC0QW6DYcrKglAyeS5I4o+7dFKCLbpEYAHxOf3j03v6Ybm9JGZcRFb0eGzg+qTxmwLOTChsWBjACatkI9jaCGf9d7jiS2KqlSaDN5vzeZc2IAHb1Ai8tyhVbUM+EfGa75basCTE2F4atWeS3ibi/HwAD+8gD9aRCD2yd4ilAAAdm2PcAAAAvPoWzDgtX185wXn2Pzo+XNM21iJx7D5T9aAW59w756ti+R1oKCKzYQhVB8wSJ5thEWqlYloOMiWN3hSEyO6PuL6uQttD3TM92Ek5cijOFyRO/YV7xVdd+o/OgcPCnSdtF0mXM/s08k9yVSx3Qw/o/Akqk5HNDraEYa/AONHoCmzm/Zs7GYNWIqfNxDRIO3xuuOdvMN8oJS3K58iXB63tONCDhxIiOMaO7T3MQPrMvhRiJiasvCwZ+Yr+mC8bXteI2GY6ZiOaSlhmw+mmAdzwhaWgFUcpY8O5gd76LQqie7TeIACGbKnCIM0ry73YKvlWT8SAexBxSk/poW+W6TDmUMstLT4+HAxQRUXLQ0JtmYmHV/igQ5siAAAAAXnQbNFuIAAAA=)}
.photo.c{background-image:url(data:image/webp;base64,UklGRvwBAABXRUJQVlA4IPABAACQFgCdASoEAZEAPrVaqE8nJSQiIxUIsOAWiWdu4WsAqLYPmFfcAssQ6YI8iSmk8UsO9x1jvOxmjdjGcnNYtaxRgflkPlWd8V/X2Mq/YpqHCRtVpfM+ewt4k4dnBfjE/kIvKGekMmd3Tau2EikLmYBZsU9Z6McZUbhennNhqeATKcXXwypDUgafIodezVreJUojzfSsvz8tJ8jpjC0z99InDadl4FqibquZwVTKdPeJYk/qCbSe8KN9UGU/aogA/vo39fLLw3QT/VktQnXDj7l6OxmIIEcpXSrbPernd8NfgAAy21SzPr1I3Svy+qW91PCRcOy/uo0GRNH0dIDpsxiJeub6DVWALeO/lleyD7KlZj+sl05O3KoOUxXcKC61B7c0tvGg5oMFemhFW7MHv1oenIXnyPTpoSx1Bo73GDAG/l+dpnxyf3CtToiwjaLruqptSJR9BNj6OfNpEzcKuZ6k1Qi+yYjOttXPRIPQgD0IA84rDlwC18Um2SMRn3P7/HPDt/pJ/zN/jN/jN4soqIMqrko7nzJor4+RIqdKMtkUNkyB13zRdCEimKMIPY08XMS++tRsyhZAKsmPiAHPNo7SootgTxRPBZzdEt6UV/CdgRrvDt7FPiV4LRowTcaVzlaaqFOmmkF1snz1RuA2OSAA)}
.post h3{font:400 19px/1.15 var(--font-type);text-transform:uppercase;letter-spacing:-.3px}
.post time{display:block;margin-top:6px;font:400 12px/1 var(--font-type)}
/* events */
.events{background:var(--tertiary)}
.events .in{padding:14px 24px 22px}
.events h2{font:400 60px/.88 var(--font-display);letter-spacing:-2px}
.rule{display:flex;align-items:center;gap:10px;margin:18px 0 6px;font:400 12px/1 var(--font-type)}
.rule:before,.rule:after{content:"";flex:1;border-top:1px solid color-mix(in srgb,var(--fg) 30%,transparent)}
.ev{display:grid;grid-template-columns:1fr 40px;gap:14px;padding:12px 0}
.ev h3{font:700 13px/1.2 var(--font-type)}
.ev p{margin-top:4px;font:400 12px/1.35 var(--font-type)}
.stamp{padding:2px 3px;border:1px solid var(--fg);box-shadow:inset 0 0 0 1px var(--tertiary),inset 0 0 0 2px var(--fg);font:400 11px/1 var(--font-body);text-align:left;height:30px}
/* guestbook */
.gb-top{padding:30px 16px;text-align:center;font:400 12px/1.4 var(--font-type)}
.gb-top .bv{margin-top:12px}
.entries{margin-top:6px;padding:4px 30px 8px 12px;position:relative}
.entry{padding:10px 0;border-bottom:1px dotted color-mix(in srgb,var(--fg) 25%,transparent)}
.entry:last-child{border:0}
.entry b{font:700 13px/1 var(--font-type)}
.entry time{margin-left:8px;font:400 10px/1 var(--font-body);color:var(--fg-muted)}
.entry blockquote{margin:6px 0 0;font:400 12px/1.4 var(--font-type)}
.scroll{position:absolute;right:4px;top:6px;bottom:6px;width:10px;border-left:1px dotted var(--fg)}
.scroll:after{content:"";position:absolute;left:1px;top:14px;width:9px;height:40px;background:var(--tertiary);border:1px solid var(--fg);border-radius:2px}
/* pricing */
.tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;align-items:start}
.tier .pane{padding:14px 14px 12px}
.tier h3{font:700 13px/1.2 var(--font-type)}
.price{display:flex;align-items:baseline;gap:6px;margin:10px 0 6px}
.price b{font:400 56px/1 var(--font-display);letter-spacing:-2px}
.price span{font:400 12px/1 var(--font-type)}
.tier p{font:400 12px/1.4 var(--font-type);min-height:50px}
.perk{display:flex;align-items:center;gap:6px;margin-top:8px;font:italic 400 12px/1 var(--font-type)}
.perk svg{width:10px;height:10px}
.tier .bv{margin-top:6px}
.banner{position:relative;height:96px;margin-bottom:6px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--sky) url(data:image/webp;base64,UklGRr4LAABXRUJQVlA4ILILAADwhwCdASrQApIBPsFgrFCnqiknIjVoyUAYCWdu+CKHPq3rlAGSnk0ixWRkYefH3O9A9NW4P/o15SU8zQzficoYChXDPyfk/J+kiqFDNk/J+T8n5PyqVsnpIn5PysSJ5gC6Vzbp+UgiVBUcVltRsnVwz8n5QFYq4k67VTjk/J2PN2tslSqxiZGbWuXEnrGAtMBY2M4nnqksluddu6Yuo2sce6Zc8n55cQg6zk9qAcUxZWKP8cqeMm4Ze7d0xdJ1xWQw84Z+UxdKNB0dI5n55PyflAMSdedh1enqnVw+XENA0iE9gKNfLiCo7Pzc9cud3Xan44cWePzPDL8Ueuk64dVw+XEpp+UBWQ7fXEvUCeUA4nMp+uHVmy9QCKYuk67P1aL2eeJB4In5Yqde7nDquHy4gqOHbeObyh57qgqOSqpm4Ze6Trh1XDQDO8ZUcOrFvdXITmX0N5Pyfk/J+eYj3sTymLpOu1Nh1sovVxQEnXDr79tbFvdGfk/KYuk68/i8w2QuEH3DL3V4PNPyiJZ+0nXDvKjqVCDmUr+uTz/MvwQVIPT7oXuliP12QQvdMueeXGowEByDdagGN3MOM6D86K5l9LG17drWRmsrGpDFuB72iGKJgGGh91cbNtCAP1iMGVLRWt9qyH/l5Gxj3hVvM6DYso0CaDG0fB10Jl0utHC/Juunrct89KOQV4SANiveBrDJv789iRfNaehSXSIuxvrBaUwp5G8ACc5eMqSNFfMWMQN42Kq1PcGaPHTiBphRKWtmDci7cQda6rxREprx3j7JfOk6epwMOMJS+CXjw3PwaIJnqcblgdtBaTqhji4ZtJWUgGmkuDMYU9UeiBvFiQYuKWyuRzYnRp2k1JOI2xHFRK5t4HAs6oEcU+H8rR4r00n5ctcjH++cyA1KOpPfZndI/Udn5uFDqbGPUQlUJtsqZLJjm+w5/bZxFy5sPTOYmkdy3kBMRn9/JvIQvdNXtfWg55FGdwdPw6RoVBmuwO5W1WfuVgNBmQE8y55PxVaw9B4MbrGM5NI+7KTo20nHMJSI888guWrXQYNUb1XEdykG7ktrR1DG0sbBgZgLHK763GSyGMtSrgaOQ5e7DN4Ze53A/U/LsbQ/EvEoaDkAHetvvl/bWcoC6scjaHQOtWJ2hVRHXVNO4frzGdeYzrzGdd6wmT8CJfcIutIcY+5rXzfY3Xsbr2N13Cj7gaRK8y6qWFUjttQhmKmxzP6ATnwCS+r1eUtcWjBSqIe5Q65c/MNSSP61ZVtZcP4V0F1Dme4HTYCl8QnlXnTHDquInm4T4ntQ8jNv2LrBcaSHpdNStsk2hrP9lT9Fc2/w3FqVoeHiwgboxs/HfcgMsod81DTfSJ2/iRL3SdcOq4Z+T8n5PfBnKxc6U4Ljt+uFohD3lLi6TvGZta4Z+T8n5Pyfk/J+T8oHrpsotvqz8x6xJ1w+HtcM/J+T8n5PyZYAAP7yej/r1h3Suj/xdzZ0VTcLUB/X+WZf4PJ4sPJEb0J9L9+TOR9bBGbdmRAXYp0/mjX7t/G4VY+7nQI8qmC7EfBvD+tX0VElxuddfT84pksVW6tV2U2ZZIzBfAh895XDki9pQHT6gzECmhBvizTvF8KviuE3tzb4Hsst5O12F0HZnGmboAi0WnT9ALU1Z3BNmlsNLeLsy3EuKPaBcD1T0YHsdk4fq+4ZkdUUNhkGIPgGGejjAdwK1wuuGKIeMTI3SmV7WPKYMIJd46t3gG42c7JlSrXD/CjDSTLYR6Doa+NBdn4lIQbnQhxOKNLOQNuJkQgrI3lKfL0QeR9b/ZlLCvjVJP50LMoRQpd8/hthvr3Yw4khCM7AAr5YbPK0sMxa3L+noBYBtbv9mrxpUlpxAOkAOIALHzXsN7EkyAYmcI+w88zPcXbULvuj9SqxMGTbHdWJwZiZNrDYvq+sPBwHPtjaOKwadw5Z4i0Hx5kX1MdDueMDrUOWEZax3WfjzCe9zylTGCRj5EF+fUlsYkJlGBMfMAo1GlaVSVgZqKITocVO8f5jrBIpxMf6n5Sw4P2+BBaDMliLcoMPDoLACrvi4Vq+t2lq+pgQIJWt6S853JSYMlQaiEKC2rfVRoim+4jI2JhS3sGiRxeLnIJrXzdqnrPWZc4lMVarw4DiVqTuYlS+R4Kd3nff6WpW8H3g4KNWOM5kVUogUkIT+Y6APyclvxi4U4tAyVvewclxV57uVCcvSALKosuMU2xXur+/0eJhE0OQ+MMFRRzdvonFbLRepggGpkCF3Os3UmDxx/mP9wZw1wwsOD4ENo5exk7m8EKBHSXH2s1fGDP/SDhbyEMBf6holhJYd1VzcaI/ctXcfozA9mCpq9fL2EDC/pKSmfoO4H2NkKZ/XeavGiC+53tfgoKsH3rLInbz4NRii0HUPaCMgTjwtWknJNhXYZPDGdPvzMSUIk3A/ZgofQxIQgTZbstqAKElejLQ2RNmjLSLLRzeO8T9c+5U/f7XXeYrbhaTQrpf3ZR5+DlpBB5IcrcFHFl/kSgLGmiK5Rgc2Y6i+r6DzGTp2pSYegodjS2qm70qCthOUkHxkHAu92U4n8eXAbwVYxJNakCUgZfOq6DVdBUos9W2fWIz3CVdtP3bI0XRb86dMwMgZOVYnYHgxFhoFqJYdxFKsN4WzNABgi6nfEaaaAArTmoN9R4zs9G0tK5nCKXrCjfe2F2LUpRuhW31XTP2mdUWvUluc0LbnfD8h2lyWUQWSpDo7FaYx3/DgcaCV6rORuacuta9YbwtxyKT2ey5yEAp6TK1x4VTib7sQjC1h9z+aYcNoiCSbZy2JWOmhZ/WLCU22YyBQbWe8bbKKrgGyNyoFJZHNiZKAqzYWWD9+VZBZ51Ky0ViLBJ+tfZU0RdlEqPwZchZPLdVjT41IsMtdvjy3sRwc/fYUUT8qDmTkf21uKjyHGaJVoOb9/7NNfnDWAbsqyNzZ5Dl+nhPJXq6gz5yKOYzrVyfVxXHfJO/7g1tQEPLdCdzwxoNm8dhdiC6tdfgxlOPMensZSxpLBszN9QG6dMjjBvOKnUya1NYgTkgMkq78pbD4A4/E8LX9mCZR/FGOSNanu34M0ydeRmRLExuUbFqcpXJuH0aUXuy/JwFdKkDF1SjrU4Di1nxsOdSqTCWreel23k0RU/R8CbCeNBwvLmKUKtkVHiu2u83JxHiCANxL69YEaBm45NuQIWYzXabDaYoPIOOJfMLVtJBP+QdSz/Hp+iVKAzaQJ2UA7c5rTdR+dwoP3k4pMf1rvnuSAAprTtoIAGs+a4U0K7zRbcr4XvYgFF6Sx+7jWWZCXZiG/d97XBRObFdhNCBOygap2uuPG0obgtvOedZgsvsknZpbCOqNoZ0TDkYYh2fQUK7Wo3Pb2WJ0tol76NX9cCosIEDuimCgmC3X2Qua2lr5YG3hdrMkqfUN9pZXoSBYKL3FHOZ+a87TT6zl+0uTQD6CHMNbkLuWEO4SIhn84eHpMTEkQ1dAh3ijdFIMCLPyjPvhi/l4ykqpQnpfVpPpgYQnYfI/A80GEfDetWyLF8UFYMKpjAHeBSoau32QNYsrOiaFeUHDvwg36tmOQVh7qi63CdjV+dmw7STI5aYDdQp1CeozIJddb1a5sTcfi3RhXeKbMGNVGZieUahtj3NkSjDwtIAlkEBqCIzsw2ehWxeKER+dO3m20qhTC2lYgdeLm2ZGweKLW+Voaj9X2Mo1ZsHxmlDSmLNoLkQuDT5EEQN7jgz/FIeaKjZgTOEiVjnkLzSirZizs5sS+ihE8xX6fWq+kTKWx/aCAWn8Q5zDRTLQAAAAARF7wM7hxO/oquDpp8KcaW6qa765fFuI29NnNSnYtn8niFnSe49IIP5V1Na8U5dsQviY+xWHYVKxvWf9DIbRCTXpZFGgxtM7Pl2b80ooHbnePNaJaG2I5vu5LbzToAAAAaTLJlEHV0rektcTW3WQFuVAEDsMn3js9Hib/8IAAAClnH7wxl9Dnz8WQLFnMAAAAAAAAA=) center/cover}
.banner b{position:absolute;left:0;right:0;bottom:12px;text-align:center;font:400 50px/1 var(--font-display);letter-spacing:-1.5px;color:var(--paper);text-shadow:0 1px 0 color-mix(in srgb,var(--fg) 30%,transparent)}
.hot{margin-top:-18px}
/* faq */
.faq .pane{padding:4px 14px}
details{border-bottom:1px solid color-mix(in srgb,var(--fg) 18%,transparent)}
details:last-child{border:0}
summary{display:flex;justify-content:space-between;gap:12px;padding:12px 0;cursor:pointer;list-style:none;font:700 13px/1.25 var(--font-type)}
summary::-webkit-details-marker{display:none}
summary:after{content:"›";font:400 18px/1 var(--font-body);transition:transform var(--dur) var(--ease)}
details[open] summary:after{transform:rotate(90deg)}
details p{padding:0 0 14px;font:400 12px/1.45 var(--font-type);max-width:62ch}
/* alert */
.alert{max-width:520px;margin:0 auto}
.alert .in{display:grid;grid-template-columns:52px 1fr;gap:18px;padding:18px 18px 16px}
.alert h2{font:400 40px/.95 var(--font-display);letter-spacing:-1px}
.alert small{display:block;margin-top:10px;font:400 11px/1.4 var(--font-body);color:var(--fg-muted)}
.alert .btns{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
.alert .ok{box-shadow:var(--bevel),0 0 0 3px var(--bg-2),0 0 0 4px var(--border)}
/* footer */
footer{margin-top:var(--section);display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap}
footer .cells{border-bottom:0;border-top:1px solid var(--border)}
footer .cells.l{border-radius:0 var(--radius) 0 0}
footer .cells.r{border-radius:var(--radius) 0 0 0}
footer .cell{font-size:15px}
@media (prefers-reduced-motion:no-preference){
.bv,.dock a,.trans button,.cells a.cell{transition:background var(--dur) var(--ease),color var(--dur) var(--ease)}
.dotlive:after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--on-air);animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite}
@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}
}
@media (max-width:1100px){
.hero{height:auto;max-height:none;min-height:0;padding-top:40px;display:flex;flex-direction:column-reverse;gap:24px;align-items:center}
.player,.welcome{position:relative;left:auto;top:auto;margin:0;width:min(606px,100%)}
}
@media (max-width:860px){
.two,.tiers{grid-template-columns:1fr}
.stats{grid-template-columns:1fr 1fr}
.hot{margin-top:0}
.mast{font-size:56px}
.dock{max-width:100vw;overflow-x:auto}
.cells.r .cell.hide{display:none}
}
@media (max-width:600px){
.screen{height:240px}
.ctl,.chan{grid-template-columns:1fr}
.vol{display:none}
.welcome h1{font-size:50px}
.welcome .cal{display:none}
.mix{grid-template-columns:1fr}
.deck{grid-template-columns:1fr}
.rec{display:none}
.mast{font-size:40px;letter-spacing:-1.5px}
.post{grid-template-columns:84px 1fr;gap:12px}
.photo{height:66px}
.cells.l .cell.hide,.cells .nav-x{display:none}
.dock a{width:66px;flex:none}
.lead{font-size:36px}
.alert .in{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div class="flavor">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="x" viewBox="0 0 9 9"><path d="M0 0h1v1h1v1h1v1h1v1h1V3h1V2h1V1h1V0h1v1H8v1H7v1H6v1H5v1h1v1h1v1h1v1h1v1H8V8H7V7H6V6H5V5H4v1H3v1H2v1H1v1H0V8h1V7h1V6h1V5h1V4H3V3H2V2H1V1H0z" fill="currentColor"/></symbol>
<symbol id="palm" viewBox="0 0 18 18"><path d="M8 7h2v10H8zM9 6C7 3 3 3 1 5c3-1 5 0 6 2-3-1-6 1-6 4 2-2 5-3 7-3zm0 0c2-3 6-3 8-1-3-1-5 0-6 2 3-1 6 1 6 4-2-2-5-3-7-3zM5 17h8v1H5z" fill="currentColor"/></symbol>
<symbol id="play" viewBox="0 0 11 11"><path d="M2 0h2v1h1v1h1v1h1v1h1v1h1v1H8v1H7v1H6v1H5v1H4v1H2z" fill="currentColor"/></symbol>
<symbol id="chk" viewBox="0 0 10 10"><path d="M8 1h2v2H9v1H8v1H7v1H6v1H5v1H4v1H3V8H2V7H1V6H0V4h2v1h1v1h1V5h1V4h1V3h1V2h1z" fill="currentColor"/></symbol>
</svg>

<header class="bar">
<nav class="cells l" aria-label="Main">
<a class="cell palm" href="#" aria-label="Droolsuite"><svg><use href="#palm"/></svg></a>
<a class="cell" href="#">Join the cabana / Log in</a>
<a class="cell hide" href="#">Channels</a>
<a class="cell hide" href="#">Perks</a>
<a class="cell hide" href="#">Rates</a>
</nav>
<div class="cells r">
<span class="cell hide">Sat 26 Sep 1987</span>
<span class="cell clock"><svg viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="6.5" fill="var(--paper)" stroke="var(--on-air)" stroke-width="2"/><path d="M7 3h1v5H7zM8 7h3v1H8z" fill="var(--fg)"/></svg>11:37</span>
</div>
</header>

<main class="wrap">
<section class="hero">
<div class="win player">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><span class="ic"><svg viewBox="0 0 12 12"><path d="M1 3h10v7H1zM2 4v5h8V4zM4 1h1v1h2V1h1v2H4z" fill="currentColor"/></svg></span><span class="t">Droolsuite</span></div>
<div class="screen"><canvas id="static" width="592" height="456" aria-hidden="true"></canvas><span class="tag">DS</span></div>
<div class="vbar"><i>◂◂</i><i>▸</i><span>Cabana_Sunset_1986.avi</span><em>591x455</em></div>
<div class="pane now"><h3>Droolsuite: LOBBY FM <span class="dotlive"></span></h3><p>Marisol Vance x The Deckchairs — SLOW TOWEL</p></div>
<div class="ctl"><div class="pane"><small style="font-size:8px">▸</small><br/>Now playing</div>
<div class="trans"><button aria-label="Play"><svg><use href="#play"/></svg></button><button aria-label="Stop"><svg viewBox="0 0 11 11"><path d="M1 1h9v9H1z" fill="currentColor"/></svg></button><button aria-label="Next">▸▸</button></div></div>
<div class="chan"><div class="sel">Channel: Lobby FM <span class="chip">LIVE</span> ▾</div><div class="sel">◁) Volume 7</div><div class="vol"></div></div>
</div>

<div class="win welcome">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><span class="t">Welcome</span></div>
<div class="in">
<span class="eyebrow">Members-only radio · est. 1987</span>
<h1>Leisure, broadcast daily.</h1>
<svg class="cal" viewBox="0 0 50 50" aria-hidden="true"><rect x="4" y="6" width="42" height="40" fill="var(--paper)" stroke="var(--fg)"/><rect x="4" y="6" width="42" height="9" fill="var(--sea)" stroke="var(--fg)"/><path d="M4 23h42M4 31h42M4 39h42M14 15v31M24 15v31M34 15v31" stroke="var(--bevel-dark)"/><rect x="16" y="25" width="6" height="5" fill="none" stroke="var(--on-air)"/><path d="M47 9v39H8" stroke="var(--bevel-dark)" stroke-width="2" fill="none"/></svg>
<p class="sub">Droolsuite is a desktop radio for pool bars, hotel lobbies and <b>anyone pretending it is still August</b>. Forty-one channels of yacht funk, bossa and balearic house, programmed by humans with tans.</p>
<div class="cta"><a class="bv pk" href="#">Become a member</a><a class="bv" href="#">Tune in free</a></div>
<p class="proof"><span class="dotlive"></span>4,211 people are listening from a sun lounger right now</p>
</div>
</div>
</section>

<section class="sec">
<div class="win">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><h2>System info</h2></div>
<div class="stats">
<div class="pane"><b>41</b><span>channels on the dial</span></div>
<div class="pane"><b>12,480</b><span>card-carrying members</span></div>
<div class="pane"><b>94°F</b><span>average broadcast temperature</span></div>
<div class="pane"><b>0</b><span>podcasts, ever</span></div>
</div>
<div class="stat"><span>4 items</span><span>Last sync 11:37</span></div>
</div>
</section>

<section class="sec two">
<div class="win">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><h2>Mixtapes</h2></div>
<div class="pane mix">
<div class="disc"><span class="cd" style="--c1:var(--sea);--c2:var(--sky)"></span><h3 class="chip">01-LobbyHours.mp3</h3><p>Channels change with the sun. Sunrise bossa at 7, deck-shoe disco by 6.</p></div>
<div class="disc"><span class="cd" style="--c1:var(--on-air);--c2:var(--leaf)"></span><h3 class="chip">02-NoSkip.mp3</h3><p>Every mix runs start to finish. There is no skip button and there never will be.</p></div>
<div class="disc"><span class="cd" style="--c1:var(--leaf);--c2:var(--accent)"></span><h3 class="chip">03-Offline.mp3</h3><p>Save up to 60 hours to the cabana drive for flights, boats and bad Wi-Fi.</p></div>
</div>
<div class="pane deck">
<div class="lcd">[spinning]<br/>02-NoSkip.mp3 · 1:04 hour<hr/><small>Double-click a disc to begin your audio holiday</small></div>
<div class="rec"><svg viewBox="0 0 150 150" aria-hidden="true"><circle cx="75" cy="75" r="72" fill="var(--paper)" stroke="var(--fg)" stroke-width="2"/><g fill="none" stroke="var(--fg)" stroke-width="1.4"><path d="M8 60q35-14 67 0t67 0M6 76q35-14 69 0t69 0M9 92q35-14 66 0t66 0M16 108q30-12 59 0t59 0M16 44q30-12 59 0t59 0M28 28q24-10 47 0t47 0M30 124q22-9 45 0t45 0"/></g><circle cx="75" cy="75" r="20" fill="var(--paper)" stroke="var(--fg)" stroke-width="2"/><circle cx="75" cy="75" r="7" fill="var(--fg)"/></svg></div>
</div>
</div>
<div>
<p class="eyebrow">Features.app</p>
<p class="lead">A radio that <em>refuses</em> to be productive.</p>
<p class="body">Droolsuite runs in a little window on your desktop and plays one thing well: music for doing nothing in particular. No algorithm, no feed, no autoplay into a true-crime series.</p>
</div>
</section>

<section class="sec two">
<div class="win events">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button></div>
<div class="in">
<h2>Cabana<br/>Calendar</h2>
<div class="rule">Upcoming</div>
<div class="ev"><div><h3>Droolsuite Lido Session ’87</h3><p>Four DJs, one diving board, a 6pm start at the Hotel Paloma pool in Palm Springs.</p></div><span class="stamp">Jun<br/>14’87</span></div>
<div class="ev"><div><h3>Night Swim Listening Club</h3><p>The new mixtape played front to back in a lit pool. Members bring towels.</p></div><span class="stamp">Jul<br/>02’87</span></div>
</div>
</div>
<div class="win">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><h2>Lobby Gazette</h2></div>
<div class="pane">
<div class="tabs"><a class="on" href="#">All</a><a href="#">The Pool Report</a><a href="#">Changelog</a></div>
<div class="mast"><span>Gaz</span><span>ette</span></div>
<small>Circulars from the Droolsuite comms department</small>
<div class="posts">
<a class="post" href="#"><span class="photo a"></span><div><h3>Version 3.2: the volume knob now goes to 11</h3><time>22 Jun 1987</time></div></a>
<a class="post" href="#"><span class="photo b"></span><div><h3>New channel ☼ Terrace Jazz ☼ 24 hours</h3><time>1 Jun 1987</time></div></a>
<a class="post" href="#"><span class="photo c"></span><div><h3>The Pool Report, issue 118</h3><time>18 May 1987</time></div></a>
</div>
</div>
<div class="stat"><span>118 items</span><span>☼</span></div>
</div>
</section>

<section class="sec two">
<div>
<p class="eyebrow">Guestbook.txt</p>
<p class="lead">Signed by people with <em>excellent</em> sunglasses.</p>
</div>
<div class="win">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><h2>Guestbook</h2></div>
<div class="pane gb-top">Members can leave a note for the front desk.<br/><a class="bv pk" href="#">Sign the guestbook</a></div>
<div class="pane entries">
<div class="entry quote"><b>Ines Kowalczyk</b><time>05:52 Jun 26 1987 · bar manager, Lisbon</time><blockquote>We replaced the lobby playlist with Lobby FM and the check-in queue started tipping.</blockquote></div>
<div class="entry quote"><b>Theo Marchetti</b><time>04:10 Jun 25 1987 · architect</time><blockquote>I work with it open all day. My renders have gotten noticeably more turquoise.</blockquote></div>
<div class="entry quote"><b>Dana Okafor</b><time>22:23 Jun 24 1987 · swim coach</time><blockquote>The only app on my computer that has never once asked me to update anything important.</blockquote></div>
<span class="scroll"></span>
</div>
</div>
</section>

<section class="sec">
<p class="eyebrow">Membership rates</p>
<h2 class="lead" style="margin-bottom:34px">Pick a lounger.</h2>
<div class="tiers">
<div class="win tier">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><span class="t">Day pass</span></div>
<div class="pane"><h3>Day Pass</h3><div class="price"><b>$0</b><span>forever</span></div><p>Lobby FM and two more channels, with a polite station ident every hour.</p><div class="perk"><svg><use href="#chk"/></svg>Activated</div></div>
<a class="bv wide" href="#">Tune in free</a>
</div>
<div class="win tier hot">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><span class="t">Member perks</span></div>
<div class="banner"><b>Cabana</b></div>
<div class="pane"><h3>Cabana Member</h3><div class="price"><b>$9</b><span>per month</span></div><p>All 41 channels, offline mixtapes, the guestbook and a complimentary terry-cloth cap.</p><div class="perk"><svg><use href="#chk"/></svg>Most chosen by the pool</div></div>
<a class="bv tl wide" href="#">Become a member</a>
</div>
<div class="win tier">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><span class="t">Private island</span></div>
<div class="pane"><h3>Private Island</h3><div class="price"><b>$240</b><span>per year</span></div><p>For hotels and bars: licensed public play for one venue, plus a custom station ident.</p><div class="perk"><svg><use href="#chk"/></svg>Invoice in any currency</div></div>
<a class="bv pk wide" href="#">Talk to the concierge</a>
</div>
</div>
</section>

<section class="sec two faq">
<div>
<p class="eyebrow">Help.hlp</p>
<p class="lead">Questions from the deep end.</p>
</div>
<div class="win">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><h2>Help</h2></div>
<div class="pane">
<details open><summary>Can I play Droolsuite in my bar?</summary><p>On Day Pass and Cabana, no: those are for personal listening. Private Island includes the public-play licence for one venue.</p></details>
<details><summary>Why is there no skip button?</summary><p>Mixes are sequenced like records. Skipping a track mid-set is like leaving a party during the good song.</p></details>
<details><summary>Does it run on my computer?</summary><p>Every desktop and any browser from the last decade. It takes 14 MB and asks for nothing except speakers.</p></details>
<details><summary>Is the cap real?</summary><p>Yes. Cabana members get one terry-cloth cap per year, posted in a padded envelope that smells faintly of sunscreen.</p></details>
</div>
</div>
</section>

<section class="sec">
<div class="win alert">
<div class="tb"><button class="x" aria-label="Close"><svg><use href="#x"/></svg></button><span class="t">Alert</span></div>
<div class="pane in">
<svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true"><path d="M26 4 49 46H3z" fill="var(--tertiary)" stroke="var(--fg)" stroke-width="2"/><rect x="24" y="18" width="4" height="16" fill="var(--fg)"/><rect x="24" y="37" width="4" height="4" fill="var(--fg)"/></svg>
<div><h2>It is 94°F somewhere. Clock off.</h2><small>Cancel anytime from Settings. The cap is yours to keep.</small>
<div class="btns"><a class="bv" href="#">Not yet</a><a class="bv tl ok" href="#">Become a member</a></div></div>
</div>
</div>
</section>
</main>

<footer>
<div class="cells l"><span class="cell">© 1987 Droolsuite Leisure Co.</span><a class="cell nav-x" href="#">Privacy</a><a class="cell nav-x" href="#">Press</a><a class="cell nav-x" href="#">Venues</a></div>
<div class="cells r"><span class="cell"><span class="dotlive"></span>On air · 41 channels nominal</span></div>
</footer>

<nav class="dock" aria-label="Apps">
<a href="#"><svg viewBox="0 0 32 32"><path d="M6 6h20l-9 10v10h5v2H10v-2h5V16z" fill="var(--paper)" stroke="var(--fg)"/><path d="M9 9h14l-6 6z" fill="var(--sand)"/><circle cx="23" cy="8" r="3" fill="var(--leaf)" stroke="var(--fg)"/></svg>Player</a>
<a href="#"><svg viewBox="0 0 32 32"><rect x="4" y="9" width="24" height="16" fill="var(--paper)" stroke="var(--fg)"/><path d="M4 9l12 9 12-9" fill="none" stroke="var(--fg)"/><rect x="9" y="4" width="14" height="8" fill="var(--chip)" stroke="var(--fg)"/></svg>Gazette</a>
<a href="#"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="var(--accent)" stroke="var(--fg)"/><path d="M16 4a12 12 0 0 1 12 12h-8z" fill="var(--sand)"/><path d="M4 16a12 12 0 0 0 12 12v-8z" fill="var(--sky)"/><circle cx="16" cy="16" r="4" fill="var(--paper)" stroke="var(--fg)"/></svg>Mixtapes</a>
<a href="#"><svg viewBox="0 0 32 32"><rect x="7" y="3" width="18" height="26" fill="var(--accent)" stroke="var(--fg)"/><path d="M10 8h12M10 12h12M10 16h8" stroke="var(--fg)"/><circle cx="19" cy="23" r="3" fill="var(--paper)" stroke="var(--fg)"/></svg>Members</a>
<a href="#"><svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="22" fill="var(--paper)" stroke="var(--fg)"/><rect x="4" y="6" width="24" height="6" fill="var(--sea)" stroke="var(--fg)"/><path d="M4 18h24M4 23h24M10 12v16M16 12v16M22 12v16" stroke="var(--bevel-dark)"/><rect x="11" y="14" width="4" height="3" fill="var(--on-air)"/></svg>Events</a>
<a href="#"><svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="18" rx="2" fill="var(--button-shadow)" stroke="var(--fg)"/><rect x="10" y="5" width="12" height="5" fill="var(--chip)" stroke="var(--fg)"/><circle cx="16" cy="18" r="6" fill="var(--fg)"/><circle cx="16" cy="18" r="3" fill="var(--sea)"/></svg>Snaps</a>
<a href="#"><svg viewBox="0 0 32 32"><path d="M11 6h8l2 4v19H9V10z" fill="var(--sand)" stroke="var(--fg)"/><rect x="12" y="2" width="6" height="4" fill="var(--on-air)" stroke="var(--fg)"/><rect x="11" y="14" width="8" height="8" fill="var(--paper)" stroke="var(--fg)"/></svg>SPF</a>
<a href="#"><svg viewBox="0 0 32 32"><path d="M5 8l13-4 9 4v18l-13 4-9-4z" fill="var(--leaf)" stroke="var(--fg)"/><path d="M14 12l13-4M14 12v18M5 8l9 4" stroke="var(--fg)" fill="none"/><path d="M17 16l7-2" stroke="var(--paper)"/></svg>Guestbook</a>
<a href="#"><svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="18" fill="var(--chip)" stroke="var(--fg)"/><rect x="7" y="7" width="18" height="12" fill="var(--sea)" stroke="var(--fg)"/><path d="M8 26h16v3H8z" fill="var(--bevel-dark)" stroke="var(--fg)"/></svg>Settings</a>
</nav>
</div>
<script>
(function(){var c=document.getElementById("static");if(!c)return;var x=c.getContext("2d"),w=c.width,h=c.height,img=x.createImageData(w,h),s=7;
function rnd(){s=(s*16807)%2147483647;return s/2147483647}
function draw(){var d=img.data;for(var i=0;i<d.length;i+=4){var v=rnd()>.5?255:0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}x.putImageData(img,0,0)}
draw();document.addEventListener("flavor:tweak",draw);
if(matchMedia("(prefers-reduced-motion: no-preference)").matches){var t=0;(function loop(n){if(n-t>90){t=n;draw()}requestAnimationFrame(loop)})(0)}
})();
</script>
<script type="application/json" data-flavor-tweaks>{"controls":[{"var":"--dither","label":"Desktop dither","min":0,"max":16,"step":1,"unit":"%"},{"var":"--static","label":"TV static","min":0,"max":100,"step":5,"unit":"%"},{"var":"--depth","label":"Window drop","min":0,"max":60,"step":2,"unit":"%"},{"var":"--bevel-w","label":"Bevel","min":0,"max":3,"step":1,"unit":"px"},{"var":"--window-radius","label":"Window corners","min":0,"max":14,"step":1,"unit":"px"}],"schemes":[{"name":"Lido","vars":{"--bg":"#bfe3e0","--bg-2":"#f7f1e6","--fg":"#0b1a1f","--fg-muted":"#4c5e60","--accent":"#f6c7c0","--accent-fg":"#0b1a1f","--border":"#0b1a1f","--paper":"#ffffff","--tertiary":"#fbf1c4","--button":"#f3e4c8","--button-shadow":"#8a7658","--accent-shadow":"#a0625a","--bevel-dark":"#95a09e","--chip":"#dfe3dc","--on-air":"#e2412f","--sky":"#f5b17a","--sea":"#1f7392","--sand":"#efd29c","--leaf":"#3a7a4a","--desk-fg":"#0b1a1f"}},{"name":"Sunscreen","vars":{"--bg":"#f8e7a6","--bg-2":"#fbf5ea","--fg":"#1d1407","--fg-muted":"#6a5a3e","--accent":"#ffb489","--accent-fg":"#1d1407","--border":"#1d1407","--paper":"#fffdf8","--tertiary":"#dff0ea","--button":"#f8dfb0","--button-shadow":"#8c6d3e","--accent-shadow":"#9b5a35","--bevel-dark":"#a89a86","--chip":"#ece2d0","--on-air":"#e24a2a","--sky":"#ff9b6b","--sea":"#2585a0","--sand":"#f6d692","--leaf":"#4b7f3a","--desk-fg":"#1d1407"}},{"name":"Night Swim","vars":{"--bg":"#20284a","--bg-2":"#efe9f6","--fg":"#0c0d1c","--fg-muted":"#55556e","--accent":"#9fd9ff","--accent-fg":"#0c0d1c","--border":"#0c0d1c","--paper":"#ffffff","--tertiary":"#f4e7ff","--button":"#e8d6f3","--button-shadow":"#6d5a80","--accent-shadow":"#4c7596","--bevel-dark":"#9a97aa","--chip":"#e1dcea","--on-air":"#ff4f7a","--sky":"#c07ad8","--sea":"#1d3f7a","--sand":"#f1b8d0","--leaf":"#2f6d68","--desk-fg":"#f4effa"}},{"name":"Country Club","vars":{"--bg":"#cfdcc4","--bg-2":"#f6f2e7","--fg":"#10170f","--fg-muted":"#566152","--accent":"#e9d27a","--accent-fg":"#10170f","--border":"#10170f","--paper":"#ffffff","--tertiary":"#f9f0d4","--button":"#e8e1c9","--button-shadow":"#7b735a","--accent-shadow":"#8a7228","--bevel-dark":"#9ea396","--chip":"#e3e2d6","--on-air":"#c7362c","--sky":"#e9b98a","--sea":"#2d6a6f","--sand":"#e6d5a8","--leaf":"#2f5b34","--desk-fg":"#10170f"}}]}</script>
</body>
</html>
```
