# Transitions — custom cursor, page transitions, scroll lock

## Custom cursor: three layers

The native cursor is suppressed, then three independently-transformed elements
take its place.

```css
html.has-cursor body,
html.has-cursor a,
html.has-cursor button,
html.has-cursor label,
html.has-cursor summary { cursor: none !important; }
```

| Layer | z-index | Blend | Transform origin |
|---|---|---|---|
| `.cursor` — 6px dot | 300 | `difference` | — |
| `.cursor-ring` — 40px circle | 299 | `difference` | `0 0` |
| `.cursor-badge` — pill label | 301 | normal | `left top` |

```css
.cursor, .cursor-ring, .cursor-badge {
  position: fixed; top: 0; left: 0;
  pointer-events: none; opacity: 0;
  contain: style;
  will-change: transform, opacity;
}
.cursor      { z-index: 300; mix-blend-mode: difference; }
.cursor-ring { z-index: 299; mix-blend-mode: difference; }
.cursor-badge{ z-index: 301; }
```

### Why `mix-blend-mode: difference` matters

One white element inverts against whatever is beneath it. A single white dot
works unchanged on both a black section and a light inverted section, so the
cursor needs no per-section variants. This is what makes the inverted light
sections free.

### States are composable, not exclusive

```css
.cursor-state--hover .cursor-ring__in { transform: scale(1.55); background: #ece9e214; }
.cursor-state--press .cursor-ring__in { transform: scale(.75); }
.cursor-state--press.cursor-state--hover .cursor-ring__in { transform: scale(1.25); }
.cursor-state--badge .cursor-ring__in { transform: scale(.48); }
.cursor-state--badge .cursor-badge__in { transform: translate(16px,16px) scale(1); }
.cursor-state--badge-left .cursor-badge__in { transform-origin: right top; }
.cursor-state--text .cursor,
.cursor-state--text .cursor-ring { opacity: 0 !important; }
```

The compound selector for press+hover is the right approach — states stack
rather than overwrite, so every combination behaves correctly without an
explicit state machine. If you write `if (hover) … else if (press) …` you will
get the wrong result in the combination.

The badge flips `transform-origin` to `right top` when it appears to the **left**
of the cursor, so it grows leftward instead of jumping across the pointer.

### The text trap

A suppressed cursor over a text field is unusable. The reference build restores
it per-element:

```css
html.has-cursor input:not([type]),
html.has-cursor textarea,
html.has-cursor [contenteditable="true"] { cursor: text !important; }
```

If you ship a custom cursor, this is not optional.

## Page transitions

A pre-paint inline script in `<head>` writes a class to `<html>` **before first
paint**, so the veil is already down when the page renders. The bundle later
re-syncs and lifts it.

### The veil

```css
html.is-arriving::after {
  content: ""; position: fixed; inset: 0; z-index: 240;
  background: var(--bg-deep); opacity: 1;
}
html.is-arriving.is-veil-lift::after {
  opacity: 0;
  transition: opacity .45s ease;
  pointer-events: none;
}
```

### Three types

State is written to `sessionStorage` and read back on arrival.

| Type | Veil | Effect |
|---|---|---|
| `img` | `background: var(--bg-deep) var(--pt-img) center/cover` | destination image as placeholder |
| `vid` | plain dark veil | video ghost resumes at the timecode you left |
| `hyb` | dark veil + SVG logo | hybrid fallback |

```css
html.is-arriving-img::after {
  background: var(--bg-deep) var(--pt-img, none) center / cover no-repeat;
}
```

The ghost element replays media from the exact timecode you left:

```css
.pt-ghost {
  position: fixed; top: 0; left: 0; z-index: 245;
  overflow: hidden; transform-origin: 0 0;
  will-change: transform; backface-visibility: hidden;
}
```

### Three things that make this production-grade

**1. bfcache awareness.** A `back_forward` navigation takes a different code path
than a fresh load and needs a different class.

**2. The failure timeout — the most important line in the system.**

```js
setTimeout(() => {
  r.classList.remove('is-arriving', 'is-arriving-img', 'is-arriving-hyb');
}, 2500);
```

Unconditional. If the bundle never loads, if it throws, or if the user has
blocked something, the veil is removed anyway and the page remains usable.

Any full-screen veil without a timeout is a page that can be permanently locked.
This is the highest-value line in this document. If you build a page transition,
build the timeout in the same commit.

**3. Input lock during navigation.**

```css
html.is-navigating, html.is-navigating body { pointer-events: none; }
```

Prevents double-clicks and stray interaction while the veil is up.

## Scroll lock

```css
html.is-scroll-locked {
  overflow: hidden;
  scrollbar-gutter: stable;   /* prevents layout shift on lock */
  touch-action: none;
  overscroll-behavior: none;
}
```

`scrollbar-gutter: stable` is the part people miss. Without it, hiding the
scrollbar removes its width and the entire page shifts sideways on lock.

`touch-action: none` stops rubber-band scroll on iOS; `overscroll-behavior: none`
stops the pull-to-refresh gesture chaining.

## Smooth scroll

If you use Lenis or an equivalent:

```css
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
```

The `scroll-behavior: auto` override is the critical part — it stops native
smooth scrolling from fighting the JS-driven animation and producing a stutter
at the end of every programmatic scroll.

## Motion off is a layout change

A custom cursor and a 3D carousel are not things you can merely switch off; they
*are* the interaction. See `accessibility.md` for the full reduced-motion block.

The short version: under `prefers-reduced-motion: reduce`, hide the custom
cursor and restore the native one, and turn the carousel into a static grid.
