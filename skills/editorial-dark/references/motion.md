# Motion

The substance of this system. The most transferable part of the reference build.

## The two governing facts

1. **One easing curve governs everything.** Adding a second curve is the fastest
   way to make a motion system feel incoherent.
2. **CSS supplies only the start state.** Almost all movement is JS-driven, with
   CSS arming `opacity: 0` and a transform. The reference build has six keyframes
   total, of which only one animates a layout element.

```css
--ease-out: cubic-bezier(.16, 1, .3, 1);
```

A near-instant onset with a long deceleration. Every transition in the system
uses it. Durations vary (`0.2s` to `0.8s`), the curve does not.

## Reveal primitives

```css
[data-reveal]     { opacity: 0; }
[data-split] .line       { display: block; overflow: hidden; }  /* the mask */
[data-split] .line-inner { display: block; }                    /* slides up */
```

- **`data-reveal`** — fades in. JS adds `.is-visible` via `IntersectionObserver`.
- **`data-split`** — text is split into `.line` / `.line-inner` pairs. The
  `overflow: hidden` on the outer is the mask; the inner slides up from
  `translateY(100%)`. A line-mask reveal, the standard editorial effect.

### Dimmed beats hidden

For text that carries meaning, the reference build starts words at **14%
opacity**, not zero:

```css
.manifesto__text .w { display: inline-block; opacity: .14; }
```

The paragraph is always readable — it just looks unfinished until the reveal
runs. On a content site this is strictly better than `opacity: 0`, and it means a
failed IntersectionObserver degrades to plain readable text instead of a blank
page.

## Stagger without a class per element

Express the delay as a CSS variable in markup, then one rule handles any number
of children:

```css
.mnav.is-open .mnav__links a {
  transition-delay: calc(.1s + var(--i, 0) * .07s);
}
```

```html
<a style="--i: 0">…</a>
<a style="--i: 1">…</a>
```

Never write `.is-active:nth-child(4) { transition-delay: .21s }` for a list of
twelve. The variable form survives reordering.

### Negative delays

The reference build's float loop uses **negative** `animation-delay`:

```css
--float-delay: -1.2s;  /* …through -5.8s */
```

A negative delay staggers the start so the animation is already mid-cycle on
load. A positive delay leaves every element sitting at its keyframe start,
producing a visible flash of unanimated state before the loop kicks in.

## Progress-driven decoration with no ScrollTrigger

```css
.process-card {
  --card-progress: 25%;
  position: sticky; top: 0;
  min-height: 100svh;
}
.process-card::before {
  content: "";
  position: absolute; top: -1px; left: 0;
  width: var(--card-progress);
  height: 2px;
  background: var(--card-ink);
}
```

Four cards set `25% / 50% / 75% / 100%`. The result reads as a progress bar
advancing across four full-height sticky cards, built entirely from
`position: sticky` and a width value.

The same idea, watermarked:

```css
.ghost-num {
  position: absolute; z-index: 0;
  left: var(--gutter); bottom: -.23em;
  font-size: clamp(14rem, 31vw, 36rem);
  line-height: .7;
  letter-spacing: -.09em;
  opacity: .035;
  pointer-events: none;
}
```

If you want the bar to track actual scroll rather than sit static, drive
`--progress` from one `requestAnimationFrame` loop reading
`getBoundingClientRect()`. Do not add a scroll library for it.

## Per-item float

The one transform keyframe in the system:

```css
@keyframes editorial-float {
  0%, to { transform: translateZ(0); }
  50%    { transform: translate3d(var(--float-x), calc(0px - var(--float-y)), 0); }
}
```

Durations 5.8s–7.7s, amplitudes 1–7px. Small enough to read as life rather than
motion. Two details that are easy to miss and both matter:

```css
/* Do not burn CPU animating off-screen elements */
.float:not(.is-near) { animation-play-state: paused; }

/* A constantly-drifting target is hard to click */
.float:is(:hover, :focus-visible) { animation-play-state: paused; }
```

## Grain overlay

```css
.grain {
  position: fixed; inset: -5%;      /* oversized to hide transform edges */
  z-index: 90;
  pointer-events: none;
  opacity: .05;
  contain: layout paint style;      /* isolate from the rest of the page */
}
```

Inline SVG `feTurbulence` at `baseFrequency="0.85" numOctaves="2"`, animated in
**discrete jumps**:

```css
@media (prefers-reduced-motion: no-preference) {
  .grain { animation: grain-shift .9s steps(4) infinite; }
}
```

`steps(4)` is the whole trick. Linear interpolation makes the texture visibly
*slide* across the viewport, which reads as a rendering bug. Stepped translation
reads as film grain.

Two more details: `inset: -5%` because translating a full-bleed element exposes
its edges, and `contain: layout paint style` because a fixed full-viewport
element otherwise repaints on every scroll frame.

> `contain: paint` on a full-viewport fixed element is safe here because the
> element has no sticky descendants. Never put `contain` on a section that
> contains sticky children — it breaks `position: sticky`.

## Hover reveal on scroll-linked media

```css
.strip-card__media img {
  filter: grayscale(.25) contrast(1.04);
  transform: scale(1.025);        /* pre-scaled to hide the hover edges */
  transition: transform .8s var(--ease-out), filter .5s var(--ease-out);
}
.strip-card:hover .strip-card__media img { filter: grayscale(0) contrast(1.02); }
```

Three things:

- The resting `scale(1.025)` means the hover scale has no visible border.
- **Desaturation at rest** gives a card grid a calm, uniform appearance that
  resolves into colour on engagement.
- Transition durations **differ per property** (`.8s` transform vs `.5s`
  filter) — the desaturate should feel slower than the movement.

## The budget

The reference build ships page transitions, a custom cursor, a pinned 3D
carousel and per-word text animation in **~26 KB gzipped total**, with no
framework runtime and no animation library.

`IntersectionObserver` plus CSS transitions is sufficient for the whole system.
The moment you add GSAP or a scroll library you are at 70 KB before your own
code. If you need scroll-linked pinning beyond `position: sticky`, write the
`requestAnimationFrame` loop — it is about thirty lines.

## Traps

| Trap | Consequence |
|---|---|
| `opacity: 0` with no `<noscript>` reset | Blank page without JS |
| `from()` with a CSS-hidden start value | Animates 0 → 0, appears frozen |
| `perspective` on a clipping ancestor | 3D flattens, transform loses depth |
| `contain: paint` above a sticky child | Sticky silently stops working |
| `overflow: hidden` on an ancestor of sticky | Creates a scroll container; sticky breaks |
| Positive `animation-delay` for stagger | Visible flash of unanimated state |
| Always-running float animations | CPU cost, and unclickable targets |
| Second easing curve | Motion stops reading as one system |
