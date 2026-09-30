#!/usr/bin/env node
// check-boundaries.mjs — Validates dependency boundaries in a pnpm workspace.
// Standalone and dependency-free: scaffold-monorepo copies it into the repo for CI.
//
// Rules (each violation is reported as file:line and makes the script exit 1):
//   app-import         an app imports another app
//   package-imports-app a package imports an app
//   relative-escape    a relative import leaves its own workspace
//   undeclared         a workspace package is imported but not declared in package.json
//   deep-import        an import path is not exposed by the target's "exports"
//   cycle              packages depend on each other in a cycle

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.git', 'out']);
const IMPORT_PATTERNS = [
  /\b(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?['"]([^'"\n]+)['"]/g,
  /\brequire\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g,
];

function printHelp() {
  console.log(`
Usage: node check-boundaries.mjs [options]

Options:
  --root <dir>       Monorepo root containing pnpm-workspace.yaml (default: current directory)
  --apps-dir <dir>   Directory whose workspaces are apps (default: apps)
  --json             Print violations as JSON
  --help, -h         Show this help message
`);
}

/** Reads the `packages:` globs from pnpm-workspace.yaml without a YAML dependency. */
export function readWorkspaceGlobs(root) {
  const file = path.join(root, 'pnpm-workspace.yaml');
  if (!fs.existsSync(file)) throw new Error(`pnpm-workspace.yaml not found in ${root}`);
  const globs = [];
  let inPackages = false;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.replace(/#.*/, '').trimEnd();
    if (!line.trim()) continue;
    if (/^\S/.test(line)) {
      inPackages = /^packages\s*:/.test(line);
      continue;
    }
    const item = inPackages && line.trim().match(/^-\s*['"]?([^'"]+)['"]?$/);
    if (item) globs.push(item[1].trim());
  }
  return globs;
}

function expandGlob(root, glob) {
  const recursive = glob.endsWith('/**');
  const oneLevel = glob.endsWith('/*');
  const base = path.join(root, recursive ? glob.slice(0, -3) : oneLevel ? glob.slice(0, -2) : glob);
  if (!recursive && !oneLevel) return fs.existsSync(path.join(base, 'package.json')) ? [base] : [];
  if (!fs.existsSync(base)) return [];
  const found = [];
  const walk = (dir, depth) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (fs.existsSync(path.join(full, 'package.json'))) found.push(full);
      if (recursive && depth < 5) walk(full, depth + 1);
    }
  };
  walk(base, 0);
  return found;
}

/** Discovers workspaces: { name, dir, rel, isApp, deps: Set, exports }. */
export function loadWorkspaces(root, appsDir = 'apps') {
  const globs = readWorkspaceGlobs(root);
  const excluded = new Set(globs.filter((g) => g.startsWith('!')).flatMap((g) => expandGlob(root, g.slice(1))));
  const dirs = [...new Set(globs.filter((g) => !g.startsWith('!')).flatMap((g) => expandGlob(root, g)))].filter((d) => !excluded.has(d));
  return dirs.sort().map((dir) => {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const rel = path.relative(root, dir).split(path.sep).join('/');
    return {
      name: pkg.name,
      dir,
      rel,
      isApp: rel === appsDir || rel.startsWith(`${appsDir}/`),
      deps: new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})]),
      exports: pkg.exports,
    };
  });
}

function listSourceFiles(dir) {
  const results = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        // Nested workspaces are scanned on their own.
        if (!fs.existsSync(path.join(full, 'package.json'))) walk(full);
      } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(full);
      }
    }
  };
  walk(dir);
  return results;
}

/** Returns [{ specifier, line }] for every static/dynamic import, export-from and require. */
export function extractImports(source) {
  // Blank out comments while keeping line numbers.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const found = [];
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of code.matchAll(pattern)) {
      found.push({ specifier: match[1], line: code.slice(0, match.index).split('\n').length });
    }
  }
  return found.sort((a, b) => a.line - b.line);
}

