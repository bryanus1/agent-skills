#!/usr/bin/env node
// Detects the test runner(s) of a project and prints the commands to run the
// whole suite, a single file and watch mode. Read-only: it never writes files.
// Usage: node detect-test-runner.mjs [--cwd <dir>] [--json] [--help]

import fs from 'node:fs';
import path from 'node:path';

const HELP = `detect-test-runner: detects the project's test runner and the commands to run it.

Usage:
  node <skill-dir>/scripts/detect-test-runner.mjs [--cwd <dir>] [--json]

Options:
  --cwd <dir>   Project directory (defaults to the current directory).
  --json        Print the result as JSON.
  -h, --help    Show this help.

Supports: vitest, jest, playwright, mocha, node:test (JS/TS), pytest, go test and cargo test.
It writes and installs nothing. Exits with 0 even when no runner is found (runners: []).`;

function parseArgs(argv) {
  const opts = { cwd: process.cwd(), json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--cwd') {
      if (!argv[i + 1]) throw new Error('--cwd requires a directory');
      opts.cwd = path.resolve(argv[++i]);
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return opts;
}

const exists = (dir, name) => fs.existsSync(path.join(dir, name));

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Walks up from `start` looking for the first directory containing one of `names`. */
function findUp(start, names) {
  let dir = start;
  while (true) {
    for (const name of names) if (exists(dir, name)) return { dir, name };
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lockb', 'bun'],
  ['bun.lock', 'bun'],
  ['package-lock.json', 'npm'],
];

function detectPackageManager(cwd, pkg) {
  const declared = typeof pkg?.packageManager === 'string' ? pkg.packageManager.split('@')[0] : null;
  if (declared && ['pnpm', 'yarn', 'npm', 'bun'].includes(declared)) return declared;
  const found = findUp(cwd, LOCKFILES.map(([file]) => file));
  return found ? LOCKFILES.find(([file]) => file === found.name)[1] : 'npm';
}

const EXEC = { pnpm: 'pnpm exec', yarn: 'yarn', npm: 'npx', bun: 'bunx' };
const RUN = { pnpm: 'pnpm', yarn: 'yarn', npm: 'npm run', bun: 'bun run' };

function firstExisting(cwd, candidates) {
  return candidates.find((name) => exists(cwd, name)) ?? null;
}

const configNames = (base, exts) => exts.map((ext) => `${base}.${ext}`);
const JS_EXTS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'];

function detectJsRunners(cwd, pkg, pm) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const scripts = pkg.scripts ?? {};
  const allScripts = Object.values(scripts).join(' ');
  const x = EXEC[pm];
  const runners = [];

  const vitestConfig = firstExisting(cwd, [...configNames('vitest.config', JS_EXTS), ...configNames('vitest.workspace', JS_EXTS)]);
  const viteHasTest = (() => {
    const vite = firstExisting(cwd, configNames('vite.config', JS_EXTS));
    return vite && /\btest\s*:/.test(fs.readFileSync(path.join(cwd, vite), 'utf8')) ? vite : null;
  })();
  if (deps.vitest || vitestConfig || viteHasTest || /\bvitest\b/.test(allScripts)) {
    runners.push({
      name: 'vitest', kind: 'unit', config: vitestConfig ?? viteHasTest,
      commands: { all: `${x} vitest run`, file: `${x} vitest run <file>`, watch: `${x} vitest` },
    });
  }

  const jestConfig = firstExisting(cwd, [...configNames('jest.config', [...JS_EXTS, 'json'])]) ?? (pkg.jest ? 'package.json#jest' : null);
  if (deps.jest || jestConfig || /\bjest\b/.test(allScripts)) {
    runners.push({
      name: 'jest', kind: 'unit', config: jestConfig,
      commands: { all: `${x} jest`, file: `${x} jest <file>`, watch: `${x} jest --watch` },
    });
  }

  const mochaConfig = firstExisting(cwd, ['.mocharc.json', '.mocharc.js', '.mocharc.cjs', '.mocharc.yml', '.mocharc.yaml']);
  if (deps.mocha || mochaConfig || /\bmocha\b/.test(allScripts)) {
    runners.push({
      name: 'mocha', kind: 'unit', config: mochaConfig,
      commands: { all: `${x} mocha`, file: `${x} mocha <file>`, watch: `${x} mocha --watch` },
    });
  }

  const nodeTestScript = Object.keys(scripts).find((key) => /\bnode\s+(?:[^&|;]*\s)?--test\b/.test(scripts[key]));
  if (nodeTestScript) {
    runners.push({
      name: 'node:test', kind: 'unit', config: null,
      commands: { all: `${RUN[pm]} ${nodeTestScript}`, file: 'node --test <file>', watch: 'node --test --watch' },
    });
  }

  const pwConfig = firstExisting(cwd, configNames('playwright.config', JS_EXTS));
  if (deps['@playwright/test'] || pwConfig) {
    runners.push({
      name: 'playwright', kind: 'e2e', config: pwConfig,
      commands: { all: `${x} playwright test`, file: `${x} playwright test <file>`, watch: `${x} playwright test --ui` },
    });
  }

  if (deps.cypress || firstExisting(cwd, configNames('cypress.config', JS_EXTS))) {
    runners.push({
      name: 'cypress', kind: 'e2e', config: firstExisting(cwd, configNames('cypress.config', JS_EXTS)),
      commands: { all: `${x} cypress run`, file: `${x} cypress run --spec <file>`, watch: `${x} cypress open` },
    });
  }

  return runners;
}

function detectOtherRunners(cwd) {
  const runners = [];
  const pyproject = exists(cwd, 'pyproject.toml') ? fs.readFileSync(path.join(cwd, 'pyproject.toml'), 'utf8') : '';
  if (exists(cwd, 'pytest.ini') || exists(cwd, 'conftest.py') || /\[tool\.pytest/.test(pyproject) || /\bpytest\b/.test(pyproject)) {
    runners.push({ name: 'pytest', kind: 'unit', config: firstExisting(cwd, ['pytest.ini', 'pyproject.toml', 'setup.cfg']),
      commands: { all: 'pytest', file: 'pytest <file>', watch: 'ptw' } });
  }
  if (exists(cwd, 'go.mod')) {
    runners.push({ name: 'go test', kind: 'unit', config: 'go.mod',
      commands: { all: 'go test ./...', file: 'go test ./<package-dir>', watch: null } });
  }
  if (exists(cwd, 'Cargo.toml')) {
    runners.push({ name: 'cargo test', kind: 'unit', config: 'Cargo.toml',
      commands: { all: 'cargo test', file: 'cargo test <test-name>', watch: 'cargo watch -x test' } });
  }
  return runners;
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', 'out', 'target', 'vendor', '__pycache__']);
const TEST_FILE = /(?:\.(?:test|spec)\.[cm]?[jt]sx?$)|(?:^test_.*\.py$)|(?:_test\.(?:py|go)$)/;

/** Finds up to `limit` existing test files to infer naming and placement conventions. */
function sampleTestFiles(cwd, limit = 5) {
  const found = [];
  const queue = [cwd];
  let visited = 0;
  while (queue.length && found.length < limit && visited < 4000) {
    const dir = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      visited++;
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) queue.push(full);
      } else if (TEST_FILE.test(entry.name)) {
        found.push(path.relative(cwd, full).split(path.sep).join('/'));
        if (found.length >= limit) break;
      }
    }
  }
  return found;
}

