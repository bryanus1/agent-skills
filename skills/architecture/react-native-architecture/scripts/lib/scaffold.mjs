// Shared helpers for the react-native-architecture scaffolds. Dependency-free.

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

export function findConflicts(files) {
  return files.filter((file) => fs.existsSync(file.path));
}

export function reportConflicts(conflicts, cwd = process.cwd()) {
  console.error(`❌ Error: ${conflicts.length} target file(s) already exist:`);
  for (const file of conflicts) console.error(`   - ${path.relative(cwd, file.path)}`);
  console.error('\nNo files were written. Re-run with --force to overwrite them.');
}

/**
 * Aborts on conflicts (unless force), then previews (dryRun) or writes every file.
 * `dirs` are empty folders to ensure (created only when not in dry-run).
 */
export function applyFiles(files, { dryRun = false, force = false, dirs = [], cwd = process.cwd() } = {}) {
  const conflicts = findConflicts(files);
  if (conflicts.length > 0 && !force) {
    reportConflicts(conflicts, cwd);
    process.exit(1);
  }
  for (const dir of dirs) {
    const displayPath = `${path.relative(cwd, dir)}/`;
    if (dryRun) {
      console.log(`  [DRY-RUN] Would ensure directory: ${displayPath}`);
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  ✓ Directory ready: ${displayPath}`);
  }
  for (const file of files) {
    const action = conflicts.includes(file) ? 'overwrite' : 'create';
    const displayPath = path.relative(cwd, file.path);
    if (dryRun) {
      console.log(`  [DRY-RUN] Would ${action}: ${displayPath}`);
      continue;
    }
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, file.content, 'utf8');
    console.log(`  ✓ ${action === 'create' ? 'Created' : 'Overwrote'}: ${displayPath}`);
  }
  if (dryRun) console.log('\n🔎 Dry run complete. Nothing was changed.');
}