function packageNameOf(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** True when `subpath` ("." or "./x") is exposed by an exports field (supports "./*" patterns). */
export function isExported(exportsField, subpath) {
  if (exportsField === undefined) return subpath === '.';
  if (typeof exportsField === 'string' || Array.isArray(exportsField)) return subpath === '.';
  const keys = Object.keys(exportsField);
  if (!keys.some((k) => k.startsWith('.'))) return subpath === '.'; // conditions-only object
  return keys.some((key) => {
    if (key === subpath) return true;
    const star = key.indexOf('*');
    if (star === -1) return false;
    const [prefix, suffix] = [key.slice(0, star), key.slice(star + 1)];
    return subpath.startsWith(prefix) && subpath.endsWith(suffix) && subpath.length >= prefix.length + suffix.length;
  });
}

function findCycles(workspaces) {
  const byName = new Map(workspaces.map((w) => [w.name, w]));
  const cycles = [];
  const seen = new Set();
  const state = new Map(); // 1 = visiting, 2 = done
  const visit = (ws, stack) => {
    state.set(ws.name, 1);
    stack.push(ws.name);
    for (const dep of ws.deps) {
      const target = byName.get(dep);
      if (!target) continue;
      if (state.get(dep) === 1) {
        const cycle = [...stack.slice(stack.indexOf(dep)), dep];
        const key = [...cycle.slice(0, -1)].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push({ ws: target, cycle });
        }
      } else if (!state.get(dep)) {
        visit(target, stack);
      }
    }
    stack.pop();
    state.set(ws.name, 2);
  };
  for (const ws of workspaces) if (!state.get(ws.name)) visit(ws, []);
  return cycles;
}

/** Runs every rule and returns violations: { rule, file, line, message }. */
export function checkBoundaries(root, { appsDir = 'apps' } = {}) {
  const absRoot = path.resolve(root);
  const workspaces = loadWorkspaces(absRoot, appsDir);
  const byName = new Map(workspaces.map((w) => [w.name, w]));
  const violations = [];
  const rel = (file) => path.relative(absRoot, file).split(path.sep).join('/');

  for (const ws of workspaces) {
    for (const file of listSourceFiles(ws.dir)) {
      for (const { specifier, line } of extractImports(fs.readFileSync(file, 'utf8'))) {
        const report = (rule, message) => violations.push({ rule, file: rel(file), line, message });

        if (specifier.startsWith('.')) {
          const target = path.resolve(path.dirname(file), specifier);
          if (target !== ws.dir && !target.startsWith(ws.dir + path.sep)) {
            const owner = workspaces.find((w) => target === w.dir || target.startsWith(w.dir + path.sep));
            report('relative-escape', `'${specifier}' leaves ${ws.name}${owner ? ` into ${owner.name}; import it by package name` : ''}.`);
          }
          continue;
        }

        const target = byName.get(packageNameOf(specifier));
        if (!target || target === ws) continue;

        if (target.isApp) {
          report(ws.isApp ? 'app-import' : 'package-imports-app', `${ws.name} imports the app ${target.name}; apps are never imported (move shared code to packages/).`);
          continue;
        }
        if (!ws.deps.has(target.name)) {
          report('undeclared', `${target.name} is not declared in ${ws.rel}/package.json (add "${target.name}": "workspace:*").`);
        }
        const subpath = specifier === target.name ? '.' : `./${specifier.slice(target.name.length + 1)}`;
        if (!isExported(target.exports, subpath)) {
          report('deep-import', `'${specifier}' is not exposed by the "exports" of ${target.name}.`);
        }
      }
    }
  }

  for (const { ws, cycle } of findCycles(workspaces.filter((w) => !w.isApp))) {
    violations.push({ rule: 'cycle', file: `${ws.rel}/package.json`, line: 1, message: `Dependency cycle: ${cycle.join(' → ')}.` });
  }

  return violations;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  const valueOf = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };

  let violations;
  try {
    violations = checkBoundaries(valueOf('--root', process.cwd()), { appsDir: valueOf('--apps-dir', 'apps') });
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  if (args.includes('--json')) {
    console.log(JSON.stringify(violations, null, 2));
  } else if (violations.length === 0) {
    console.log('✔ No boundary violations found.');
  } else {
    for (const v of violations) console.log(`${v.file}:${v.line}  [${v.rule}]  ${v.message}`);
    console.log(`\n❌ ${violations.length} boundary violation(s).`);
  }
  process.exit(violations.length > 0 ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
