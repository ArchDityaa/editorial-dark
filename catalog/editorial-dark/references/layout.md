# Layout

## The gutter system — the most transferable trick here

```css
--pad:         clamp(1.25rem, 4vw, 4rem);
--content-max: 128rem;

--gutter: var(--pad);
--gutter: max(var(--pad), calc((100vw - var(--content-max)) / 2));
```

**The second declaration silently overrides the first.** This is intentional CSS
layering, not a bug: the fallback applies on old browsers, the `max()` version
takes over on modern ones.

The result is a fluid outer margin that grows with the viewport until content
reaches 128rem, then holds. One declaration replaces what would otherwise be
several media queries or a container query. Use this.

## The 12-column editorial grid

```css
.strip__head {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0 clamp(.8rem, 1.5vw, 1.5rem);
  padding: 0 var(--gutter);
}
.strip__eyebrow { grid-column: 1 / span 3; }
.strip__title   { grid-column: 4 / -1; }
.strip__intro   { grid-column: 7 / -1; }
```

`minmax(0, 1fr)` and never `1fr`. The `0` minimum is what stops a long
unbreakable word from blowing out the track. This is needed on every grid in a
text-heavy site, and the failure mode is a horizontal scrollbar that only appears
on some pages.

## Asymmetric two-column, everywhere

```css
grid-template-columns: minmax(200px, .55fr) minmax(0, 1.45fr);
grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
grid-template-columns: minmax(5.5rem, .32fr) minmax(0, 1.25fr) minmax(20rem, .82fr);
```

Never 50/50. A narrow rail carries a sticky label; a wide rail carries content.
`minmax(200px, …)` guarantees the label rail cannot collapse below a readable
width, and `minmax(20rem, …)` guarantees a media column never drops below
something usable.

## Overflow safety

One rule block applies the fix across many classes at once:

```css
.hero__line, .strip__title, .case__title, .contact__mail,
.footer__col a, .mnav__links a { overflow-wrap: anywhere; }

.strip__title, .process__title-main, .case__title,
.archive__title, .contact__hook { text-wrap: balance; }
```

`anywhere` rather than `break-word` is correct for uppercase display type, where
a single long word can otherwise overflow the viewport. `text-wrap: balance` on
headings stops a two-word headline breaking as one word per line.

`overflow: clip` on the root is the final backstop — prefer it over `hidden`
because `hidden` creates a scroll container.

## Sticky side labels

```css
.manifesto__label { position: sticky; top: 7rem; }
.manifesto__stats  { position: sticky; top: 11rem; }
```

The label tracks the top while body text scrolls past. Set both to
`position: static` on mobile — sticky rails do not survive narrow viewports
because the rail is no longer tall enough to stick against.

## Alternating full-height cards

Four cards, `position: sticky; top: 0; min-height: 100svh`, with even cards
mirroring the entire layout:

```css
.process-card:nth-child(2n) .process-card__index { grid-column: 3; text-align: right; }
.process-card:nth-child(2n) .process-card__visual { grid-column: 1; }
```

Because every inner rule references `var(--card-*)`, a single declaration
re-themes ~30 properties. See `tokens.md` for the inversion pattern.

### Theme with `:nth-of-type`, never `:nth-child`

```css
/* Correct — counts only <article> siblings */
.pcard:nth-of-type(1) { --card-progress: 25%; }
.pcard:nth-of-type(2) { --card-progress: 50%; }

/* Wrong if the section has any non-article first child */
.pcard:nth-child(1) { --card-progress: 25%; }
```

A screen-reader-only heading is the usual culprit:

```html
<section class="process">
  <h2 class="sr-only">Process</h2>   <!-- this is :nth-child(1) -->
  <article class="pcard">…</article>  <!-- this is :nth-child(2) -->
</section>
```

With the `<h2>` present, `:nth-child(2)` matches the **first** card. Every
theme shifts by one, and nothing looks broken — the colours are all valid, just
attached to the wrong card. `:nth-of-type` counts only siblings of the same tag,
so it is immune to any stray wrapper. This bug is invisible in a screenshot of
one card and obvious the moment you compare two.

> `min-height: 100svh` on sticky cards: use `svh`, not `vh`. `vh` includes the
> mobile URL bar, so the last card gets cut off when the bar is visible.

## 3D carousel

```css
.strip__viewport { perspective: 1200px; perspective-origin: 58% 48%; }
.strip__rail     { transform-style: preserve-3d; }
.strip-card      { transform-style: preserve-3d; opacity: .52; }
.strip-card.is-dominant { opacity: 1; }
```

Two details worth keeping:

- **Attention is tracked by opacity, not scale.** Cards sit at 52% and the focused
  one goes to full. Scaling every card changes layout continuously and jitters;
  opacity is free.
- **The perspective origin is off-centre** (58% 48%). A centred vanishing point
  looks symmetrical and flat; off-axis reads as more dimensional.

### Perspective must not be clipped

An ancestor with `overflow: hidden` flattens a `perspective` child — the
`preserve-3d` chain breaks and the depth disappears. Put `perspective` on the
element that actually holds the 3D transform, and do not clip above it.

### Two implementations, one markup

The reference build ships both, selected by class:

```css
.strip.is-carousel-native .strip__pin { position: sticky; top: 0; }
/* native scroll-snap variant */
scroll-snap-type: x mandatory;
```

A JS-driven carousel where supported, native scroll-snap otherwise. Decide at
runtime, keep one markup. Do not ship a carousel that only works with JS.

## Section shape language

```css
.editorial-light {
  border-radius: var(--sec-radius) var(--sec-radius) 0 0;   /* top only */
  padding-bottom: calc(clamp(8rem, 16vh, 13rem) + var(--sec-radius));
}
```

Large radius on the top corners of a light section, with bottom padding increased
by the radius so content does not crowd the curve. Sections alternate
dark → light → dark → light. That rhythm is what stops a long single-page site
from feeling like one undifferentiated scroll.

## Odd-but-right details

```css
.legend li:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
```

`:nth-child(-n+2)` selects the first two, letting you draw borders on a 2×2
grid without special-casing corners.

```css
.card:nth-child(2) { margin-top: 1.25rem; }
.card:nth-child(8) { margin-top: 8.75rem; }
```

Eight explicit rules producing a descending stagger in the static fallback —
when the carousel becomes a grid, the cards keep their stepped rhythm. Verbose,
and the only way to preserve the effect without JS.
