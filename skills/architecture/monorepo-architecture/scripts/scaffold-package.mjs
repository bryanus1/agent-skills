#!/usr/bin/env node
// scaffold-package.mjs — Creates an internal workspace package in packages/<name>.

import fs from 'node:fs';
import path from 'node:path';
import { KEBAB_REGEX, applyFiles, detectScope, fail, parseArgs } from './lib/scaffold.mjs';
import { LINTER_MODES, PACKAGE_KINDS, packageFiles } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node scaffold-package.mjs <name> [options]

Arguments:
  name                  Package folder and name in kebab-case (e.g. utils, contracts, design-tokens)

Options:
  --kind <kind>         lib (default) | contracts | api-client | design-tokens | ui-web | ui-native | config
                          lib            compiled universal TypeScript library with a vitest test
                          contracts      shared Zod schemas, one subpath export per domain (universal)
                          api-client     typed OpenAPI client with cross-platform auth headers (universal)
                          design-tokens  cross-platform colors/spacing/typography for Next, Astro & NativeWind
                          ui-web         web-only React components (Next.js / Astro React islands)
                          ui-native      React Native primitives/contracts (Expo / mobile)
                          config         shared configuration files, no build step
  --linter <mode>       oxc | eslint | both (default: auto-detected from packages/oxc-config or eslint-config)
  --scope <scope>       npm scope (default: detected from the root package.json name)
  --dry-run             List the files that would be generated without writing anything
  --force               Overwrite generated files that already exist (default: abort on conflict)
  --help, -h            Show this help message

Run it from the monorepo root (the folder with pnpm-workspace.yaml).
`);
}

function detectLinter(root) {
  const hasOxc = fs.existsSync(path.join(root, 'packages', 'oxc-config', 'package.json'));
  const hasEslint = fs.existsSync(path.join(root, 'packages', 'eslint-config', 'package.json'));
  if (hasOxc && hasEslint) return 'both';
  if (hasEslint && !hasOxc) return 'eslint';
  return 'oxc';
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }
  const { positional, flags } = parseArgs(argv, { booleans: ['--dry-run', '--force'], strings: ['--kind', '--scope', '--linter'] });

  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name)) fail(`Package name '${name ?? ''}' must be kebab-case.`);
  const kind = flags.kind ?? 'lib';
  if (!PACKAGE_KINDS.includes(kind)) fail(`Unknown --kind '${kind}'. Use one of: ${PACKAGE_KINDS.join(', ')}.`);

  const root = process.cwd();
  if (!fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))) fail('pnpm-workspace.yaml not found. Run from the monorepo root.');
  const scope = flags.scope?.replace(/^@/, '') ?? detectScope(root);
  if (!scope) fail('Could not detect the scope from package.json. Pass --scope <scope>.');

  const linter = flags.linter ?? detectLinter(root);
  if (!LINTER_MODES.includes(linter)) fail(`Unknown --linter '${linter}'. Use one of: ${LINTER_MODES.join(', ')}.`);

  const files = packageFiles({ root, scope, name, kind, linter });
  console.log(`📦 Scaffolding @${scope}/${name} (${kind}, linter: ${linter}) in packages/${name}`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force, cwd: root });

  if (flags['dry-run']) {
    console.log(`\n🔎 Dry run complete: ${files.length} files would be written. Nothing was changed.`);
    return;
  }
  console.log(`\n✨ @${scope}/${name} created.`);
  console.log(`\n📌 Next steps:`);
  console.log(`   1. Add "@${scope}/${name}": "workspace:*" to the package.json of each compatible consumer`);
  console.log(`   2. pnpm install && pnpm --filter @${scope}/${name} build`);
  console.log(`   3. Import only through its "exports" (e.g. '@${scope}/${name}'), never from src/ or dist/`);
}

main();