function inferConventions(samples) {
  if (!samples.length) return null;
  const suffixes = samples.map((file) => file.match(/\.(test|spec)\.[cm]?[jt]sx?$/)?.[0] ?? path.extname(file));
  const counts = suffixes.reduce((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});
  const suffix = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const separateDir = samples.filter((file) => /(^|\/)(tests?|__tests__|spec)\//.test(file)).length > samples.length / 2;
  return { suffix, placement: separateDir ? 'separate test directory' : 'colocated next to the source', samples };
}

function detect(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  const pkg = fs.existsSync(pkgPath) ? readJson(pkgPath) : null;
  const pm = pkg ? detectPackageManager(cwd, pkg) : null;
  const runners = [...(pkg ? detectJsRunners(cwd, pkg, pm) : []), ...detectOtherRunners(cwd)];
  const workspaceRoot = findUp(cwd, ['pnpm-workspace.yaml', 'turbo.json', 'nx.json', 'lerna.json']);
  return {
    cwd,
    packageManager: pm,
    testScript: pkg?.scripts?.test ? `${RUN[pm]} test` : null,
    monorepo: Boolean(workspaceRoot || pkg?.workspaces),
    runners,
    conventions: inferConventions(sampleTestFiles(cwd)),
  };
}

function printHuman(result) {
  const lines = [`Project: ${result.cwd}`];
  if (result.packageManager) lines.push(`Package manager: ${result.packageManager}`);
  if (result.testScript) lines.push(`Test script: ${result.testScript}`);
  if (result.monorepo) lines.push('Monorepo: yes (run the tests from the affected package or with the workspace filter)');
  if (!result.runners.length) {
    lines.push('', 'No test runner detected.');
  }
  for (const runner of result.runners) {
    lines.push('', `▸ ${runner.name} (${runner.kind})${runner.config ? ` — config: ${runner.config}` : ''}`);
    lines.push(`  all:      ${runner.commands.all}`);
    lines.push(`  file:     ${runner.commands.file}`);
    if (runner.commands.watch) lines.push(`  watch:    ${runner.commands.watch}`);
  }
  if (result.conventions) {
    lines.push('', `Test convention: suffix ${result.conventions.suffix}, ${result.conventions.placement}`);
    for (const sample of result.conventions.samples) lines.push(`  e.g. ${sample}`);
  } else {
    lines.push('', 'No existing test files to infer conventions from.');
  }
  console.log(lines.join('\n'));
}

try {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    process.exit(0);
  }
  if (!fs.existsSync(opts.cwd) || !fs.statSync(opts.cwd).isDirectory()) {
    throw new Error(`Directory does not exist: ${opts.cwd}`);
  }
  const result = detect(opts.cwd);
  if (opts.json) console.log(JSON.stringify(result, null, 2));
  else printHuman(result);
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error('Use --help to see the options.');
  process.exit(2);
}
