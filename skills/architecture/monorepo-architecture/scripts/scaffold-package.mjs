#!/usr/bin/env node
// scaffold-package.mjs — Creates an internal workspace package in packages/<name>.

import fs from 'node:fs';
import path from 'node:path';
import { KEBAB_REGEX, applyFiles, detectScope, fail, parseArgs } from './lib/scaffold.mjs';
import { PACKAGE_KINDS, packageFiles } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node scaffold-package.mjs <name> [options]

Arguments:
  name                Package folder and name in kebab-case (e.g. utils, ui, contracts)

Options:
  --kind <kind>       lib (default) | contracts | api-client | config
                        lib         compiled TypeScript library with a vitest test
                        contracts   shared Zod schemas, one subpath export per domain
                        api-client  typed client generated from the API's OpenAPI document
                        config      shared configuration files, no build step
  --scope <scope>     npm scope (default: detected from the root package.json name)
  --dry-run           List the files that would be generated without writing anything
  --force             Overwrite generated files that already exist (default: abort on conflict)
  --help, -h          Show this help message

Run it from the monorepo root (the folder with pnpm-workspace.yaml).
`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const { positional, flags } = parseArgs(argv, { booleans: ['--dry-run', '--force'], strings: ['--kind', '--scope'] });

  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name)) fail(`Package name '${name ?? ''}' must be kebab-case.`);
  const kind = flags.kind ?? 'lib';
  if (!PACKAGE_KINDS.includes(kind)) fail(`Unknown --kind '${kind}'. Use one of: ${PACKAGE_KINDS.join(', ')}.`);

  const root = process.cwd();
  if (!fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) fail('pnpm-workspace.yaml not found. Run from the monorepo root.');
  const scope = flags.scope?.replace(/^@/, '') ?? detectScope(root);
  if (!scope) fail('Could not detect the scope from package.json. Pass --scope <scope>.');

  const files = packageFiles({ root, scope, name, kind });
  console.log(`📦 Scaffolding @${scope}/${name} (${kind}) in packages/${name}`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force, cwd: root });

  if (flags['dry-run']) {
    console.log(`\n🔎 Dry run complete: ${files.length} files would be written. Nothing was changed.`);
    return;
  }
  console.log(`\n✨ @${scope}/${name} created.`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Add "@${scope}/${name}": "workspace:*" to the package.json of each consumer`);
  console.log(`   2. pnpm install && pnpm --filter @${scope}/${name} build`);
  console.log(`   3. Import only through its "exports" (e.g. '@${scope}/${name}'), never from src/ or dist/`);
}

main();
