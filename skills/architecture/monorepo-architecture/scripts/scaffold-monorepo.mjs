#!/usr/bin/env node
// scaffold-monorepo.mjs — Creates the root of a pnpm + Turborepo monorepo:
// workspace config, task pipeline, shared tsconfig/eslint packages, the
// contracts package for the chosen mode and a vendored boundary checker.
// Apps are NOT created here: the script prints the exact commands.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { KEBAB_REGEX, applyFiles, fail, json, parseArgs } from './lib/scaffold.mjs';
import { eslintConfigPackageFiles, packageFiles, tsconfigPackageFiles } from './lib/templates.mjs';

const CONTRACT_MODES = { zod: { name: 'contracts', kind: 'contracts' }, openapi: { name: 'api-client', kind: 'api-client' } };

function printHelp() {
  console.log(`
Usage: node scaffold-monorepo.mjs --scope <scope> --contracts <zod|openapi> [options]

Options:
  --scope <scope>          npm scope for internal packages, e.g. acme → @acme/contracts
  --contracts <mode>       How web and API share contracts (see references/shared-packages-and-contracts.md):
                             zod      packages/contracts with shared Zod schemas
                             openapi  packages/api-client generated from the API's Swagger document
  --pnpm-version <x.y.z>   Version for the packageManager field (default: detected from pnpm)
  --dry-run                List the files that would be generated without writing anything
  --force                  Overwrite generated files that already exist (default: abort on conflict)
  --help, -h               Show this help message

Examples:
  node scaffold-monorepo.mjs --scope acme --contracts zod --dry-run
  node scaffold-monorepo.mjs --scope acme --contracts openapi
`);
}

function detectPnpmVersion() {
  const fromAgent = process.env.npm_config_user_agent?.match(/pnpm\/(\d+\.\d+\.\d+)/);
  if (fromAgent) return fromAgent[1];
  try {
    return execFileSync('pnpm', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    process.exit(0);
  }
  const { flags } = parseArgs(argv, { booleans: ['--dry-run', '--force'], strings: ['--scope', '--contracts', '--pnpm-version'] });

  const scope = flags.scope?.replace(/^@/, '');
  if (!scope) fail('--scope is required (e.g. --scope acme).');
  if (!KEBAB_REGEX.test(scope)) fail(`Scope '${scope}' must be kebab-case.`);
  const mode = CONTRACT_MODES[flags.contracts];
  if (!mode) fail("--contracts is required: 'zod' or 'openapi'. See references/shared-packages-and-contracts.md to choose.");

  const pnpmVersion = flags['pnpm-version'] ?? detectPnpmVersion();
  if (!pnpmVersion || !/^\d+\.\d+\.\d+$/.test(pnpmVersion)) fail('Could not detect pnpm. Install it or pass --pnpm-version <x.y.z>.');

  const root = process.cwd();
  const checker = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-boundaries.mjs'), 'utf8');

  const rootPackage = {
    name: scope,
    private: true,
    packageManager: `pnpm@${pnpmVersion}`,
    engines: { node: '>=20' },
    scripts: {
      build: 'turbo run build',
      dev: 'turbo run dev',
      lint: 'turbo run lint',
      typecheck: 'turbo run typecheck',
      test: 'turbo run test',
      'check:boundaries': 'node scripts/check-boundaries.mjs',
    },
    devDependencies: { turbo: '^2.5.0', typescript: '^5.6.0' },
  };

  const turbo = {
    $schema: 'https://turbo.build/schema.json',
    tasks: {
      build: { dependsOn: ['^build'], outputs: ['dist/**', '.next/**', '!.next/cache/**'] },
      dev: { dependsOn: ['^build'], cache: false, persistent: true },
      lint: { dependsOn: ['^build'] },
      typecheck: { dependsOn: ['^build'] },
      test: { dependsOn: ['^build'], outputs: ['coverage/**'] },
    },
  };

  const files = [
    { path: path.join(root, 'package.json'), content: json(rootPackage) },
    { path: path.join(root, 'pnpm-workspace.yaml'), content: 'packages:\n  - "apps/*"\n  - "packages/*"\n' },
    { path: path.join(root, 'turbo.json'), content: json(turbo) },
    { path: path.join(root, '.npmrc'), content: 'engine-strict=true\n' },
    {
      path: path.join(root, '.gitignore'),
      content: 'node_modules/\ndist/\n.next/\n.turbo/\ncoverage/\n.env\n.env*.local\n*.log\n',
    },
    { path: path.join(root, 'scripts', 'check-boundaries.mjs'), content: checker, mode: 0o755 },
    ...tsconfigPackageFiles({ root, scope }),
    ...eslintConfigPackageFiles({ root, scope }),
    ...packageFiles({ root, scope, name: mode.name, kind: mode.kind }),
  ];

  console.log(`🏗️  Scaffolding pnpm + Turborepo monorepo (@${scope}, contracts: ${flags.contracts})`);
  if (flags['dry-run']) console.log('🔎 Mode: [DRY RUN - No files will be written]');
  console.log('');

  applyFiles(files, { dryRun: flags['dry-run'], force: flags.force, cwd: root });

  if (flags['dry-run']) {
    console.log(`\n🔎 Dry run complete: ${files.length} files would be written. Nothing was changed.`);
    return;
  }

  const contractsDep = `"@${scope}/${mode.name}": "workspace:*"`;
  console.log(`\n✨ Monorepo root scaffolded (${files.length} files).`);
  console.log(`\n📌 Next steps (run after confirming with the user; they download packages):`);
  console.log(`   1. pnpm create next-app@latest apps/web --ts --app --src-dir --eslint --import-alias "@/*" --use-pnpm --skip-install --yes`);
  console.log(`   2. pnpm dlx @nestjs/cli new api --directory apps/api --package-manager pnpm --skip-git --skip-install`);
  console.log(`   3. Wire each app (see references/monorepo-structure-guide.md):`);
  console.log(`      - apps/web/tsconfig.json extends "@${scope}/tsconfig/nextjs.json"; apps/api/tsconfig.json extends "@${scope}/tsconfig/nestjs.json"`);
  console.log(`      - add ${contractsDep} and "@${scope}/tsconfig": "workspace:*" to ${flags.contracts === 'zod' ? 'both apps' : 'apps/web'}`);
  console.log(`   4. pnpm install && pnpm build && pnpm check:boundaries`);
}

main();
