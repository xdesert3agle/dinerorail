---
version: "alpha"
name: "Soupabase"
description: "Graphite-black developer platform: one emerald brand green, hairline bento cards drawn as line art, two-tone Manrope headlines, a quote wall."
colors:
  primary: "#3ecf8e"
  on-primary: "#052e1c"
  surface: "#131413"
  surface-container: "#181a19"
  on-surface: "#edefee"
  on-surface-variant: "#989a99"
  outline: "color-mix(in srgb,#edefee 7.5%,transparent)"
  brand-deep: "#006338"
  announce: "#0b0e0d"
  violet: "#a78bfa"
  orange: "#f0a25e"
  blue: "#3b46e0"
  story-a: "#ff3d9a"
  story-b: "#ff2244"
  story-c: "#ff8a1c"
typography:
  headline-display:
    fontFamily: "Manrope"
    fontSize: 46px
    fontWeight: 500
    lineHeight: 1
  headline-lg:
    fontFamily: "Manrope"
    fontSize: 34px
    fontWeight: 500
    lineHeight: 1.12
  body-md:
    fontFamily: "Inter"
    fontSize: 15px
    lineHeight: 1.35
  label-md:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: 500
  code-md:
    fontFamily: "Source Code Pro"
    fontSize: 13.5px
    lineHeight: 1.63
rounded:
  sm: 6px
  md: 8px
  lg: 16px
  xl: 21px
  full: 9999px
spacing:
  unit: 4px
  section: 128px
  max-width: 1128px
---

# Soupabase

> A graphite developer-platform page where one emerald green does all the talking and every product is a hairline card drawn in line art.

Source: https://flavors.design/f/soupabase

Headlines are set in Manrope, UI in Inter and code in Source Code Pro; all three are on Google Fonts, so no stand-ins were needed. The announcement bar's pixel face ("Departure Mono") is replaced by Source Code Pro.

## Overview

Soupabase is the Postgres-platform landing: calm, dense with product, and almost colourless. The page is graphite `#131413` (green-tinted, never pure black), cards are one step up at `#181a19`, and everything is separated by 1px white-at-7.5% hairlines. Exactly one colour carries the brand: **emerald `#3ecf8e`** on the second hero line, checkmarks, the terminal command, the vector dots and a deep `#006338` fill on primary buttons. The mood is "serious infrastructure that happens to be pleasant": a dev tool that shows you its dashboard, its SDK and its pricing instead of adjectives.

It is for developers choosing a backend. It is not neon, not gradient-mesh, not glassy. The one loud moment is the customer-story panel, a hot pink-to-orange gradient slab beside four narrow brand-coloured columns; everything else is grey on graphite. Product illustrations are **line art in hairline strokes** (a wireframe globe, an isometric cube, file-icon tiles, dashed API rows) rather than screenshots or 3D renders.

## Colors

| Role      | Value | Notes |
| --------- | ----- | ----- |
| bg        | `#131413` | page, green-tinted graphite (`oklch(.19 .0025 157.5)`) |
| bg-2      | `#181a19` | bento cards, windows, pricing, quote cards |
| fg        | `#edefee` | headlines, the bolded phrase in every card body |
| fg-muted  | `#989a99` | body copy, the grey half of two-tone headlines |
| accent    | `#3ecf8e` | brand green: hero line 2, checks, command text, vector dots |
| accent-fg | `#052e1c` | ink on a solid green checkbox |
| border    | `color-mix(in srgb,var(--fg) var(--hair-alpha),transparent)` | every 1px line; 7.5% default |
| brand-deep | `#006338` | primary button fill (with a green-55% border) |
| announce  | `#0b0e0d` | announcement bar, darker story columns |
| violet    | `#a78bfa` | code keywords |
| orange    | `#f0a25e` | code strings |
| blue      | `#3b46e0` | one story column, one avatar |
| story-a/b/c | `#ff3d9a` / `#ff2244` / `#ff8a1c` | the customer-story gradient, top to bottom |

Scheme: dark. Contrast rule: fg on bg ~16:1, fg-muted ~6.3:1; body copy is muted and the key phrase in each sentence is lifted to fg.
Color rules: no colour literal outside `:root`; tints are `color-mix()` so the four schemes (Daylight, Jade Night, Nocturne, Paprika) repaint everything. Green appears in small doses; the only big colour field on the page is the story gradient.

## Typography

- Display: `"Manrope", "Circular", system-ui, sans-serif` — 500 weight only, h1 46px/1 at -0.4px, section h2 34px/1.12, pricing title 40px; sentence case
- Body: `"Inter", "Inter Fallback", system-ui, "Helvetica Neue", sans-serif` — 16px base, card copy 15px/20px, nav 15px/500, buttons 12–15px/500
- Mono: `"Source Code Pro", "Office Code Pro", Menlo, monospace` — code panel, `$ soupabase` command, email tiles, **plan names in uppercase with 1.5px tracking and prices at 44px/400**
- Scale: 12 / 13 / 15 / 16 / 17 / 18 / 22 / 34 / 40 / 44 / 46
- Load: `<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600&family=Inter:wght@400;500&family=Source+Code+Pro:wght@400;500&display=swap">`
- Rules: every headline is **two-tone**: one line fg, one line muted (hero: fg then green). Which half is grey changes per section ("Stay productive…" white over grey; "How busy kitchens" grey over white). Body sentences put the important phrase in fg with `<b>` at weight 400, never bold.

## Layout

- Max width 1128px content, 20px gutters; the logo frame breaks out to 1280px with vertical hairlines at both ends
- Base unit 4px; spacing 8 / 12 / 16 / 24 / 32 / 48 / 64 / 128
- Section rhythm 128px; hero sits 160px below the nav
- Hero: a 2-column grid, headline and buttons left, the subhead bottom-aligned right
- Bento: 4 columns, 12px gaps; the database card spans 2, the others are 1×1 at ~392px tall with line art bleeding off the bottom edge
- Section header: two-tone h2 left, an underlined text link right, aligned to the baseline
- Density: balanced — generous section gaps, compact type inside cards

## Elevation & Depth

Flat graphite with hairlines; depth comes from one-step surface lifts and very quiet button shadows.

- Cards: `border: 1px solid var(--border)` (fg at 7.5%) on `--bg-2`; hover lifts the border to `--border-strong` (fg at 13.5%). No card shadow.
- Buttons: `border: 1px solid var(--border-strong)`, fill `color-mix(in srgb,var(--fg) 5%,transparent)`, shadow `0 1px 3px 0 color-mix(in srgb,var(--announce) 60%,transparent)`; primary swaps to `#006338` with a `color-mix(in srgb,var(--accent) 55%,transparent)` border.
- Window mocks and the Pro plan: `--shadow-lg: 0 10px 15px -3px …40%, 0 4px 6px -4px …40%`. The highlighted plan also gets a brighter border `color-mix(in srgb,var(--fg) 34%,transparent)` and breaks 32px above and below the plan row.
- Sticky nav: `background: color-mix(in srgb,var(--bg) 90%,transparent)` with `backdrop-filter: blur(6px)` and a hairline bottom border.
- Grid overlays: a 16px square grid at fg 5% (`--grid-alpha`) masked `linear-gradient(transparent,#000 30%)` behind the Simmer card.
- The quote wall is masked left/right and faded at the bottom with `mask-image`; the dashboard sidebar is `filter: blur(1.2px)` at 55% to push it behind the form.

## Shapes

- Radius: 6px small buttons and inputs, 8px large buttons, tiles and story columns, 16px cards and quote cards, 21px dashboard window
- Pills (9999px): editor tabs, the terminal command, the typing bubble, "Read docs" button, API route chips, "Recommended"
- Circles: avatars (28/40px), traffic-light dots (8px), checkbox is a 4px-radius square
- Line art: 1px strokes, 16px icon glyphs at 1.5px stroke, round caps and joins

## Components

