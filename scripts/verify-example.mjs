#!/usr/bin/env node
/**
 * Static checks on example/index.html. No browser, no network — this catches
 * the class of mistakes that are easy to make and hard to spot, all of which
 * were hit while building the example.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(join(ROOT, 'example', 'index.html'), 'utf8');

const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };

// --- 1. the skill assets are loaded over a path that resolves ----------------
check(
  html.includes('../skills/editorial-dark/assets/tokens.css'),
  'example must load the skill tokens.css unmodified'
);
check(
  html.includes('../skills/editorial-dark/assets/motion.css'),
  'example must load the skill motion.css unmodified'
);

// --- 2. no-JavaScript reset is present and in <head> -------------------------
const noscript = html.match(/<noscript>[\s\S]*?<\/noscript>/i);
check(noscript, 'example must include a <noscript> reset; the reveal system hides content');
if (noscript) {
  for (const sel of ['[data-reveal]', '.w', '.preloader']) {
    check(
      noscript[0].includes(sel),
      `<noscript> must force ${sel} visible, or the page is blank without JS`
    );
  }
  check(
    html.indexOf('<noscript>') < html.indexOf('</head>'),
    '<noscript> reset must be inside <head> so it applies before first paint'
  );
}

// --- 3. the boot veil has a failure timeout ----------------------------------
// Without this, a JS error leaves the page permanently covered.
check(html.includes('is-booting'), 'example uses a pre-paint boot class');
// Match setTimeout( ... , <ms> ) across a whole function body, not just to the
// first closing paren.
const timeouts = [...html.matchAll(/setTimeout\(([\s\S]*?),\s*(\d+)\s*\)/g)]
  .map((m) => Number(m[2]));
check(
  timeouts.some((ms) => ms >= 1500 && ms <= 4000),
  `the boot veil must have an unconditional ~2500ms failure timeout (found: ${timeouts.join(', ') || 'none'})`
);
check(
  new RegExp('setTimeout\\([\\s\\S]*?is-booting[\\s\\S]*?,\\s*\\d+\\s*\\)').test(html),
  'the failure timeout must remove the boot class, not just run something'
);

// --- 4. reduced motion changes layout, not only animation --------------------
check(html.includes('prefers-reduced-motion'), 'example must handle prefers-reduced-motion');
const rm = html.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/);
if (rm) {
  const block = rm[0];
  for (const needle of ['cursor', 'preloader', 'data-reveal', 'position']) {
    check(block.includes(needle), `reduced-motion block must address "${needle}"`);
  }
  check(
    !/position:\s*static\s*!important/.test(block) ||
      /pcard__ghost/.test(block) ||
      /position:\s*relative\s*!important/.test(block),
    'reduced motion must not set position:static on a card that contains an absolutely-positioned child (the watermark escapes)'
  );
}

// --- 5. nth-of-type, not nth-child, for card theming -------------------------
const nthChildCards = html.match(/\.pcard:nth-child\(/);
check(
  !nthChildCards,
  'use .pcard:nth-of-type() — a sr-only <h2> first child shifts every :nth-child theme by one'
);

// --- 6. no raster images -----------------------------------------------------
check(!/<img\b/i.test(html), 'example must not use raster images; generate everything with CSS or SVG');
check(!/url\(['"]?https?:/i.test(html.replace(/fonts\.googleapis|fonts\.gstatic/g, '')),
  'example must not hotlink remote assets (Google Fonts is the only allowed exception)');

// --- 7. accessibility basics -------------------------------------------------
const h1s = (html.match(/<h1\b/gi) || []).length;
check(h1s === 1, `page must have exactly one <h1>, found ${h1s}`);

// every form control needs a label tied by for/id
const inputs = [...html.matchAll(/<(input|textarea)\b[^>]*>/gi)].map((x) => x[0]);
for (const tag of inputs) {
  if (/type="hidden"/i.test(tag)) continue;
  const id = tag.match(/\sid="([^"]+)"/i);
  check(id, `form control without an id cannot be labelled: ${tag.slice(0, 60)}`);
  if (id) {
    check(
      new RegExp(`<label[^>]*for="${id[1]}"`, 'i').test(html),
      `<label for="${id[1]}"> is missing`
    );
  }
}

// --- 8. touch targets --------------------------------------------------------
// --tap is defined in the skill's tokens.css, so check the definition there and
// check the usage here.
const tokensCss = await readFile(join(ROOT, 'skills', 'editorial-dark', 'assets', 'tokens.css'), 'utf8');
check(/--tap:\s*2\.75rem/.test(tokensCss), 'tokens.css must define --tap: 2.75rem (44px)');
const tapUses = (html.match(/var\(--tap\)/g) || []).length;
check(tapUses >= 4, `example should apply var(--tap) to interactive elements (found ${tapUses} uses)`);

// --- 9. no framework or animation library ------------------------------------
check(!/cdn\.|unpkg|jsdelivr|googleapis\.com\/ajax/i.test(html), 'example must not load any JS library');

// --- 10. inline script parses -------------------------------------------------
// Two inline scripts are expected: the pre-paint boot veil in <head>, and the
// main script at the end of <body>. Both must parse.
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((x) => x[1]).filter(Boolean);
check(scripts.length === 2, `expected two inline scripts (boot veil + main), found ${scripts.length}`);
scripts.forEach((src, i) => {
  try {
    new Function(src);
  } catch (err) {
    problems.push(`inline script ${i + 1} does not parse: ${err.message}`);
  }
});
// The first must be the pre-paint veil, in <head>, before any stylesheet.
check(
  html.indexOf('<script>') < html.indexOf('<link rel="stylesheet"'),
  'the pre-paint boot script must come before the stylesheets in <head>'
);

// --- 11. CSS brace balance ---------------------------------------------------
const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((x) => x[1]);
styles.forEach((css, i) => {
  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  check(open === close, `<style> block ${i + 1} has unbalanced braces: ${open} open, ${close} close`);
});

// --- 12. aspect-ratio containers must be block -------------------------------
// A <span>/<a> with aspect-ratio and no display:block collapses to zero height.
const mediaRules = [...html.matchAll(/\.card__media\s*\{([^}]*)\}/g)];
for (const [, body] of mediaRules) {
  check(/display:\s*block/.test(body), '.card__media must declare display:block — aspect-ratio is ignored on an inline box');
}

if (problems.length) {
  console.error('example validation failed:');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
console.log(
  `example OK — ${h1s} <h1>, ${inputs.length} form controls labelled, ` +
  `${scripts.length} script, ${styles.length} style block, all static checks pass`
);
