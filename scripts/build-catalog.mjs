#!/usr/bin/env node
/**
 * Build an HTTP skill catalog for distribution without cloning.
 *
 * Why this exists
 * ---------------
 * OpenCode, Claude Code and AGENTS.md tools can all load skills over HTTP from
 * a base URL containing an `index.json`. That is how someone installs this
 * system with one config line and no git clone.
 *
 * Two rules drive the layout below.
 *
 * 1. The entry file must be `<name>.md`, NOT `SKILL.md`.
 *    Per the OpenCode docs: "Each downloaded skill directory becomes a source
 *    root, so `git-release.md` has the ID `git-release`. A root-level
 *    `SKILL.md` currently has the literal ID `SKILL` in V2."
 *    So the catalog serves `editorial-dark/editorial-dark.md`.
 *
 * 2. `version` must change when any file changes, or clients serve a stale
 *    cache forever. We derive it from a content hash of every served file, so
 *    it bumps automatically and cannot drift.
 *
 * Usage:
 *   node scripts/build-catalog.mjs          # write catalog/
 *   node scripts/build-catalog.mjs --check  # fail if catalog/ is stale
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'skills', 'editorial-dark');
const OUT = join(ROOT, 'catalog');
const ID = 'editorial-dark';
const CHECK = process.argv.includes('--check');

/** Recursively list files under a directory, relative to that root. */
async function walk(root) {
  const out = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else out.push(relative(root, full).split('\\').join('/'));
    }
  }
  await visit(root);
  return out.sort();
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`error: missing source ${SRC}`);
    process.exit(1);
  }

  const sources = await walk(SRC);
  const served = [];

  for (const rel of sources) {
    let content = await readFile(join(SRC, rel), 'utf8');

    // The entry file is renamed on the way out. See rule 1 above.
    const outRel = rel === 'SKILL.md' ? `${ID}.md` : rel;
    served.push({ outRel, content });

    // References reference each other by relative path, which still resolves
    // inside the downloaded directory, so nothing else needs rewriting.
    void content;
  }

  // Rule 2: content-addressed version.
  const hash = createHash('sha256');
  for (const f of served) hash.update(f.outRel).update('\0').update(f.content).update('\0');
  const version = hash.digest('hex').slice(0, 12);

  const index = {
    skills: [
      {
        name: ID,
        version,
        files: served.map((f) => f.outRel),
      },
    ],
  };

  const indexJson = `${JSON.stringify(index, null, 2)}\n`;

  if (CHECK) {
    let stale = [];
    if (!existsSync(join(OUT, 'index.json'))) stale = ['catalog/index.json (missing)'];
    else if ((await readFile(join(OUT, 'index.json'), 'utf8')) !== indexJson) {
      stale = ['catalog/index.json (out of date)'];
    }
    for (const f of served) {
      const p = join(OUT, ID, f.outRel);
      if (!existsSync(p)) stale.push(`catalog/${ID}/${f.outRel} (missing)`);
      else if ((await readFile(p, 'utf8')) !== f.content) stale.push(`catalog/${ID}/${f.outRel} (out of date)`);
    }
    if (stale.length) {
      console.error('catalog is stale — run: node scripts/build-catalog.mjs');
      stale.forEach((s) => console.error('  ' + s));
      process.exit(1);
    }
    console.log(`catalog up to date (version ${version}, ${served.length} files)`);
    return;
  }

  await rm(OUT, { recursive: true, force: true });
  for (const f of served) {
    const dest = join(OUT, ID, f.outRel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content);
  }
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'index.json'), indexJson);

  const bytes = served.reduce((n, f) => n + Buffer.byteLength(f.content), 0);
  console.log(`catalog/ written — version ${version}, ${served.length} files, ${(bytes / 1024).toFixed(1)} KB`);
  console.log(`  entry: catalog/${ID}/${ID}.md  (id "${ID}", not "SKILL")`);
  console.log(`  serve: publish catalog/ at a static host, then`);
  console.log(`         { "skills": ["https://<host>/catalog/"] }`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