- Announcement bar: 56px, `--announce` background, centred 15px/500 message, a small square bullet, an underlined green link with ↗, a close ✕, and **rows of mono brackets `{[(<` fading in from both edges** (JS-drawn, density is a knob)
- Nav: 65px sticky; wordmark with the steaming-bowl mark, dropdown items with a small chevron, a star count, then two 26px buttons ("Sign in" ghost, primary green)
- Buttons: 26px tall 12px/500 in the nav; 38px/14px in the hero; full-width 42px in pricing. `:active` scales to .97
- Bento cards: 18px/500 Inter title with a 16px stroke icon, 15px muted body with fg phrases, then line art: dashed API route rows, a wireframe globe with a route, an isometric vector cube with green dots, 62px file tiles, blurred email tiles, cursors over a grid
- Logo frame + stats: a 6-column wall of greyed wordmarks inside a hairline frame, stats in a 4-column hairline grid under it
- Dashboard mock: pill tabs (active has an fg border), a 21px window with traffic lights, a blurred sidebar, a form panel with a mono `code` chip, inputs, a green checkbox with a "Recommended" pill and an info notice
- Code panel: 6 framework icon cells over a mono snippet (violet keywords, orange strings, green calls) and a pill "Read docs" button
- Customer stories: one wide gradient slab with a big Manrope quote, avatar byline, underlined link; four 76px brand columns beside it
- Quote wall: 5 staggered columns of 288px cards, 40px avatar with a tiny quote-mark badge, muted text with fg highlights, faded at the edges
- Pricing: one bordered row of plans with the Pro plan popping out; plan names mono uppercase, prices 44px mono, green checks, sub-lines muted
- Footer: logo + socials + email field left, six link columns, a hairline and a status line

## Do's and Don'ts

- Do write every headline as two lines of different tone, fg and muted (or fg and green in the hero).
- Do lift the key phrase of each paragraph to fg and leave the rest muted.
- Do draw product visuals as hairline line art that bleeds off the card bottom.
- Do keep green to text, checks, dots and the deep primary fill.
- Do use mono for plan names, prices, commands and code.
- Do use pill tabs with a single fg-bordered active state.

- Don't use pure black; the graphite has a green tint.
- Don't add shadows to bento cards; borders only.
- Don't use a second accent colour outside the story gradient and syntax highlighting.
- Don't set headlines above weight 500.
- Don't screenshot the product; mock it in HTML with blur for depth.
- Don't round cards beyond 16px or make buttons pills (tabs are the exception).

## Motion

- Duration 200ms, easing `cubic-bezier(.22,1,.36,1)`
- What animates: background, border-colour and scale on buttons, nav items and cards; the proof dot pulses; the input caret blinks
- What never animates: section entrances, layout, line art
- Signature move: buttons press to `scale(.97)` on `:active`; cards brighten their hairline on hover
- All keyframes live inside `@media (prefers-reduced-motion: no-preference)`

## Tweaks

Five knobs. `--hair-alpha` (3–18%) drives `--border` and `--border-strong`, so every line on the page; `--radius-lg` is the card corner; `--grid-alpha` is the Simmer grid; `--bracket-density` (0.1–1) redraws the announcement brackets on `flavor:tweak`; `--story-spin` rotates the customer-story gradient. Schemes: Daylight (the light theme), Classic 2022, Nocturne, Paprika — each sets all fourteen colour literals.

## Reference CSS

```css
:root {
  --bg:#131413;
  --bg-2:#181a19;
  --fg:#edefee;
  --fg-muted:#989a99;
  --accent:#3ecf8e;
  --accent-fg:#052e1c;
  --brand-deep:#006338;
  --announce:#0b0e0d;
  --violet:#a78bfa;
  --orange:#f0a25e;
  --blue:#3b46e0;
  --story-a:#ff3d9a;
  --story-b:#ff2244;
  --story-c:#ff8a1c;
  --border:color-mix(in srgb,var(--fg) var(--hair-alpha),transparent);
  --border-strong:color-mix(in srgb,var(--fg) calc(var(--hair-alpha) * 1.8),transparent);
  --fg-light:color-mix(in srgb,var(--fg) 72%,var(--bg));
  --fg-dim:color-mix(in srgb,var(--fg) 34%,var(--bg));
  --surface:color-mix(in srgb,var(--fg) 3%,transparent);
  --control:color-mix(in srgb,var(--fg) 5%,transparent);
  --font-display:"Manrope", "Circular", system-ui, sans-serif;
  --font-body:"Inter", "Inter Fallback", system-ui, "Helvetica Neue", sans-serif;
  --font-mono:"Source Code Pro", "Office Code Pro", Menlo, monospace;
  --radius:8px;
  --radius-sm:6px;
  --radius-lg:16px;
  --radius-xl:21px;
  --space-1:4px;
  --space-8:128px;
  --shadow:0 1px 3px 0 color-mix(in srgb,var(--announce) 60%,transparent),inset 0 1px 0 0 color-mix(in srgb,var(--fg) 4%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--fg) 10%,transparent);
  --shadow-lg:0 10px 15px -3px color-mix(in srgb,var(--announce) 40%,transparent),0 4px 6px -4px color-mix(in srgb,var(--announce) 40%,transparent);
  --ease:cubic-bezier(.22,1,.36,1);
  --dur:200ms;
  --max-width:1128px;
  --section:128px;
  --hair-alpha:7.5%;
  --grid-alpha:5%;
  --bracket-density:0.55;
  --story-spin:0deg;
}
.card{position:relative;display:flex;flex-direction:column;min-height:392px;padding:24px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-2);overflow:hidden}
.btn{display:inline-flex;align-items:center;height:26px;padding:0 10px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--control);font:500 12px/1 var(--font-body)}
.btn.p{background:var(--brand-deep);border-color:color-mix(in srgb,var(--accent) 55%,transparent)}
h2{font:500 34px/1.12 var(--font-display);color:var(--fg-muted)}
h2 span{display:block;color:var(--fg)}
```

## Reference markup

```html
<section class="hero wrap">
  <div class="hg">
    <div>
      <h1>Build in a simmer<span>Serve to millions</span></h1>
      <div class="hb g">
        <a class="btn p lg" href="#">Start your pot</a>
        <a class="btn lg" href="#">Request a tasting</a>
      </div>
    </div>
    <p class="lead">Start your project with a Postgres stockpot. Add Ladle auth, instant broth APIs…</p>
  </div>
</section>
<article class="card">
  <h3 class="g"><svg class="i">…</svg>Burners</h3>
  <p>Easily write custom code <b>without deploying or scaling stoves.</b></p>
  <div class="term g">$ soupabase <span class="grn">burners deploy</span></div>
  <svg class="art">…wireframe globe…</svg>
</article>
```

## How to apply this flavor

1. Replace the target page's design tokens with the palette, fonts and spacing above.
2. Restyle components to match the Components section; keep the page's content and structure.
3. Apply the motion rules; remove any animation not described here.
4. Check the Don't list before finishing.

## Full source

