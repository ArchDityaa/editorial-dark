# Tokens

Extracted from a production build and verified against source CSS. Copy
`assets/tokens.css` rather than transcribing from here.

## Colour

Dark-only by design. There is no `prefers-color-scheme` block in the reference
build.

```css
/* Surfaces — four steps, all near-black */
--bg-deep:  #090908;   /* deepest: footer, full-bleed sections */
--bg-raise: #131311;   /* raised: form card, inputs */
--bg:       #0e0e0d;   /* default page background */

/* Ink — three steps, all warm off-white (never pure white) */
--ink:       #ece9e2;  /* primary text */
--ink-dim:   #8d8a83;  /* secondary, ~4.9:1 on --bg — AA safe for body copy */
--ink-faint: #3a3936;  /* tertiary, ~1.9:1 on --bg — FAILS AA, decorative only */
--line:      rgba(236, 233, 226, .12);
```

### Why off-white, never pure white

`#fff` on `#0e0e0d` is a 15:1 contrast ratio — far above what is comfortable over
a long read. Pure white on near-black produces halation on OLED and eye strain
on bright displays. A warm off-white at `#ece9e2` lands around 12:1, still
excellent, and reads as considered rather than default.

The three ink steps are spaced deliberately: primary, secondary, and a faint
step that exists purely to sit behind a hairline or a decorative label.

### The contrast failure — read this before shipping

`--ink-faint` at **~1.9:1** fails WCAG AA (4.5:1 for body text, 3:1 for large).
The reference build uses it for footer meta text, small-caps labels, and form
placeholder text.

If your content is meaningful, lift it:

```css
--ink-faint: #6b6963;   /* ~4.5:1 on --bg — AA safe */
```

Keep `#3a3936` only for genuinely decorative marks where the text carries no
information. If a reviewer flags contrast, this is the first thing to fix.

### Inverting sections without a second palette

Roughly a third of the reference site flips to a light background. It does this
by redeclaring the semantic names locally, not by adding tokens:

```css
.strip {
  --strip-ink:   var(--bg-deep);                                    /* was --ink */
  --strip-muted: color-mix(in srgb, var(--bg-deep) 58%, transparent);
  --strip-line:  color-mix(in srgb, var(--bg-deep) 18%, transparent);

  background: var(--ink);
  color:      var(--strip-ink);
}
```

`color-mix()` is the key idiom — derive the muted and line variants from the
swapped ink rather than hardcoding a parallel palette. The same pattern re-themes
four full-height cards in the reference build:

```css
.process-card:nth-child(3) {
  --card-bg:    var(--ink);                    /* full inversion */
  --card-ink:   var(--bg-deep);
  --card-dim:   #5f5c56;
  --card-faint: #aaa69e;
  --card-line:  rgba(9, 9, 8, .2);
  --card-progress: 75%;
}
```

Because every inner rule references `var(--card-*)`, one declaration re-themes
~30 properties. This is the payoff of a token-first approach and the reason a
site can invert freely without a second stylesheet.

### The one accent is not part of the palette

`#122755` (deep blue) appears only inside third-party widget CSS — a cookie
banner and a CMS editing chrome. It is not authored. Do not adopt it.

## Typography

Three families, three strictly separated roles. The discipline of never crossing
them is what makes the design read as intentional.

```css
--font-grotesk: "Cabinet Grotesk Variable", "Cabinet Grotesk",
                "Cabinet Grotesk Fallback", sans-serif;   /* display + UI */
--font-body:    "General Sans", "General Sans Fallback",
                system-ui, sans-serif;                    /* body copy */
--font-serif:   "Zodiak", "Zodiak Fallback", Georgia, serif;  /* accents */
```

| Role | Family | Treatment |
|---|---|---|
| Headlines | grotesk | 800, uppercase, tight tracking |
| Body / UI | body | 400–500, normal case |
| Accent words | serif | *italic*, always paired against grotesk |
| Numerals | grotesk | `font-variant-numeric: tabular-nums` |

**The serif never sets body copy.** It appears only as an italic accent word
inside a grotesk headline. That restraint is the whole trick — a serif used for
paragraphs would look like a different website.

## Free font substitutions

Cabinet Grotesk (Fontshare) and Zodiak (Klim Type Foundry) are both commercial
and **must not be redistributed** — this repo ships no font files. Substitute:

| Original | Role | Free substitute | Notes |
|---|---|---|---|
| Cabinet Grotesk | Display | **Bricolage Grotesque** (Google) | Variable, wide weight range, good at 800 |
| | | *or* **Archivo** (Google) | Closer to a neutral grotesk |
| | | *or* **Familjen Grotesk** | Scandinavian, sharp terminals |
| General Sans | Body | **Inter** (Google) | Safe, excellent metrics |
| Zodiak | Serif accent | **Instrument Serif** (Google) | High-contrast, italic available |
| | | *or* **Newsreader** (Google) | Warmer, good italic |
| | | *or* **Fraunces** (Google) | More characterful, variable axes |

General Sans is **free** on Fontshare and needs no substitution.

The pairing matters more than the specific faces. Three things must survive:

1. A high-contrast **italic** serif for accent words
2. A neutral grotesk with a real 800 weight and variable axes
3. Strict role separation — serif never sets body copy

`Bricolage Grotesque` + `Inter` + `Instrument Serif` gets closest. Test the serif
italic at small sizes against `--ink-dim`; a high-contrast face at 16px gets
thin fast.

## Metric-adjusted fallbacks

Rarely seen, and worth copying. Every family in the reference build has a
fallback with corrected metrics:

```css
@font-face {
  font-family: "Cabinet Grotesk Fallback";
  src: local("Helvetica Neue"), local("Arial"), local("Roboto");
  size-adjust: 91%;
  ascent-override: 98%;
  descent-override: 24%;
  line-gap-override: 0%;
}
```

`font-display: swap` alone still causes a reflow when the webfont arrives.
Overriding the fallback's metrics makes the swap visually invisible. Recalculate
the numbers for your own faces with a capstyle-style tool rather than copying
these verbatim.

## Type scale

Fluid throughout. The largest sizes mix `vw` **and** `svh`, so they shrink on
short landscape viewports, not only narrow ones:

```css
/* Hero */
font-size: clamp(4.2rem, min(13.5vw, 26svh), 16rem);
line-height: 0.88;
letter-spacing: -0.02em;
text-transform: uppercase;

/* Oversized section title */
font-size: clamp(5rem, 15.5vw, 17rem);
line-height: 0.72;
letter-spacing: -0.065em;
```

**Tracking tightens as size grows.** That is typographically correct — display
type at 17rem with normal tracking has visible gaps between letters. Note the
inverse pairing: line-height drops to `0.72–0.88` while tracking goes to
`-0.055em` … `-0.065em`. Small text does the opposite.

## Measure

Every text block has an explicit `max-width` in `ch`, never `px`:
`20ch`, `24ch`, `34ch`, `38ch`, `40ch`, `43ch`, `46ch`, `52ch`, `56ch`, `62ch`.

Body copy lands at 34–46ch. The accessibility target is 45–75 characters, so
this is correct rather than merely consistent. Headlines sit at 18–24ch because
they are large — a 46ch measure on a 17rem headline is unreadably wide.

Using `ch` also means the measure survives font loading, which a `px` measure
does not.
