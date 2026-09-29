# Accessibility

The reference build's accessibility work is above average. These are habits worth
copying wholesale.

## The no-JS rule

Any system that starts elements at `opacity: 0` makes its content **invisible
without JavaScript**. The reference build inverts the risk with a `<noscript>`
block that forces every hidden start state back to its final visible value:

```html
<noscript><style>
  .preloader { display: none }
  [data-reveal], [data-split] { opacity: 1 !important; transform: none !important; }
  .archive__filters { display: none !important; }
</style></noscript>
```

Any element that **blocks the page** — a preloader, a splash, a cookie wall —
needs the same treatment. A `<noscript>`-hidden preloader means a blank page for
anyone with JS disabled.

Put this in `<head>`, as early as possible.

## Reduced motion is a layout change

Not a token scrub. A real override that changes what the components *are*:

```css
@media (prefers-reduced-motion: reduce) {
  /* Restore the native cursor and remove the custom one */
  html.has-cursor body { cursor: auto !important; }
  html.has-cursor a, button, label, summary { cursor: pointer !important; }
  .cursor, .cursor-ring, .cursor-badge { display: none }

  /* Stop ambient loops */
  .grain { animation: none }
  .pulse { animation: none }

  /* Skip blocking UI */
  .preloader { display: none }

  /* Force every hidden start state visible */
  [data-reveal], .w { opacity: 1 !important; transform: none !important; }

  /* Kill all transitions as a backstop */
  * { transition-duration: .01ms !important; }
}
```

The `*` backstop is deliberate: handle each case individually, *then* add a
brute-force safety net. The reference build's own source comment calls this a
*"garde-fou"* — bracing.

### And it changes the layout too

```css
@media (prefers-reduced-motion: reduce) {
  .strip__rail {
    position: static !important;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
    width: auto !important;
    overflow: visible;
    transform: none !important;
  }
  .strip-card {
    width: auto !important;
    flex: initial !important;
    margin-top: 0;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

The 3D carousel becomes a **normal responsive grid**. This is the correct
response: when the animation *is* the layout, disabling the animation alone
leaves an unusable page.

If you have a native scroll-snap variant, hand off to it instead of a grid —
that preserves the interaction rather than removing it.

## Touch targets

`min-height: 2.75rem` (44px) appears on `.nav__cta`, `.cform__submit`,
`.cform__choice span` and `.filter-pill`. The nav burger uses `2.75rem` for both
width and height.

It is applied where needed rather than universally, so **check every interactive
element yourself** rather than assuming a global rule covers it. 44px is the WCAG
2.2 AAA target and the practical minimum for a thumb.

## Focus

- `:focus-visible` throughout, never `:focus` — no ring on mouse click, ring on
  keyboard.
- Pill inputs move the ring to the label via `input:focus-visible + span`.
- Underline inputs signal focus with `border-bottom-color`. Lower contrast than
  a ring; a known trade-off of the style.

Never write `outline: none` without replacing the indicator.

## Overflow

- `overflow: clip` rather than `hidden` on the root — `hidden` creates a scroll
  container, which silently breaks `position: sticky` for descendants.
- `user-select: none` plus `-webkit-touch-callout: none` on media, so long-press
  on a phone does not offer "save image".
- `touch-action: none` on draggable and scroll-locked elements.

## Scroll lock

```css
html.is-scroll-locked {
  overflow: hidden;
  scrollbar-gutter: stable;   /* no layout shift */
  touch-action: none;
  overscroll-behavior: none;
}
```

`scrollbar-gutter: stable` is the one people miss. Without it, hiding the
scrollbar removes its width and the page shifts sideways on lock.

## Semantics

- One `<h1>` per page, one heading level per section.
- Real `<button>`, `<dialog>`, `<details>`, `<form>`. `aria-*` patches bad
  semantics; it does not replace them.
- Every input has a label tied by `htmlFor`/`id` — including the honeypot, which
  gets `aria-hidden` and `tabindex="-1"` so it is not announced.
- `.sr-only` utility present and correct.

## Known gaps in the reference build

Documented honestly, because they will show up in an audit:

1. **`--ink-faint` at ~1.9:1 fails AA** for body text. Used for footer meta,
   small-caps labels, and form placeholders. Lift to `#6b6963` (~4.5:1) if the
   text is meaningful.
2. **Focus-by-border-colour on inputs** is weaker than a proper ring.
3. **The custom cursor hides the native one entirely.** Any bug in the cursor
   script leaves users with no pointer at all. Always verify keyboard and
   touch, and never ship it without the reduced-motion restore.
4. **`text-wrap: balance` and `overflow-wrap: anywhere`** are not supported
   everywhere; both degrade gracefully, but check long-word overflow in a real
   browser at 320px.

## Review checklist

- [ ] `<noscript>` resets every hidden start state
- [ ] Any full-screen blocker is `display: none` under `noscript`
- [ ] `prefers-reduced-motion` covers **layout**, not just animation
- [ ] Native cursor restored when the custom one is disabled
- [ ] Every interactive element ≥ 44px
- [ ] `:focus-visible` ring on every focusable element
- [ ] Faint text is decorative, or lifted to ≥ 4.5:1
- [ ] `scrollbar-gutter: stable` on scroll lock
- [ ] `overflow: clip` not `hidden` above sticky content
- [ ] One `<h1>` per page
- [ ] Tested at 320px with a long unbroken word
- [ ] Every full-screen veil has a failure timeout
