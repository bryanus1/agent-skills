#!/usr/bin/env node

import path from 'node:path';
import { KEBAB_REGEX, applyFiles, fail, parseArgs } from './lib/scaffold.mjs';
import { barrel, serviceTemplate, serviceTestTemplate } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node scaffold-service.mjs <verb-noun> --feature <feature-name> [options]

Arguments:
  verb-noun           Service name in kebab-case (e.g. get-invoices, create-invoice)

Options:
  --feature <name>    Feature name that will own the service (required)
  --target-dir <dir>  Base features directory (default: src/features)
  --dry-run           List what would be generated without writing anything
  --force             Overwrite files that already exist (default: abort on conflict)
  --help, -h          Show this help message
`);
}

function toCamelCase(str) {
  return str
    .split(/[-_]/)
    .map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const { positional, flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--feature', '--target-dir'],
  });

  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name) || !name.includes('-')) {
    fail(`Service name '${name ?? ''}' must follow the <verb>-<noun> convention in kebab-case (e.g. get-invoices).`);
  }

  const feature = flags.feature;
  if (!feature || !KEBAB_REGEX.test(feature)) {
    fail('--feature is required and must be in kebab-case.');
  }

  const camel = toCamelCase(name);
  const serviceDir = path.resolve(
    process.cwd(),
    flags['target-dir'] ?? 'src/features',
    feature,
    'services',
    name,
  );

  const files = [
    {
      path: path.join(serviceDir, `${name}.service.ts`),
      content: serviceTemplate(camel),
    },
    {
      path: path.join(serviceDir, `${name}.service.test.ts`),
      content: serviceTestTemplate(camel, `${name}.service`),
    },
    {
      path: path.join(serviceDir, 'index.ts'),
      content: barrel(`${name}.service`),
    },
  ];

  console.log(`⚙️ Scaffolding React Native Service: ${camel}`);
  console.log(`📁 Target directory: ${serviceDir}`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force });
}

main();
