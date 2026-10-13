#!/usr/bin/env node

import path from 'node:path';
import { KEBAB_REGEX, applyFiles, fail, parseArgs, toPascalCase } from './lib/scaffold.mjs';
import { barrel, modelTemplate, routeTemplate, screenTemplate, screenTestTemplate } from './lib/templates.mjs';

function printHelp() {
  console.log(`
Usage: node scaffold-feature.mjs <feature-name> [options]

Arguments:
  feature-name        Name of the feature in kebab-case (e.g., billing, user-profile)

Options:
  --target-dir <dir>  Base directory for features (default: src/features)
  --app-dir <dir>     Expo Router directory used by --with-route (default: src/app)
  --with-starter      Generate starter model and screen files
  --with-route        Also generate a thin Expo Router route (requires --with-starter)
  --dry-run           List what would be generated without writing anything
  --force             Overwrite files that already exist (default: abort on conflict)
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
    booleans: ['--with-starter', '--with-route', '--dry-run', '--force'],
    strings: ['--target-dir', '--app-dir'],
  });
  const [name] = positional;
  if (!name || !KEBAB_REGEX.test(name)) {
    fail(`Feature name '${name ?? ''}' must be in kebab-case (lowercase letters, numbers, hyphens).`);
  }
  if (flags['with-route'] && !flags['with-starter']) {
    fail('--with-route requires --with-starter (the route re-exports the starter screen).');
  }

  const featureRoot = path.resolve(process.cwd(), flags['target-dir'] ?? 'src/features', name);
  const dirs = ['components', 'hooks', 'models', 'schemas', 'screens', 'services', 'utils'].map((d) => path.join(featureRoot, d));
  const files = [];

  if (flags['with-starter']) {
    const pascal = toPascalCase(name);
    const screenDir = path.join(featureRoot, 'screens', `${name}-home`);
    files.push(
      { path: path.join(featureRoot, 'models', `${name}.ts`), content: modelTemplate(pascal) },
      { path: path.join(featureRoot, 'models', 'index.ts'), content: barrel(name) },
      { path: path.join(screenDir, `${name}-home.tsx`), content: screenTemplate(pascal, name) },
      { path: path.join(screenDir, `${name}-home.test.tsx`), content: screenTestTemplate(pascal, name) },
      { path: path.join(screenDir, 'index.ts'), content: barrel(`${name}-home`) },
    );
    if (flags['with-route']) {
      const routePath = path.resolve(process.cwd(), flags['app-dir'] ?? 'src/app', name, 'index.tsx');
      files.push({ path: routePath, content: routeTemplate(pascal, name) });
    }
  }

  console.log(`🚀 Scaffolding React Native Screaming Feature: ${name}`);
  console.log(`📁 Target directory: ${featureRoot}`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force, dirs });
  if (flags['dry-run']) return;

  console.log(`\n✅ Feature '${name}' scaffolded successfully!`);
  console.log('⚠️ Reminder: Leaf-folder barrel policy (import from the leaf folder that owns index.ts):');
  console.log(`   - import { ... } from '@/features/${name}/screens/${name}-home';`);
  console.log(`   - import { ... } from '@/features/${name}/models';`);
  console.log(`   Do NOT create container barrels at src/features/${name}/index.ts or components/index.ts`);
  console.log('   Keep src/app/** thin: routes only import and render screens.');
}

main();
