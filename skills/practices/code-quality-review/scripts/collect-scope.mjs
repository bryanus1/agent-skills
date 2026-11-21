#!/usr/bin/env node
// collect-scope: lists the files a branch or the working tree changed, classifies them
// by area (frontend, backend, data, tests, config/docs) and recommends which lenses to apply.
// Read-only: runs `git diff` and `git ls-files`; modifies nothing.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const HELP = `collect-scope: classifies the changed files and recommends review lenses (read-only).

Usage:
  node <skill-dir>/scripts/collect-scope.mjs [options] [-- paths...]
  (without git, give the paths to review after '--' and they are classified as they are)

Options:
  --base <ref>   Compare against the merge base with <ref> (defaults to main, master or develop if it exists).
  --working      Only uncommitted changes (staged, unstaged and new files).
  --cwd <dir>    Repository directory (defaults to the current one).
  --json         JSON output.
  -h, --help     Show this help.

Output: files by area, added/removed lines and recommended lenses
(clean-code, solid-principles, design-patterns, tdd-workflow, frontend-best-practices, backend-best-practices).
Exit codes: 0 report generated, 2 usage or git error.`;

const args = process.argv.slice(2);
const opts = { base: null, working: false, cwd: process.cwd(), json: false, paths: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0); }
  else if (a === '--json') opts.json = true;
  else if (a === '--working') opts.working = true;
  else if (a === '--base') opts.base = args[++i];
  else if (a === '--cwd') opts.cwd = path.resolve(args[++i] ?? '');
  else if (a === '--') { opts.paths = args.slice(i + 1); break; }
  else { console.error(`Unknown option: ${a}\n\n${HELP}`); process.exit(2); }
}
if (opts.base === undefined || (args.includes('--base') && !opts.base)) {
  console.error('--base requires a value'); process.exit(2);
}

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: opts.cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function refExists(ref) {
  try { git('rev-parse', '--verify', '--quiet', ref); return true; } catch { return false; }
}

let isRepo = true;
try { git('rev-parse', '--is-inside-work-tree'); } catch { isRepo = false; }
if (!isRepo && opts.paths.length === 0) {
  console.error('Not a git repository. Give the files to review: collect-scope.mjs -- <paths...>');
  process.exit(2);
}

let baseRef = null;
if (isRepo && !opts.working) {
  baseRef = opts.base ?? ['main', 'master', 'develop'].find(refExists) ?? null;
  if (opts.base && !refExists(opts.base)) { console.error(`The ref ${opts.base} does not exist.`); process.exit(2); }
}

const pathspec = opts.paths.length ? ['--', ...opts.paths] : [];
const changed = new Map(); // file -> { added, removed, status }

function addNumstat(output) {
  for (const line of output.split('\n').filter(Boolean)) {
    const [add, del, ...rest] = line.split('\t');
    const file = rest.join('\t');
    const prev = changed.get(file) ?? { added: 0, removed: 0, status: 'modified' };
    prev.added += add === '-' ? 0 : Number(add);
    prev.removed += del === '-' ? 0 : Number(del);
    changed.set(file, prev);
  }
}

let mode;
if (!isRepo) {
  // Without git: the given paths (files or directories) are classified as they are.
  mode = 'manual list (no git)';
  const walk = (target) => {
    const abs = path.resolve(opts.cwd, target);
    let stat; try { stat = statSync(abs); } catch { return; }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(abs)) { if (!['node_modules', '.git'].includes(entry)) walk(path.join(target, entry)); }
    } else {
      let lines = 0; try { lines = readFileSync(abs, 'utf8').split('\n').length; } catch { /* binary */ }
      changed.set(path.normalize(target).split(path.sep).join('/'), { added: lines, removed: 0, status: 'new' });
    }
  };
  for (const p of opts.paths) walk(p);
} else try {
  let mergeBase = null;
  if (baseRef) {
    try { mergeBase = git('merge-base', baseRef, 'HEAD').trim(); } catch { mergeBase = null; }
  }
  if (mergeBase && git('rev-parse', 'HEAD').trim() !== mergeBase) {
    mode = `branch vs ${baseRef}`;
    addNumstat(git('diff', '--numstat', mergeBase, 'HEAD', ...pathspec));
  } else {
    mode = 'working tree';
  }
  // Uncommitted changes (always included)
  addNumstat(git('diff', '--numstat', 'HEAD', ...pathspec));
  for (const file of git('ls-files', '--others', '--exclude-standard', ...pathspec).split('\n').filter(Boolean)) {
    let lines = 0;
    try { lines = git('diff', '--no-index', '--numstat', '/dev/null', file).split('\t')[0] | 0; } catch (e) {
      const out = String(e.stdout ?? ''); lines = Number(out.split('\t')[0]) || 0;
    }
    changed.set(file, { added: lines, removed: 0, status: 'new' });
  }
} catch (error) {
  console.error(`Git error: ${String(error.stderr ?? error.message).trim()}`);
  process.exit(2);
}

const TEST_RE = /(^|\/)(__tests__|tests?|spec|e2e)\/|\.(test|spec)\.[a-z]+$|_test\.(go|py)$|(^|\/)test_[^/]+\.py$/i;
const FRONT_EXT = /\.(tsx|jsx|vue|svelte|astro|css|scss|sass|less|html)$/i;
const FRONT_DIR = /(^|\/)(components|pages|app|views|screens|hooks|styles|ui)\//i;
const BACK_DIR = /(^|\/)(api|routes?|controllers?|services?|handlers?|resolvers?|middlewares?|repositories|repository|modules|server|workers?|jobs|queues?)\//i;
const CODE_EXT = /\.(ts|js|mjs|cjs|py|go|rs|java|kt|rb|php|cs)$/i;
const DATA_RE = /\.(sql|prisma)$|(^|\/)(migrations?|schema|seeds?)\//i;
const DOC_RE = /\.(md|mdx|txt|ya?ml|json|toml|lock|svg|png|jpe?g|gif|ico)$|(^|\/)(\.github|\.husky|docs)\//i;

function classify(file) {
  if (TEST_RE.test(file)) return 'tests';
  if (DATA_RE.test(file)) return 'data';
  if (FRONT_EXT.test(file)) return 'frontend';
  if (CODE_EXT.test(file) && FRONT_DIR.test(file) && !BACK_DIR.test(file)) return 'frontend';
  if (CODE_EXT.test(file) && BACK_DIR.test(file)) return 'backend';
  if (CODE_EXT.test(file)) return 'code';
  if (DOC_RE.test(file)) return 'config-docs';
  return 'other';
}

const areas = { frontend: [], backend: [], data: [], code: [], tests: [], 'config-docs': [], other: [] };
let added = 0; let removed = 0;
for (const [file, info] of [...changed.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  areas[classify(file)].push({ file, added: info.added, removed: info.removed, status: info.status });
  added += info.added; removed += info.removed;
}

const sourceCount = areas.frontend.length + areas.backend.length + areas.data.length + areas.code.length;
const lenses = [];
if (sourceCount > 0) lenses.push({ skill: 'clean-code', why: 'source code changed' });
if (areas.frontend.length) lenses.push({ skill: 'frontend-best-practices', why: `${areas.frontend.length} UI file(s)` });
if (areas.backend.length || areas.data.length) lenses.push({ skill: 'backend-best-practices', why: `${areas.backend.length + areas.data.length} server or data file(s)` });
if (areas.backend.length + areas.code.length + areas.frontend.length >= 3) lenses.push({ skill: 'solid-principles', why: 'several code units: review responsibilities and dependencies' });
if (sourceCount > 0) lenses.push({ skill: 'design-patterns', why: 'only if the change introduces or should introduce a pattern (conditional)', conditional: true });
if (sourceCount > 0) lenses.push({ skill: 'tdd-workflow', why: areas.tests.length ? 'tests changed: check that they cover the change' : 'code changed without tests: review the coverage of the change' });

const warnings = [];
if (sourceCount > 0 && areas.tests.length === 0) warnings.push('Changes source code without touching any test.');
if (added + removed > 800) warnings.push(`Large change (${added + removed} lines): review it in parts or by area.`);
if (changed.size === 0) warnings.push('No changes detected.');

const result = { mode, base: baseRef, files: changed.size, added, removed, areas, lenses, warnings };

if (opts.json) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }

console.log(`Scope: ${mode} · ${changed.size} file(s) · +${added} −${removed}`);
for (const [area, items] of Object.entries(areas)) {
  if (!items.length) continue;
  console.log(`\n${area} (${items.length})`);
  for (const item of items) console.log(`  ${item.status === 'new' ? '+' : ' '} ${item.file}  +${item.added} −${item.removed}`);
}
if (lenses.length) {
  console.log('\nRecommended lenses');
  for (const lens of lenses) console.log(`  - ${lens.skill}${lens.conditional ? ' (conditional)' : ''}: ${lens.why}`);
}
if (warnings.length) {
  console.log('\nWarnings');
  for (const w of warnings) console.log(`  ! ${w}`);
}
