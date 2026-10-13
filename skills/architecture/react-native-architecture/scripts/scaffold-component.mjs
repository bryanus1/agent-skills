#!/usr/bin/env node

import path from 'node:path';
import { KEBAB_REGEX, applyFiles, fail, parseArgs, toPascalCase } from './lib/scaffold.mjs';
import { barrel, componentTemplate, componentTestTemplate } from './lib/templates.mjs';

const TYPES = ['default', 'modal', 'section'];

function printHelp() {
  console.log(`
Usage: node scaffold-component.mjs <component-name> [options]

Arguments:
  component-name      Name of component in kebab-case (e.g., user-card, invoice-modal)

Options:
  --target-dir <dir>  Target directory (default: src/components/common)
  --type <type>       Component archetype: ${TYPES.join(', ')} (default: default)
  --dry-run           List the files that would be generated without writing anything
  --force             Overwrite component files that already exist (default: abort on conflict)
  --help, -h          Show this help message
`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const { positional, flags } = parseArgs(argv, {
    booleans: ['--dry-run', '--force'],
    strings: ['--target-dir', '--type'],
  });
  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name)) fail(`Component name '${name ?? ''}' must be in kebab-case.`);

  const type = flags.type ?? 'default';
  if (!TYPES.includes(type)) fail(`Unknown --type '${type}'. Use one of: ${TYPES.join(', ')}.`);

  const pascal = toPascalCase(name);
  const folder = path.resolve(process.cwd(), flags['target-dir'] ?? 'src/components/common', name);
  const files = [
    { path: path.join(folder, `${name}.tsx`), content: componentTemplate(pascal, type) },
    { path: path.join(folder, `${name}.test.tsx`), content: componentTestTemplate(pascal, name, type) },
    { path: path.join(folder, 'index.ts'), content: barrel(name) },
  ];

  console.log(`🧩 Scaffolding React Native component: ${pascal} (${type})`);
  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force });
}

main();
