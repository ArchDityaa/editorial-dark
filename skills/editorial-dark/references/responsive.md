# Responsive

## Breakpoints are failure conditions, not a scale

Each breakpoint in the reference build corresponds to something specific
breaking. Do not add one because a number feels round.

| Query | What changes | Why |
|---|---|---|
| `max-width: 1100px` | FAQ rows 3-col → 1-col | `5rem + 1.1fr` stops fitting |
| `max-width: 900px` | Nav → burger, grids → 1-col, carousel → native scroll | Main collapse point |
| `max-width: 560px` | Header CTA hidden, stats 1-col, form padding cut | Space runs out |
| `max-width: 400px` | Thumbnails hidden, tighter clamps, 1-col footers | Extreme narrow |
| `max-width: 560px` **and** `max-height: 650px` | Carousel meta → absolute overlay | Short landscape |
| `max-width: 900px` **and** `max-height: 520px` **and** `landscape` | Hero 2-col kept, description hidden | Phone landscape |
| `max-height: 560px` | Sticky cards → static | `100svh` cards overflow short viewports |

That last two rows are the ones most sites skip entirely.

## Viewport units — pick per context

```css
.hero   { height: 100vh; height: 100svh; }              /* stable, no URL-bar jitter */
.pin    { min-height: 100vh; min-height: 100dvh; }      /* dynamic, must respond */
.bleed  { min-height: 100lvh; }                         /* largest, full-bleed media */
```

Always the double declaration: `vh` first as the fallback, then the modern unit.

Choosing per context is the part that matters:

- **`svh`** for a hero that should not reflow when the URL bar hides. Using
  `dvh` here makes the hero jump ~60px every time the bar collapses.
- **`dvh`** for pinned carousels, which must track the real available height or
  cards get cut off.
- **`lvh`** for full-bleed media that should use every pixel.

### Mixing units in type

```css
font-size: clamp(4.2rem, min(13.5vw, 26svh), 16rem);
```

Display type mixes `vw` and `svh`, so it shrinks on a short-but-wide window, not
only a narrow one. A `vw`-only headline becomes absurd on a 1920×400 window.
This is unusually careful and worth adopting for any display type.

## Short landscape, actually handled

```css
@media (max-width: 900px) and (max-height: 520px) and (orientation: landscape) {
  .hero__inner { grid-template-columns: minmax(0,1.35fr) minmax(11rem,.65fr); }
  .hero__desc  { display: none; }
  .mnav__links { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); }
}
```

A phone in landscape is constrained by **height**, not width. An 844px-wide
iPhone does trip the 900px breakpoint, but that rule assumes a tall viewport and
sets `min-height: 100svh` heroes that overflow when only ~390px of height is
available. Hence the extra `max-height` and `orientation` conditions: shorter
hero, descriptive text dropped, mobile menu reflowed to two columns.

Test this case explicitly. It is the single most-skipped breakpoint in web
development.

## Touch vs hover

```css
@media (max-width: 900px) {
  .card__open { opacity: 1; transform: none; }   /* no hover on touch */
  .services__meta { opacity: 1; transform: none; }
  .nav__burger { display: inline-flex; }
}
```

Anything revealed on hover must be permanently visible on touch. This is not
just a media query decision — a primary-surface hover also fails for keyboard
users of hybrid devices, so tie it to `(hover: hover)` when you can:

```css
@media (hover: hover) and (pointer: fine) {
  .card__open { opacity: 0; transform: translateY(-.75rem); }
}
```

## Short-height fallbacks

```css
@media (max-height: 560px) {
  .process-card { position: relative; min-height: auto; }
  .process-card__inner { min-height: 0; padding-block: 3rem; }
}
```

A `min-height: 100svh` sticky card on a 500px-tall window produces one card per
screen with no content visible. Below a height threshold, drop to static flow.

## Testing matrix

Check at minimum:

| Width | Height | Target |
|---|---|---|
| 320 | 568 | Smallest supported |
| 390 | 844 | iPhone |
| 768 | 1024 | Tablet portrait |
| 844 | 390 | **Phone landscape** |
| 1024 | 768 | Tablet landscape |
| 1440 | 900 | Laptop |
| 1920 | 400 | **Short and wide** — type overflow |

The last two catch problems the others cannot. A 1920×400 window breaks any
`vw`-only display type, and 844×390 breaks any `vh`-only full-height section.

Also test with a long unbroken string (`aaaaaaaaaaaaaaa`) in a headline, and
with browser zoom at 200%.
