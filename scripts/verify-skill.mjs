#!/usr/bin/env node
/**
 * Validate SKILL.md against the format OpenCode and Claude Code both read.
 * Exits non-zero on any problem, so CI can go red.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = join(ROOT, 'skills', 'editorial-dark');
const ID = 'editorial-dark';

const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };

// --- frontmatter -------------------------------------------------------------
const raw = await readFile(join(SKILL_DIR, 'SKILL.md'), 'utf8');
const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
check(m, 'SKILL.md must start with a YAML frontmatter block delimited by ---');

if (m) {
  const fm = m[1];

  // name
  const name = fm.match(/^name:\s*(.+)$/m);
  check(name, 'frontmatter is missing "name"');

  // description — the model only sees ID + name + description, and a skill
  // with no description is never advertised.
  const desc = fm.match(/^description:\s*(.+)$/m);
  check(desc, 'frontmatter is missing "description" (skill would not be discoverable)');
  if (desc) {
    check(desc[1].trim().length > 40, 'description is very short; it must say when to use the skill');
    check(desc[1].trim().length <= 1024, 'description exceeds 1024 chars');
  }

  // The ID comes from the directory name, not from `name`. Flag a mismatch so
  // the display label does not quietly disagree with the real ID.
  if (name) {
    const label = name[1].trim();
    check(
      label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === ID,
      `frontmatter name "${label}" does not map to the directory ID "${ID}"`
    );
  }
}

// --- ID shape ----------------------------------------------------------------
// Docs recommend: ^[a-z0-9]+(-[a-z0-9]+)*$, 1-64 chars, aligned with the dir.
check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ID), `skill ID "${ID}" is not lowercase kebab-case`);
check(ID.length >= 1 && ID.length <= 64, `skill ID length ${ID.length} is outside 1-64`);

// --- referenced files must exist ---------------------------------------------
// Every "references/x.md" and "assets/x.css" mention in SKILL.md must resolve,
// otherwise the agent is told to read a file that is not there.
const mentioned = [...raw.matchAll(/(?:references|assets)\/[A-Za-z0-9._-]+/g)].map((x) => x[0]);
const uniq = [...new Set(mentioned)];
check(uniq.length > 0, 'SKILL.md references no supporting files');

const { existsSync } = await import('node:fs');
for (const ref of uniq) {
  check(existsSync(join(SKILL_DIR, ref)), `SKILL.md references ${ref}, which does not exist`);
}

// --- license sanity ----------------------------------------------------------
// CC BY 4.0 is the claim; make sure no font file sneaks into the repo.
const { readdir } = await import('node:fs/promises');
async function findFonts(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findFonts(full)));
    else if (/\.(woff2?|ttf|otf|eot)$/i.test(e.name)) out.push(full);
  }
  return out;
}
const fonts = await findFonts(ROOT);
check(
  fonts.length === 0,
  `font files must not be redistributed: ${fonts.map((f) => f.replace(ROOT + '/', '')).join(', ')}`
);

if (problems.length) {
  console.error('SKILL.md validation failed:');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
console.log(`SKILL.md OK — id "${ID}", ${uniq.length} supporting files referenced, no fonts bundled`);