```html
<!doctype html>
<!-- Soupabase: near-black graphite, one emerald brand green, hairline bento cards drawn as line art, two-tone headlines and a quote wall. -->
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Soupabase | The Stockpot Development Platform</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600&family=Inter:wght@400;500&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet"/>
<!-- prettier-ignore -->
<style>:root{
--bg:#131413;
--bg-2:#181a19;
--fg:#edefee;
--fg-muted:#989a99;
--accent:#3ecf8e;
--accent-fg:#052e1c;
--brand-deep:#006338;
--announce:#0b0e0d;
--violet:#a78bfa;
--orange:#f0a25e;
--blue:#3b46e0;
--story-a:#ff3d9a;
--story-b:#ff2244;
--story-c:#ff8a1c;
--border:color-mix(in srgb,var(--fg) var(--hair-alpha),transparent);
--border-strong:color-mix(in srgb,var(--fg) calc(var(--hair-alpha) * 1.8),transparent);
--fg-light:color-mix(in srgb,var(--fg) 72%,var(--bg));
--fg-dim:color-mix(in srgb,var(--fg) 34%,var(--bg));
--surface:color-mix(in srgb,var(--fg) 3%,transparent);
--control:color-mix(in srgb,var(--fg) 5%,transparent);
--font-display:"Manrope", "Circular", system-ui, sans-serif;
--font-body:"Inter", "Inter Fallback", system-ui, "Helvetica Neue", sans-serif;
--font-mono:"Source Code Pro", "Office Code Pro", Menlo, monospace;
--radius:8px;
--radius-sm:6px;
--radius-lg:16px;
--radius-xl:21px;
--space-1:4px;
--space-8:128px;
--shadow:0 1px 3px 0 color-mix(in srgb,var(--announce) 60%,transparent),inset 0 1px 0 0 color-mix(in srgb,var(--fg) 4%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--fg) 10%,transparent);
--shadow-lg:0 10px 15px -3px color-mix(in srgb,var(--announce) 40%,transparent),0 4px 6px -4px color-mix(in srgb,var(--announce) 40%,transparent);
--ease:cubic-bezier(.22,1,.36,1);
--dur:200ms;
--max-width:1128px;
--section:128px;
--hair-alpha:7.5%;
--grid-alpha:5%;
--bracket-density:0.55;
--story-spin:0deg;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:400 16px/1.5 var(--font-body);-webkit-font-smoothing:antialiased}
.flavor{overflow-x:hidden}
a{color:inherit;text-decoration:none}
h1,h2,h3,h4,p,blockquote,dl,dd{margin:0}
.wrap{max-width:var(--max-width);margin:0 auto;padding:0 20px}
.g{display:flex;align-items:center}
.mut{color:var(--fg-muted)}
.fg{color:var(--fg)}
.grn{color:var(--accent)}
.mono{font-family:var(--font-mono)}
svg.i{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
/* announcement */
.ann{position:relative;height:56px;justify-content:center;gap:12px;border-bottom:1px solid var(--border);background:var(--announce);font-size:15px;font-weight:500;overflow:hidden}
.ann b{font-weight:500;color:var(--accent);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}
.ann i{width:4px;height:4px;background:var(--fg-dim)}
.ann .x{position:absolute;right:22px;color:var(--fg-muted);font-size:15px}
.br{position:absolute;top:2px;font:400 13px/15px var(--font-mono);white-space:pre;color:color-mix(in srgb,var(--accent) 45%,var(--announce));pointer-events:none}
.br.l{left:0;mask-image:linear-gradient(90deg,#000 20%,transparent)}
.br.r{right:0;text-align:right;mask-image:linear-gradient(270deg,#000 20%,transparent)}
.br em{font-style:normal;color:var(--fg)}
/* nav */
.hdr{position:sticky;top:0;z-index:40;height:65px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(6px)}
nav{height:100%;gap:20px}
.logo{gap:8px;font:600 21px/1 var(--font-display);letter-spacing:-.3px;margin-right:22px}
.logo svg{width:26px;height:26px}
.nl{gap:2px;font-size:15px;font-weight:500}
.nl a{gap:4px;padding:8px 10px;border-radius:var(--radius);transition:background var(--dur) var(--ease)}
.nl a:hover{background:var(--control)}
.nl svg{width:11px;height:11px;opacity:.6}
.nr{margin-left:auto;gap:8px}
.star{gap:8px;padding:4px 10px;font-size:12px;font-weight:500;color:var(--fg-light)}
.star svg{width:18px;height:18px;fill:var(--fg)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:26px;padding:0 10px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--control);color:var(--fg);font:500 12px/1 var(--font-body);box-shadow:0 1px 3px 0 color-mix(in srgb,var(--announce) 60%,transparent);transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),scale var(--dur) var(--ease);white-space:nowrap}
.btn:hover{background:color-mix(in srgb,var(--fg) 10%,transparent)}
.btn:active{scale:.97}
.btn.p{background:var(--brand-deep);border-color:color-mix(in srgb,var(--accent) 55%,transparent);color:var(--fg)}
.btn.p:hover{background:color-mix(in srgb,var(--brand-deep) 82%,var(--accent))}
.btn.lg{height:38px;padding:0 16px;border-radius:var(--radius);font-size:14px}
.btn svg{width:13px;height:13px}
/* hero */
.hero{padding-top:160px;padding-bottom:64px}
.hg{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:end}
h1{font:500 46px/1 var(--font-display);letter-spacing:-.4px}
h1 span{display:block;color:var(--accent)}
.lead{font-size:17px;line-height:24px;color:var(--fg-muted);padding-bottom:62px;max-width:540px}
.hb{gap:8px;margin-top:32px}
.proof{margin-top:18px;gap:8px;font-size:13px;color:var(--fg-muted)}
.proof i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
/* bento */
.bento{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.card{position:relative;display:flex;flex-direction:column;min-height:392px;padding:24px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-2);overflow:hidden;transition:border-color var(--dur) var(--ease)}
.card:hover{border-color:var(--border-strong)}
.card.w{grid-column:span 2;min-height:410px}
.card h3{gap:10px;font:500 18px/1.2 var(--font-body);margin-bottom:16px}
.card h3 svg{width:18px;height:18px}
.card p{font-size:15px;line-height:20px;color:var(--fg-muted);max-width:30ch}
.card p b,.use b{font-weight:400;color:var(--fg)}
.art{position:absolute;left:0;right:0;bottom:0;height:62%;color:var(--fg-dim)}
.checks{margin-top:auto;display:grid;gap:4px;font-size:15px}
.checks span{gap:6px}
.checks svg{width:14px;height:14px}
.pot{position:absolute;right:44px;top:120px;width:168px;height:168px;border:1px solid var(--border);border-radius:var(--radius-lg);display:grid;place-items:center;background:linear-gradient(var(--border),var(--border)) 50% 50%/1px 100% no-repeat,linear-gradient(var(--border),var(--border)) 50% 50%/100% 1px no-repeat}
.pot svg{width:150px;height:150px;fill:none;stroke:var(--fg-dim);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
.tiles{position:absolute;left:0;bottom:12px;display:grid;grid-template-columns:repeat(2,124px);gap:10px;transform:translateX(-30px)}
.tiles span{height:56px;border:1px solid var(--border);border-radius:var(--radius);display:grid;place-items:center;font:400 13px var(--font-mono);color:var(--fg-muted);white-space:nowrap;overflow:hidden}
.tiles .bl{color:transparent;text-shadow:0 0 7px var(--fg-dim)}
.term{position:absolute;left:32px;right:32px;bottom:180px;z-index:1;gap:8px;height:30px;padding:0 12px;border:1px solid var(--border-strong);border-radius:99px;background:var(--bg-2);font:400 12px var(--font-mono);color:var(--fg-light);white-space:nowrap}
.fileg{position:absolute;left:8px;bottom:16px;display:grid;grid-template-columns:repeat(4,62px);gap:8px}
.fileg i{height:62px;border:1px solid var(--border);border-radius:var(--radius);display:grid;place-items:center;color:var(--fg-light)}
.fileg svg{width:20px;height:20px}
.gridbg{background-image:linear-gradient(color-mix(in srgb,var(--fg) var(--grid-alpha),transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--fg) var(--grid-alpha),transparent) 1px,transparent 1px);background-size:16px 16px;mask-image:linear-gradient(transparent,#000 30%)}
.bub{position:absolute;left:94px;top:70px;gap:6px;padding:10px 20px;border:1px solid var(--border-strong);border-radius:99px;background:var(--bg-2)}
.bub i{width:6px;height:6px;border-radius:50%;background:var(--fg)}
.cur{position:absolute;width:30px;height:38px;fill:var(--bg-2);stroke:var(--fg-light);stroke-width:1.2}
.api{position:absolute;left:0;right:0;bottom:32px;display:grid;gap:8px}
.api div{gap:14px;padding:4px 18px;border-top:1px dashed var(--border-strong);font:500 9.5px var(--font-body);color:var(--fg-muted)}
.api span{padding:5px 10px;border:1px solid var(--border-strong);border-radius:6px}
.api em{font-style:normal;padding:5px 12px;border:1px solid var(--border-strong);border-radius:99px;background:var(--control)}
.api em b{font-weight:500;color:var(--fg)}
.use{margin-top:24px;font:500 22px/1.3 var(--font-display);color:var(--fg-muted)}
/* logos + stats */
.trust{margin-top:112px;font-size:15px;color:var(--fg-muted);padding-bottom:34px}
.frame{border-block:1px solid var(--border)}
.frame>.fi{max-width:1280px;margin:0 auto;border-inline:1px solid var(--border)}
.logos{display:grid;grid-template-columns:repeat(6,1fr);max-width:1128px;margin:0 auto;padding:30px 20px}
.logos span{height:70px;display:grid;place-items:center;font:600 24px/1 var(--font-display);letter-spacing:-.6px;color:var(--fg-dim);filter:grayscale(1)}
.logos span:nth-child(3n){font:italic 500 20px/1 Georgia,serif;letter-spacing:0}
.logos span:nth-child(4n){font:500 19px/1 var(--font-mono);letter-spacing:-1px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--border)}
.stats div{padding:28px 32px;border-left:1px solid var(--border)}
.stats div:first-child{border-left:0}
.stats b{display:block;font:500 34px/1.1 var(--font-display);letter-spacing:-.5px}
.stats span{font-size:14px;color:var(--fg-muted)}
/* section heads */
.sec{padding-top:var(--section)}
.sh{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:40px}
h2{font:500 34px/1.12 var(--font-display);letter-spacing:-.3px;color:var(--fg-muted)}
h2 span{display:block;color:var(--fg)}
h2 .tail{display:inline;color:var(--fg)}
.lk{font-size:15px;color:var(--fg-light);text-decoration:underline;text-underline-offset:4px;text-decoration-color:var(--fg-dim);white-space:nowrap}
.lk:hover{color:var(--fg)}
/* dashboard */
.tabs{gap:8px;margin-bottom:32px;flex-wrap:wrap}
.tab{padding:8px 32px;border:1px solid var(--border-strong);border-radius:99px;font-size:14px;color:var(--fg-light)}
.tab.on{border-color:var(--fg);color:var(--fg)}
.win{position:relative;border:1px solid var(--border);border-radius:var(--radius-xl);background:var(--bg-2);box-shadow:var(--shadow-lg);overflow:hidden;height:600px}
.dots{gap:8px;padding:12px 16px}
.dots i{width:8px;height:8px;border-radius:50%;background:var(--border-strong)}
.dash{display:grid;grid-template-columns:300px 1fr;height:100%;border-top:1px solid var(--border)}
.side{padding:14px;border-right:1px solid var(--border);filter:blur(1.2px);opacity:.55}
.side div{height:28px;margin:6px 0;border-radius:6px;background:var(--control)}
.side div:nth-child(3n){width:62%}.side div:nth-child(2n){width:80%}
.side .on{background:color-mix(in srgb,var(--accent) 18%,transparent)}
.panel{padding:0;font-size:15px}
.ph{gap:8px;padding:22px 28px;border-bottom:1px solid var(--border);font-size:17px;font-weight:500}
code,.code{font-family:var(--font-mono)}
.ph code{padding:2px 7px;border:1px solid var(--border-strong);border-radius:5px;background:var(--control);font-size:15px}
.fr{display:grid;grid-template-columns:240px 1fr;align-items:center;padding:14px 28px;color:var(--fg-light)}
.in{height:42px;padding:0 16px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--control);display:flex;align-items:center;color:var(--fg)}
.in.ph2{color:var(--fg-dim)}
.car{width:1px;height:18px;margin-left:2px;background:var(--fg)}
.opt{padding:22px 28px 0;border-top:1px solid var(--border);margin-top:18px}
.ck{gap:14px;font-weight:500}
.ck i{width:18px;height:18px;border-radius:4px;background:var(--accent);display:grid;place-items:center;color:var(--accent-fg)}
.ck i svg{width:12px;height:12px;stroke-width:2.5}
.pill{padding:2px 10px;border:1px solid var(--border-strong);border-radius:99px;font-size:13px;font-weight:500;color:var(--fg-light)}
.opt p{margin:4px 0 0 32px;color:var(--fg-muted)}
.note{margin:16px 0 0 32px;padding:16px 18px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);display:grid;grid-template-columns:24px 1fr;gap:12px}
.note b{font-weight:500}
.note p{margin:6px 0 12px;font-size:13.5px}
.note u{color:var(--fg)}
/* frameworks + code */
.fw{display:grid;grid-template-columns:1fr 544px;gap:48px;align-items:start}
.fw>*{min-width:0}
.fwg{display:grid;grid-template-columns:repeat(6,1fr);border:1px solid var(--border);border-radius:var(--radius) var(--radius) 0 0}
.fwg span{height:66px;display:grid;place-items:center;border-left:1px solid var(--border);color:var(--fg-dim)}
.fwg span:first-child{border:0}
.fwg span.on{color:var(--fg);background:var(--control)}
.fwg svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.6}
pre{position:relative;margin:0;padding:22px 24px 64px;border:1px solid var(--border);border-top:0;border-radius:0 0 var(--radius-lg) var(--radius-lg);background:var(--bg-2);font:400 13.5px/22px var(--font-mono);color:var(--fg-light);overflow:auto}
.k{color:var(--violet)}.s{color:var(--orange)}.f{color:var(--accent)}.c{color:var(--fg-dim)}
pre .btn{position:absolute;right:16px;bottom:16px;border-radius:99px;height:30px;padding:0 12px;font-family:var(--font-body)}
/* stories */
.stories{display:grid;grid-template-columns:1fr 76px 76px 76px 76px;gap:8px;height:580px}
.story{position:relative;border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;padding:32px;background:linear-gradient(calc(180deg + var(--story-spin)),var(--story-a),var(--story-b) 45%,var(--story-c));color:var(--fg)}
.story blockquote{font:500 22px/31px var(--font-display);max-width:28ch;color:color-mix(in srgb,var(--fg) 94%,var(--story-a))}
.story .who{gap:10px;margin:18px 0 38px;font-size:13px;opacity:.75}
.av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex:none;font:600 11px var(--font-body);color:var(--fg);background:linear-gradient(135deg,color-mix(in srgb,var(--c,var(--accent)) 70%,var(--fg)),color-mix(in srgb,var(--c,var(--accent)) 60%,var(--bg)))}
.story .rd{font-size:13px;text-decoration:underline;text-underline-offset:3px;opacity:.75}
.mk{position:absolute;top:32px;left:32px;width:34px;height:34px;fill:var(--fg)}
.col{border-radius:var(--radius);display:grid;place-items:start center;padding-top:32px}
.col svg{width:34px;height:34px;fill:var(--fg)}
.c1{background:color-mix(in srgb,var(--blue) 14%,var(--announce))}
.c2{background:color-mix(in srgb,var(--accent) 14%,var(--announce))}
.c3{background:var(--announce);border:1px solid var(--border)}
.c4{background:linear-gradient(170deg,color-mix(in srgb,var(--blue) 80%,var(--fg)),var(--blue))}
/* community wall */
.cc{text-align:center}
.cc h2{color:var(--fg);font-size:36px}
.cc .wrap>p{margin:12px 0 20px;color:var(--fg-muted)}
.wall{position:relative;margin-top:80px;height:760px;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent),linear-gradient(#000 62%,transparent);mask-composite:intersect}
.wall>div{display:grid;grid-template-columns:repeat(5,288px);gap:8px;justify-content:center}
.wall .cl{display:grid;gap:8px;align-content:start}
.wall .cl:nth-child(2n){margin-top:60px}.wall .cl:nth-child(3){margin-top:100px}
.quote{padding:20px 24px 24px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-2);text-align:left;transition:border-color var(--dur) var(--ease)}
.quote:hover{border-color:var(--border-strong)}
.qh{position:relative;gap:12px;margin-bottom:18px;font-size:15px;font-weight:500}
.qh .av{width:40px;height:40px;font-size:14px}
.qh .qb{position:absolute;left:-8px;top:-8px;width:18px;height:18px;border-radius:50%;background:var(--fg);color:var(--bg);display:grid;place-items:center;font:700 10px/1 var(--font-body)}
.quote p{font-size:15px;line-height:22.5px;color:var(--fg-muted)}
.quote p b{font-weight:400;color:var(--fg)}
.quote small{display:block;margin-top:10px;font-size:12px;color:var(--fg-dim)}
/* pricing */
.ph1{text-align:center;margin-bottom:48px}
.ph1 h2{color:var(--fg);font-size:40px}
.ph1 p{margin-top:12px;font-size:17px;color:var(--fg-light)}
.plans{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:start;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-2)}
.plan{padding:32px 18px 30px;border-left:1px solid var(--border);min-height:600px}
.plan:first-child{border:0}
.plan.hi{margin:-32px 0 -32px -1px;padding-top:28px;border:1px solid color-mix(in srgb,var(--fg) 34%,transparent);border-radius:var(--radius-lg);background:var(--bg-2);box-shadow:var(--shadow-lg);min-height:664px}
.pn{gap:8px;font:400 22px/1 var(--font-mono);letter-spacing:1.5px;text-transform:uppercase}
.pn span{padding:3px 8px;border-radius:5px;background:var(--fg-light);color:var(--bg);font:500 12px/1 var(--font-body);letter-spacing:0;text-transform:none}
.plan>p{margin:14px 0 18px;font-size:15px;line-height:20px;color:var(--fg-light);min-height:40px}
.plan .btn{width:100%;height:42px;font-size:15px;border-radius:var(--radius)}
.pr{margin-top:36px;height:92px}
.pr small{font-size:13px;color:var(--fg-muted)}
.pr b{display:block;font:400 44px/1.2 var(--font-mono);letter-spacing:1px}
.pr b span{font:400 13px var(--font-body);color:var(--fg-muted);letter-spacing:0}
.inc{margin-top:18px;padding-top:28px;border-top:1px solid var(--border);font-size:13px;color:var(--fg-muted)}
.inc ul{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:14px}
.inc li{display:flex;gap:10px;color:var(--fg)}
.inc li svg{color:var(--accent);width:15px;height:15px;margin-top:1px}
.inc li em{display:block;font-style:normal;color:var(--fg-muted)}
.cmp{display:flex;justify-content:center;margin-top:64px}
.cmp .btn{background:var(--fg);color:var(--bg);border-color:var(--fg)}
/* faq */
.faq{display:grid;grid-template-columns:1fr 1.6fr;gap:64px}
.faq h2{color:var(--fg)}
details{border-bottom:1px solid var(--border)}
details:first-child{border-top:1px solid var(--border)}
summary{display:flex;justify-content:space-between;gap:16px;padding:20px 0;font-size:16px;font-weight:500;cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";color:var(--fg-muted);font-weight:400}
details[open] summary::after{content:"−"}
details p{padding:0 40px 22px 0;font-size:15px;color:var(--fg-muted)}
/* open source + cta + sec */
.os p{max-width:500px;margin:18px 0 26px;font-size:15px;line-height:23px;color:var(--fg-light)}
.os h2{color:var(--fg)}
.os .btn,.cta .btn{height:34px;padding:0 14px;font-size:14px;border-radius:var(--radius)}
.cta{text-align:center;padding:var(--section) 0 150px;border-top:1px solid var(--border);margin-top:var(--section)}
.cta h2{font-size:36px}
.cta .hb{justify-content:center}
.cta small{display:block;margin-top:16px;font-size:13px;color:var(--fg-muted)}
.secu{justify-content:center;gap:48px;padding:0 0 60px;border-bottom:1px solid var(--border);font-size:15px;flex-wrap:wrap}
.secu a{color:var(--accent)}
.secu span{gap:8px}
.secu em{font-style:normal;color:var(--fg-muted)}
/* footer */
footer{padding:80px 0 30px}
.fg6{display:grid;grid-template-columns:1.9fr repeat(6,1fr);gap:24px}
.fb .logo{font-size:28px}
.fb .logo svg{width:32px;height:32px}
.soc{gap:22px;margin:40px 0 36px;color:var(--fg-light)}
.soc svg{width:22px;height:22px}
.fb p{font-size:15px;color:var(--fg-light)}
.fin{margin:12px 0 8px;height:34px;padding:0 10px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);background:var(--control);font-size:15px;color:var(--fg-muted);display:flex;align-items:center;max-width:240px}
.fc h4{font:500 15px var(--font-display);margin-bottom:22px}
.fc a{display:block;margin-bottom:9px;font-size:15px;color:var(--fg-muted);transition:color var(--dur) var(--ease)}
.fc a:hover{color:var(--fg)}
.fl{justify-content:space-between;margin-top:80px;padding-top:30px;border-top:1px solid var(--border);font-size:12px;color:var(--fg-muted);gap:16px;flex-wrap:wrap}
.fl .g{gap:18px}
.fl i{width:7px;height:7px;border-radius:50%;background:var(--accent);margin-right:6px}
@media (prefers-reduced-motion:no-preference){
.proof i{animation:pulse 2.4s var(--ease) infinite}
@keyframes pulse{50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--accent) 0%,transparent)}}
.car{animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
}
@media (max-width:1000px){
.nl,.star{display:none}
.hg,.fw,.faq{grid-template-columns:1fr}
.lead{padding:0}
.bento{grid-template-columns:1fr 1fr}
.logos{grid-template-columns:repeat(3,1fr)}
.stats{grid-template-columns:1fr 1fr}
.stats div:nth-child(3){border-left:0}
.stats div:nth-child(n+3){border-top:1px solid var(--border)}
.stories{grid-template-columns:1fr;height:auto}
.story{min-height:460px}
.col{display:none}
.plans{grid-template-columns:1fr;border:0;background:none;gap:16px}
.plan,.plan:first-child,.plan.hi{margin:0;border:1px solid var(--border);border-radius:var(--radius-lg);min-height:0;background:var(--bg-2)}
.plan.hi{border-color:color-mix(in srgb,var(--fg) 34%,transparent)}
.fg6{grid-template-columns:repeat(3,1fr)}
.fb{grid-column:1/-1}
.dash{grid-template-columns:1fr}
.side{display:none}
}
@media (max-width:640px){
.hero{padding-top:72px;padding-bottom:48px}
h1{font-size:38px}
h2{font-size:28px}
.bento{grid-template-columns:1fr}
.card.w{grid-column:auto}
.card{min-height:360px}
.pot{right:20px;top:auto;bottom:20px;width:120px;height:120px}
.pot svg{width:100px;height:100px}
.checks{margin-top:24px}
.sh{flex-direction:column;align-items:flex-start}
.ann{font-size:13px;gap:8px;padding:0 44px 0 16px;justify-content:flex-start}
.ann>span:first-of-type{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ann i,.br,.ann a.g{display:none}
.logos,.stats{grid-template-columns:1fr 1fr}
.stats div{padding:22px 18px}
.stats div:nth-child(odd){border-left:0}
.stats div:nth-child(2){border-left:1px solid var(--border)}
.stats div:nth-child(n+3){border-top:1px solid var(--border)}
.fwg{grid-template-columns:repeat(3,1fr)}
.fwg span:nth-child(4){border-left:0}
.fwg span:nth-child(n+4){border-top:1px solid var(--border)}
.fr{grid-template-columns:1fr;gap:8px}
.note,.opt p{margin-left:0}
.win{height:640px}
.wall>div{grid-template-columns:repeat(2,minmax(0,288px))}
.wall .cl:nth-child(n+3){display:none}
.story{padding:24px}
.secu{gap:16px;flex-direction:column;align-items:flex-start;padding-inline:20px}
.fg6{grid-template-columns:1fr 1fr}
.fl{flex-direction:column;align-items:flex-start}
.nr .btn:not(.p){display:none}
}
</style>
</head>
<body>
<div class="flavor">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="mark" viewBox="0 0 32 32"><path d="M3.5 15h25a1 1 0 0 1 1 1.1A13.5 13.5 0 0 1 16 28.5 13.5 13.5 0 0 1 2.5 16.1a1 1 0 0 1 1-1.1Z" fill="var(--accent)"/><path d="M16 15h12.5a1 1 0 0 1 1 1.1A13.5 13.5 0 0 1 16 28.5Z" fill="var(--brand-deep)" opacity=".55"/><path d="M11 11c0-3 3-3.5 3-7M18 11c0-3 3-3.5 3-7" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="chk" viewBox="0 0 16 16"><path d="m3 8.5 3 3 7-7"/></symbol>
<symbol id="chev" viewBox="0 0 12 12"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4"/></symbol>
<symbol id="star" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></symbol><symbol id="branch" viewBox="0 0 24 24"><circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="7" r="2.5"/><path d="M6 7.5v9M18 9.5c0 4-12 3-12 7" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="arr" viewBox="0 0 16 16"><path d="M5 11 11 5M6 5h5v5"/></symbol>
</svg>

<div class="ann g">
<div class="br l" aria-hidden="true"></div>
<span>Soupabase Simmer 2026 is coming October 14</span><i aria-hidden="true"></i>
<a class="g" href="#"><b>Apply to attend</b>&nbsp;↗</a>
<div class="br r" aria-hidden="true"></div>
<a class="x" href="#" aria-label="Dismiss">✕</a>
</div>

<header class="hdr">
<nav class="wrap g">
<a class="logo g" href="#"><svg aria-hidden="true"><use href="#mark"/></svg>soupabase</a>
<div class="nl g">
<a class="g" href="#">Product<svg><use href="#chev"/></svg></a>
<a class="g" href="#">Developers<svg><use href="#chev"/></svg></a>
<a class="g" href="#">Solutions<svg><use href="#chev"/></svg></a>
<a href="#">Pricing</a><a href="#">Docs</a><a href="#">Blog</a>
</div>
<div class="nr g">
<a class="star g" href="#"><svg><use href="#star"/></svg>48.2K</a>
<a class="btn" href="#">Sign in</a>
<a class="btn p" href="#">Start your pot</a>
</div>
</nav>
</header>

<main>
<section class="hero wrap">
<div class="hg">
<div>
<h1>Build in a simmer<span>Serve to millions</span></h1>
<div class="hb g"><a class="btn p lg" href="#">Start your pot</a><a class="btn lg" href="#">Request a tasting</a></div>
</div>
<p class="lead">Start your project with a Postgres stockpot. Add Ladle auth, instant broth APIs, Burners at the edge, realtime Simmer, a Pantry for files and Spice for vector embeddings.</p>
</div>
<p class="proof g"><i aria-hidden="true"></i>41,380 pots started this week · 99.99% uptime since March 2024</p>
</section>

<section class="wrap" aria-label="Features">
<div class="bento">
<article class="card w">
<h3 class="g"><svg class="i"><rect x="3" y="2.5" width="12" height="4" rx="1"/><rect x="3" y="6.5" width="12" height="4" rx="1"/><rect x="3" y="10.5" width="12" height="5" rx="1"/></svg>Postgres Stockpot</h3>
<p>Every project is <b>a full Postgres database</b>, slow-cooked, portable and yours to take home in one <b>pg_dump</b>.</p>
<div class="pot" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M14 40h72M20 40v30a14 14 0 0 0 14 14h32a14 14 0 0 0 14-14V40M8 46h12M80 46h12M36 30c0-6 6-6 6-12M52 30c0-6 6-6 6-12"/><circle cx="64" cy="58" r="3" fill="var(--fg-dim)"/></svg></div>
<div class="checks"><span class="g"><svg class="i"><use href="#chk"/></svg>100% portable broth</span><span class="g"><svg class="i"><use href="#chk"/></svg>Built-in Ladle with RLS</span><span class="g"><svg class="i"><use href="#chk"/></svg>Easy to season</span></div>
</article>
<article class="card">
<h3 class="g"><svg class="i"><rect x="4" y="7.5" width="10" height="8" rx="2"/><path d="M6.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5M7 11h4"/></svg>Ladle Auth</h3>
<p><b>Add sign ups and logins</b>, and keep every bowl behind Row Level Security.</p>
<div class="tiles" aria-hidden="true"></div>
</article>
<article class="card">
<h3 class="g"><svg class="i"><circle cx="9" cy="9" r="6.5"/><path d="M4 12c3-1 7-5 8-9M6 4c2 1 6 6 6 11"/></svg>Burners</h3>
<p>Easily write custom code <b>without deploying or scaling stoves.</b></p>
<div class="term g" aria-hidden="true">$ soupabase <span class="grn">burners deploy</span></div>
<svg class="art" viewBox="0 0 260 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".7" opacity=".6"><ellipse cx="200" cy="250" rx="230" ry="200"/><ellipse cx="200" cy="250" rx="170" ry="200"/><ellipse cx="200" cy="250" rx="100" ry="200"/><ellipse cx="200" cy="250" rx="36" ry="200"/><path d="M-30 160q230-70 460 0M-30 110q230-70 460 0M-30 215q230-70 460 0"/></g><path d="M130 60v50l30 35 30 20-6 30 60 8" fill="none" stroke="var(--fg)" stroke-width="1"/><g fill="var(--fg)"><circle cx="130" cy="110" r="3"/><circle cx="20" cy="175" r="3"/><circle cx="244" cy="205" r="3"/></g></svg>
</article>
<article class="card">
<h3 class="g"><svg class="i"><path d="M3 5.5h12v10H3zM5 2.5h8M6.5 9.5h5"/></svg>Pantry</h3>
<p><b>Store, organize and serve</b> large files, from menus to plating videos.</p>
<div class="fileg" aria-hidden="true"></div>
</article>
<article class="card">
<h3 class="g"><svg class="i"><path d="M2.5 9a6.5 6.5 0 0 1 13 0M5 9a4 4 0 0 1 8 0"/><circle cx="9" cy="9" r="1.2"/></svg>Simmer</h3>
<p><b>Build multiplayer kitchens</b> with realtime broth synchronization.</p>
<div class="art gridbg" aria-hidden="true"><div class="bub g"><i></i><i></i><i></i></div><svg class="cur" style="left:64px;top:92px" viewBox="0 0 20 26"><path d="M2 2v20l5-5 4 8 3-1.5-4-8h7z"/></svg><svg class="cur" style="left:170px;top:190px;width:18px;opacity:.6" viewBox="0 0 20 26"><path d="M2 2v20l5-5 4 8 3-1.5-4-8h7z"/></svg></div>
</article>
<article class="card">
<h3 class="g"><svg class="i"><path d="M9 2 15.5 5.5v7L9 16l-6.5-3.5v-7zM9 9v7M9 9l6.5-3.5M9 9 2.5 5.5"/></svg>Spice</h3>
<p>Plug in your favourite models to <b>store, index and search flavour embeddings</b>.</p>
<svg class="art" viewBox="0 0 260 240" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.1"><path d="M130 50 196 86v76l-66 36-66-36V86zM130 122v76M130 122l66-36M130 122 64 86"/></g><path d="M40 216 130 150M130 150 210 60" stroke="var(--accent)" stroke-dasharray="2 5" stroke-width="1.4" fill="none"/><g fill="var(--accent)"><circle cx="104" cy="160" r="3.5"/><circle cx="150" cy="112" r="3"/><circle cx="184" cy="72" r="3"/><circle cx="212" cy="156" r="4"/><circle cx="54" cy="118" r="2"/></g><g fill="var(--fg-dim)"><circle cx="160" cy="176" r="4"/><circle cx="24" cy="120" r="3"/><circle cx="238" cy="130" r="2"/></g></svg>
</article>
<article class="card">
<h3 class="g"><svg class="i"><path d="M3 5h12M3 9h12M3 13h7"/></svg>Broth API</h3>
<p>Instant, ready-to-sip <b>REST and GraphQL APIs</b>.</p>
<div class="api" aria-hidden="true"></div>
</article>
</div>
<p class="use"><span class="fg">Use one or all.</span> Best-in-pot products. Served as one platform.</p>
</section>

<p class="wrap trust">Trusted by fast-growing kitchens worldwide</p>
<section class="frame" aria-label="Customers and stats">
<div class="fi">
<div class="logos"></div>
<div class="stats">
<div><b>2.4M</b><span>Pots simmering</span></div>
<div><b>11ms</b><span>Median ladle latency</span></div>
<div><b>48.2K</b><span>Stars on the forge</span></div>
<div><b>17</b><span>Regions, one broth</span></div>
</div>
</div>
</section>

<section class="sec wrap">
<div class="sh"><h2><span>Stay productive and manage your pot</span>without leaving the dashboard</h2></div>
<div class="tabs g"><a class="tab on" href="#">Table Editor</a><a class="tab" href="#">SQL Editor</a><a class="tab" href="#">RLS Policies</a></div>
<div class="win" aria-hidden="true">
<div class="dots g"><i></i><i></i><i></i></div>
<div class="dash">
<div class="side"><div></div><div></div><div class="on"></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
<div class="panel">
<div class="ph g">Create a new table under <code>kitchen</code></div>
<div class="fr"><span>Name</span><span class="in">minestrone<i class="car"></i></span></div>
<div class="fr"><span>Description</span><span class="in ph2">Optional</span></div>
<div class="opt">
<div class="ck g"><i><svg class="i"><use href="#chk"/></svg></i>Enable Row Level Security (RLS) <span class="pill">Recommended</span></div>
<p>Restrict who can dip into this table with Postgres policies.</p>
<div class="note"><svg class="i" style="width:18px;height:18px"><circle cx="9" cy="9" r="7"/><path d="M9 8v4M9 5.5v.1"/></svg><div><b>Policies are required to query data</b><p class="mut">Without a policy, every select returns an <u>empty bowl</u>. You can add policies after saving this table.</p><span class="btn">↗ RLS Documentation</span></div></div>
</div>
</div>
</div>
</div>
</section>

<section class="sec wrap fw">
<div class="sh" style="margin:0"><h2><span>Use Soupabase with</span>any frontend</h2></div>
<div>
<div class="fwg" aria-hidden="true"></div>
<pre><span class="k">import</span> <span class="c">{</span> createPot <span class="c">}</span> <span class="k">from</span> <span class="s">'@soupabase/ladle-js'</span>

<span class="k">const</span> pot <span class="k">=</span> <span class="f">createPot</span>(
  process<span class="c">.</span>env<span class="c">.</span><span class="f">SOUPABASE_URL</span>,
  process<span class="c">.</span>env<span class="c">.</span><span class="f">SOUPABASE_ANON_KEY</span>
)

<span class="k">export default function</span> <span class="f">Menu</span>() {
  <span class="k">const</span> [soups, setSoups] <span class="k">=</span> <span class="f">useState</span>([])
  <span class="f">useEffect</span>(() <span class="k">=&gt;</span> {
    pot<span class="c">.</span><span class="f">from</span>(<span class="s">'soups'</span>)<span class="c">.</span><span class="f">select</span>(<span class="s">'*'</span>)
      <span class="c">.</span><span class="f">then</span>(({ data }) <span class="k">=&gt;</span> <span class="f">setSoups</span>(data))
  }, [])
  <span class="k">return</span> <span class="c">&lt;</span><span class="f">SoupList</span> items<span class="k">=</span>{soups} <span class="c">/&gt;</span>
}<a class="btn" href="#">Read the frontend docs ↗</a></pre>
</div>
</section>

<section class="sec wrap">
<div class="sh"><h2>How busy kitchens<span>are cooking with Soupabase</span></h2><a class="lk" href="#">More customer stories</a></div>
<div class="stories">
<div class="story">
<svg class="mk" viewBox="0 0 34 34" aria-hidden="true"><path d="M4 14h26v4a13 13 0 0 1-26 0zM11 10c0-3 3-3 3-6M19 10c0-3 3-3 3-6"/></svg>
<blockquote class="quote-big">Brothwell went from one kitchen in Leeds to 212 ghost kitchens in nine months. The database never once asked for a weekend.</blockquote>
<div class="who g"><span class="av" style="--c:var(--story-c)">IM</span>Ines Marwood, Head of Platform, Brothwell</div>
<a class="rd" href="#">Read the story →</a>
</div>
<div class="col c1"><svg viewBox="0 0 34 34" aria-hidden="true"><path d="M6 24 17 6l11 18z"/></svg></div>
<div class="col c2"><svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="10"/></svg></div>
<div class="col c3"><svg viewBox="0 0 34 34" aria-hidden="true"><path d="M7 7h20v6H13v4h10v4H13v6H7z"/></svg></div>
<div class="col c4"><svg viewBox="0 0 34 34" aria-hidden="true"><path d="M5 26 29 6l-6 22-7-7z"/></svg></div>
</div>
</section>

<section class="sec cc" aria-label="Testimonials">
<div class="wrap">
<h2>Join the kitchen</h2>
<p>Discover what our community has to say about their Soupabase experience.</p>
<a class="btn lg" href="#">Join the forum</a>
</div>
<div class="wall"><div></div></div>
</section>

<section class="sec wrap" aria-label="Pricing">
<div class="ph1"><h2>Predictable pricing, designed to simmer</h2><p>Start free, cook with your team, then scale to millions of bowls.</p></div>
<div class="plans">
<div class="plan"><div class="pn">Free</div><p>Perfect for passion projects and one-pot websites.</p><a class="btn p" href="#">Start for Free</a><div class="pr"><small>&nbsp;</small><b>$0<span> / month</span></b></div><div class="inc">Get started with:<ul data-l="Unlimited API ladles|50,000 monthly active diners|500 MB stockpot|1 GB pantry storage|Community support"></ul></div></div>
<div class="plan hi"><div class="pn">Pro <span>Most Popular</span></div><p>For production kitchens with the power to scale.</p><a class="btn p" href="#">Get Started</a><div class="pr"><small>From</small><b>$25<span> / month</span></b></div><div class="inc">Everything in Free, plus:<ul data-l="100,000 monthly active diners~then $0.00325 per diner|8 GB stockpot per project~then $0.125 per GB|100 GB pantry storage|Daily backups kept 7 days|Email support"></ul></div></div>
<div class="plan"><div class="pn">Team</div><p>Add SSO, control over backups and kitchen-grade certifications.</p><a class="btn" href="#">Get Started</a><div class="pr"><small>From</small><b>$599<span> / month</span></b></div><div class="inc">Everything in Pro, plus:<ul data-l="SOC2 and ISO 27001|SSO for the dashboard|Priority email support and SLAs|Daily backups kept 14 days|28-day log retention"></ul></div></div>
</div>
<div class="cmp"><a class="btn" href="#">Compare Plans ↓</a></div>
</section>

<section class="sec wrap faq" aria-label="FAQ">
<h2><span>Frequently asked</span>questions</h2>
<div>
<details open><summary>Is it really just Postgres underneath?</summary><p>Yes. Every pot is a dedicated Postgres 17 instance with superuser access. Connect with psql, any ORM or the 40-year-old tool your DBA refuses to give up.</p></details>
<details><summary>Can I take my broth somewhere else?</summary><p>Run pg_dump and walk away. Soupabase is open source under Apache 2.0, and the self-hosted stack boots from a single compose file.</p></details>
<details><summary>What happens when a free pot sits idle?</summary><p>Free pots are paused after seven days without traffic. Nothing is deleted; press Restore and it is back on the stove in about a minute.</p></details>
<details><summary>Do Burners run close to my diners?</summary><p>Burners deploy to 17 regions and start in under 40 ms. They run TypeScript, read your stockpot through a pooled connection and scale to zero overnight.</p></details>
</div>
</section>

<section class="sec wrap os">
<h2>Open source from the first stir</h2>
<p>Soupabase is built in the open because a kitchen should be inspectable. Read the recipes, contribute a seasoning, self-host the whole thing. You are never locked in the pantry.</p>
<a class="btn" href="#"><svg style="fill:currentColor"><use href="#branch"/></svg>View the source</a>
</section>

<section class="cta">
<div class="wrap">
<h2>Build in a simmer, <span class="tail">serve to millions</span></h2>
<div class="hb g"><a class="btn p lg" href="#">Start your pot</a><a class="btn lg" href="#">Request a tasting</a></div>
<small>Free forever for two pots. No card required.</small>
</div>
</section>
<div class="secu g wrap"><span class="g">We protect your broth.&nbsp;<a href="#">More on Security</a></span><span class="g"><svg class="i"><use href="#chk"/></svg>SOC2 Type 2 <em>Certified</em></span><span class="g"><svg class="i"><use href="#chk"/></svg>HIPAA <em>Compliant</em></span><span class="g"><svg class="i"><use href="#chk"/></svg>ISO 27001 <em>Certified</em></span></div>
</main>

<footer>
<div class="wrap">
<div class="fg6">
<div class="fb">
<a class="logo g" href="#"><svg aria-hidden="true"><use href="#mark"/></svg>soupabase</a>
<div class="soc g"><svg class="i"><rect x="2" y="4" width="14" height="10" rx="2"/><path d="m2.5 5 6.5 5 6.5-5"/></svg><svg class="i"><path d="M3 4h12v8H8l-3 3v-3H3z"/></svg><svg class="i"><circle cx="9" cy="9" r="6.5"/><path d="m7.5 6.5 4 2.5-4 2.5z"/></svg><svg class="i"><path d="M3 3a12 12 0 0 1 12 12M3 8a7 7 0 0 1 7 7"/><circle cx="4" cy="14" r="1.2"/></svg></div>
<p>Get product updates and recipes from Soupabase.</p>
<div class="fin">you@brothwell.kitchen</div>
<a class="btn p" href="#">Subscribe</a>
</div>
</div>
<div class="fl g"><span>© 2026 Soupabase Inc, Lisbon</span><span class="g"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Status</a></span><span class="g"><i></i>All pots simmering · 99.99% uptime, 90 days</span></div>
</div>
</footer>
</div>
<script>
const $=(s)=>document.querySelector(s);
const H=(s,h)=>{const e=$(s);if(e)e.innerHTML=h};
const V=(n)=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n))||0;
const drawBrackets=()=>{const d=Math.min(1,Math.max(.1,V("--bracket-density")));const set="{[(<‹".split(""),cl="}])>›".split("");let seed=7;const r=()=>(seed=(seed*9301+49297)%233280)/233280;
const row=(n,open)=>Array.from({length:n},()=>r()<d?(open?set:cl)[Math.floor(r()*5)]:" ").join("");
H(".br.l",[0,1,2].map((i)=>row(38-i*6,true)+(i===2?"<em>}</em>":"")).join("\n"));H(".br.r",[0,1,2].map((i)=>row(22+i*8,false)).join("\n"))};
drawBrackets();document.addEventListener("flavor:tweak",drawBrackets);
H(".tiles",["0198@basil.io","marco1601","·","·","4567@fennel.co","noodlemaster"].map((t,i)=>`<span class="${i>1&&i<4?"bl":""}">${i>1&&i<4?"xxxxxxxxxxxx":t}</span>`).join(""));
const ic={img:'<rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m17 13-4-4-8 8"/>',doc:'<path d="M5 2.5h6l4 4v11H5zM11 2.5v4h4"/>',vid:'<rect x="2.5" y="5" width="11" height="10" rx="1.5"/><path d="m13.5 9 4-2.5v7l-4-2.5"/>'};
H(".fileg",["img","doc","vid"].flatMap((k)=>Array(4).fill(`<i><svg class="i" viewBox="0 0 20 20">${ic[k]}</svg></i>`)).join(""));
H(".api",["soups","stocks","broths","noodles","garnish"].map((t)=>`<div class="g"><span>▦ ${t}</span><em>…/v1/<b>${t}</b></em></div>`).join(""));
H(".logos","Brothwell|ladle&co|Kettleworks|MISO/OPS|Stovetop|Pho Real|Saltbox|Cauldra|Bouillon|souper|Umami Labs|Gazpacho".split("|").map((t)=>`<span>${t}</span>`).join(""));
const fw=['<path d="M13 3a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/><ellipse cx="13" cy="13" rx="10" ry="4"/>','<path d="M4 21 13 4l9 17z"/>','<path d="M13 3 22 8v10l-9 5-9-5V8z"/>','<rect x="4" y="4" width="18" height="18" rx="4"/>','<path d="M4 20 13 5l9 15M8 14h10"/>','<circle cx="13" cy="13" r="3"/><circle cx="13" cy="13" r="9"/>'];
H(".fwg",fw.map((p,i)=>`<span class="${i?"":"on"}"><svg viewBox="0 0 26 26">${p}</svg></span>`).join(""));
const Q=[["mara_builds","IM","Moved our whole ordering backend to Soupabase over a weekend. <b>RLS just clicked.</b> Auth, storage and the SQL editor in one tab is unreal.","--violet"],["teo_simmers","TS","Fun, lightweight, and <b>really quick to spin up</b> auth plus a few tables. Almost too easy.","--accent"],["priyacodes","PK","Ran Soupabase locally and just sat there in silence. <b>This is the tooling I want for my team.</b>","--orange"],["okonkwo","CO","Starting a new project, <b>really impressed with Ladle and RLS.</b> Security got much simpler for a solo founder.","--blue"],["jules_h","JH","Soupabase is really good.","--story-a"],["nadia.sql","NS","From docs to latency to the URL structure, <b>everything makes you think \"oh, that's obvious\".</b> Every platform should study it.","--accent"],["fennel_co","FC","The Burners cold start is under 40 ms. We deleted two services and a queue.","--violet"],["benny_k","BK","Finally tried it today and wow, why did I wait so long? <b>Auth, database and realtime in about 20 minutes.</b>","--orange"],["rosa.ts","RT","I've always used Soupabase just as a database. Then I found the pantry.","--blue"],["hal9001","HN","Very impressed by how fast they've gone from <b>\"promising\" to \"standard\"</b>.","--story-c"]];
const card=([h,i,t,c])=>`<div class="quote"><div class="qh g"><span class="qb">&ldquo;</span><span class="av" style="--c:var(${c})">${i}</span>@${h}</div><p>${t}</p></div>`;
H(".wall>div",[0,1,2,3,4].map((c)=>`<div class="cl">${[Q[c],Q[c+5],Q[(c+3)%10]].map(card).join("")}</div>`).join(""));
document.querySelectorAll("[data-l]").forEach((u)=>{u.innerHTML=u.dataset.l.split("|").map((l)=>{const[a,b]=l.split("~");return `<li><svg class="i"><use href="#chk"/></svg><span>${a}${b?`<em>${b}</em>`:""}</span></li>`}).join("")});
const cols=[["Product","Stockpot|Ladle Auth|Burners|Simmer|Pantry|Spice|Cron"],["Solutions","Ghost kitchens|Startups|Agencies|Enterprise|Switch from Firestew"],["Resources","Blog|Support|System Status|Partners|Security"],["Developers","Documentation|Recipe Library|Changelog|RSS"],["Community","Events|SoupSquad|Contributing|Open Source"],["Company","About|Careers|Legal Hub|Privacy|Contact"]];
$(".fg6").insertAdjacentHTML("beforeend",cols.map(([h,l])=>`<div class="fc"><h4>${h}</h4>${l.split("|").map((t)=>`<a href="#">${t}</a>`).join("")}</div>`).join(""));
</script>
<script type="application/json" data-flavor-tweaks>{"controls":[{"var":"--hair-alpha","label":"Hairlines","min":3,"max":18,"step":0.5,"unit":"%"},{"var":"--radius-lg","label":"Card radius","min":0,"max":28,"step":1,"unit":"px"},{"var":"--grid-alpha","label":"Grid lines","min":0,"max":14,"step":1,"unit":"%"},{"var":"--bracket-density","label":"Bracket density","min":0.1,"max":1,"step":0.05},{"var":"--story-spin","label":"Story gradient angle","min":-90,"max":90,"step":5,"unit":"deg"}],"schemes":[{"name":"Daylight","vars":{"--bg":"#fcfcfc","--bg-2":"#ffffff","--fg":"#171717","--fg-muted":"#707070","--accent":"#1c8a55","--accent-fg":"#f7fdf9","--brand-deep":"#3ecf8e","--announce":"#f8f3ef","--violet":"#6d28d9","--orange":"#c2410c","--blue":"#3b46e0","--story-a":"#ff3d9a","--story-b":"#ff2244","--story-c":"#ff8a1c"}},{"name":"Jade Night","vars":{"--bg":"#1c1c1c","--bg-2":"#232323","--fg":"#ededed","--fg-muted":"#8f8f8f","--accent":"#3ecf8e","--accent-fg":"#052e1c","--brand-deep":"#1a7f57","--announce":"#161616","--violet":"#c4b5fd","--orange":"#fdba74","--blue":"#4f5bd5","--story-a":"#7c3aed","--story-b":"#db2777","--story-c":"#f59e0b"}},{"name":"Nocturne","vars":{"--bg":"#0d1117","--bg-2":"#131a24","--fg":"#e6edf3","--fg-muted":"#8b96a5","--accent":"#5eead4","--accent-fg":"#042f2e","--brand-deep":"#0f766e","--announce":"#090d13","--violet":"#a5b4fc","--orange":"#fbbf24","--blue":"#2563eb","--story-a":"#2563eb","--story-b":"#7c3aed","--story-c":"#06b6d4"}},{"name":"Paprika","vars":{"--bg":"#151210","--bg-2":"#1c1815","--fg":"#f4ede6","--fg-muted":"#a3968a","--accent":"#fb7a3c","--accent-fg":"#2a1206","--brand-deep":"#9a3412","--announce":"#0f0c0a","--violet":"#e9a8f2","--orange":"#fcd34d","--blue":"#b45309","--story-a":"#fbbf24","--story-b":"#f97316","--story-c":"#dc2626"}}]}</script>
</body>
</html>
```
