// Shared helpers for the monorepo-architecture scaffolds. Dependency-free.

import fs from 'node:fs';
import path from 'node:path';

export const KEBAB_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function fail(message) {
  console.error(`❌ Error: ${message}`);
  process.exit(1);
}

/** Parses `argv` into positionals and the declared `--flags`. Unknown options fail. */
export function parseArgs(argv, { booleans = [], strings = [] } = {}) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (booleans.includes(arg)) {
      flags[arg.slice(2)] = true;
    } else if (strings.includes(arg)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) fail(`Missing value for ${arg}.`);
      flags[arg.slice(2)] = value;
      i++;
    } else if (arg.startsWith('-')) {
      fail(`Unknown option: ${arg}. Run with --help.`);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

export function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// Same rules as nestjs-architecture/scripts/scaffold-module.mjs so folder names match.
export function pluralize(str) {
  if (str === 'auth') return str;
  if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) return `${str.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(str)) return `${str}es`;
  return `${str}s`;
}

export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Returns the npm scope from the root package.json name ("@acme/x" or "acme"), or null. */
export function detectScope(root) {
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const { name } = readJson(pkgPath);
  if (typeof name !== 'string' || !name) return null;
  return name.startsWith('@') ? name.slice(1).split('/')[0] : name;
}

/**
 * Files to create have `{ path, content }`; edits of files that must already
 * exist add `update: true` and never count as conflicts.
 */
export function findConflicts(files) {
  return files.filter((file) => !file.update && fs.existsSync(file.path));
}

export function reportConflicts(conflicts, cwd = process.cwd()) {
  console.error(`❌ Error: ${conflicts.length} target file(s) already exist:`);
  for (const file of conflicts) console.error(`   - ${path.relative(cwd, file.path)}`);
  console.error('\nNo files were written. Re-run with --force to overwrite them.');
}

/** Aborts on conflicts (unless force), then previews (dryRun) or writes every file. */
export function applyFiles(files, { dryRun = false, force = false, cwd = process.cwd() } = {}) {
  const conflicts = findConflicts(files);
  if (conflicts.length > 0 && !force) {
    reportConflicts(conflicts, cwd);
    process.exit(1);
  }
  for (const file of files) {
    const action = file.update ? 'update' : conflicts.includes(file) ? 'overwrite' : 'create';
    const displayPath = path.relative(cwd, file.path);
    if (dryRun) {
      console.log(`  [DRY-RUN] Would ${action}: ${displayPath}`);
      continue;
    }
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, file.content, 'utf8');
    if (file.mode) fs.chmodSync(file.path, file.mode);
    console.log(`  ✓ ${action === 'create' ? 'Created' : action === 'update' ? 'Updated' : 'Overwrote'}: ${displayPath}`);
  }
}
