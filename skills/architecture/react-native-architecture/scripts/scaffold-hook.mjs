#!/usr/bin/env node

import path from 'node:path';
import { KEBAB_REGEX, applyFiles, fail, parseArgs, toPascalCase } from './lib/scaffold.mjs';
import { barrel, hookTemplate, hookTestTemplate, keysTemplate } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node scaffold-hook.mjs <hook-name> --feature <feature-name> [options]

Arguments:
  hook-name           Name of the hook in kebab-case, starting with use- (e.g. use-invoices, use-create-invoice)

Options:
  --feature <name>    Feature name that will own the hook (required)
  --kind <kind>       Hook archetype: query, mutation (default: query)
  --entity <name>     Entity name for key factory in kebab-case (default: derived from feature)
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
    strings: ['--feature', '--kind', '--entity', '--target-dir'],
  });

  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name) || !name.startsWith('use-')) {
    fail(`Hook name '${name ?? ''}' must be in kebab-case and start with 'use-' (e.g. use-invoices).`);
  }

  const feature = flags.feature;
  if (!feature || !KEBAB_REGEX.test(feature)) {
    fail('--feature is required and must be in kebab-case.');
  }

  const kind = flags.kind ?? 'query';
  if (!['query', 'mutation'].includes(kind)) {
    fail(`Invalid --kind '${kind}'. Use 'query' or 'mutation'.`);
  }

  const entity = flags.entity ?? feature;
  if (!KEBAB_REGEX.test(entity)) {
    fail(`Entity name '${entity}' must be in kebab-case.`);
  }

  const entityPascal = toPascalCase(entity);
  const entityCamel = toCamelCase(entity);
  const hookCamel = toCamelCase(name);

  const featureRoot = path.resolve(process.cwd(), flags['target-dir'] ?? 'src/features', feature);
  const keysDir = path.join(featureRoot, 'hooks', `${entity}-keys`);
  const hookDir = path.join(featureRoot, 'hooks', name);

  const files = [];

  // Key factory (hierarchical) if not already existing
  files.push(
    { path: path.join(keysDir, `${entity}.keys.ts`), content: keysTemplate(entityCamel, entityPascal) },
    { path: path.join(keysDir, 'index.ts'), content: `export { ${entityCamel}Keys } from './${entity}.keys';\n` },
  );

  // Hook, test and leaf barrel
  files.push(
    {
      path: path.join(hookDir, `${name}.hook.ts`),
      content: hookTemplate(hookCamel, { feature, kind, entityName: entityCamel, entityPascal }),
    },
    {
      path: path.join(hookDir, `${name}.hook.test.ts`),
      content: hookTestTemplate(hookCamel, { kind }),
    },
    {
      path: path.join(hookDir, 'index.ts'),
      content: barrel(`${name}.hook`),
    },
  );

  console.log(`🪝 Scaffolding React Native TanStack Hook: ${hookCamel} (${kind})`);
  console.log(`📁 Target feature: ${feature}`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force });
}

main();
