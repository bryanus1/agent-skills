#!/usr/bin/env node

// Fails when a skill under skills/ changed relative to a base ref without a
// version bump in its SKILL.md frontmatter. Changes limited to evals/ are exempt
// because they do not alter what gets installed and executed.

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from './lib/skills.mjs';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function tryGit(cwd, ...args) {
  try {
    return git(cwd, ...args);
  } catch {
    return null;
  }
}

export function compareSemver(a, b) {
  const parse = (v) => String(v).split(/[-+]/)[0].split('.').map(Number);
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  }
  return 0;
}

function versionOf(content) {
  const parsed = content ? parseFrontmatter(content) : null;
  return parsed?.data?.version === undefined ? null : String(parsed.data.version);
}

/** Returns one entry per changed skill: { skillPath, before, after, ok, reason }. */
export function checkSkillVersions(cwd, baseRef) {
  const mergeBase = git(cwd, 'merge-base', baseRef, 'HEAD').trim();
  const changed = git(cwd, 'diff', '--name-only', mergeBase, '--', 'skills/').split('\n').filter(Boolean);

  // Group changed files by the skill directory that contains a SKILL.md.
  const skillDirs = new Map();
  for (const file of changed) {
    const parts = file.split('/');
    for (let depth = parts.length - 1; depth >= 2; depth--) {
      const dir = parts.slice(0, depth).join('/');
      const exists = tryGit(cwd, 'cat-file', '-e', `HEAD:${dir}/SKILL.md`) !== null || tryGit(cwd, 'cat-file', '-e', `${mergeBase}:${dir}/SKILL.md`) !== null;
      if (exists) {
        if (!skillDirs.has(dir)) skillDirs.set(dir, []);
        skillDirs.get(dir).push(file.slice(dir.length + 1));
        break;
      }
    }
  }

  const results = [];
  for (const [dir, files] of skillDirs) {
    const skillPath = `${dir}/SKILL.md`;
    const before = versionOf(tryGit(cwd, 'show', `${mergeBase}:${skillPath}`));
    const after = versionOf(tryGit(cwd, 'show', `HEAD:${skillPath}`));

    if (after === null) {
      results.push({ skillPath, before, after, ok: true, reason: 'removed' });
    } else if (before === null) {
      results.push({ skillPath, before, after, ok: true, reason: 'new skill' });
    } else if (files.every((file) => file.startsWith('evals/'))) {
      results.push({ skillPath, before, after, ok: true, reason: 'evals-only change' });
    } else if (compareSemver(after, before) > 0) {
      results.push({ skillPath, before, after, ok: true, reason: 'bumped' });
    } else {
      results.push({ skillPath, before, after, ok: false, reason: `changed without a version bump (${files.length} file(s))` });
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  const baseRef = baseIndex >= 0 ? args[baseIndex + 1] : 'origin/main';
  const cwd = git(process.cwd(), 'rev-parse', '--show-toplevel').trim();

  if (tryGit(cwd, 'rev-parse', '--verify', '--quiet', `${baseRef}^{commit}`) === null) {
    console.error(`❌ Base ref '${baseRef}' not found. Fetch it or pass --base <ref>.`);
    process.exit(1);
  }

  const results = checkSkillVersions(cwd, baseRef);
  if (results.length === 0) {
    console.log(`✔ No skill changes relative to ${baseRef}.`);
    return;
  }

  for (const { skillPath, before, after, ok, reason } of results) {
    const versions = before && after ? `${before} → ${after}` : after || before;
    console.log(`${ok ? '✔' : '❌'} ${path.dirname(skillPath)} (${versions}): ${reason}`);
  }

  if (results.some((r) => !r.ok)) {
    console.error('\nBump the `version` in each failing SKILL.md (SemVer: major = breaking, minor = new capability, patch = fix or docs).');
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
