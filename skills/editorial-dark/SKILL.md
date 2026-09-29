---
name: Editorial Dark
description: Build dark, editorial, motion-heavy frontends with a token-first CSS architecture. Use when a site needs a premium dark aesthetic, word-level text reveals, custom cursors, 3D scroll carousels, or page transitions. Triggers on "editorial", "dark theme", "premium web design", "text reveal", "split text", "custom cursor", "page transition", "scroll carousel", "premium agency site", "award-winning style", "clamp fluid type", "design tokens".
license: CC BY 4.0
metadata:
  opencode/autoinvoke: true
---

# Editorial Dark — design system reference

A reconstructed design system for dark, editorial, motion-led frontends. Every
token and pattern here was extracted from a real production build and verified
against source CSS.

**Read only the reference file you need.** Do not load all of them.

| Need | Read |
|---|---|
| Colour, type, spacing, easing tokens | `references/tokens.md` |
| Reveals, text splitting, stagger, float loops | `references/motion.md` |
| Custom cursor, page transitions, scroll lock | `references/transitions.md` |
| Gutter, 12-col grid, sticky cards, 3D carousel | `references/layout.md` |
| Buttons, links, inputs, pills, forms | `references/components.md` |
| Reduced motion, noscript, focus, touch targets | `references/accessibility.md` |
| Breakpoints, svh/dvh, landscape, typography scale | `references/responsive.md` |

To start a project, copy `assets/tokens.css` and `assets/motion.css` into the
project and import them before any component styles.

## Non-negotiable rules

These are the things that make the system work. Breaking them breaks the feel.

1. **One easing curve only.** `--ease-out: cubic-bezier(.16, 1, .3, 1)`. If you
   add a second curve, the motion stops reading as one system.
2. **`minmax(0, 1fr)`, never `1fr`,** in every grid track. A long unbreakable
   word in `1fr` blows out the track.
3. **Never hide content unconditionally.** `[data-reveal] { opacity: 0 }` means
   the page is blank without JS. Pair it with a `<noscript>` reset. Prefer the
   dimmed variant (`opacity: .14`) for anything that carries meaning.
4. **Every full-screen veil needs a failure timeout.** A transition veil with no
   timeout locks the page when the bundle fails. See `references/transitions.md`.
5. **Reduced motion must change layout, not just animation.** A 3D carousel
   becomes a grid; a reveal becomes visible; a custom cursor disappears and the
   native one returns. See `references/accessibility.md`.
6. **Never set an initial hidden state in markup.** Enable it from a root class
   or an attribute, so the no-JS default stays visible.

## Budget

The reference build ships these features — page transitions, custom cursor,
pinned carousel, per-word text animation — in **~26 KB gzipped total**, with no
framework runtime and no animation library.

Hold the line. The moment you add GSAP or a scroll library you are at 70 KB
before writing a line of your own. Prefer `IntersectionObserver` + CSS
transitions; the whole system is buildable with no dependencies.

## Traps that have already been paid for

- **`content-visibility` and sticky do not compose.** A `contain: paint` ancestor
  breaks `position: sticky` for sticky children. Never put `contain` on a
  section that contains sticky elements.
- **Perspective + overflow clip.** A parent with `overflow: hidden` flattens a
  `perspective` child. Put `perspective` on the element that actually holds the
  3D transform, not on an ancestor that clips.
- **`from()` with a CSS-hidden start value** animates 0 → 0. Use `fromTo` when
  the start state lives in CSS.
- **Measure in `ch`, not `px`,** for body copy. `max-width: 46ch` survives font
  loading; `max-width: 720px` does not.
- **Negative `animation-delay`** to stagger start without a flash of unanimated
  state. Positive delays leave elements sitting at their keyframe start.
- **`overflow: clip`, not `hidden`,** where you want to prevent scroll
  containment — `hidden` on an ancestor silently creates a scroll container and
  breaks `position: sticky` inside it.

## Licensing

The tokens, layout, and motion techniques in this skill are freely reusable —
CC BY 4.0, attribution only.

**The two typefaces in the original are not included and cannot be redistributed**
(Cabinet Grotesk, Zodiak — both commercial). `references/tokens.md` lists free
substitutions that preserve the three-role structure. Never ship a font file
from this repo; link to a licensed source instead.

See `references/provenance.md` for the scope of what was extracted and what was
deliberately excluded.
