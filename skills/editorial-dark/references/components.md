# Components

Patterns extracted from the reference build. Copy the reasoning, not the values.

## Buttons

Two variants, both capsule, both inverting on hover:

```css
.btn {
  display: inline-flex; align-items: center; gap: .55rem;
  min-height: 2.75rem;                 /* 44px touch target */
  padding: .8rem 1.6rem;
  font-size: .85rem; font-weight: 500;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--ink);
  background: none;
  border: 1px solid rgba(236, 233, 226, .4);
  border-radius: 99px;
  cursor: pointer;
  transition: background .4s var(--ease-out), color .4s var(--ease-out);
}
.btn:hover, .btn:focus-visible { background: var(--ink); color: var(--bg); }
```

**Invert** (background ↔ foreground) rather than tint. A tint reads as a
different state; an inversion reads as the button being pressed in. Apply it
consistently — every button in the reference build does the same thing on hover.

## Underline link reveal

```css
.link { position: relative; }

.link::after {
  content: "";
  position: absolute; left: 0; bottom: -4px;
  width: 100%; height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;            /* collapsed at the right edge */
  transition: transform .45s var(--ease-out);
}
.link:hover::after,
.link:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left;             /* wipes leftward */
}
```

The `transform-origin` flip is the detail — the line wipes in from the side you
are coming from rather than expanding symmetrically outward.

Linked to `:focus-visible` as well as `:hover`, so keyboard users get the same
affordance. A reveal on `:hover` only is invisible to keyboard navigation.

## Pill choice inputs

A real radio button underneath, the label as the visual control:

```css
.choice input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.choice span {
  display: inline-flex; align-items: center;
  min-height: 2.75rem;
  padding: .6rem 1.25rem;
  border: 1px solid var(--line);
  border-radius: 99px;
  cursor: pointer;
  transition: background .3s var(--ease-out), color .3s var(--ease-out);
}
.choice input:checked + span { background: var(--ink); color: var(--bg); }
.choice input:focus-visible + span { outline: 2px solid var(--ink); outline-offset: 3px; }
```

Semantics preserved, focus ring moved to the label. Real `<input type="radio">`
means keyboard arrow-key navigation, form submission and screen-reader
announcement all work. A `<div>` with click handlers gives none of that.

`opacity: 0` rather than `display: none` so the input stays focusable and
clickable.

## Underline-only inputs

```css
.field input, .field textarea {
  background: none;
  border: none;
  border-bottom: 1px solid var(--line);
  border-radius: 0;                /* kill iOS rounding */
  padding: .6rem 0;
  color: var(--ink);
  transition: border-color .35s var(--ease-out);
}
.field input:focus-visible { outline: none; border-bottom-color: var(--ink); }
.field input::placeholder { color: var(--ink-faint); }
```

Three details:

- `border-radius: 0` — iOS applies its own rounding to inputs otherwise.
- Focus is communicated by border colour.
- The placeholder uses `--ink-faint`, which **fails AA contrast**. If the
  placeholder carries information, use `--ink-dim`.

The focus-by-border-colour approach is lower contrast than a proper ring. If you
reuse it, keep a subtle ring as well — this is a known trade-off of the style.

## Multi-step form

```css
.step { display: none; }
.step.is-active { display: grid; }
.progress-bar { width: 33.33%; transition: width .6s var(--ease-out); }
```

Three steps toggled with `display`, plus:

- A **honeypot** for bots: a real input positioned off-screen and visually
  hidden — `position: absolute; left: -9999px; opacity: 0; pointer-events: none`.
  Not `display: none`, which bots detect.
- An `is-sent` state that hides the entire form and reveals a confirmation,
  including the focus management to move focus to the confirmation.
- `aria-live` on the step container so screen readers announce step changes.

## Stat blocks

```css
.stat { border-top: 1px solid var(--line); padding-top: 1.1rem; }
.stat strong {
  font-family: var(--font-serif);
  font-style: italic; font-weight: 700;
  font-size: clamp(2.4rem, 4.5vw, 3.8rem);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
```

Numbers in the serif italic, labels in body. A small structural choice that
carries a large share of the personality.

## Oversized footer wordmark

```css
.wordmark {
  font-size: clamp(3rem, 17.5vw, 17rem);
  line-height: .82;
  letter-spacing: -.03em;
  text-transform: uppercase;
  white-space: nowrap;
}
```

17.5vw uppercase with tracking closed to `-0.03em` so the letters hold together
at that size. Needs `overflow-x: clip` on the parent and an explicit font size
reduction below 400px, or it overflows on narrow screens.

## Nav

```css
.nav {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem var(--gutter);
  mix-blend-mode: difference;        /* legible on any background */
}
```

`mix-blend-mode: difference` means one nav works over dark and light sections
without a scroll handler or per-section variants.

The burger is three stacked spans that rotate into an X:

```css
.burger.is-open span:nth-child(1) { transform: translateY(3.75px) rotate(45deg); }
.burger.is-open span:nth-child(2) { transform: translateY(-3.75px) rotate(-45deg); }
```

The middle span is scaled to zero height at rest (`height: 1.5px`) so only two
need animating.

## Mobile nav

```css
.mnav {
  position: fixed; inset: 0; z-index: 95;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 6rem var(--gutter) max(2.4rem, env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
  opacity: 0; visibility: hidden;
  transition: opacity .45s var(--ease-out), visibility 0s linear .45s;
}
.mnav.is-open { opacity: 1; visibility: visible; }
```

Three details that matter on real devices:

- `env(safe-area-inset-bottom)` — without it the last link sits under the home
  indicator on an iPhone.
- `visibility` is transitioned with a **zero-duration delay** so it flips only
  after the opacity fade finishes. Without the `0s linear .45s` part, `visibility`
  would switch immediately and kill the fade-out.
- `overscroll-behavior: contain` stops scroll chaining to the page behind.
- `html.menu-open { overflow: hidden }` locks the background.

Large link targets animate in with a stagger:

```css
.mnav.is-open .mnav__links a {
  transition-delay: calc(.1s + var(--i, 0) * .07s);
}
```

## Card hover composition

```css
.card__media img {
  filter: grayscale(.25) contrast(1.04);
  transform: scale(1.025);
  transition: transform .8s var(--ease-out), filter .5s var(--ease-out);
}
.card:hover .card__media img { filter: grayscale(0) contrast(1.02); }
.card__open { opacity: 0; transform: translateY(-.75rem); }
.card:hover .card__open { opacity: 1; transform: none; }
```

A resting scale of `1.025` means the hover scale has no visible border. The
"open" pill is revealed by the same hover, entering from above.

On touch devices there is no hover, so the pill must be permanently visible —
see the `max-width: 900px` rule in `responsive.md`.
