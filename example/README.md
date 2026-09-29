# Working example

A single dependency-free HTML file that exercises the whole system.

```sh
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/example/
```

Opening the file directly with `file://` will not work — it loads
`../skills/editorial-dark/assets/*.css` over HTTP.

## What it demonstrates

| Feature | Where |
|---|---|
| Fluid type with `vw` + `svh` | Hero headline |
| Line-masked text reveal | Hero, section titles, card names |
| Word-level stagger via `var(--i)` | Hero and titles |
| `data-reveal="dim"` at 14% → 100% | Statement, contact hook |
| Three-role typography | Bricolage Grotesque / Inter / Instrument Serif |
| Inverted light section | Showcase, via local token override |
| Sticky full-height cards + progress bar | Process, 25/50/75/100% |
| Per-item float with negative delays | Showcase cards |
| SVG grain with `steps(4)` | Full-page overlay |
| Custom cursor, 3 layers | Dot / ring / contextual badge |
| Oversized footer wordmark | 17.5vw uppercase |
| Count-up on scroll | Statement stats |
| Burger + mobile nav | Below 700px |
| Reduced-motion **layout** change | Carousel → grid, cursor → native |
| No-JS reset | `<noscript>` in `<head>` |

Everything visual is CSS gradients or inline SVG. There are no raster images
and no image requests at all.

## Verified

Checked in a real browser at 390×844, 844×390, 320×568, 768×1024, 1440×900 and
1920×400:

- No horizontal scroll at any width
- No interactive element under 44px
- Contrast: `--ink` 15.93:1, `--ink-dim` 5.61:1, lifted `--ink-faint` 4.56:1
- One `<h1>`, every input labelled, zero console errors
- Reduced motion: preloader skipped, native cursor restored, sticky cards
  become static, carousel becomes a single-column grid
- 1920×400 yields a 104px headline, not 259px — the `svh` clamp is doing its job

## Bugs this example caught

The example earned its place by surfacing real defects in the system, each now
documented in the reference files:

1. **`:nth-child` off-by-one.** A screen-reader-only `<h2>` as the section's
   first child shifted every card theme by one. Nothing looked broken — the
   colours were valid, just on the wrong card. → `references/layout.md`
2. **`aspect-ratio` on an inline box.** A `<span>` media container with no
   `display: block` collapsed to zero height and the artwork silently vanished.
3. **Text splitting destroying markup.** Rewriting `textContent` deletes inline
   children, so the serif accent span lost its styling. The splitter now walks
   the tree and moves original nodes.
4. **Re-split dropping reveal state.** Rebuilding word spans on resize discards
   `.w.is-visible`; words stuck at 14% opacity permanently. Fixed by restoring
   the state inside the rebuild, since the observer has already unobserved.
5. **A `#6b6963` claim that measured 3.52:1.** Documentation said ~4.5:1; it
   failed AA. The measured AA-safe value is `#7d7b75` at 4.56:1.
6. **Reduced motion leaking a watermark.** Setting `position: static` on a card
   removed the containing block for its absolutely-positioned ghost number,
   which floated over the top of the document.

## Reading the code

`index.html` is ordered so the reusable parts are obvious:

1. `<head>` — pre-paint veil with a failure timeout, then the `<noscript>`
   reset
2. The two skill assets, loaded unmodified
3. Example-specific CSS only
4. Body
5. Script — seven numbered sections, each commented with what it does and why

The split/reveal logic (section 2 and 3) is the part worth copying. It is
about 90 lines of dependency-free JavaScript and covers the cases that naive
implementations get wrong: inline children, whitespace, resize, and reveal
state.
