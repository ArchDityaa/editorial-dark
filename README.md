# Editorial Dark

[![verify](https://github.com/ArchDityaa/editorial-dark/actions/workflows/verify.yml/badge.svg)](https://github.com/ArchDityaa/editorial-dark/actions/workflows/verify.yml)
[![license](https://img.shields.io/badge/license-CC%20BY%204.0-8a8a8a)](./LICENSE)
[![runtime](https://img.shields.io/badge/runtime-0%20dependencies-2d6a4f)](./example/README.md)
[![bundle](https://img.shields.io/badge/reference%20build-26%20KB%20gz-brightgreen)](./skills/editorial-dark/references/tokens.md)
[![fonts](https://img.shields.io/badge/fonts-0%20files%20bundled-3d3d3d)](./skills/editorial-dark/references/provenance.md)
[![agents](https://img.shields.io/badge/agents-opencode%20%C2%B7%20claude%20code%20%C2%B7%20AGENTS.md-5b6ee5)](./install.sh)

A reconstructed design system for **dark, editorial, motion-heavy frontends** —
packaged as an agent skill that works with OpenCode, Claude Code, and any
`AGENTS.md`-driven tool.

Everything here was extracted from a real production build (Astro + Tina CMS)
and verified against source CSS. No content, copy, imagery, or fonts from the
subject site are included.

---

## Why a skill

A design system in a markdown file is only useful if an agent actually loads it
before writing CSS. Skill directories are discovered automatically and
advertised to the model by description, so the guidance arrives at the moment it
is relevant rather than sitting in a README nobody opens.

## Install

```sh
git clone <this-repo> && cd editorial-dark
./install.sh              # project-local
./install.sh --global     # user-wide, all projects
```

Creates symlinks into all three discovery paths. Safe to re-run.

| Agent | Path used |
|---|---|
| OpenCode | `.opencode/skills/editorial-dark/` |
| Claude Code | `.claude/skills/editorial-dark/` |
| AGENTS.md tools | `.agents/skills/editorial-dark/` |

OpenCode treats `.claude/skills` and `.agents/skills` as compatibility sources,
so the skill resolves across all three from a single installed directory.

### Manual install

Copy `skills/editorial-dark/` into any of the three directories.

### Install over HTTP (no clone)

`catalog/` is a ready-to-serve HTTP skill catalog. Point any agent at it and the
skill downloads on demand:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": ["https://archdityaa.github.io/editorial-dark/"]
}
```

```sh
# regenerate after editing the skill
node scripts/build-catalog.mjs
```

Two details make this work, both handled by the build script:

1. The entry file is served as `editorial-dark/editorial-dark.md`, **not**
   `SKILL.md`. A root-level `SKILL.md` gets the literal ID `SKILL` instead of
   `editorial-dark`, so the skill would install under the wrong name.
2. `version` in `index.json` is a content hash of every served file. Clients
   cache by version, so a hand-edited version would leave users stuck on a
   stale copy forever.

`node scripts/build-catalog.mjs --check` fails if the committed catalog has
drifted from `skills/`; CI runs it on every push.

## Try it

Ask an agent: *"build me a dark editorial site with word-level text reveals"*
and check whether it reaches for the skill.

To see the system working first, run the example:

```sh
python3 -m http.server 8000    # from the repo root
open http://localhost:8000/example/
```

`example/README.md` lists what it covers and the six real bugs it uncovered.

## What's inside

```
example/index.html              working demo, zero dependencies
skills/editorial-dark/
├── SKILL.md                    entry point — rules, budget, traps
├── assets/
│   ├── tokens.css              copy-paste design tokens
│   └── motion.css              reveals, stagger, float, grain + driver
└── references/
    ├── tokens.md               colour, type, scale, font substitution
    ├── motion.md               the core: reveals, stagger, loops
    ├── transitions.md          custom cursor, page transitions, scroll lock
    ├── layout.md               gutter, 12-col, sticky cards, 3D carousel
    ├── components.md           buttons, links, inputs, forms
    ├── accessibility.md        reduced motion, noscript, focus, review
    ├── responsive.md           breakpoints, svh/dvh, landscape
    └── provenance.md           what was extracted, what was excluded
```

`SKILL.md` carries only the rules. An agent reads one reference file when it
needs that topic — progressive disclosure, so it does not load 1,000 lines to
learn one thing.

## Using it in a project

```sh
cp skills/editorial-dark/assets/tokens.css  src/styles/
cp skills/editorial-dark/assets/motion.css  src/styles/
```

Import `tokens.css` before any component styles. `motion.css` needs a
`<noscript>` block — see `references/accessibility.md`.

## The load-bearing ideas

If you read nothing else:

1. **One easing curve.** `--ease-out: cubic-bezier(.16, 1, .3, 1)`. A second
   curve makes the motion stop reading as one system.
2. **CSS arms start states, JS drives motion.** Six keyframes total in the
   reference build, one of which animates layout.
3. **Dim, don't hide.** Text carrying meaning starts at 14% opacity, not 0.
4. **Every full-screen veil needs a failure timeout.** Without one, a failed
   bundle locks the page permanently.
5. **Reduced motion changes layout, not just animation.** A 3D carousel becomes
   a grid.
6. **The `--gutter` double declaration.** One line replaces a stack of media
   queries.

## Budget

The reference build ships page transitions, a custom cursor, a pinned 3D
carousel and per-word text animation in **~26 KB gzipped**, with no framework
runtime and no animation library.

Hold the line. `IntersectionObserver` plus CSS transitions covers the whole
system; adding GSAP costs more than the entire reference implementation.

## Licensing

**CC BY 4.0** — free for commercial use, attribution only. See `LICENSE`.

The two typefaces in the original (Cabinet Grotesk, Zodiak) are commercial and
are **not included**. Free substitutes are listed in `references/tokens.md`.
General Sans is free on Fontshare and needs no substitution.

`references/provenance.md` records what was extracted, what was deliberately
left out, and which three initial claims were corrected during verification.
