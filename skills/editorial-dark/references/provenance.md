# Provenance and scope

## What this is

A **technical reconstruction** of the design system behind
[studiors.be](https://studiors.be/), an independent web studio based in Belgium.
Tokens, patterns and architecture were extracted from the site's public build
output and verified against the source CSS.

The reference build: **Astro 5**, **Tina CMS**, Cloudflare at the edge,
`media.studiors.be` for assets. ~109 KB of CSS and JS raw, **~26 KB gzipped**,
with no framework runtime and no animation library.

Extraction date: 2026-09-29.

## What was deliberately excluded

Nothing from the site was taken. Specifically absent from this repository:

- No copy, headlines, or marketing text
- No photography, video, or other media
- No project names, client names, or logos
- No font files
- No Tina CMS content

Those are Studio RS's and their clients' copyrighted work, and they have no
value in a reimplementation for a different studio — the copy is about their
clients, not yours.

## What makes this legitimate to share

Studying how a public site is constructed is normal industry practice. The
colour values, layout arithmetic, easing curves, and technique are functional
facts about how the page works, not creative expression. This repository
documents **method**, and provides a self-contained implementation written from
that understanding.

Where CSS appears here it has been rewritten or reduced to the pattern being
demonstrated, not copied wholesale.

## Licensing

- This documentation and the CSS in `assets/` — **CC BY 4.0.** Use it freely,
  including commercially. Attribution only.
- The pattern of the layout is generic to the genre. A 12-column grid, a grain
  overlay, and a `cubic-bezier` easing curve are not protectable expression.

### The fonts are the exception

**Cabinet Grotesk** (Fontshare) and **Zodiak** (Klim Type Foundry) are
commercial, licensed per seat, and are **not included in this repository**.
Redistributing them would be copyright infringement.

`references/tokens.md` lists free substitutions. General Sans is free on
Fontshare and needs none.

Never add a font file to this repository. Link to a licensed source instead.

## Corrected claims

During extraction, three initial claims were overstated and corrected against
the source. They are recorded here because the numbers appear elsewhere in the
documentation:

| Initial claim | Verified |
|---|---|
| "one authored keyframe" | 6 total, 5 authored, 1 vendor; only 1 animates layout |
| "`min-height: 2.75rem` on all interactive elements" | 4 selectors; nav burger uses it as width too |
| "`overflow-wrap: anywhere` on 18 classes" | 5 occurrences in one grouped rule |

## What could not be recovered

The original source is **not** obtainable from the public deployment. Tina CMS
stores content as Markdown in a git repository that is not published;
`/admin/config.json`, `/tina.json` and `/.tina/config.json` all return 404, and
no `git.`, `cms.` or `admin.` subdomain resolves.

Not recoverable: the `.astro` component files, the Tina schema definitions, the
build configuration, and the i18n routing logic.

Recoverable, and what this repository documents: the rendered output — tokens,
layout, motion architecture, accessibility patterns.

**If you are reimplementing a site under a contract you are party to, request
the repository from whoever built it.** This material is the fallback for when
that is not available or not appropriate.

## Verifying the claims

Most findings are checkable. To re-verify the bundle budget:

```sh
curl -sL https://studiors.be/ \
  | grep -oE '/_astro/[A-Za-z0-9._-]+\.(js|css)' | sort -u
```

Then fetch each and check `content-length` with and without gzip. Findings that
could not be verified are listed in the table above.
